from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
from datetime import datetime
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    """Simple WebSocket connection manager without persistent connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room: str = "global"):
        """Accept WebSocket connection"""
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(websocket)
        logger.info(f"Client connected to room: {room}")
    
    async def disconnect(self, websocket: WebSocket, room: str = "global"):
        """Disconnect WebSocket"""
        if room in self.active_connections:
            if websocket in self.active_connections[room]:
                self.active_connections[room].remove(websocket)
        logger.info(f"Client disconnected from room: {room}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
    
    async def broadcast_to_room(self, message: dict, room: str):
        """Broadcast message to all connections in room"""
        if room not in self.active_connections:
            return
        
        # Get current connections
        connections = self.active_connections[room].copy()
        
        # Send to each connection
        for connection in connections:
            try:
                await connection.send_json(message)
            except:
                # Remove dead connections
                if connection in self.active_connections[room]:
                    self.active_connections[room].remove(connection)

# Create global connection manager
manager = ConnectionManager()

@router.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str):
    """WebSocket endpoint"""
    await manager.connect(websocket, room)
    
    try:
        # Send welcome message
        await manager.send_personal_message({
            "type": "welcome",
            "message": f"Connected to {room} room",
            "timestamp": datetime.now().isoformat()
        }, websocket)
        
        # Keep connection alive
        while True:
            # Wait for messages
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                
                # Handle ping/pong
                if message.get("type") == "ping":
                    await manager.send_personal_message({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }, websocket)
                
                # Broadcast other messages
                else:
                    await manager.broadcast_to_room({
                        "type": "message",
                        "data": message,
                        "timestamp": datetime.now().isoformat()
                    }, room)
                    
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON"
                }, websocket)
                
    except WebSocketDisconnect:
        await manager.disconnect(websocket, room)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(websocket, room)

# SSE endpoint as fallback
from fastapi import Request
from fastapi.responses import StreamingResponse

@router.get("/sse/{room}")
async def sse_endpoint(request: Request, room: str):
    """SSE endpoint - WebSocket fallback"""
    
    async def event_generator():
        """Generate SSE events"""
        try:
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connected', 'room': room})}\n\n"
            
            # Keep connection alive with heartbeats
            while True:
                if await request.is_disconnected():
                    break
                
                # Send heartbeat
                yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
                
                await asyncio.sleep(5)
                
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