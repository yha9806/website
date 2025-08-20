"""
模型注册表 - 管理所有AI模型的配置
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import json


class ModelConfig:
    """单个模型的完整配置"""
    
    def __init__(self, model_id: str, **config):
        # 基础信息
        self.model_id = model_id
        self.display_name = config['display_name']
        self.provider = config['provider']
        self.api_model_name = config['api_model_name']
        self.organization = config['organization']
        
        # 能力和特性
        self.capabilities = config.get('capabilities', ['text'])
        self.model_type = config.get('model_type', 'llm')  # llm, image, multimodal
        self.parameters = config.get('parameters', {})
        
        # 成本和限制
        self.cost_per_1k_tokens = config.get('cost_per_1k_tokens', 0)
        self.max_tokens = config.get('max_tokens', 4096)
        self.rate_limit = config.get('rate_limit', 60)  # requests per minute
        
        # 特殊处理需求
        self.requires_special_handling = config.get('requires_special_handling', {})
        self.supports_streaming = config.get('supports_streaming', False)
        self.supports_functions = config.get('supports_functions', False)
        
        # 元数据
        self.release_date = config.get('release_date')
        self.deprecated = config.get('deprecated', False)
        self.verified = config.get('verified', False)
        self.description = config.get('description', '')
        
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'model_id': self.model_id,
            'display_name': self.display_name,
            'provider': self.provider,
            'api_model_name': self.api_model_name,
            'organization': self.organization,
            'capabilities': self.capabilities,
            'model_type': self.model_type,
            'parameters': self.parameters,
            'cost_per_1k_tokens': self.cost_per_1k_tokens,
            'max_tokens': self.max_tokens,
            'rate_limit': self.rate_limit,
            'requires_special_handling': self.requires_special_handling,
            'supports_streaming': self.supports_streaming,
            'supports_functions': self.supports_functions,
            'release_date': self.release_date,
            'deprecated': self.deprecated,
            'verified': self.verified,
            'description': self.description
        }
    
    def __str__(self):
        return f"ModelConfig({self.model_id}: {self.display_name} by {self.organization})"


class ModelRegistry:
    """中央模型注册表 - 单例模式"""
    
    _instance = None
    _models: Dict[str, ModelConfig] = {}
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._models = {}
            self._initialized = True
    
    def register_model(self, model_config: ModelConfig) -> None:
        """注册新模型"""
        if model_config.model_id in self._models:
            try:
                print(f"Warning: Overwriting existing model {model_config.model_id}")
            except:
                pass  # Ignore print errors during import
        self._models[model_config.model_id] = model_config
        try:
            print(f"Registered model: {model_config.model_id}")
        except:
            pass  # Ignore print errors during import
    
    def get_model(self, model_id: str) -> ModelConfig:
        """获取模型配置"""
        if model_id not in self._models:
            raise ValueError(f"Model {model_id} not registered. Available models: {list(self._models.keys())}")
        return self._models[model_id]
    
    def list_models(self, 
                   provider: Optional[str] = None,
                   capability: Optional[str] = None,
                   model_type: Optional[str] = None,
                   organization: Optional[str] = None,
                   verified_only: bool = False) -> List[ModelConfig]:
        """列出符合条件的模型"""
        models = list(self._models.values())
        
        if provider:
            models = [m for m in models if m.provider == provider]
        if capability:
            models = [m for m in models if capability in m.capabilities]
        if model_type:
            models = [m for m in models if m.model_type == model_type]
        if organization:
            models = [m for m in models if m.organization == organization]
        if verified_only:
            models = [m for m in models if m.verified]
        
        return models
    
    def get_providers(self) -> List[str]:
        """获取所有已注册的Provider列表"""
        return list(set(m.provider for m in self._models.values()))
    
    def get_organizations(self) -> List[str]:
        """获取所有组织列表"""
        return list(set(m.organization for m in self._models.values()))
    
    def model_exists(self, model_id: str) -> bool:
        """检查模型是否已注册"""
        return model_id in self._models
    
    def get_model_by_api_name(self, api_name: str, provider: str) -> Optional[ModelConfig]:
        """根据API名称和Provider获取模型"""
        for model in self._models.values():
            if model.api_model_name == api_name and model.provider == provider:
                return model
        return None
    
    def clear_registry(self) -> None:
        """清空注册表（仅用于测试）"""
        self._models.clear()
    
    def export_registry(self) -> Dict[str, Any]:
        """导出整个注册表"""
        return {
            'models': {k: v.to_dict() for k, v in self._models.items()},
            'providers': self.get_providers(),
            'organizations': self.get_organizations(),
            'total_models': len(self._models),
            'export_time': datetime.now().isoformat()
        }
    
    def import_registry(self, data: Dict[str, Any]) -> None:
        """从导出的数据导入注册表"""
        self.clear_registry()
        for model_id, model_data in data.get('models', {}).items():
            config = ModelConfig(model_id=model_id, **model_data)
            self.register_model(config)
    
    def get_stats(self) -> Dict[str, Any]:
        """获取注册表统计信息"""
        return {
            'total_models': len(self._models),
            'providers': len(self.get_providers()),
            'organizations': len(self.get_organizations()),
            'verified_models': len([m for m in self._models.values() if m.verified]),
            'deprecated_models': len([m for m in self._models.values() if m.deprecated]),
            'model_types': {
                'llm': len([m for m in self._models.values() if m.model_type == 'llm']),
                'image': len([m for m in self._models.values() if m.model_type == 'image']),
                'multimodal': len([m for m in self._models.values() if m.model_type == 'multimodal'])
            }
        }


# 全局注册表实例
model_registry = ModelRegistry()