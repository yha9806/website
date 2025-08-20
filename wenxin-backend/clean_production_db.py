"""
Clean production database - Remove old test data and prepare for new import
Supports both SQLite (dev) and PostgreSQL (production)
"""
import asyncio
import json
import sys
import io
from datetime import datetime
from pathlib import Path
import os

# Set UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, engine
from app.models.ai_model import AIModel
from app.core.config import settings


class ProductionDatabaseCleaner:
    def __init__(self):
        self.backup_dir = Path("database_backups")
        self.backup_dir.mkdir(exist_ok=True)
        
    async def backup_current_data(self, session: AsyncSession):
        """Backup current database data before cleaning"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = self.backup_dir / f"backup_{timestamp}.json"
        
        print(f"[BACKUP] Creating backup at {backup_file}")
        
        # Get all current models
        result = await session.execute(select(AIModel))
        models = result.scalars().all()
        
        backup_data = {
            'timestamp': timestamp,
            'environment': settings.ENVIRONMENT,
            'database_url': settings.DATABASE_URL.split('@')[0] if '@' in settings.DATABASE_URL else 'local',
            'total_models': len(models),
            'models': []
        }
        
        for model in models:
            model_data = {
                'id': str(model.id),
                'name': model.name,
                'organization': model.organization,
                'version': model.version,
                'overall_score': model.overall_score,
                'data_source': model.data_source,
                'is_active': model.is_active,
                'is_verified': model.is_verified,
                'metrics': model.metrics,
                'tags': model.tags,
                'created_at': model.created_at.isoformat() if model.created_at else None,
                'benchmark_score': model.benchmark_score,
                'benchmark_metadata': model.benchmark_metadata
            }
            backup_data['models'].append(model_data)
        
        # Save backup
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)
        
        print(f"[BACKUP] Saved {len(models)} models to backup")
        return backup_file
    
    async def clean_test_data(self, session: AsyncSession):
        """Remove old test data from database"""
        print("[CLEAN] Starting database cleanup...")
        
        # Count models by data source
        result = await session.execute(
            select(
                AIModel.data_source,
                func.count(AIModel.id).label('count')
            ).group_by(AIModel.data_source)
        )
        source_counts = result.all()
        
        print("\n[INFO] Current data distribution:")
        for source, count in source_counts:
            print(f"  - {source or 'null'}: {count} models")
        
        # Delete models based on criteria
        delete_criteria = [
            # Old mock data
            (AIModel.data_source == 'mock', "mock data"),
            # Unverified models
            (AIModel.is_verified == False, "unverified models"),
            # Models without benchmark data
            ((AIModel.benchmark_score == None) & (AIModel.data_source != 'benchmark'), "models without benchmark"),
            # Models with null data source (legacy)
            (AIModel.data_source == None, "legacy models")
        ]
        
        total_deleted = 0
        for criteria, description in delete_criteria:
            result = await session.execute(
                select(AIModel).where(criteria)
            )
            models_to_delete = result.scalars().all()
            
            if models_to_delete:
                print(f"\n[DELETE] Removing {len(models_to_delete)} {description}:")
                for model in models_to_delete:
                    print(f"  - {model.name}")
                    await session.delete(model)
                
                total_deleted += len(models_to_delete)
        
        await session.commit()
        print(f"\n[CLEAN] Total deleted: {total_deleted} models")
        
        # Verify remaining models
        result = await session.execute(select(func.count(AIModel.id)))
        remaining = result.scalar()
        print(f"[INFO] Remaining models: {remaining}")
        
        return total_deleted
    
    async def prepare_for_import(self, session: AsyncSession):
        """Prepare database for new data import"""
        print("\n[PREPARE] Preparing database for import...")
        
        # Check if database has required columns
        if settings.DATABASE_URL.startswith("sqlite"):
            # For SQLite, check columns using raw SQL
            from sqlalchemy import text
            result = await session.execute(text("PRAGMA table_info(ai_models)"))
            columns = [row[1] for row in result]
            
            required_columns = [
                'benchmark_responses',
                'scoring_details', 
                'score_highlights',
                'score_weaknesses',
                'improvement_suggestions'
            ]
            
            missing_columns = [col for col in required_columns if col not in columns]
            if missing_columns:
                print(f"[WARNING] Missing columns: {missing_columns}")
                print("[INFO] Run update_db_v2.py to add missing columns")
                return False
        
        print("[PREPARE] Database structure verified")
        return True


async def main():
    """Main cleanup function"""
    print("=" * 60)
    print("PRODUCTION DATABASE CLEANER")
    print(f"Environment: {settings.ENVIRONMENT}")
    print("=" * 60)
    
    # Confirm action
    if settings.ENVIRONMENT == "production":
        print("\n⚠️  WARNING: Running in PRODUCTION mode!")
        print("This will delete data from the production database.")
        response = input("Type 'CONFIRM' to proceed: ")
        if response != "CONFIRM":
            print("[ABORT] Operation cancelled")
            return
    
    cleaner = ProductionDatabaseCleaner()
    
    async with AsyncSessionLocal() as session:
        # Phase 1: Backup
        print("\nPhase 1: Backup current data")
        print("-" * 40)
        backup_file = await cleaner.backup_current_data(session)
        
        # Phase 2: Clean
        print("\nPhase 2: Clean test data")
        print("-" * 40)
        deleted_count = await cleaner.clean_test_data(session)
        
        # Phase 3: Prepare
        print("\nPhase 3: Prepare for import")
        print("-" * 40)
        ready = await cleaner.prepare_for_import(session)
        
        if ready:
            print("\n✅ [SUCCESS] Database cleaned and ready for import")
            print(f"📁 Backup saved to: {backup_file}")
            print(f"🗑️  Deleted {deleted_count} old records")
        else:
            print("\n⚠️  [WARNING] Database needs schema update")
            print("Run: python update_db_v2.py")


if __name__ == "__main__":
    # Check environment variable for production
    if os.getenv("ENVIRONMENT") == "production":
        settings.ENVIRONMENT = "production"
        # Override database URL for production
        prod_db_url = os.getenv("DATABASE_URL")
        if prod_db_url:
            settings.DATABASE_URL = prod_db_url
    
    asyncio.run(main())