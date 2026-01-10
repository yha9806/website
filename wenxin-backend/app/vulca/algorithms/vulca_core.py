"""
VULCA Core Algorithm - Production Implementation
Integrates EMNLP2025 research with correlation matrix for intelligent 6D→47D expansion
"""

import time
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
import json
import hashlib
from datetime import datetime

from .emnlp2025 import VULCAAlgorithmV2, VULCA_47_DIMENSIONS
from .correlation_matrix import CorrelationMatrix


@dataclass
class VULCAResult:
    """Complete VULCA evaluation result"""
    model_id: str
    timestamp: datetime
    version: str = "2.0"
    
    # Core scores
    scores_6d: Dict[str, float] = field(default_factory=dict)
    scores_47d: Dict[str, float] = field(default_factory=dict)
    overall_score: float = 0.0
    
    # Metadata
    algorithm_version: str = "EMNLP2025-v2.0"
    processing_time_ms: float = 0.0
    correlation_strength: float = 0.0
    confidence_level: float = 0.0
    
    # Additional analysis
    top_dimensions: List[Tuple[str, float]] = field(default_factory=list)
    weakest_dimensions: List[Tuple[str, float]] = field(default_factory=list)
    category_scores: Dict[str, float] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'model_id': self.model_id,
            'timestamp': self.timestamp.isoformat(),
            'version': self.version,
            'scores_6d': self.scores_6d,
            'scores_47d': self.scores_47d,
            'overall_score': self.overall_score,
            'algorithm_version': self.algorithm_version,
            'processing_time_ms': self.processing_time_ms,
            'correlation_strength': self.correlation_strength,
            'confidence_level': self.confidence_level,
            'top_dimensions': self.top_dimensions,
            'weakest_dimensions': self.weakest_dimensions,
            'category_scores': self.category_scores
        }


class VULCACore:
    """
    Production VULCA Core Algorithm
    Combines EMNLP2025 research with correlation matrix for accurate evaluation
    """
    
    def __init__(self, enable_correlation: bool = True, cache_enabled: bool = True):
        """
        Initialize VULCA Core
        
        Args:
            enable_correlation: Whether to use correlation matrix for propagation
            cache_enabled: Whether to cache results for performance
        """
        self.algorithm = VULCAAlgorithmV2()
        self.correlation_matrix = CorrelationMatrix() if enable_correlation else None
        self.enable_correlation = enable_correlation
        self.cache_enabled = cache_enabled
        self._cache = {}
        
    def evaluate(self, 
                 model_id: str,
                 scores_6d: Dict[str, float],
                 cultural_perspective: Optional[str] = None,
                 use_correlation_propagation: bool = True) -> VULCAResult:
        """
        Perform complete VULCA evaluation
        
        Args:
            model_id: Unique identifier for the model
            scores_6d: 6-dimension scores (creativity, technique, emotion, context, innovation, impact)
            cultural_perspective: Optional perspective (western, eastern, global)
            use_correlation_propagation: Whether to apply correlation propagation
            
        Returns:
            VULCAResult with complete evaluation data
        """
        start_time = time.time()
        
        # Check cache if enabled
        cache_key = self._generate_cache_key(model_id, scores_6d, cultural_perspective)
        if self.cache_enabled and cache_key in self._cache:
            cached_result = self._cache[cache_key]
            cached_result.processing_time_ms = 0.1  # Cache hit
            return cached_result
        
        # Validate input
        self._validate_6d_scores(scores_6d)
        
        # Step 1: Initial 6D to 47D expansion
        scores_47d = self.algorithm.expand_6d_to_47d(scores_6d)
        
        # Step 2: Apply correlation propagation if enabled
        if self.enable_correlation and use_correlation_propagation and self.correlation_matrix:
            # Select top scoring dimensions for propagation
            top_initial = self._select_propagation_seeds(scores_47d, top_n=5)
            propagated = self.correlation_matrix.apply_correlation_propagation(top_initial)
            
            # Blend propagated scores with initial expansion
            scores_47d = self._blend_scores(scores_47d, propagated, blend_factor=0.3)
        
        # Step 3: Apply cultural perspective if specified
        if cultural_perspective:
            scores_47d = self.algorithm.apply_cultural_perspective(scores_47d, cultural_perspective)
        
        # Step 4: Calculate overall score and metrics
        overall_score = self.algorithm.calculate_overall_score(scores_47d)
        
        # Step 5: Analyze results
        category_scores = self._calculate_category_scores(scores_47d)
        top_dims = self._get_top_dimensions(scores_47d, n=5)
        weak_dims = self._get_weakest_dimensions(scores_47d, n=5)
        
        # Step 6: Calculate confidence and correlation strength
        confidence = self._calculate_confidence(scores_47d)
        correlation_strength = self._calculate_correlation_strength(scores_47d)
        
        # Create result
        result = VULCAResult(
            model_id=model_id,
            timestamp=datetime.now(),
            scores_6d=scores_6d,
            scores_47d=scores_47d,
            overall_score=overall_score,
            processing_time_ms=(time.time() - start_time) * 1000,
            correlation_strength=correlation_strength,
            confidence_level=confidence,
            top_dimensions=top_dims,
            weakest_dimensions=weak_dims,
            category_scores=category_scores
        )
        
        # Cache result if enabled
        if self.cache_enabled:
            self._cache[cache_key] = result
        
        return result
    
    def batch_evaluate(self, 
                      evaluations: List[Dict],
                      cultural_perspective: Optional[str] = None) -> List[VULCAResult]:
        """
        Evaluate multiple models in batch
        
        Args:
            evaluations: List of dicts with 'model_id' and 'scores_6d'
            cultural_perspective: Optional perspective to apply to all
            
        Returns:
            List of VULCAResult objects
        """
        results = []
        for eval_data in evaluations:
            result = self.evaluate(
                model_id=eval_data['model_id'],
                scores_6d=eval_data['scores_6d'],
                cultural_perspective=cultural_perspective
            )
            results.append(result)
        return results
    
    def compare_models(self, 
                      result1: VULCAResult, 
                      result2: VULCAResult) -> Dict:
        """
        Compare two VULCA evaluation results
        
        Returns:
            Comparison data including winner, advantages, and detailed differences
        """
        comparison = {
            'model1_id': result1.model_id,
            'model2_id': result2.model_id,
            'overall_winner': result1.model_id if result1.overall_score > result2.overall_score else result2.model_id,
            'score_difference': abs(result1.overall_score - result2.overall_score),
            'category_comparison': {},
            'dimension_advantages': {'model1': [], 'model2': []},
            'recommendation': ''
        }
        
        # Compare categories
        for category in ['cognitive', 'creative', 'social']:
            score1 = result1.category_scores.get(category, 0)
            score2 = result2.category_scores.get(category, 0)
            comparison['category_comparison'][category] = {
                'model1': score1,
                'model2': score2,
                'winner': 'model1' if score1 > score2 else 'model2',
                'difference': abs(score1 - score2)
            }
        
        # Find dimension advantages
        for dim_name in result1.scores_47d:
            score1 = result1.scores_47d[dim_name]
            score2 = result2.scores_47d.get(dim_name, 0)
            diff = score1 - score2
            
            if diff > 10:  # Significant advantage
                comparison['dimension_advantages']['model1'].append({
                    'dimension': dim_name,
                    'advantage': diff
                })
            elif diff < -10:
                comparison['dimension_advantages']['model2'].append({
                    'dimension': dim_name.replace('_', ' ').title(),
                    'advantage': abs(diff)
                })
        
        # Generate recommendation
        if comparison['score_difference'] < 5:
            comparison['recommendation'] = "Models are very similar in overall capability"
        elif comparison['score_difference'] < 10:
            comparison['recommendation'] = f"{comparison['overall_winner']} has a slight edge"
        else:
            comparison['recommendation'] = f"{comparison['overall_winner']} is significantly better"
        
        return comparison
    
    def _validate_6d_scores(self, scores_6d: Dict[str, float]):
        """Validate 6D input scores"""
        required_dims = ['creativity', 'technique', 'emotion', 'context', 'innovation', 'impact']
        for dim in required_dims:
            if dim not in scores_6d:
                raise ValueError(f"Missing required dimension: {dim}")
            if not 0 <= scores_6d[dim] <= 100:
                raise ValueError(f"Score for {dim} must be between 0 and 100")
    
    def _generate_cache_key(self, model_id: str, scores_6d: Dict, perspective: Optional[str]) -> str:
        """Generate cache key for results"""
        key_data = f"{model_id}:{json.dumps(scores_6d, sort_keys=True)}:{perspective}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _select_propagation_seeds(self, scores_47d: Dict[str, float], top_n: int) -> Dict[str, float]:
        """Select top scoring dimensions as propagation seeds"""
        sorted_dims = sorted(scores_47d.items(), key=lambda x: x[1], reverse=True)
        return dict(sorted_dims[:top_n])
    
    def _blend_scores(self, 
                     original: Dict[str, float], 
                     propagated: Dict[str, float], 
                     blend_factor: float) -> Dict[str, float]:
        """Blend original and propagated scores"""
        blended = {}
        for dim in original:
            orig_score = original[dim]
            prop_score = propagated.get(dim, orig_score)
            blended[dim] = orig_score * (1 - blend_factor) + prop_score * blend_factor
            blended[dim] = np.clip(blended[dim], 0, 100)
        return blended
    
    def _calculate_category_scores(self, scores_47d: Dict[str, float]) -> Dict[str, float]:
        """Calculate average scores for each category"""
        categories = {
            'cognitive': [],
            'creative': [],
            'social': []
        }
        
        for dim in VULCA_47_DIMENSIONS:
            if dim.name in scores_47d:
                categories[dim.category.value].append(scores_47d[dim.name])
        
        return {
            cat: np.mean(scores) if scores else 0
            for cat, scores in categories.items()
        }
    
    def _get_top_dimensions(self, scores_47d: Dict[str, float], n: int) -> List[Tuple[str, float]]:
        """Get top scoring dimensions"""
        sorted_dims = sorted(scores_47d.items(), key=lambda x: x[1], reverse=True)
        return [(name.replace('_', ' ').title(), score) for name, score in sorted_dims[:n]]
    
    def _get_weakest_dimensions(self, scores_47d: Dict[str, float], n: int) -> List[Tuple[str, float]]:
        """Get weakest scoring dimensions"""
        sorted_dims = sorted(scores_47d.items(), key=lambda x: x[1])
        return [(name.replace('_', ' ').title(), score) for name, score in sorted_dims[:n]]
    
    def _calculate_confidence(self, scores_47d: Dict[str, float]) -> float:
        """Calculate confidence level based on score distribution"""
        scores = list(scores_47d.values())
        std_dev = np.std(scores)
        # Lower std dev means more consistent scores, higher confidence
        confidence = max(0, min(100, 100 - std_dev * 2))
        return confidence
    
    def _calculate_correlation_strength(self, scores_47d: Dict[str, float]) -> float:
        """Calculate how well dimensions correlate"""
        if not self.correlation_matrix:
            return 0.0
        
        # Sample correlations between top dimensions
        top_dims = self._get_top_dimensions(scores_47d, n=10)
        correlations = []
        
        for i, (dim1, _) in enumerate(top_dims):
            for dim2, _ in top_dims[i+1:]:
                # Convert back to snake_case for lookup
                dim1_key = dim1.lower().replace(' ', '_')
                dim2_key = dim2.lower().replace(' ', '_')
                corr = self.correlation_matrix.get_correlation(dim1_key, dim2_key)
                correlations.append(abs(corr))
        
        return np.mean(correlations) * 100 if correlations else 0.0
    
    def clear_cache(self):
        """Clear the result cache"""
        self._cache.clear()
    
    def get_dimension_metadata(self) -> List[Dict]:
        """Get metadata for all 47 dimensions"""
        return [
            {
                'name': dim.name,
                'display_name': dim.name.replace('_', ' ').title(),
                'category': dim.category.value,
                'weight': dim.weight,
                'description': dim.description,
                'cultural_sensitivity': dim.cultural_sensitivity
            }
            for dim in VULCA_47_DIMENSIONS
        ]


def validate_algorithm_performance():
    """Validate that the algorithm meets performance requirements"""
    import random
    
    print("=" * 60)
    print("VULCA Core Algorithm Validation")
    print("=" * 60)
    
    # Initialize algorithm
    vulca = VULCACore(enable_correlation=True, cache_enabled=True)
    
    # Test 1: Single evaluation performance
    print("\n1. Single Evaluation Performance Test")
    print("-" * 40)
    
    test_scores = {
        'creativity': 85,
        'technique': 78,
        'emotion': 82,
        'context': 75,
        'innovation': 88,
        'impact': 80
    }
    
    # Warm up
    _ = vulca.evaluate("test_model", test_scores)
    
    # Measure performance
    times = []
    for i in range(10):
        scores = {k: v + random.uniform(-5, 5) for k, v in test_scores.items()}
        start = time.time()
        result = vulca.evaluate(f"model_{i}", scores)
        elapsed = (time.time() - start) * 1000
        times.append(elapsed)
    
    avg_time = np.mean(times)
    print(f"Average processing time: {avg_time:.2f}ms")
    print(f"Requirement: <200ms")
    print(f"Status: {'PASS' if avg_time < 200 else 'FAIL'}")
    
    # Test 2: Batch evaluation
    print("\n2. Batch Evaluation Test")
    print("-" * 40)
    
    batch_data = [
        {
            'model_id': f'batch_model_{i}',
            'scores_6d': {
                'creativity': random.uniform(60, 95),
                'technique': random.uniform(60, 95),
                'emotion': random.uniform(60, 95),
                'context': random.uniform(60, 95),
                'innovation': random.uniform(60, 95),
                'impact': random.uniform(60, 95)
            }
        }
        for i in range(20)
    ]
    
    start = time.time()
    batch_results = vulca.batch_evaluate(batch_data)
    batch_time = (time.time() - start) * 1000
    
    print(f"Batch size: 20 models")
    print(f"Total time: {batch_time:.2f}ms")
    print(f"Average per model: {batch_time/20:.2f}ms")
    print(f"Status: {'PASS' if batch_time/20 < 200 else 'FAIL'}")
    
    # Test 3: Score consistency
    print("\n3. Score Consistency Test")
    print("-" * 40)
    
    # Same input should produce same output
    result1 = vulca.evaluate("consistency_test", test_scores)
    vulca.clear_cache()  # Clear cache to force recalculation
    result2 = vulca.evaluate("consistency_test", test_scores)
    
    score_diff = abs(result1.overall_score - result2.overall_score)
    print(f"Score 1: {result1.overall_score:.2f}")
    print(f"Score 2: {result2.overall_score:.2f}")
    print(f"Difference: {score_diff:.4f}")
    print(f"Status: {'PASS' if score_diff < 0.1 else 'FAIL'}")
    
    # Test 4: Cultural perspective
    print("\n4. Cultural Perspective Test")
    print("-" * 40)
    
    perspectives = ['western', 'eastern', 'global']
    perspective_results = {}
    
    for perspective in perspectives:
        result = vulca.evaluate("culture_test", test_scores, cultural_perspective=perspective)
        perspective_results[perspective] = result.overall_score
        print(f"{perspective.capitalize()}: {result.overall_score:.2f}")
    
    # Verify perspectives produce different results
    scores = list(perspective_results.values())
    variation = max(scores) - min(scores)
    print(f"Score variation: {variation:.2f}")
    print(f"Status: {'PASS' if variation > 1 else 'FAIL'}")
    
    # Test 5: Dimension distribution
    print("\n5. Dimension Distribution Test")
    print("-" * 40)
    
    result = vulca.evaluate("distribution_test", test_scores)
    
    print(f"Overall score: {result.overall_score:.2f}")
    print(f"Processing time: {result.processing_time_ms:.2f}ms")
    print(f"Confidence level: {result.confidence_level:.2f}%")
    print(f"Correlation strength: {result.correlation_strength:.2f}%")
    
    print("\nTop 5 dimensions:")
    for dim, score in result.top_dimensions:
        print(f"  {dim}: {score:.2f}")
    
    print("\nCategory scores:")
    for category, score in result.category_scores.items():
        print(f"  {category.capitalize()}: {score:.2f}")
    
    # Test 6: Model comparison
    print("\n6. Model Comparison Test")
    print("-" * 40)
    
    model1_scores = {
        'creativity': 90,
        'technique': 85,
        'emotion': 88,
        'context': 82,
        'innovation': 92,
        'impact': 87
    }
    
    model2_scores = {
        'creativity': 75,
        'technique': 88,
        'emotion': 70,
        'context': 85,
        'innovation': 78,
        'impact': 82
    }
    
    result1 = vulca.evaluate("model_a", model1_scores)
    result2 = vulca.evaluate("model_b", model2_scores)
    
    comparison = vulca.compare_models(result1, result2)
    
    print(f"Model 1 overall: {result1.overall_score:.2f}")
    print(f"Model 2 overall: {result2.overall_score:.2f}")
    print(f"Winner: {comparison['overall_winner']}")
    print(f"Score difference: {comparison['score_difference']:.2f}")
    print(f"Recommendation: {comparison['recommendation']}")
    
    print("\n" + "=" * 60)
    print("Validation Complete")
    print("=" * 60)


if __name__ == "__main__":
    # Run validation tests
    validate_algorithm_performance()