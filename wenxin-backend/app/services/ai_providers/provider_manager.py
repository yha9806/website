import os
import random
from typing import Dict, Optional, List
from enum import Enum
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider
from .huggingface_provider import HuggingFaceProvider
from .deepseek_provider import DeepSeekProvider
from .qwen_provider import QwenProvider
from .xai_provider import XAIProvider
from .openrouter_provider import OpenRouterProvider
from .mock_provider import MockProvider
from . import AIProvider
from app.core.config import settings


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
        import logging
        logger = logging.getLogger(__name__)
        
        # Check OpenAI
        openai_key = settings.OPENAI_API_KEY
        if openai_key and openai_key != "your-openai-key-here":
            try:
                logger.info(f"Attempting to initialize OpenAI provider with key: {openai_key[:20]}...")
                self.providers["openai"] = OpenAIProvider(api_key=openai_key)
                logger.info("OpenAI provider initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI provider: {e}", exc_info=True)
        else:
            logger.info(f"Skipping OpenAI provider (no valid key)")
            
        # Check Gemini
        gemini_key = settings.GEMINI_API_KEY
        if gemini_key:
            try:
                logger.info(f"Attempting to initialize Gemini provider with key: {gemini_key[:20]}...")
                self.providers["gemini"] = GeminiProvider()
                logger.info("Gemini provider initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini provider: {e}", exc_info=True)
        else:
            logger.info("Skipping Gemini provider (no key)")
            
        # Check HuggingFace
        hf_key = settings.HUGGINGFACE_API_KEY
        if hf_key:
            try:
                logger.info(f"Attempting to initialize HuggingFace provider with key: {hf_key[:20]}...")
                self.providers["huggingface"] = HuggingFaceProvider()
                logger.info("HuggingFace provider initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize HuggingFace provider: {e}", exc_info=True)
        else:
            logger.info("Skipping HuggingFace provider (no key)")
            
        # Check Anthropic (Claude)
        anthropic_key = settings.ANTHROPIC_API_KEY
        if anthropic_key:
            try:
                logger.info(f"Attempting to initialize Anthropic provider with key: {anthropic_key[:20]}...")
                # We'll need to create AnthropicProvider later
                logger.info("Anthropic provider not yet implemented")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic provider: {e}", exc_info=True)
        else:
            logger.info("Skipping Anthropic provider (no key)")
            
        # Check DeepSeek
        deepseek_key = getattr(settings, 'DEEPSEEK_API_KEY', None)
        if deepseek_key:
            try:
                logger.info(f"Attempting to initialize DeepSeek provider with key: {deepseek_key[:20]}...")
                self.providers["deepseek"] = DeepSeekProvider(api_key=deepseek_key)
                logger.info("DeepSeek provider initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize DeepSeek provider: {e}", exc_info=True)
        else:
            logger.info("Skipping DeepSeek provider (no key)")
            
        # Check Qwen
        qwen_key = getattr(settings, 'QWEN_API_KEY', None)
        if qwen_key:
            try:
                logger.info(f"Attempting to initialize Qwen provider with key: {qwen_key[:20]}...")
                self.providers["qwen"] = QwenProvider(api_key=qwen_key)
                logger.info("Qwen provider initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Qwen provider: {e}", exc_info=True)
        else:
            logger.info("Skipping Qwen provider (no key)")
            
        # Check X AI
        xai_key = getattr(settings, 'XAI_API_KEY', None)
        if xai_key:
            try:
                logger.info(f"Attempting to initialize X AI provider with key: {xai_key[:20]}...")
                self.providers["xai"] = XAIProvider(api_key=xai_key)
                logger.info("X AI provider initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize X AI provider: {e}", exc_info=True)
        else:
            logger.info("Skipping X AI provider (no key)")
            
        # Check OpenRouter (for Kimi and other models)
        openrouter_key = getattr(settings, 'OPENROUTER_API_KEY', None)
        if openrouter_key:
            try:
                logger.info(f"Attempting to initialize OpenRouter provider with key: {openrouter_key[:20]}...")
                self.providers["openrouter"] = OpenRouterProvider(api_key=openrouter_key)
                logger.info("OpenRouter provider initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize OpenRouter provider: {e}", exc_info=True)
        else:
            logger.info("Skipping OpenRouter provider (no key)")
            
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
        # Now includes new providers: deepseek, qwen, xai
        preferences = {
            UserTier.GUEST: {
                "poem": ["openai", "gemini", "qwen", "deepseek", "xai", "huggingface", "mock"],
                "story": ["openai", "gemini", "deepseek", "qwen", "xai", "huggingface", "mock"],
                "painting": ["openai", "huggingface", "mock"],  
                "music": ["openai", "mock"]
            },
            UserTier.USER: {
                "poem": ["gemini", "openai", "qwen", "deepseek", "xai", "huggingface", "mock"],
                "story": ["openai", "gemini", "deepseek", "qwen", "xai", "huggingface", "mock"],
                "painting": ["openai", "huggingface", "mock"],
                "music": ["openai", "mock"]
            },
            UserTier.PREMIUM: {
                "poem": ["openai", "gemini", "qwen", "deepseek", "xai", "huggingface", "mock"],
                "story": ["openai", "gemini", "deepseek", "qwen", "xai", "huggingface", "mock"],
                "painting": ["openai", "huggingface", "mock"],
                "music": ["openai", "mock"]
            },
            UserTier.VIP: {
                "poem": ["openai", "gemini", "qwen", "deepseek", "xai", "huggingface", "mock"],
                "story": ["openai", "gemini", "deepseek", "qwen", "xai", "huggingface", "mock"],
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
            UserTier.GUEST: ["openai", "gemini", "huggingface", "mock"],  # 允许Guest使用OpenAI GPT-4o-mini
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

    # Benchmark methods - delegate to selected provider
    async def generate_poem(self, prompt: str, model_name: Optional[str] = None, 
                           user_tier: UserTier = UserTier.GUEST, 
                           provider_preference: Optional[str] = None) -> str:
        """Generate poem using selected provider"""
        # model_name is ignored for now as we use provider selection logic
        provider = self.get_provider_for_task("poem", user_tier, provider_preference)
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🎯 Selected provider for poem: {type(provider).__name__}")
        return await provider.generate_poem(prompt)
    
    async def generate_story(self, prompt: str, model_name: Optional[str] = None,
                            user_tier: UserTier = UserTier.GUEST,
                            provider_preference: Optional[str] = None) -> str:
        """Generate story using selected provider"""
        # model_name is ignored for now as we use provider selection logic
        provider = self.get_provider_for_task("story", user_tier, provider_preference)
        return await provider.generate_story(prompt)
    
    async def generate_painting(self, prompt: str, model_name: Optional[str] = None,
                               user_tier: UserTier = UserTier.GUEST,
                               provider_preference: Optional[str] = None) -> str:
        """Generate painting description using selected provider"""
        # model_name is ignored for now as we use provider selection logic
        provider = self.get_provider_for_task("painting", user_tier, provider_preference)
        return await provider.generate_painting(prompt)


# Global instance
provider_manager = ProviderManager()