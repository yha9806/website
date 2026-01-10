"""
Benchmark API endpoints
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

logger = logging.getLogger(__name__)

from app.core.database import get_db
from app.api.deps import get_current_user_optional
from app.models import User, AIModel, BenchmarkSuite, BenchmarkRun
from app.services.benchmark import BenchmarkRunner, StandardBenchmarks, RealTimeRanker
from app.schemas.benchmark import (
    BenchmarkSuiteResponse,
    BenchmarkRunResponse, 
    BenchmarkRunCreate,
    RealTimeRankingResponse
)

router = APIRouter(tags=["benchmarks"])


@router.get("/test-provider")
async def test_provider_methods():
    """Test provider manager methods directly"""
    try:
        from app.services.ai_providers.provider_manager import provider_manager
        
        # Test the method signatures that benchmark runner calls
        result = await provider_manager.generate_poem(
            prompt="Write a haiku about spring",
            model_name="test-model"
        )
        
        return {"status": "success", "result": result}
        
    except Exception as e:
        import traceback
        logger.error(f"Provider test failed: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"error": str(e), "traceback": traceback.format_exc()}


@router.get("/", response_model=List[BenchmarkSuiteResponse])
async def list_benchmark_suites(
    is_active: Optional[bool] = None,
    is_public: Optional[bool] = None,
    task_type: Optional[str] = None,
    session: AsyncSession = Depends(get_db)
):
    """List all benchmark suites"""
    query = select(BenchmarkSuite)
    
    if is_active is not None:
        query = query.where(BenchmarkSuite.is_active.is_(is_active))
    if is_public is not None:
        query = query.where(BenchmarkSuite.is_public.is_(is_public))
    if task_type:
        query = query.where(BenchmarkSuite.task_type == task_type)
        
    result = await session.execute(query)
    suites = result.scalars().all()
    
    return [BenchmarkSuiteResponse.model_validate(suite) for suite in suites]


@router.get("/{suite_id}", response_model=BenchmarkSuiteResponse)
async def get_benchmark_suite(
    suite_id: str,
    session: AsyncSession = Depends(get_db)
):
    """Get a specific benchmark suite"""
    result = await session.execute(select(BenchmarkSuite).where(BenchmarkSuite.id == suite_id))
    suite = result.scalar_one_or_none()
    
    if not suite:
        raise HTTPException(status_code=404, detail="Benchmark suite not found")
        
    return BenchmarkSuiteResponse.model_validate(suite)


@router.post("/run", response_model=BenchmarkRunResponse)
async def run_benchmark(
    benchmark_request: BenchmarkRunCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Run a benchmark test"""
    # Verify suite and model exist
    suite_result = await session.execute(
        select(BenchmarkSuite).where(BenchmarkSuite.id == benchmark_request.suite_id)
    )
    suite = suite_result.scalar_one_or_none()
    
    if not suite:
        raise HTTPException(status_code=404, detail="Benchmark suite not found")
        
    model_result = await session.execute(
        select(AIModel).where(AIModel.id == benchmark_request.model_id)
    )
    model = model_result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail="AI model not found")
    
    # Create benchmark runner
    runner = BenchmarkRunner(session)
    
    try:
        # Run the benchmark (this might take a while)
        benchmark_run = await runner.run_suite_for_model(
            benchmark_request.suite_id,
            benchmark_request.model_id
        )
        
        return BenchmarkRunResponse.model_validate(benchmark_run)
        
    except Exception as e:
        import traceback
        logger.error(f"Benchmark execution failed: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Benchmark execution failed: {str(e)}")


@router.get("/runs/{run_id}", response_model=BenchmarkRunResponse)
async def get_benchmark_run(
    run_id: str,
    session: AsyncSession = Depends(get_db)
):
    """Get benchmark run results"""
    result = await session.execute(select(BenchmarkRun).where(BenchmarkRun.id == run_id))
    run = result.scalar_one_or_none()
    
    if not run:
        raise HTTPException(status_code=404, detail="Benchmark run not found")
        
    return BenchmarkRunResponse.model_validate(run)


@router.get("/suites/{suite_id}/runs", response_model=List[BenchmarkRunResponse])
async def list_suite_runs(
    suite_id: str,
    limit: int = 20,
    session: AsyncSession = Depends(get_db)
):
    """List runs for a specific benchmark suite"""
    result = await session.execute(
        select(BenchmarkRun)
        .where(BenchmarkRun.suite_id == suite_id)
        .order_by(BenchmarkRun.started_at.desc())
        .limit(limit)
    )
    runs = result.scalars().all()
    
    return [BenchmarkRunResponse.model_validate(run) for run in runs]


@router.get("/models/{model_id}/runs", response_model=List[BenchmarkRunResponse])
async def list_model_runs(
    model_id: str,
    limit: int = 20,
    session: AsyncSession = Depends(get_db)
):
    """List runs for a specific model"""
    result = await session.execute(
        select(BenchmarkRun)
        .where(BenchmarkRun.model_id == model_id)
        .order_by(BenchmarkRun.started_at.desc())
        .limit(limit)
    )
    runs = result.scalars().all()
    
    return [BenchmarkRunResponse.model_validate(run) for run in runs]


@router.post("/run-all")
async def run_all_benchmarks(
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Run all active benchmark suites for all models"""
    runner = BenchmarkRunner(session)
    
    # Run in background to avoid timeout
    background_tasks.add_task(runner.run_all_active_suites)
    
    return {"message": "Benchmark execution started in background"}


@router.get("/rankings/realtime", response_model=List[RealTimeRankingResponse])
async def get_realtime_rankings(
    category: Optional[str] = None,
    session: AsyncSession = Depends(get_db)
):
    """Get real-time model rankings with confidence levels"""
    ranker = RealTimeRanker(session)
    
    try:
        rankings = await ranker.calculate_real_time_rankings(category)
        return [RealTimeRankingResponse.model_validate(ranking) for ranking in rankings]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate rankings: {str(e)}")


@router.post("/standard")
async def create_standard_benchmarks(
    session: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Create all standard benchmark suites"""
    # Check if user is admin (optional - could be public)
    if current_user and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get standard benchmarks
    standard_benchmarks = StandardBenchmarks.get_all_standard_benchmarks()
    
    created_count = 0
    for benchmark_data in standard_benchmarks:
        # Check if benchmark already exists
        existing = await session.execute(
            select(BenchmarkSuite).where(BenchmarkSuite.name == benchmark_data["name"])
        )
        
        if not existing.scalar_one_or_none():
            benchmark = BenchmarkSuite(
                name=benchmark_data["name"],
                description=benchmark_data["description"],
                version=benchmark_data["version"],
                task_type=benchmark_data["task_type"],
                test_cases=benchmark_data["test_cases"],
                evaluation_criteria=benchmark_data["evaluation_criteria"],
                difficulty_level=benchmark_data["difficulty_level"],
                tags=benchmark_data["tags"],
                auto_run=benchmark_data["auto_run"],
                run_frequency=benchmark_data["run_frequency"],
                is_active=True,
                is_public=True,
                created_by="system"
            )
            session.add(benchmark)
            created_count += 1
    
    await session.commit()
    
    return {"message": f"Created {created_count} standard benchmark suites"}


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    session: AsyncSession = Depends(get_db)
):
    """Get benchmark dashboard statistics"""
    # Count total suites
    total_suites_result = await session.execute(select(func.count(BenchmarkSuite.id)))
    total_suites = total_suites_result.scalar()
    
    # Count active suites
    active_suites_result = await session.execute(
        select(func.count(BenchmarkSuite.id)).where(BenchmarkSuite.is_active == True)
    )
    active_suites = active_suites_result.scalar()
    
    # Count total runs
    total_runs_result = await session.execute(select(func.count(BenchmarkRun.id)))
    total_runs = total_runs_result.scalar()
    
    # Count completed runs
    completed_runs_result = await session.execute(
        select(func.count(BenchmarkRun.id)).where(BenchmarkRun.status == 'completed')
    )
    completed_runs = completed_runs_result.scalar()
    
    # Count models with benchmark data
    benchmark_models_result = await session.execute(
        select(func.count(AIModel.id)).where(AIModel.data_source == 'benchmark')
    )
    benchmark_models = benchmark_models_result.scalar()
    
    return {
        "total_suites": total_suites,
        "active_suites": active_suites,
        "total_runs": total_runs,
        "completed_runs": completed_runs,
        "success_rate": round((completed_runs / total_runs * 100) if total_runs > 0 else 0, 1),
        "benchmark_verified_models": benchmark_models
    }