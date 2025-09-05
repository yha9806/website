"""
VULCA Service Layer - Business Logic Implementation
Handles VULCA evaluation operations and database interactions
"""

from typing import List, Dict, Optional, Any
import asyncio
from datetime import datetime
import json
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete
from sqlalchemy.orm import selectinload

from ..core.vulca_core_adapter import VULCACoreAdapter
from ..models.vulca_model import VULCAEvaluation, VULCADimension
from ...core.database import get_db

class VULCAService:
    """VULCA business logic service"""
    
    def __init__(self, db_session: Optional[AsyncSession] = None):
        self.db = db_session
        self.adapter = VULCACoreAdapter()
        
    async def evaluate_model(
        self, 
        model_id: int, 
        scores_6d: Dict[str, float],
        model_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a single model with VULCA framework
        
        Args:
            model_id: Model identifier
            scores_6d: 6-dimensional base scores
            model_name: Optional model name
            
        Returns:
            Complete evaluation results including 47D scores and cultural perspectives
        """
        try:
            # Expand to 47 dimensions
            scores_47d = self.adapter.expand_6d_to_47d(scores_6d)
            
            # Calculate cultural perspectives
            cultural_scores = self.adapter.calculate_cultural_scores(scores_47d)
            
            # Prepare evaluation result
            evaluation_result = {
                'model_id': model_id,
                'model_name': model_name or f'Model_{model_id}',
                'scores_6d': scores_6d,
                'scores_47d': scores_47d,
                'cultural_perspectives': cultural_scores,
                'evaluation_date': datetime.utcnow().isoformat(),
                'metadata': {
                    'algorithm_version': '2.0',
                    'expansion_method': 'correlation_matrix',
                    'cultural_perspectives_count': len(cultural_scores)
                }
            }
            
            # Save to database if session available
            if self.db:
                await self._save_evaluation(evaluation_result)
                
            return evaluation_result
            
        except Exception as e:
            raise RuntimeError(f"Evaluation failed: {str(e)}")
            
    async def _save_evaluation(self, evaluation_result: Dict[str, Any]):
        """Save evaluation to database"""
        try:
            evaluation = VULCAEvaluation(
                model_id=evaluation_result['model_id'],
                model_name=evaluation_result['model_name'],
                original_6d_scores=json.dumps(evaluation_result['scores_6d']),
                extended_47d_scores=json.dumps(evaluation_result['scores_47d']),
                cultural_perspectives=json.dumps(evaluation_result['cultural_perspectives']),
                evaluation_metadata=json.dumps(evaluation_result['metadata']),
                evaluation_date=datetime.fromisoformat(evaluation_result['evaluation_date'])
            )
            
            self.db.add(evaluation)
            await self.db.commit()
            
        except Exception as e:
            await self.db.rollback()
            raise RuntimeError(f"Failed to save evaluation: {str(e)}")
            
    async def compare_models(
        self, 
        model_ids: List[int],
        include_details: bool = True
    ) -> Dict[str, Any]:
        """
        Compare multiple models using VULCA metrics
        
        Args:
            model_ids: List of model IDs to compare
            include_details: Whether to include detailed scores
            
        Returns:
            Comparison results with difference matrix and summary
        """
        if len(model_ids) < 2:
            raise ValueError("At least 2 models required for comparison")
            
        evaluations = []
        
        # Get evaluations for each model
        if self.db:
            for model_id in model_ids:
                stmt = select(VULCAEvaluation).where(
                    VULCAEvaluation.model_id == model_id
                ).order_by(VULCAEvaluation.evaluation_date.desc())
                
                result = await self.db.execute(stmt)
                evaluation = result.scalar_one_or_none()
                
                if evaluation:
                    evaluations.append({
                        'model_id': evaluation.model_id,
                        'model_name': evaluation.model_name,
                        'scores_47d': json.loads(evaluation.extended_47d_scores),
                        'cultural_scores': json.loads(evaluation.cultural_perspectives)
                    })
        else:
            # Generate sample data if no database
            for model_id in model_ids:
                sample_6d = {dim: np.random.uniform(70, 95) for dim in self.adapter.base_dims}
                result = await self.evaluate_model(model_id, sample_6d, f'Model_{model_id}')
                evaluations.append({
                    'model_id': model_id,
                    'model_name': result['model_name'],
                    'scores_47d': result['scores_47d'],
                    'cultural_scores': result['cultural_perspectives']
                })
                
        # Calculate difference matrix
        diff_matrix = self._calculate_difference_matrix(evaluations)
        
        # Generate comparison summary
        summary = self._generate_comparison_summary(evaluations, diff_matrix)
        
        comparison_result = {
            'models': evaluations if include_details else [
                {'model_id': e['model_id'], 'model_name': e['model_name']} 
                for e in evaluations
            ],
            'difference_matrix': diff_matrix.tolist(),
            'summary': summary,
            'comparison_date': datetime.utcnow().isoformat()
        }
        
        return comparison_result
        
    def _calculate_difference_matrix(self, evaluations: List[Dict]) -> np.ndarray:
        """Calculate pairwise difference matrix between models"""
        n_models = len(evaluations)
        diff_matrix = np.zeros((n_models, n_models))
        
        for i in range(n_models):
            for j in range(n_models):
                if i != j:
                    scores_i = np.array(list(evaluations[i]['scores_47d'].values()))
                    scores_j = np.array(list(evaluations[j]['scores_47d'].values()))
                    
                    # Calculate Euclidean distance
                    diff_matrix[i, j] = np.sqrt(np.sum((scores_i - scores_j) ** 2))
                    
        return diff_matrix
        
    def _generate_comparison_summary(
        self, 
        evaluations: List[Dict], 
        diff_matrix: np.ndarray
    ) -> Dict[str, Any]:
        """Generate summary statistics for model comparison"""
        n_models = len(evaluations)
        
        # Find most similar and most different pairs
        np.fill_diagonal(diff_matrix, np.inf)  # Ignore diagonal
        
        min_diff_idx = np.unravel_index(np.argmin(diff_matrix), diff_matrix.shape)
        max_diff_idx = np.unravel_index(np.argmax(diff_matrix[diff_matrix != np.inf]), 
                                         diff_matrix.shape)
        
        # Calculate average differences
        valid_diffs = diff_matrix[diff_matrix != np.inf]
        avg_diff = float(np.mean(valid_diffs)) if len(valid_diffs) > 0 else 0
        
        # Calculate dimension-wise statistics
        all_scores = np.array([list(e['scores_47d'].values()) for e in evaluations])
        dim_stats = {
            'mean_by_dimension': np.mean(all_scores, axis=0).tolist(),
            'std_by_dimension': np.std(all_scores, axis=0).tolist(),
            'max_by_dimension': np.max(all_scores, axis=0).tolist(),
            'min_by_dimension': np.min(all_scores, axis=0).tolist()
        }
        
        # Cultural perspective analysis
        cultural_analysis = {}
        for perspective in self.adapter.cultural_perspectives:
            scores = [e['cultural_scores'][perspective] for e in evaluations]
            cultural_analysis[perspective] = {
                'mean': float(np.mean(scores)),
                'std': float(np.std(scores)),
                'best_model': evaluations[np.argmax(scores)]['model_name']
            }
            
        return {
            'most_similar': {
                'models': [evaluations[min_diff_idx[0]]['model_name'], 
                          evaluations[min_diff_idx[1]]['model_name']],
                'difference': float(diff_matrix[min_diff_idx])
            },
            'most_different': {
                'models': [evaluations[max_diff_idx[0]]['model_name'], 
                          evaluations[max_diff_idx[1]]['model_name']],
                'difference': float(diff_matrix[max_diff_idx])
            },
            'average_difference': avg_diff,
            'dimension_statistics': dim_stats,
            'cultural_analysis': cultural_analysis
        }
        
    async def get_model_history(
        self, 
        model_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get evaluation history for a specific model
        
        Args:
            model_id: Model identifier
            limit: Maximum number of records to return
            
        Returns:
            List of historical evaluations
        """
        if not self.db:
            return []
            
        stmt = select(VULCAEvaluation).where(
            VULCAEvaluation.model_id == model_id
        ).order_by(
            VULCAEvaluation.evaluation_date.desc()
        ).limit(limit)
        
        result = await self.db.execute(stmt)
        evaluations = result.scalars().all()
        
        history = []
        for eval in evaluations:
            history.append({
                'evaluation_id': eval.id,
                'model_id': eval.model_id,
                'model_name': eval.model_name,
                'scores_6d': json.loads(eval.original_6d_scores),
                'scores_47d': json.loads(eval.extended_47d_scores),
                'cultural_perspectives': json.loads(eval.cultural_perspectives),
                'evaluation_date': eval.evaluation_date.isoformat(),
                'metadata': json.loads(eval.evaluation_metadata) if eval.evaluation_metadata else {}
            })
            
        return history
        
    async def get_dimensions_info(self) -> List[Dict[str, Any]]:
        """
        Get detailed information about all 47 dimensions
        
        Returns:
            List of dimension information
        """
        return self.adapter.get_dimension_info()
        
    async def get_cultural_perspectives(self) -> List[Dict[str, str]]:
        """
        Get information about all cultural perspectives
        
        Returns:
            List of cultural perspective descriptions
        """
        perspectives = []
        
        descriptions = {
            'western': 'Emphasizes individualism, innovation, and analytical thinking',
            'eastern': 'Values harmony, tradition, and holistic approaches',
            'african': 'Focuses on community, rhythm, and ancestral wisdom',
            'latin_american': 'Celebrates passion, family, and magical realism',
            'middle_eastern': 'Prioritizes hospitality, tradition, and spirituality',
            'south_asian': 'Combines spirituality, family values, and cultural festivals',
            'oceanic': 'Connects with nature, ocean, and island communities',
            'indigenous': 'Honors land connection, ancestral wisdom, and oral traditions'
        }
        
        for perspective in self.adapter.cultural_perspectives:
            perspectives.append({
                'id': perspective,
                'name': perspective.replace('_', ' ').title(),
                'description': descriptions.get(perspective, ''),
                'weight_range': '0.5 - 1.0'
            })
            
        return perspectives