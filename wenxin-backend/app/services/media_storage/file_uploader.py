"""
File upload handling utilities
"""
import os
import uuid
import mimetypes
from typing import Optional, List
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class FileUploader:
    """Handle file uploads with validation and processing"""
    
    def __init__(self, 
                 allowed_extensions: List[str] = None,
                 max_file_size: int = 10 * 1024 * 1024):  # 10MB default
        self.allowed_extensions = allowed_extensions or [
            '.png', '.jpg', '.jpeg', '.gif', '.webp', 
            '.txt', '.md', '.json'
        ]
        self.max_file_size = max_file_size
    
    def validate_file(self, filename: str, file_size: int) -> tuple[bool, str]:
        """
        Validate uploaded file
        
        Args:
            filename: Original filename
            file_size: File size in bytes
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file extension
        file_ext = Path(filename).suffix.lower()
        if file_ext not in self.allowed_extensions:
            return False, f"File type {file_ext} not allowed"
        
        # Check file size
        if file_size > self.max_file_size:
            return False, f"File size {file_size} exceeds limit {self.max_file_size}"
        
        # Check for suspicious filename patterns
        if '..' in filename or '/' in filename or '\\' in filename:
            return False, "Invalid filename characters"
        
        return True, ""
    
    def generate_safe_filename(self, original_filename: str, 
                              prefix: str = "") -> str:
        """
        Generate safe filename for storage
        
        Args:
            original_filename: Original uploaded filename
            prefix: Optional prefix for filename
            
        Returns:
            Safe filename string
        """
        # Extract extension
        file_ext = Path(original_filename).suffix.lower()
        
        # Generate unique identifier
        unique_id = uuid.uuid4().hex[:12]
        
        # Create safe filename
        if prefix:
            safe_name = f"{prefix}_{unique_id}{file_ext}"
        else:
            safe_name = f"{unique_id}{file_ext}"
        
        return safe_name
    
    def get_mime_type(self, filename: str) -> str:
        """Get MIME type for file"""
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or 'application/octet-stream'
    
    def is_image_file(self, filename: str) -> bool:
        """Check if file is an image"""
        image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']
        return Path(filename).suffix.lower() in image_extensions
    
    def is_text_file(self, filename: str) -> bool:
        """Check if file is text"""
        text_extensions = ['.txt', '.md', '.json', '.yaml', '.yml', '.csv']
        return Path(filename).suffix.lower() in text_extensions