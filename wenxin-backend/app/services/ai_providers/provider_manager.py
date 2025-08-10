import os
import random
from typing import Dict, Optional, List
from enum import Enum
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider
from .huggingface_provider import HuggingFaceProvider
from .mock_provider import MockProvider
from . import AIProvider


class UserTier(str, Enum):
    GUEST = "guest"
    USER = "user"
    PREMIUM = "premium"
    VIP = "vip"


class ProviderManager:
    """Manages AI providers and smart selection logic"""
    
    def __init__(self):
        self.providers: Dict[str, AIProvider] = {}
        self.fallback_provider = MockProvider()
        self._initialize_providers()
        
    def _initialize_providers(self):
        """Initialize available providers"""
        try:
            # Initialize OpenAI provider
            if os.getenv("OPENAI_API_KEY"):
                self.providers["openai"] = OpenAIProvider()
        except Exception as e:
            print(f"Failed to initialize OpenAI provider: {e}")
            
        try:
            # Initialize Gemini provider
            if os.getenv("GEMINI_API_KEY"):
                self.providers["gemini"] = GeminiProvider()
        except Exception as e:
            print(f"Failed to initialize Gemini provider: {e}")
            
        try:
            # Initialize HuggingFace provider
            if os.getenv("HUGGINGFACE_API_KEY"):
                self.providers["huggingface"] = HuggingFaceProvider()
        except Exception as e:
            print(f"Failed to initialize HuggingFace provider: {e}")
            
        # Always have mock as fallback
        self.providers["mock"] = self.fallback_provider
        
        print(f"Initialized providers: {list(self.providers.keys())}")
    
    def get_provider_for_task(
        self,
        task_type: str,
        user_tier: UserTier = UserTier.GUEST,
        provider_preference: Optional[str] = None
    ) -> AIProvider:
        """Select the best provider for a given task and user tier"""
        
        # If specific provider requested and available
        if provider_preference and provider_preference in self.providers:
            provider = self.providers[provider_preference]
            if self._is_provider_allowed(provider_preference, user_tier):
                return provider
        
        # Smart selection based on task type and user tier
        selected_provider = self._smart_provider_selection(task_type, user_tier)
        return self.providers.get(selected_provider, self.fallback_provider)
    
    def _smart_provider_selection(self, task_type: str, user_tier: UserTier) -> str:
        """Intelligent provider selection logic"""
        
        # Define provider preferences by task type and user tier
        preferences = {
            UserTier.GUEST: {
                "poem": ["gemini", "huggingface", "mock"],
                "story": ["gemini", "huggingface", "mock"],
                "painting": ["huggingface", "mock"],  # Free image generation
                "music": ["mock"]  # Limited options
            },
            UserTier.USER: {
                "poem": ["gemini", "openai", "huggingface", "mock"],
                "story": ["openai", "gemini", "huggingface", "mock"],
                "painting": ["openai", "huggingface", "mock"],
                "music": ["openai", "mock"]
            },
            UserTier.PREMIUM: {
                "poem": ["openai", "gemini", "huggingface", "mock"],
                "story": ["openai", "gemini", "huggingface", "mock"],
                "painting": ["openai", "huggingface", "mock"],
                "music": ["openai", "mock"]
            },
            UserTier.VIP: {
                "poem": ["openai", "gemini", "huggingface", "mock"],
                "story": ["openai", "gemini", "huggingface", "mock"],
                "painting": ["openai", "huggingface", "mock"],
                "music": ["openai", "mock"]
            }
        }
        
        # Get preference list for this user tier and task type
        pref_list = preferences.get(user_tier, {}).get(task_type, ["mock"])
        
        # Find the first available provider
        for provider_name in pref_list:
            if provider_name in self.providers:
                return provider_name
        
        return "mock"  # Ultimate fallback
    
    def _is_provider_allowed(self, provider_name: str, user_tier: UserTier) -> bool:
        """Check if a provider is allowed for the user tier"""
        restrictions = {
            UserTier.GUEST: ["gemini", "huggingface", "mock"],
            UserTier.USER: ["openai", "gemini", "huggingface", "mock"],
            UserTier.PREMIUM: ["openai", "gemini", "huggingface", "mock"],
            UserTier.VIP: ["openai", "gemini", "huggingface", "mock"]
        }
        
        allowed_providers = restrictions.get(user_tier, ["mock"])
        return provider_name in allowed_providers
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Check health of all providers"""
        health_status = {}
        
        for name, provider in self.providers.items():
            try:
                health_status[name] = await provider.health_check()
            except Exception:
                health_status[name] = False
        
        return health_status
    
    def get_available_providers(self) -> List[str]:
        """Get list of available provider names"""
        return list(self.providers.keys())
    
    def get_fallback_provider(self) -> AIProvider:
        """Get the fallback provider (always mock)"""
        return self.fallback_provider
    
    def select_provider_with_fallback(
        self,
        task_type: str,
        user_tier: UserTier = UserTier.GUEST,
        provider_preference: Optional[str] = None
    ) -> AIProvider:
        """Select provider with automatic fallback on failure"""
        try:
            primary_provider = self.get_provider_for_task(
                task_type, user_tier, provider_preference
            )
            return primary_provider
        except Exception as e:
            print(f"Provider selection failed: {e}, falling back to mock")
            return self.fallback_provider
    
    def get_provider_info(self) -> Dict[str, Dict]:
        """Get information about all providers"""
        info = {}
        for name, provider in self.providers.items():
            info[name] = {
                "class": provider.__class__.__name__,
                "has_api_key": bool(provider.api_key) if hasattr(provider, 'api_key') else False,
                "capabilities": {
                    "poem": True,
                    "story": True,
                    "painting": name in ["openai", "huggingface", "mock"],
                    "music": name in ["openai", "mock"]
                }
            }
        return info


# Global instance
provider_manager = ProviderManager()