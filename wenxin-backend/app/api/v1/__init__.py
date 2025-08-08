from fastapi import APIRouter
from .auth import router as auth_router
from .models import router as models_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(models_router, prefix="/models", tags=["AI Models"])