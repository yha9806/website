"""
Real-time ranking algorithm that combines multiple data sources
"""
import math
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models import AIModel, BenchmarkRun, EvaluationTask, Battle

logger = logging.getLogger(__name__)


class RealTimeRanker:
    """
    Dynamic ranking algorithm that calculates model scores based on:
    1. Benchmark test results (highest weight)
    2. Human evaluation scores (medium weight)  
    3. Battle/voting results (lower weight)
    4. Data recency and confidence levels
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        
        # Algorithm weights
        self.weights = {
            'benchmark': 0.60,    # Benchmark tests (most reliable)
            'human_eval': 0.25,   # Human evaluations
            'battle': 0.10,       # Battle results
            'recency': 0.05       # Recency bonus
        }
        
        # Confidence thresholds
        self.confidence_thresholds = {
            'high': 0.8,      # 80%+ confidence
            'medium': 0.5,    # 50-80% confidence  
            'low': 0.3        # 30-50% confidence
        }
        
    async def calculate_real_time_rankings(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Calculate real-time rankings for all models
        """
        # Get all active models
        models_query = select(AIModel).where(AIModel.is_active == True)
        if category:
            models_query = models_query.where(AIModel.category == category)
            
        models_result = await self.session.execute(models_query)
        models = models_result.scalars().all()
        
        rankings = []
        for model in models:
            score_data = await self._calculate_model_score(model)
            rankings.append(score_data)
            
        # Sort by total score (descending)
        rankings.sort(key=lambda x: x['total_score'], reverse=True)
        
        # Add rank positions
        for i, ranking in enumerate(rankings):
            ranking['rank'] = i + 1
            
        return rankings
        
    async def _calculate_model_score(self, model: AIModel) -> Dict[str, Any]:
        """
        Calculate comprehensive score for a single model
        """
        # 1. Get benchmark scores
        benchmark_score, benchmark_confidence = await self._get_benchmark_score(model.id)
        
        # 2. Get human evaluation scores  
        human_eval_score, human_eval_confidence = await self._get_human_evaluation_score(model.id)
        
        # 3. Get battle/voting scores
        battle_score, battle_confidence = await self._get_battle_score(model.id)
        
        # 4. Calculate recency bonus
        recency_bonus = self._calculate_recency_bonus(model)
        
        # 5. Combine scores with weights
        total_score = (
            benchmark_score * self.weights['benchmark'] +
            human_eval_score * self.weights['human_eval'] +
            battle_score * self.weights['battle'] +
            recency_bonus * self.weights['recency']
        )
        
        # 6. Calculate overall confidence
        overall_confidence = self._calculate_overall_confidence(
            benchmark_confidence, human_eval_confidence, battle_confidence
        )
        
        # 7. Determine data source mix
        data_sources = self._determine_data_sources(benchmark_score, human_eval_score, battle_score)
        
        return {
            'model_id': model.id,
            'model_name': model.name,
            'organization': model.organization,
            'category': model.category,
            'total_score': round(total_score, 2),
            'confidence_level': overall_confidence,
            'data_sources': data_sources,
            'score_breakdown': {
                'benchmark': round(benchmark_score, 2),
                'human_evaluation': round(human_eval_score, 2),
                'battle_results': round(battle_score, 2),
                'recency_bonus': round(recency_bonus, 2)
            },
            'confidence_breakdown': {
                'benchmark': benchmark_confidence,
                'human_evaluation': human_eval_confidence,
                'battle': battle_confidence,
                'overall': overall_confidence
            },
            'last_updated': datetime.utcnow().isoformat()
        }
        
    async def _get_benchmark_score(self, model_id: str) -> Tuple[float, float]:
        """
        Get weighted average of benchmark test scores
        """
        # Get recent benchmark runs (last 30 days)
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        benchmark_runs_result = await self.session.execute(
            select(BenchmarkRun)
            .where(
                BenchmarkRun.model_id == model_id,
                BenchmarkRun.status == 'completed',
                BenchmarkRun.completed_at >= cutoff_date
            )
            .order_by(BenchmarkRun.completed_at.desc())
        )
        runs = benchmark_runs_result.scalars().all()
        
        if not runs:
            # Fallback to model's stored benchmark_score
            model_result = await self.session.execute(
                select(AIModel).where(AIModel.id == model_id)
            )
            model = model_result.scalar_one()
            return model.benchmark_score or 0.0, 0.1  # Low confidence for missing data
            
        # Weight recent runs higher
        total_weighted_score = 0
        total_weight = 0
        
        for i, run in enumerate(runs[:10]):  # Consider last 10 runs
            # Recency weight (more recent = higher weight)
            recency_weight = math.exp(-i * 0.1)  # Exponential decay
            
            # Quality weight based on test count
            quality_weight = min(1.0, len(run.test_results) / 10.0)
            
            final_weight = recency_weight * quality_weight
            total_weighted_score += (run.overall_score or 0) * final_weight
            total_weight += final_weight
            
        if total_weight == 0:
            return 0.0, 0.1
            
        avg_score = total_weighted_score / total_weight
        
        # Confidence based on number of runs and consistency
        confidence = min(0.95, 0.3 + (len(runs) * 0.1))  # Max 95% confidence
        
        # Reduce confidence if scores are inconsistent
        if len(runs) > 1:
            scores = [run.overall_score or 0 for run in runs[:5]]
            std_dev = math.sqrt(sum((x - avg_score) ** 2 for x in scores) / len(scores))
            consistency_factor = max(0.5, 1.0 - (std_dev / 20.0))  # Penalize high variance
            confidence *= consistency_factor
            
        return avg_score, confidence
        
    async def _get_human_evaluation_score(self, model_id: str) -> Tuple[float, float]:
        """
        Get human evaluation scores from evaluation tasks
        """
        # Get completed evaluation tasks with human scores
        tasks_result = await self.session.execute(
            select(EvaluationTask)
            .where(
                EvaluationTask.model_id == model_id,
                EvaluationTask.status == 'completed',
                EvaluationTask.human_score.isnot(None)
            )
            .order_by(EvaluationTask.completed_at.desc())
            .limit(20)  # Last 20 human evaluations
        )
        tasks = tasks_result.scalars().all()
        
        if not tasks:
            return 0.0, 0.0  # No human evaluations
            
        # Calculate weighted average
        total_score = 0
        total_weight = 0
        
        for i, task in enumerate(tasks):
            # Weight recent evaluations higher
            recency_weight = math.exp(-i * 0.05)
            
            # Weight based on evaluation completeness
            completeness_weight = 1.0
            if task.evaluation_metrics:
                completeness_weight = len(task.evaluation_metrics) / 5.0  # Assume 5 key metrics
                
            final_weight = recency_weight * completeness_weight
            total_score += task.human_score * final_weight
            total_weight += final_weight
            
        avg_score = total_score / total_weight if total_weight > 0 else 0
        
        # Confidence based on number of evaluations
        confidence = min(0.9, len(tasks) * 0.08)  # Max 90% confidence
        
        return avg_score, confidence
        
    async def _get_battle_score(self, model_id: str) -> Tuple[float, float]:
        """
        Get battle/voting scores
        """
        # Get battles where this model participated
        battles_result = await self.session.execute(
            select(Battle)
            .where(
                (Battle.model_a_id == model_id) | (Battle.model_b_id == model_id),
                Battle.status == 'completed'
            )
            .order_by(Battle.completed_at.desc())
            .limit(50)  # Last 50 battles
        )
        battles = battles_result.scalars().all()
        
        if not battles:
            return 0.0, 0.0
            
        wins = 0
        total_battles = len(battles)
        
        for battle in battles:
            if battle.model_a_id == model_id and battle.votes_a > battle.votes_b:
                wins += 1
            elif battle.model_b_id == model_id and battle.votes_b > battle.votes_a:
                wins += 1
                
        win_rate = wins / total_battles if total_battles > 0 else 0
        
        # Convert win rate to 0-100 score
        battle_score = win_rate * 100
        
        # Confidence based on total votes
        total_votes = sum(battle.votes_a + battle.votes_b for battle in battles)
        confidence = min(0.8, total_votes / 1000.0)  # Max 80% confidence, need 1000+ votes
        
        return battle_score, confidence
        
    def _calculate_recency_bonus(self, model: AIModel) -> float:
        """
        Calculate bonus points for recent activity
        """
        if not model.last_benchmark_at:
            return 0.0
            
        days_since_update = (datetime.utcnow() - model.last_benchmark_at).days
        
        if days_since_update <= 7:
            return 5.0      # Recent activity bonus
        elif days_since_update <= 30:
            return 2.0      # Moderate recency
        else:
            return 0.0      # No bonus for old data
            
    def _calculate_overall_confidence(self, benchmark_conf: float, human_conf: float, battle_conf: float) -> float:
        """
        Calculate overall confidence level
        """
        # Weighted average of confidence levels
        overall = (
            benchmark_conf * self.weights['benchmark'] +
            human_conf * self.weights['human_eval'] +
            battle_conf * self.weights['battle']
        )
        
        return min(0.95, overall)  # Cap at 95%
        
    def _determine_data_sources(self, benchmark_score: float, human_score: float, battle_score: float) -> List[str]:
        """
        Determine which data sources contribute to the score
        """
        sources = []
        
        if benchmark_score > 0:
            sources.append('benchmark')
        if human_score > 0:
            sources.append('human_evaluation')
        if battle_score > 0:
            sources.append('battle_results')
            
        if not sources:
            sources.append('mock')  # Fallback for mock data
            
        return sources
        
    def get_confidence_label(self, confidence: float) -> str:
        """
        Get human-readable confidence label
        """
        if confidence >= self.confidence_thresholds['high']:
            return 'high'
        elif confidence >= self.confidence_thresholds['medium']:
            return 'medium'
        elif confidence >= self.confidence_thresholds['low']:
            return 'low'
        else:
            return 'very_low'
            
    async def get_model_ranking_history(self, model_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get historical ranking data for a specific model
        """
        # This would require storing historical rankings
        # For now, return current ranking
        current_ranking = await self._calculate_model_score(
            await self.session.get(AIModel, model_id)
        )
        
        return [{
            'date': datetime.utcnow().date().isoformat(),
            'rank': current_ranking['rank'] if 'rank' in current_ranking else None,
            'score': current_ranking['total_score'],
            'confidence': current_ranking['confidence_level']
        }]