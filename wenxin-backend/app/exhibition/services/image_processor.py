"""
Image Processor for Aliyun OSS images
"""
import base64
import httpx
import logging
from typing import Optional, Tuple
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Process images from Aliyun OSS with resize support"""

    # Aliyun OSS image processing parameter
    OSS_PROCESS_PREFIX = "x-oss-process=image"

    @staticmethod
    def get_resized_url(
        original_url: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        percentage: Optional[int] = None,
        mode: str = "lfit"  # lfit, mfit, fill, pad, fixed
    ) -> str:
        """
        Generate resized image URL using Aliyun OSS processing

        Args:
            original_url: Original OSS image URL
            width: Target width in pixels
            height: Target height in pixels
            percentage: Resize percentage (1-1000)
            mode: Resize mode (lfit=scale, mfit=scale+crop, fill=fill, pad=pad)

        Returns:
            URL with resize parameters
        """
        if not original_url:
            return ""

        # Parse URL and remove existing width/height params that conflict with OSS processing
        parsed = urlparse(original_url)
        query_params = parse_qs(parsed.query)

        # Remove conflicting params
        query_params.pop('width', None)
        query_params.pop('height', None)

        # Build resize parameters (OSS uses comma as separator)
        resize_parts = ["resize", f"m_{mode}"]
        if percentage:
            resize_parts = ["resize", f"p_{percentage}"]
        else:
            if width:
                resize_parts.append(f"w_{width}")
            if height:
                resize_parts.append(f"h_{height}")

        # Add OSS process param (format: image/resize,m_lfit,w_1024)
        process_value = f"image/{','.join(resize_parts)}"
        query_params['x-oss-process'] = [process_value]

        # Rebuild query string (flatten single-value lists)
        new_query = "&".join(
            f"{k}={v[0]}" if len(v) == 1 else "&".join(f"{k}={vi}" for vi in v)
            for k, v in query_params.items()
        )

        # Rebuild URL
        new_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))

        return new_url

    @staticmethod
    def get_thumbnail_url(original_url: str, size: int = 300) -> str:
        """Get thumbnail URL (square crop)"""
        return ImageProcessor.get_resized_url(
            original_url,
            width=size,
            height=size,
            mode="fill"
        )

    @staticmethod
    def get_preview_url(original_url: str, max_width: int = 800) -> str:
        """Get preview URL (scaled to max width)"""
        return ImageProcessor.get_resized_url(
            original_url,
            width=max_width,
            mode="lfit"
        )

    # Claude API maximum image size: 5MB
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB in bytes

    @staticmethod
    async def fetch_image_base64(
        url: str,
        max_width: int = 1024,
        timeout: float = 30.0
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Fetch image and return as base64 for Claude vision API
        Uses Aliyun OSS resize to ensure image is under 5MB limit

        Args:
            url: Image URL
            max_width: Max width for resizing (reduces token usage)
            timeout: Request timeout

        Returns:
            Tuple of (base64_data, media_type) or (None, None) on error
        """
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                # Try with OSS resize parameter to reduce image size
                # Use max_width and convert to JPEG for better compression
                resized_url = ImageProcessor.get_resized_url(
                    url,
                    width=max_width,
                    mode="lfit"
                )

                # Try progressively smaller sizes if image is too large
                widths_to_try = [max_width, 800, 600, 400]

                for width in widths_to_try:
                    if width != max_width:
                        resized_url = ImageProcessor.get_resized_url(url, width=width, mode="lfit")

                    response = await client.get(resized_url)
                    response.raise_for_status()

                    # Check if under size limit
                    if len(response.content) <= ImageProcessor.MAX_IMAGE_SIZE:
                        break

                    logger.warning(f"Image {len(response.content)} bytes exceeds limit, trying smaller size")

                # If still too large after all attempts, skip this image
                if len(response.content) > ImageProcessor.MAX_IMAGE_SIZE:
                    logger.error(f"Image still too large after resize: {len(response.content)} bytes")
                    return None, None

                # Determine media type
                content_type = response.headers.get("content-type", "image/jpeg")
                if "png" in content_type:
                    media_type = "image/png"
                elif "gif" in content_type:
                    media_type = "image/gif"
                elif "webp" in content_type:
                    media_type = "image/webp"
                else:
                    media_type = "image/jpeg"

                # Encode to base64
                base64_data = base64.b64encode(response.content).decode("utf-8")

                logger.info(f"Fetched image: {len(response.content)} bytes ({width}px), type: {media_type}")
                return base64_data, media_type

        except Exception as e:
            logger.error(f"Failed to fetch image {url}: {e}")
            return None, None

    @staticmethod
    def parse_image_urls(image_urls_str: str) -> list[str]:
        """Parse comma-separated image URLs string"""
        if not image_urls_str:
            return []
        return [url.strip() for url in image_urls_str.split(",") if url.strip()]
