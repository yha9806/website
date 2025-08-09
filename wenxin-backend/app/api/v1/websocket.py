from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Set
import json
import asyncio
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    """WebSocket连接管理器"""
    
    def __init__(self):
        # 存储活动的WebSocket连接
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "battle": set(),  # 对战房间
            "evaluation": set(),  # 评测房间
            "global": set()  # 全局广播
        }
        # 存储对战状态
        self.battle_state: Dict[str, dict] = {}
        # 存储评测进度
        self.evaluation_progress: Dict[str, dict] = {}
        # 连接管理锁，防止并发修改
        self.connection_lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, room: str = "global"):
        """接受WebSocket连接"""
        await websocket.accept()
        async with self.connection_lock:
            if room not in self.active_connections:
                self.active_connections[room] = set()
            self.active_connections[room].add(websocket)
        logger.info(f"Client connected to room: {room}")
    
    async def disconnect(self, websocket: WebSocket, room: str = "global"):
        """断开WebSocket连接"""
        async with self.connection_lock:
            if room in self.active_connections:
                self.active_connections[room].discard(websocket)
        logger.info(f"Client disconnected from room: {room}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """发送个人消息"""
        await websocket.send_text(message)
    
    async def broadcast_to_room(self, message: dict, room: str):
        """向房间内所有连接广播消息"""
        # 使用锁保护整个广播过程
        async with self.connection_lock:
            if room not in self.active_connections:
                return
            
            # 创建连接的安全快照
            connections = list(self.active_connections[room])
        
        # 在锁外发送消息，避免长时间持有锁
        disconnected = set()
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                disconnected.add(connection)
        
        # 如果有断开的连接，再次获取锁进行清理
        if disconnected:
            async with self.connection_lock:
                for conn in disconnected:
                    self.active_connections[room].discard(conn)
    
    async def update_battle_votes(self, battle_id: str, model1_votes: int, model2_votes: int):
        """更新对战投票数据"""
        self.battle_state[battle_id] = {
            "id": battle_id,
            "model1_votes": model1_votes,
            "model2_votes": model2_votes,
            "total_votes": model1_votes + model2_votes,
            "timestamp": datetime.now().isoformat()
        }
        
        # 广播更新
        await self.broadcast_to_room({
            "type": "battle_update",
            "data": self.battle_state[battle_id]
        }, "battle")
    
    async def update_evaluation_progress(self, evaluation_id: str, progress: int, 
                                        status: str, current_stage: str = None):
        """更新评测进度"""
        self.evaluation_progress[evaluation_id] = {
            "id": evaluation_id,
            "progress": progress,
            "status": status,
            "current_stage": current_stage,
            "timestamp": datetime.now().isoformat()
        }
        
        # 广播更新
        await self.broadcast_to_room({
            "type": "evaluation_progress",
            "data": self.evaluation_progress[evaluation_id]
        }, "evaluation")

# 创建全局连接管理器实例
manager = ConnectionManager()

@router.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str):
    """WebSocket端点"""
    await manager.connect(websocket, room)
    try:
        # 发送欢迎消息
        await manager.send_personal_message(
            json.dumps({
                "type": "welcome",
                "message": f"Connected to {room} room",
                "timestamp": datetime.now().isoformat()
            }),
            websocket
        )
        
        # 如果是对战房间，发送当前状态
        if room == "battle" and manager.battle_state:
            for battle_id, state in manager.battle_state.items():
                await manager.send_personal_message(
                    json.dumps({
                        "type": "battle_update",
                        "data": state
                    }),
                    websocket
                )
        
        # 如果是评测房间，发送当前进度
        if room == "evaluation" and manager.evaluation_progress:
            for eval_id, progress in manager.evaluation_progress.items():
                await manager.send_personal_message(
                    json.dumps({
                        "type": "evaluation_progress",
                        "data": progress
                    }),
                    websocket
                )
        
        # 保持连接并处理消息
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                
                # 处理心跳
                if message.get("type") == "ping":
                    await manager.send_personal_message(
                        json.dumps({"type": "pong", "timestamp": datetime.now().isoformat()}),
                        websocket
                    )
                
                # 处理投票消息
                elif message.get("type") == "vote" and room == "battle":
                    battle_id = message.get("battle_id")
                    model = message.get("model")  # "model1" or "model2"
                    
                    # 模拟投票更新（实际应该调用数据库）
                    if battle_id in manager.battle_state:
                        state = manager.battle_state[battle_id]
                        if model == "model1":
                            state["model1_votes"] += 1
                        elif model == "model2":
                            state["model2_votes"] += 1
                        state["total_votes"] = state["model1_votes"] + state["model2_votes"]
                        
                        # 广播更新
                        await manager.update_battle_votes(
                            battle_id,
                            state["model1_votes"],
                            state["model2_votes"]
                        )
                
                # 广播聊天消息
                elif message.get("type") == "chat":
                    await manager.broadcast_to_room({
                        "type": "chat",
                        "user": message.get("user", "Anonymous"),
                        "message": message.get("message"),
                        "timestamp": datetime.now().isoformat()
                    }, room)
                    
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "Invalid JSON"}),
                    websocket
                )
                
    except WebSocketDisconnect:
        await manager.disconnect(websocket, room)
        await manager.broadcast_to_room({
            "type": "user_left",
            "timestamp": datetime.now().isoformat()
        }, room)

@router.websocket("/ws")
async def websocket_global(websocket: WebSocket):
    """全局WebSocket端点"""
    await websocket_endpoint(websocket, "global")

# SSE (Server-Sent Events) 作为WebSocket的备选方案
from fastapi import Request
from fastapi.responses import StreamingResponse
import asyncio

@router.get("/sse/{room}")
async def sse_endpoint(request: Request, room: str):
    """SSE端点 - 作为WebSocket的降级方案"""
    
    async def event_generator():
        """生成SSE事件"""
        try:
            # 发送初始连接消息
            yield f"data: {json.dumps({'type': 'connected', 'room': room})}\n\n"
            
            # 模拟实时更新
            while True:
                # 检查客户端是否断开
                if await request.is_disconnected():
                    break
                
                # 发送心跳
                yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
                
                # 如果是对战房间，发送对战更新
                if room == "battle" and manager.battle_state:
                    for battle_id, state in manager.battle_state.items():
                        yield f"data: {json.dumps({'type': 'battle_update', 'data': state})}\n\n"
                
                # 如果是评测房间，发送进度更新
                if room == "evaluation" and manager.evaluation_progress:
                    for eval_id, progress in manager.evaluation_progress.items():
                        yield f"data: {json.dumps({'type': 'evaluation_progress', 'data': progress})}\n\n"
                
                await asyncio.sleep(2)  # 每2秒更新一次
                
        except asyncio.CancelledError:
            logger.info(f"SSE connection closed for room: {room}")
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )

# 导出路由器和管理器
__all__ = ["router", "manager"]