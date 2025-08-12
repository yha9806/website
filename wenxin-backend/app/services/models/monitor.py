"""
模型监控器 - 记录和监控模型调用
"""
import sqlite3
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class ModelMonitor:
    """模型调用监控"""
    
    def __init__(self, db_path: str = "model_monitor.db"):
        """
        初始化监控器
        
        Args:
            db_path: 数据库路径
        """
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 创建请求记录表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS model_requests (
                request_id TEXT PRIMARY KEY,
                model_id TEXT NOT NULL,
                request_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建响应记录表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS model_responses (
                request_id TEXT PRIMARY KEY,
                model_used TEXT,
                tokens_used INTEGER,
                response_time REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES model_requests(request_id)
            )
        """)
        
        # 创建错误记录表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS model_errors (
                request_id TEXT PRIMARY KEY,
                error_message TEXT,
                error_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES model_requests(request_id)
            )
        """)
        
        conn.commit()
        conn.close()
        logger.info(f"Model monitor database initialized at {self.db_path}")
    
    async def log_request(self, model_id: str, request: Dict[str, Any]) -> str:
        """
        记录请求
        
        Args:
            model_id: 模型ID
            request: 请求数据
            
        Returns:
            请求ID
        """
        request_id = str(uuid.uuid4())
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO model_requests (request_id, model_id, request_data, created_at)
                VALUES (?, ?, ?, ?)
            """, (
                request_id,
                model_id,
                json.dumps(request),
                datetime.now().isoformat()
            ))
            conn.commit()
            logger.debug(f"Logged request {request_id} for model {model_id}")
        except Exception as e:
            logger.error(f"Failed to log request: {e}")
        finally:
            conn.close()
        
        return request_id
    
    async def log_response(self, request_id: str, response: Any) -> None:
        """
        记录响应
        
        Args:
            request_id: 请求ID
            response: 响应数据
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 提取响应信息
            if hasattr(response, 'model'):
                model_used = response.model
            elif isinstance(response, dict) and 'model' in response:
                model_used = response['model']
            else:
                model_used = 'unknown'
            
            if hasattr(response, 'usage') and response.usage:
                tokens_used = response.usage.total_tokens
            elif isinstance(response, dict) and 'tokens_used' in response:
                tokens_used = response['tokens_used']
            else:
                tokens_used = 0
            
            cursor.execute("""
                INSERT INTO model_responses (request_id, model_used, tokens_used, created_at)
                VALUES (?, ?, ?, ?)
            """, (
                request_id,
                model_used,
                tokens_used,
                datetime.now().isoformat()
            ))
            conn.commit()
            logger.debug(f"Logged response for request {request_id}")
        except Exception as e:
            logger.error(f"Failed to log response: {e}")
        finally:
            conn.close()
    
    async def log_error(self, request_id: str, error: Exception) -> None:
        """
        记录错误
        
        Args:
            request_id: 请求ID
            error: 错误信息
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO model_errors (request_id, error_message, error_type, created_at)
                VALUES (?, ?, ?, ?)
            """, (
                request_id,
                str(error),
                type(error).__name__,
                datetime.now().isoformat()
            ))
            conn.commit()
            logger.debug(f"Logged error for request {request_id}")
        except Exception as e:
            logger.error(f"Failed to log error: {e}")
        finally:
            conn.close()
    
    async def get_model_stats(self, model_id: str) -> Dict[str, Any]:
        """
        获取模型统计信息
        
        Args:
            model_id: 模型ID
            
        Returns:
            统计信息
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 总请求数
            cursor.execute("""
                SELECT COUNT(*) FROM model_requests WHERE model_id = ?
            """, (model_id,))
            total_requests = cursor.fetchone()[0]
            
            # 成功请求数
            cursor.execute("""
                SELECT COUNT(*) FROM model_requests r
                JOIN model_responses res ON r.request_id = res.request_id
                WHERE r.model_id = ?
            """, (model_id,))
            successful_requests = cursor.fetchone()[0]
            
            # 错误请求数
            cursor.execute("""
                SELECT COUNT(*) FROM model_requests r
                JOIN model_errors e ON r.request_id = e.request_id
                WHERE r.model_id = ?
            """, (model_id,))
            error_requests = cursor.fetchone()[0]
            
            # 平均tokens使用
            cursor.execute("""
                SELECT AVG(res.tokens_used) FROM model_requests r
                JOIN model_responses res ON r.request_id = res.request_id
                WHERE r.model_id = ?
            """, (model_id,))
            avg_tokens = cursor.fetchone()[0] or 0
            
            # 最近的错误
            cursor.execute("""
                SELECT e.error_message, e.created_at FROM model_requests r
                JOIN model_errors e ON r.request_id = e.request_id
                WHERE r.model_id = ?
                ORDER BY e.created_at DESC
                LIMIT 5
            """, (model_id,))
            recent_errors = cursor.fetchall()
            
            return {
                'model_id': model_id,
                'total_requests': total_requests,
                'successful_requests': successful_requests,
                'error_requests': error_requests,
                'success_rate': successful_requests / total_requests if total_requests > 0 else 0,
                'average_tokens': avg_tokens,
                'recent_errors': [{'message': err[0], 'timestamp': err[1]} for err in recent_errors]
            }
            
        except Exception as e:
            logger.error(f"Failed to get model stats: {e}")
            return {}
        finally:
            conn.close()
    
    async def get_all_stats(self) -> Dict[str, Any]:
        """
        获取所有模型的统计信息
        
        Returns:
            统计信息
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 获取所有模型
            cursor.execute("""
                SELECT DISTINCT model_id FROM model_requests
            """)
            models = [row[0] for row in cursor.fetchall()]
            
            stats = {}
            for model_id in models:
                stats[model_id] = await self.get_model_stats(model_id)
            
            # 总体统计
            cursor.execute("SELECT COUNT(*) FROM model_requests")
            total_requests = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM model_responses")
            total_responses = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM model_errors")
            total_errors = cursor.fetchone()[0]
            
            return {
                'models': stats,
                'summary': {
                    'total_models': len(models),
                    'total_requests': total_requests,
                    'total_responses': total_responses,
                    'total_errors': total_errors,
                    'overall_success_rate': total_responses / total_requests if total_requests > 0 else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get all stats: {e}")
            return {}
        finally:
            conn.close()
    
    def clear_old_records(self, days: int = 7) -> None:
        """
        清理旧记录
        
        Args:
            days: 保留最近几天的记录
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cutoff_date = datetime.now().timestamp() - (days * 24 * 60 * 60)
            
            # 删除旧的错误记录
            cursor.execute("""
                DELETE FROM model_errors 
                WHERE datetime(created_at) < datetime(?, 'unixepoch')
            """, (cutoff_date,))
            
            # 删除旧的响应记录
            cursor.execute("""
                DELETE FROM model_responses 
                WHERE datetime(created_at) < datetime(?, 'unixepoch')
            """, (cutoff_date,))
            
            # 删除旧的请求记录
            cursor.execute("""
                DELETE FROM model_requests 
                WHERE datetime(created_at) < datetime(?, 'unixepoch')
            """, (cutoff_date,))
            
            conn.commit()
            logger.info(f"Cleared records older than {days} days")
            
        except Exception as e:
            logger.error(f"Failed to clear old records: {e}")
        finally:
            conn.close()