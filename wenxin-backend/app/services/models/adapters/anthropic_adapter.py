"""Anthropic Provider Adapter"""
import os
from typing import Dict, Any, Optional
from anthropic import AsyncAnthropic
from .base import BaseAdapter

class AnthropicAdapter(BaseAdapter):
    """Adapter for Anthropic Claude models"""
    
    def _initialize_client(self):
        """Initialize Anthropic client"""
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            print("Warning: ANTHROPIC_API_KEY not set")
            return None
        
        try:
            return AsyncAnthropic(api_key=api_key)
        except Exception as e:
            print(f"Failed to initialize Anthropic client: {e}")
            return None
    
    async def generate(self, request: Dict[str, Any]) -> str:
        """Generate response from Anthropic model"""
        if not self.client:
            raise ValueError("Anthropic client not initialized. Check ANTHROPIC_API_KEY.")
        
        try:
            # Extract parameters
            model = request.get('model', 'claude-3-5-sonnet-20241022')
            prompt = request.get('prompt', '')
            max_tokens = request.get('max_tokens', 1000)
            temperature = request.get('temperature', 0.7)
            system = request.get('system', '')
            
            # Build messages
            messages = []
            if system:
                # Claude models handle system messages differently
                # Include system message as part of the first user message
                messages.append({
                    "role": "user",
                    "content": f"{system}\n\n{prompt}" if system else prompt
                })
            else:
                messages.append({
                    "role": "user", 
                    "content": prompt
                })
            
            # Make API call
            response = await self.client.messages.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            # Extract response text
            if response.content and len(response.content) > 0:
                return response.content[0].text
            
            return "No response generated"
            
        except Exception as e:
            error_msg = str(e)
            print(f"Anthropic API error: {error_msg}")
            
            # Check for specific errors
            if "authentication" in error_msg.lower() or "api key" in error_msg.lower():
                raise ValueError("Invalid Anthropic API key")
            elif "model" in error_msg.lower() and "not found" in error_msg.lower():
                raise ValueError(f"Model {model} not available with current API key")
            else:
                raise ValueError(f"Anthropic API error: {error_msg}")
    
    async def health_check(self) -> bool:
        """Check if Anthropic API is accessible"""
        if not self.client:
            return False
        
        try:
            # Try a minimal API call to check connectivity
            response = await self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=10
            )
            return True
        except Exception as e:
            print(f"Anthropic health check failed: {e}")
            return False
    
    async def list_models(self) -> list:
        """List available Anthropic models"""
        # Anthropic doesn't have a list models endpoint
        # Return known models
        return [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ]