"""
Provider适配器基类
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

from ..model_registry import ModelConfig

logger = logging.getLogger(__name__)


class BaseAdapter(ABC):
    """Provider适配器基类"""
    
    def __init__(self, model_config: ModelConfig):
        """
        初始化适配器
        
        Args:
            model_config: 模型配置
        """
        self.model_config = model_config
        self.client = self._initialize_client()
        logger.info(f"Initialized {self.__class__.__name__} for {model_config.model_id}")
    
    @abstractmethod
    def _initialize_client(self):
        """初始化Provider客户端"""
        pass
    
    @abstractmethod
    async def generate(self, request: Dict[str, Any]) -> Any:
        """
        生成内容
        
        Args:
            request: 包含以下字段的请求字典
                - prompt: 输入提示
                - model: 模型名称
                - max_tokens 或 max_completion_tokens: 最大生成tokens
                - temperature: 温度参数（可选）
                - 其他Provider特定参数
                
        Returns:
            Provider响应（格式因Provider而异）
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """
        健康检查
        
        Returns:
            是否可用
        """
        pass
    
    def validate_request(self, request: Dict[str, Any]) -> bool:
        """
        验证请求参数
        
        Args:
            request: 请求参数
            
        Returns:
            是否有效
        """
        if 'prompt' not in request:
            logger.error("Request missing 'prompt' field")
            return False
        
        if 'model' not in request:
            logger.error("Request missing 'model' field")
            return False
        
        return True
    
    def prepare_common_params(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        准备通用参数
        
        Args:
            request: 原始请求
            
        Returns:
            处理后的参数
        """
        params = {
            'model': request['model'],
        }
        
        # 处理max_tokens
        if 'max_completion_tokens' in request:
            params['max_completion_tokens'] = request['max_completion_tokens']
        elif 'max_tokens' in request:
            params['max_tokens'] = request['max_tokens']
        
        # 处理temperature（如果支持）
        if 'temperature' in request and not self.model_config.requires_special_handling.get('no_temperature'):
            params['temperature'] = request['temperature']
        
        return params