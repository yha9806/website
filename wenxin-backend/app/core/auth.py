"""
Authentication dependencies and utilities
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False  # Don't auto-raise 401, let us handle it
)

# Optional OAuth2 for admin endpoints
oauth2_scheme_admin = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=True  # Auto-raise 401 for admin endpoints
)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Optional[User]:
    """
    Get current user from JWT token
    Returns None if no token or invalid token
    """
    if not token:
        return None
    
    # Decode token to get username
    username = decode_token(token)
    if not username:
        return None
    
    # Get user from database
    result = await db.execute(
        select(User).where(User.username == username)
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        return None
    
    return user


async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """
    Get current active user
    Raises 401 if not authenticated
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


async def get_current_admin_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme_admin)
) -> User:
    """
    Get current admin user
    Raises 401 if not authenticated or 403 if not admin
    """
    # Decode token
    username = decode_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    result = await db.execute(
        select(User).where(User.username == username)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Check if user is admin
    if not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    
    return user


async def get_optional_current_user(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise None
    Used for endpoints that work with or without authentication
    """
    if not token:
        return None
    
    try:
        username = decode_token(token)
        if not username:
            return None
        
        result = await db.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()
        
        if user and user.is_active:
            return user
    except Exception:
        pass
    
    return None