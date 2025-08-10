"""
Image storage management for AI-generated images
"""
import os
import uuid
import aiohttp
import aiofiles
import logging
from typing import Optional
from urllib.parse import urlparse
from pathlib import Path

logger = logging.getLogger(__name__)


class ImageStorage:
    """Handles storage and management of AI-generated images"""
    
    def __init__(self, storage_path: str = "static/generated_images"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
    async def save_generated_image(self, image_url: str, task_id: str, 
                                 provider: str = "openai") -> Optional[str]:
        """
        Download and save AI-generated image locally
        
        Args:
            image_url: Original image URL from AI provider
            task_id: Unique task identifier
            provider: AI provider name (openai, dalle, etc.)
            
        Returns:
            Local URL path to saved image or None if failed
        """
        try:
            # Generate unique filename
            file_extension = self._get_image_extension(image_url)
            filename = f"{provider}_{task_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
            file_path = self.storage_path / filename
            
            # Download image from URL
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as response:
                    if response.status == 200:
                        content = await response.read()
                        
                        # Save to local storage
                        async with aiofiles.open(file_path, 'wb') as f:
                            await f.write(content)
                        
                        # Return web-accessible URL
                        web_path = f"/static/generated_images/{filename}"
                        logger.info(f"Image saved: {web_path}")
                        return web_path
                    else:
                        logger.error(f"Failed to download image: HTTP {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error saving image {image_url}: {e}")
            return None
    
    async def save_uploaded_image(self, file_content: bytes, 
                                filename: str, task_id: str) -> Optional[str]:
        """
        Save uploaded image file
        
        Args:
            file_content: Image binary content
            filename: Original filename
            task_id: Task identifier
            
        Returns:
            Local URL path to saved image
        """
        try:
            # Generate safe filename
            file_extension = Path(filename).suffix.lower()
            if file_extension not in ['.png', '.jpg', '.jpeg', '.webp', '.gif']:
                file_extension = '.png'  # Default to PNG
                
            safe_filename = f"upload_{task_id}_{uuid.uuid4().hex[:8]}{file_extension}"
            file_path = self.storage_path / safe_filename
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(file_content)
            
            web_path = f"/static/generated_images/{safe_filename}"
            logger.info(f"Upload saved: {web_path}")
            return web_path
            
        except Exception as e:
            logger.error(f"Error saving upload {filename}: {e}")
            return None
    
    def delete_image(self, image_path: str) -> bool:
        """
        Delete stored image file
        
        Args:
            image_path: Web path or filename to delete
            
        Returns:
            True if deleted successfully
        """
        try:
            # Extract filename from path
            if image_path.startswith('/static/generated_images/'):
                filename = image_path.split('/')[-1]
            else:
                filename = image_path
                
            file_path = self.storage_path / filename
            
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted image: {filename}")
                return True
            else:
                logger.warning(f"Image not found for deletion: {filename}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting image {image_path}: {e}")
            return False
    
    def get_image_info(self, image_path: str) -> Optional[dict]:
        """
        Get information about stored image
        
        Args:
            image_path: Web path to image
            
        Returns:
            Dict with image info or None
        """
        try:
            filename = image_path.split('/')[-1]
            file_path = self.storage_path / filename
            
            if not file_path.exists():
                return None
                
            stat = file_path.stat()
            return {
                'filename': filename,
                'size': stat.st_size,
                'created': stat.st_ctime,
                'modified': stat.st_mtime,
                'path': image_path
            }
            
        except Exception as e:
            logger.error(f"Error getting image info {image_path}: {e}")
            return None
    
    def cleanup_old_images(self, days_old: int = 30) -> int:
        """
        Clean up images older than specified days
        
        Args:
            days_old: Age threshold in days
            
        Returns:
            Number of files deleted
        """
        import time
        
        deleted_count = 0
        threshold_time = time.time() - (days_old * 24 * 60 * 60)
        
        try:
            for file_path in self.storage_path.glob("*"):
                if file_path.is_file() and file_path.stat().st_mtime < threshold_time:
                    file_path.unlink()
                    deleted_count += 1
                    
            logger.info(f"Cleaned up {deleted_count} old images")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            return deleted_count
    
    def _get_image_extension(self, url: str) -> str:
        """Extract image file extension from URL"""
        parsed = urlparse(url)
        path = Path(parsed.path)
        extension = path.suffix.lower()
        
        # Map common extensions
        if extension in ['.png', '.jpg', '.jpeg', '.webp', '.gif']:
            return extension[1:]  # Remove dot
        else:
            return 'png'  # Default to PNG


# Global instance
image_storage = ImageStorage()