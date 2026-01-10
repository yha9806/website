"""
VULCA 47D Semantic Correlation Matrix
Defines relationships between dimensions for intelligent expansion
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
from dataclasses import dataclass
import json


@dataclass
class DimensionRelationship:
    """Represents a relationship between two dimensions"""
    source: str
    target: str
    correlation: float  # -1 to 1
    relationship_type: str  # 'causal', 'bidirectional', 'enhancing', 'inhibiting'


class CorrelationMatrix:
    """
    Manages the semantic correlation matrix for 47 VULCA dimensions
    """
    
    def __init__(self):
        self.dimensions = self._initialize_dimensions()
        self.matrix = self._build_full_correlation_matrix()
        
    def _initialize_dimensions(self) -> List[str]:
        """Initialize all 47 dimension names"""
        cognitive = [
            'logical_reasoning', 'pattern_recognition', 'analytical_depth',
            'knowledge_integration', 'contextual_understanding', 'abstraction_capability',
            'temporal_reasoning', 'spatial_reasoning', 'causal_inference',
            'memory_utilization', 'attention_focus', 'cognitive_flexibility',
            'metacognition', 'problem_decomposition', 'hypothesis_generation',
            'evidence_evaluation'
        ]
        
        creative = [
            'creative_synthesis', 'artistic_expression', 'innovation_index',
            'narrative_construction', 'metaphorical_thinking', 'imaginative_depth',
            'stylistic_versatility', 'conceptual_blending', 'divergent_thinking',
            'aesthetic_sensitivity', 'humor_generation', 'emotional_resonance',
            'originality_score', 'creative_flexibility', 'symbolic_representation',
            'creative_coherence'
        ]
        
        social = [
            'cultural_awareness', 'empathy_modeling', 'social_appropriateness',
            'communication_clarity', 'collaborative_ability', 'ethical_reasoning',
            'perspective_taking', 'conflict_resolution', 'emotional_intelligence',
            'social_prediction', 'trust_building', 'fairness_assessment',
            'diversity_handling', 'social_impact_awareness', 'interpersonal_sensitivity'
        ]
        
        return cognitive + creative + social
    
    def _build_full_correlation_matrix(self) -> np.ndarray:
        """
        Build the complete 47x47 correlation matrix
        Each cell represents how much dimension i influences dimension j
        """
        n = len(self.dimensions)
        matrix = np.zeros((n, n))
        
        # Set diagonal to 1 (perfect self-correlation)
        np.fill_diagonal(matrix, 1.0)
        
        # Define strong correlations within categories
        self._set_category_correlations(matrix, 0, 16, 0.3, 0.6)  # Cognitive
        self._set_category_correlations(matrix, 16, 32, 0.35, 0.65)  # Creative
        self._set_category_correlations(matrix, 32, 47, 0.4, 0.7)  # Social
        
        # Define cross-category correlations
        self._set_cross_category_correlations(matrix)
        
        # Make matrix symmetric (correlation is bidirectional)
        matrix = (matrix + matrix.T) / 2
        np.fill_diagonal(matrix, 1.0)
        
        return matrix
    
    def _set_category_correlations(self, matrix: np.ndarray, 
                                  start: int, end: int, 
                                  min_corr: float, max_corr: float):
        """Set correlations within a category"""
        for i in range(start, end):
            for j in range(start, end):
                if i != j:
                    # Random correlation within range
                    correlation = np.random.uniform(min_corr, max_corr)
                    matrix[i, j] = correlation
    
    def _set_cross_category_correlations(self, matrix: np.ndarray):
        """Define specific cross-category relationships"""
        dim_to_idx = {dim: i for i, dim in enumerate(self.dimensions)}
        
        # Cognitive-Creative connections
        strong_connections = [
            ('logical_reasoning', 'problem_decomposition', 0.7),
            ('pattern_recognition', 'creative_synthesis', 0.6),
            ('analytical_depth', 'evidence_evaluation', 0.65),
            ('abstraction_capability', 'conceptual_blending', 0.7),
            ('cognitive_flexibility', 'creative_flexibility', 0.75),
            ('hypothesis_generation', 'innovation_index', 0.65),
            
            # Creative-Social connections
            ('artistic_expression', 'cultural_awareness', 0.6),
            ('narrative_construction', 'communication_clarity', 0.7),
            ('emotional_resonance', 'empathy_modeling', 0.75),
            ('humor_generation', 'social_appropriateness', 0.5),
            ('creative_synthesis', 'collaborative_ability', 0.45),
            
            # Cognitive-Social connections
            ('contextual_understanding', 'cultural_awareness', 0.65),
            ('causal_inference', 'social_prediction', 0.6),
            ('evidence_evaluation', 'fairness_assessment', 0.7),
            ('metacognition', 'perspective_taking', 0.55),
            ('knowledge_integration', 'diversity_handling', 0.6),
        ]
        
        for source, target, correlation in strong_connections:
            if source in dim_to_idx and target in dim_to_idx:
                i, j = dim_to_idx[source], dim_to_idx[target]
                matrix[i, j] = correlation
                matrix[j, i] = correlation  # Symmetric
    
    def get_correlation(self, dim1: str, dim2: str) -> float:
        """Get correlation between two dimensions"""
        if dim1 not in self.dimensions or dim2 not in self.dimensions:
            return 0.0
        
        i = self.dimensions.index(dim1)
        j = self.dimensions.index(dim2)
        return self.matrix[i, j]
    
    def get_strongest_correlations(self, dimension: str, top_n: int = 5) -> List[Tuple[str, float]]:
        """Get the top N strongest correlations for a dimension"""
        if dimension not in self.dimensions:
            return []
        
        idx = self.dimensions.index(dimension)
        correlations = []
        
        for j, other_dim in enumerate(self.dimensions):
            if j != idx:  # Skip self-correlation
                correlations.append((other_dim, self.matrix[idx, j]))
        
        # Sort by absolute correlation strength
        correlations.sort(key=lambda x: abs(x[1]), reverse=True)
        return correlations[:top_n]
    
    def apply_correlation_propagation(self, initial_scores: Dict[str, float]) -> Dict[str, float]:
        """
        Propagate scores through the correlation matrix
        This simulates how strength in one dimension affects others
        """
        # Initialize all scores
        propagated_scores = {dim: 0.0 for dim in self.dimensions}
        propagated_scores.update(initial_scores)
        
        # Apply one round of propagation
        for dim1 in initial_scores:
            if dim1 in self.dimensions:
                idx1 = self.dimensions.index(dim1)
                for idx2, dim2 in enumerate(self.dimensions):
                    if dim2 not in initial_scores:  # Don't override initial scores
                        correlation = self.matrix[idx1, idx2]
                        influence = initial_scores[dim1] * correlation * 0.3  # Damping factor
                        propagated_scores[dim2] += influence
        
        # Normalize to 0-100 range
        for dim in propagated_scores:
            propagated_scores[dim] = np.clip(propagated_scores[dim], 0, 100)
        
        return propagated_scores
    
    def export_to_json(self, filepath: str):
        """Export correlation matrix to JSON for visualization"""
        data = {
            'dimensions': self.dimensions,
            'matrix': self.matrix.tolist(),
            'categories': {
                'cognitive': self.dimensions[:16],
                'creative': self.dimensions[16:32],
                'social': self.dimensions[32:47]
            }
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
    
    def analyze_dimension_importance(self) -> pd.DataFrame:
        """
        Analyze the importance of each dimension based on correlations
        Returns a DataFrame with importance metrics
        """
        importance_data = []
        
        for i, dim in enumerate(self.dimensions):
            row_correlations = self.matrix[i, :]
            
            # Calculate metrics
            avg_correlation = np.mean(np.abs(row_correlations[row_correlations != 1]))
            max_correlation = np.max(row_correlations[row_correlations != 1])
            num_strong_correlations = np.sum(np.abs(row_correlations) > 0.6) - 1  # Exclude self
            
            # Determine category
            if i < 16:
                category = 'cognitive'
            elif i < 32:
                category = 'creative'
            else:
                category = 'social'
            
            importance_data.append({
                'dimension': dim,
                'category': category,
                'avg_correlation': avg_correlation,
                'max_correlation': max_correlation,
                'num_strong_correlations': num_strong_correlations,
                'centrality_score': avg_correlation * num_strong_correlations
            })
        
        df = pd.DataFrame(importance_data)
        df = df.sort_values('centrality_score', ascending=False)
        return df


def visualize_correlation_heatmap(matrix: CorrelationMatrix):
    """Generate a visualization of the correlation matrix (requires matplotlib)"""
    try:
        import matplotlib.pyplot as plt
        import seaborn as sns
        
        plt.figure(figsize=(20, 16))
        
        # Create labels with shortened names
        labels = [dim.replace('_', '\n') for dim in matrix.dimensions]
        
        # Create heatmap
        sns.heatmap(matrix.matrix, 
                   xticklabels=labels,
                   yticklabels=labels,
                   cmap='RdBu_r',
                   center=0,
                   vmin=-1,
                   vmax=1,
                   square=True,
                   linewidths=0.5,
                   cbar_kws={'label': 'Correlation'})
        
        plt.title('VULCA 47D Correlation Matrix', fontsize=16)
        plt.tight_layout()
        plt.savefig('/i/website/wenxin-backend/app/vulca/algorithms/correlation_matrix.png', dpi=150)
        plt.show()
        
        print("Correlation matrix visualization saved to correlation_matrix.png")
        
    except ImportError:
        print("Matplotlib/Seaborn not installed. Skipping visualization.")


if __name__ == "__main__":
    # Initialize and test the correlation matrix
    corr_matrix = CorrelationMatrix()
    
    # Test correlation lookup
    print("Sample correlations:")
    print(f"logical_reasoning <-> problem_decomposition: {corr_matrix.get_correlation('logical_reasoning', 'problem_decomposition'):.3f}")
    print(f"creative_synthesis <-> innovation_index: {corr_matrix.get_correlation('creative_synthesis', 'innovation_index'):.3f}")
    print(f"empathy_modeling <-> emotional_intelligence: {corr_matrix.get_correlation('empathy_modeling', 'emotional_intelligence'):.3f}")
    
    # Find strongest correlations for a dimension
    print("\nStrongest correlations for 'creative_synthesis':")
    for dim, corr in corr_matrix.get_strongest_correlations('creative_synthesis'):
        print(f"  {dim}: {corr:.3f}")
    
    # Test propagation
    initial = {
        'logical_reasoning': 85,
        'creative_synthesis': 90,
        'empathy_modeling': 75
    }
    
    propagated = corr_matrix.apply_correlation_propagation(initial)
    print("\nPropagated scores (top 10):")
    sorted_scores = sorted(propagated.items(), key=lambda x: x[1], reverse=True)
    for dim, score in sorted_scores[:10]:
        print(f"  {dim}: {score:.2f}")
    
    # Analyze dimension importance
    importance_df = corr_matrix.analyze_dimension_importance()
    print("\nMost central dimensions:")
    print(importance_df.head(10)[['dimension', 'category', 'centrality_score']])
    
    # Export for frontend use
    corr_matrix.export_to_json('app/vulca/algorithms/correlation_matrix.json')
    print("\nCorrelation matrix exported to correlation_matrix.json")
    
    # Try to visualize (optional)
    visualize_correlation_heatmap(corr_matrix)