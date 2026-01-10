"""
Benchmark Runner - Executes benchmark tests against AI models
"""
import asyncio
import time
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_

from app.models import AIModel, BenchmarkSuite, BenchmarkRun, BenchmarkStatus
from app.services.models.unified_client import UnifiedModelClient
from app.services.intelligent_scoring import IntelligentScorer

logger = logging.getLogger(__name__)


class BenchmarkRunner:
    """
    Executes benchmark tests and tracks results
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.unified_client = UnifiedModelClient()  # Use new unified interface
        self.scorer = IntelligentScorer()
        logger.info(f"BenchmarkRunner initialized with Unified Model Interface")
        
    async def run_suite_for_model(self, suite_id: str, model_id: str) -> BenchmarkRun:
        """
        Run a specific benchmark suite against a specific model
        """
        # Fetch suite and model
        suite_result = await self.session.execute(select(BenchmarkSuite).where(BenchmarkSuite.id == suite_id))
        suite = suite_result.scalar_one_or_none()
        
        model_result = await self.session.execute(select(AIModel).where(AIModel.id == model_id))
        model = model_result.scalar_one_or_none()
        
        if not suite or not model:
            raise ValueError(f"Suite {suite_id} or Model {model_id} not found")
            
        logger.info(f"Starting benchmark run: {suite.name} for model {model.name}")
        
        # Create benchmark run record
        run = BenchmarkRun(
            suite_id=suite_id,
            model_id=model_id,
            status=BenchmarkStatus.RUNNING,
            started_at=datetime.utcnow()
        )
        self.session.add(run)
        await self.session.commit()
        await self.session.refresh(run)
        
        try:
            # Execute test cases
            test_results = []
            response_times = []
            error_count = 0
            error_details = []
            
            for i, test_case in enumerate(suite.test_cases):
                try:
                    start_time = time.time()
                    result = await self._execute_test_case(model, test_case, suite.task_type)
                    end_time = time.time()
                    
                    response_time = end_time - start_time
                    response_times.append(response_time)
                    
                    # Score the result
                    logger.info(f"Scoring result of type {type(result)}: {result}")
                    scores = await self._score_result(result, test_case, suite.evaluation_criteria, suite.task_type)
                    
                    test_results.append({
                        'test_case_id': i,
                        'prompt': test_case.get('prompt', ''),
                        'result': result,
                        'scores': scores,
                        'response_time': response_time,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    
                    logger.info(f"Test case {i+1}/{len(suite.test_cases)} completed in {response_time:.2f}s")
                    
                except Exception as e:
                    error_count += 1
                    error_details.append({
                        'test_case_id': i,
                        'error': str(e),
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    logger.error(f"Test case {i} failed: {e}")
                    
            # Calculate aggregate scores
            overall_score, scores_by_criteria = self._calculate_aggregate_scores(test_results, suite.evaluation_criteria)
            
            # Update run record with results
            await self.session.execute(
                update(BenchmarkRun)
                .where(BenchmarkRun.id == run.id)
                .values(
                    status=BenchmarkStatus.COMPLETED,
                    completed_at=datetime.utcnow(),
                    duration_seconds=time.time() - start_time,
                    test_results=test_results,
                    scores_by_criteria=scores_by_criteria,
                    overall_score=overall_score,
                    response_times=response_times,
                    average_response_time=sum(response_times) / len(response_times) if response_times else None,
                    error_count=error_count,
                    error_details=error_details
                )
            )
            
            # Update model's benchmark score
            await self._update_model_benchmark_score(model_id, overall_score, suite.name)
            
            # Update suite statistics
            await self._update_suite_statistics(suite_id)
            
            await self.session.commit()
            
            logger.info(f"Benchmark run completed. Overall score: {overall_score:.2f}")
            
            # Refresh and return the completed run
            await self.session.refresh(run)
            return run
            
        except Exception as e:
            # Mark run as failed
            await self.session.execute(
                update(BenchmarkRun)
                .where(BenchmarkRun.id == run.id)
                .values(
                    status=BenchmarkStatus.FAILED,
                    completed_at=datetime.utcnow(),
                    error_details=[{
                        'error': str(e),
                        'timestamp': datetime.utcnow().isoformat()
                    }]
                )
            )
            await self.session.commit()
            logger.error(f"Benchmark run failed: {e}")
            raise
            
    async def _execute_test_case(self, model: AIModel, test_case: Dict[str, Any], task_type: str) -> Dict[str, Any]:
        """
        Execute a single test case against the model using Unified Model Interface
        """
        prompt = test_case.get('prompt', '')
        parameters = test_case.get('parameters', {})
        
        # Map database model name to model_id in registry
        # This assumes model.name in database matches model_id in registry
        model_id = model.name.lower().replace(' ', '-').replace('.', '-')
        
        # Prepare task-specific prompt and parameters
        if task_type == 'poem':
            full_prompt = f"Write a poem about: {prompt}"
            response = await self.unified_client.generate(
                model_id=model_id,
                prompt=full_prompt,
                max_tokens=parameters.get('max_tokens', 500),
                temperature=parameters.get('temperature', 0.7)
            )
            
            # Parse response content to extract poem structure
            content = response.get('content', '')
            lines = content.split('\n')
            title = lines[0] if lines else 'Untitled'
            poem_content = '\n'.join(lines[1:]) if len(lines) > 1 else content
            
            result = {
                'title': title,
                'content': poem_content,
                'style': parameters.get('style', 'free verse'),
                'language': parameters.get('language', 'zh'),
                'metadata': {
                    'model_used': response.get('model_used', model_id),
                    'tokens_used': response.get('tokens_used', 0)
                }
            }
        elif task_type == 'story':
            full_prompt = f"Write a story about: {prompt}"
            response = await self.unified_client.generate(
                model_id=model_id,
                prompt=full_prompt,
                max_tokens=parameters.get('max_tokens', 1000),
                temperature=parameters.get('temperature', 0.8)
            )
            
            # Parse response content
            content = response.get('content', '')
            lines = content.split('\n')
            title = lines[0] if lines else 'Untitled Story'
            story_content = '\n'.join(lines[1:]) if len(lines) > 1 else content
            
            result = {
                'title': title,
                'content': story_content,
                'genre': parameters.get('genre', 'general'),
                'word_count': len(story_content.split()),
                'language': parameters.get('language', 'zh'),
                'metadata': {
                    'model_used': response.get('model_used', model_id),
                    'tokens_used': response.get('tokens_used', 0)
                }
            }
        elif task_type == 'painting':
            # For image models, we can't generate text descriptions
            # Check if this is an image model
            if 'dall-e' in model_id or 'midjourney' in model_id or 'stable-diffusion' in model_id:
                # Image models cannot generate text, return placeholder
                result = {
                    'content': f"[Image generation model - cannot generate text for: {prompt}]",
                    'image_url': None,
                    'image_base64': None,
                    'metadata': {
                        'model_type': 'image',
                        'error': 'Image models cannot generate text descriptions'
                    }
                }
            else:
                # For text models, generate a painting description
                full_prompt = f"Describe a painting of: {prompt}"
                response = await self.unified_client.generate(
                    model_id=model_id,
                    prompt=full_prompt,
                    max_tokens=parameters.get('max_tokens', 300),
                    temperature=parameters.get('temperature', 0.7)
                )
                
                result = {
                    'content': response.get('content', ''),
                    'image_url': None,
                    'image_base64': None,
                    'metadata': {
                        'model_used': response.get('model_used', model_id),
                        'tokens_used': response.get('tokens_used', 0)
                    }
                }
        else:
            raise ValueError(f"Unsupported task type: {task_type}")
            
        return result
        
    async def _score_result(self, result: Dict[str, Any], test_case: Dict[str, Any], 
                          evaluation_criteria: Dict[str, Any], task_type: str) -> Dict[str, float]:
        """
        Score a test result using the intelligent scoring system
        """
        content = result.get('content', '')
        style = result.get('style', test_case.get('style', ''))
        
        if task_type == 'poem':
            scores = await self.scorer.evaluate_poem(content, style)
        elif task_type == 'story':
            genre = result.get('genre', test_case.get('genre', ''))
            word_count = len(content.split()) if content else 0
            scores = await self.scorer.evaluate_story(content, genre, word_count)
        elif task_type == 'painting':
            scores = await self.scorer.evaluate_painting(content, style)
        else:
            raise ValueError(f"Unsupported task type: {task_type}")
            
        # Apply evaluation criteria weights if specified
        if 'weights' in evaluation_criteria:
            weighted_scores = {}
            for criterion, weight in evaluation_criteria['weights'].items():
                if criterion in scores:
                    weighted_scores[criterion] = scores[criterion] * weight
                else:
                    weighted_scores[criterion] = scores.get(criterion, 0.5) * weight
            return weighted_scores
            
        return scores
        
    def _calculate_aggregate_scores(self, test_results: List[Dict[str, Any]], 
                                  evaluation_criteria: Dict[str, Any]) -> Tuple[float, Dict[str, float]]:
        """
        Calculate aggregate scores from individual test results
        """
        if not test_results:
            return 0.0, {}
            
        # Collect all scores by criteria
        criteria_scores = {}
        for result in test_results:
            for criterion, score in result['scores'].items():
                if criterion not in criteria_scores:
                    criteria_scores[criterion] = []
                criteria_scores[criterion].append(score)
                
        # Calculate averages
        scores_by_criteria = {}
        for criterion, scores in criteria_scores.items():
            scores_by_criteria[criterion] = sum(scores) / len(scores)
            
        # Calculate overall score
        if 'overall_weight' in evaluation_criteria:
            overall_score = sum(
                score * evaluation_criteria['overall_weight'].get(criterion, 1.0)
                for criterion, score in scores_by_criteria.items()
            ) / len(scores_by_criteria)
        else:
            overall_score = sum(scores_by_criteria.values()) / len(scores_by_criteria)
            
        # Convert to 0-100 scale
        overall_score = overall_score * 100
        scores_by_criteria = {k: v * 100 for k, v in scores_by_criteria.items()}
        
        return overall_score, scores_by_criteria
        
    async def _update_model_benchmark_score(self, model_id: str, score: float, suite_name: str):
        """
        Update the model's benchmark score and metadata
        """
        # First get current verification count
        model_result = await self.session.execute(
            select(AIModel.verification_count).where(AIModel.id == model_id)
        )
        current_count = model_result.scalar() or 0
        new_count = current_count + 1
        new_confidence = min(1.0, new_count * 0.1 + 0.5)
        
        await self.session.execute(
            update(AIModel)
            .where(AIModel.id == model_id)
            .values(
                benchmark_score=score,
                last_benchmark_at=datetime.utcnow(),
                data_source='benchmark',
                verification_count=new_count,
                confidence_level=new_confidence
            )
        )
        
    async def _update_suite_statistics(self, suite_id: str):
        """
        Update benchmark suite statistics
        """
        # First get current counts
        suite_result = await self.session.execute(
            select(BenchmarkSuite.run_count, BenchmarkSuite.success_count)
            .where(BenchmarkSuite.id == suite_id)
        )
        current_run_count, current_success_count = suite_result.first() or (0, 0)
        
        await self.session.execute(
            update(BenchmarkSuite)
            .where(BenchmarkSuite.id == suite_id)
            .values(
                last_run_at=datetime.utcnow(),
                run_count=current_run_count + 1,
                success_count=current_success_count + 1
            )
        )
        
    async def run_all_active_suites(self) -> List[BenchmarkRun]:
        """
        Run all active benchmark suites for all models
        """
        # Get all active suites
        suites_result = await self.session.execute(
            select(BenchmarkSuite).where(BenchmarkSuite.is_active.is_(True))
        )
        suites = suites_result.scalars().all()
        
        # Get all active models
        models_result = await self.session.execute(
            select(AIModel).where(AIModel.is_active.is_(True))
        )
        models = models_result.scalars().all()
        
        results = []
        for suite in suites:
            for model in models:
                try:
                    run = await self.run_suite_for_model(suite.id, model.id)
                    results.append(run)
                except Exception as e:
                    logger.error(f"Failed to run suite {suite.name} for model {model.name}: {e}")
                    
        return results
        
    async def schedule_periodic_runs(self):
        """
        Schedule periodic benchmark runs based on suite configurations
        """
        while True:
            try:
                # Get suites that need to run
                now = datetime.utcnow()
                suites_result = await self.session.execute(
                    select(BenchmarkSuite).where(
                        BenchmarkSuite.is_active.is_(True),
                        BenchmarkSuite.auto_run.is_(True),
                        or_(BenchmarkSuite.next_run_at <= now, BenchmarkSuite.next_run_at.is_(None))
                    )
                )
                suites = suites_result.scalars().all()
                
                for suite in suites:
                    logger.info(f"Running scheduled benchmark: {suite.name}")
                    try:
                        await self.run_all_models_for_suite(suite.id)
                        
                        # Calculate next run time
                        if suite.run_frequency == 'daily':
                            next_run = now + timedelta(days=1)
                        elif suite.run_frequency == 'weekly':
                            next_run = now + timedelta(weeks=1)
                        elif suite.run_frequency == 'monthly':
                            next_run = now + timedelta(days=30)
                        else:
                            next_run = now + timedelta(days=7)  # Default to weekly
                            
                        await self.session.execute(
                            update(BenchmarkSuite)
                            .where(BenchmarkSuite.id == suite.id)
                            .values(next_run_at=next_run)
                        )
                        
                    except Exception as e:
                        logger.error(f"Scheduled benchmark failed for {suite.name}: {e}")
                        
                await self.session.commit()
                
            except Exception as e:
                logger.error(f"Error in periodic benchmark scheduler: {e}")
                
            # Wait for 1 hour before checking again
            await asyncio.sleep(3600)
            
    async def run_all_models_for_suite(self, suite_id: str) -> List[BenchmarkRun]:
        """
        Run a benchmark suite for all active models
        """
        models_result = await self.session.execute(
            select(AIModel).where(AIModel.is_active.is_(True))
        )
        models = models_result.scalars().all()
        
        results = []
        for model in models:
            try:
                run = await self.run_suite_for_model(suite_id, model.id)
                results.append(run)
            except Exception as e:
                logger.error(f"Failed to run suite for model {model.name}: {e}")
                
        return results