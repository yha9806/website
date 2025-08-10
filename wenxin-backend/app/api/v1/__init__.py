from fastapi import APIRouter
from .auth import router as auth_router
from .models import router as models_router
from .battles import router as battles_router
from .artworks import router as artworks_router
from .evaluations import router as evaluations_router
from .scoring_advice import router as scoring_advice_router
from .websocket_simple import router as websocket_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(models_router, prefix="/models", tags=["AI Models"])
api_router.include_router(battles_router, prefix="/battles", tags=["Battles"])
api_router.include_router(artworks_router, prefix="/artworks", tags=["Artworks"])
api_router.include_router(evaluations_router, prefix="/evaluations", tags=["Evaluations"])
api_router.include_router(scoring_advice_router, prefix="/scoring-advice", tags=["Scoring Advice"])
api_router.include_router(websocket_router, tags=["Real-time"])