"""List all models in database"""
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.ai_model import AIModel

async def list_models():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(AIModel.name, AIModel.id))
        models = result.all()
        print("Models in database:")
        for name, id in sorted(models):
            print(f"  {name} ({id})")
        print(f"\nTotal: {len(models)} models")

if __name__ == "__main__":
    asyncio.run(list_models())