"""
VULCA Core Adapter - 6D to 47D Intelligent Extension
Implements the core algorithm for expanding 6-dimensional evaluations to 47 dimensions
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
import json
import os

class VULCACoreAdapter:
    """VULCA 6D to 47D intelligent extension adapter"""
    
    def __init__(self):
        self.base_dims = ['creativity', 'technique', 'emotion', 'context', 'innovation', 'impact']
        self.extended_dims = [f'dim_{i}' for i in range(47)]
        self.cultural_perspectives = [
            'western', 'eastern', 'african', 'latin_american',
            'middle_eastern', 'south_asian', 'oceanic', 'indigenous'
        ]
        
        self.correlation_matrix = self._initialize_correlation_matrix()
        self.dimension_mapping = self._initialize_dimension_mapping()
        self.cultural_weights = self._initialize_cultural_weights()
        
    def _initialize_correlation_matrix(self) -> np.ndarray:
        """Initialize 6x47 correlation matrix for dimension expansion"""
        # Create a sophisticated correlation matrix
        np.random.seed(42)  # For reproducibility
        
        # Base correlation patterns
        matrix = np.zeros((6, 47))
        
        # Each base dimension strongly correlates with specific extended dimensions
        for i in range(6):
            # Primary correlations (7-8 dimensions per base)
            start_idx = i * 7
            end_idx = min(start_idx + 8, 47)
            matrix[i, start_idx:end_idx] = np.random.uniform(0.7, 0.9, end_idx - start_idx)
            
            # Secondary correlations (weaker connections)
            for j in range(47):
                if matrix[i, j] == 0:
                    matrix[i, j] = np.random.uniform(0.1, 0.3)
        
        # Normalize columns to sum to 1
        matrix = matrix / matrix.sum(axis=0)
        return matrix
        
    def _initialize_dimension_mapping(self) -> Dict[str, List[str]]:
        """Initialize mapping from base dimensions to extended dimensions"""
        return {
            'creativity': [
                'originality', 'imagination', 'innovation_depth', 
                'artistic_vision', 'conceptual_novelty', 'creative_synthesis',
                'ideation_fluency', 'divergent_thinking'
            ],
            'technique': [
                'skill_mastery', 'precision', 'craft_excellence',
                'technical_proficiency', 'execution_quality', 'methodological_rigor',
                'tool_expertise', 'procedural_knowledge'
            ],
            'emotion': [
                'emotional_depth', 'sentiment_expression', 'affective_resonance',
                'mood_conveyance', 'feeling_authenticity', 'empathy_evocation',
                'psychological_insight', 'emotional_intelligence'
            ],
            'context': [
                'cultural_awareness', 'historical_grounding', 'situational_relevance',
                'environmental_sensitivity', 'social_consciousness', 'temporal_awareness',
                'spatial_understanding', 'contextual_integration'
            ],
            'innovation': [
                'breakthrough_thinking', 'paradigm_shifting', 'novel_approaches',
                'experimental_courage', 'boundary_pushing', 'revolutionary_concepts',
                'transformative_ideas', 'disruptive_creativity'
            ],
            'impact': [
                'audience_engagement', 'lasting_impression', 'influence_scope',
                'transformative_power', 'memorable_quality', 'viral_potential',
                'legacy_creation'
            ]
        }
        
    def _initialize_cultural_weights(self) -> Dict[str, np.ndarray]:
        """Initialize cultural perspective weight vectors"""
        weights = {}
        
        # Define unique weight patterns for each cultural perspective
        cultural_patterns = {
            'western': {
                'individualism': 0.8, 'innovation': 0.9, 'directness': 0.7,
                'analytical': 0.85, 'competition': 0.75
            },
            'eastern': {
                'harmony': 0.9, 'tradition': 0.85, 'indirectness': 0.8,
                'holistic': 0.9, 'cooperation': 0.85
            },
            'african': {
                'community': 0.95, 'rhythm': 0.9, 'storytelling': 0.85,
                'ancestral': 0.8, 'ubuntu': 0.9
            },
            'latin_american': {
                'passion': 0.9, 'family': 0.85, 'celebration': 0.8,
                'magical_realism': 0.85, 'social': 0.8
            },
            'middle_eastern': {
                'hospitality': 0.9, 'tradition': 0.85, 'honor': 0.8,
                'spirituality': 0.85, 'community': 0.8
            },
            'south_asian': {
                'spirituality': 0.9, 'family': 0.85, 'hierarchy': 0.75,
                'festivals': 0.8, 'karma': 0.85
            },
            'oceanic': {
                'nature': 0.95, 'navigation': 0.85, 'oral_tradition': 0.8,
                'island_community': 0.85, 'ocean': 0.9
            },
            'indigenous': {
                'land_connection': 0.95, 'ancestral_wisdom': 0.9, 'circular_time': 0.85,
                'nature_spirituality': 0.9, 'oral_history': 0.85
            }
        }
        
        # Convert patterns to weight vectors
        for perspective, pattern in cultural_patterns.items():
            # Generate weights based on cultural values
            np.random.seed(hash(perspective) % 2**32)
            weight_vector = np.random.uniform(0.5, 1.0, 47)
            
            # Adjust weights based on cultural emphasis
            for i, value in enumerate(pattern.values()):
                indices = range(i * 9, min((i + 1) * 9, 47))
                for idx in indices:
                    weight_vector[idx] *= value
                    
            # Normalize to [0.5, 1.0] range
            weight_vector = 0.5 + 0.5 * (weight_vector - weight_vector.min()) / (weight_vector.max() - weight_vector.min())
            weights[perspective] = weight_vector
            
        return weights
        
    def expand_6d_to_47d(self, scores_6d: Dict[str, float]) -> Dict[str, float]:
        """
        Core expansion algorithm: Convert 6D scores to 47D scores
        
        Args:
            scores_6d: Dictionary with 6 base dimension scores (0-100)
            
        Returns:
            Dictionary with 47 extended dimension scores (0-100)
        """
        # Validate input
        for dim in self.base_dims:
            if dim not in scores_6d:
                raise ValueError(f"Missing dimension: {dim}")
                
        # Convert to numpy array
        vec_6d = np.array([scores_6d[dim] for dim in self.base_dims])
        
        # Apply correlation matrix transformation
        vec_47d_base = np.dot(vec_6d, self.correlation_matrix)
        
        # Add controlled variation
        np.random.seed(int(sum(vec_6d) * 100))  # Deterministic but input-dependent
        noise = np.random.normal(0, 2, 47)  # Small noise (std=2)
        vec_47d = vec_47d_base + noise
        
        # Apply non-linear transformation for more realistic distribution
        vec_47d = np.tanh(vec_47d / 50) * 50 + 50  # Sigmoid-like, centered at 50
        
        # Ensure values are in valid range [0, 100]
        vec_47d = np.clip(vec_47d, 0, 100)
        
        # Convert to dictionary
        scores_47d = {f'dim_{i}': float(vec_47d[i]) for i in range(47)}
        
        # Add semantic dimension names
        dimension_names = self._get_dimension_names()
        scores_47d_named = {}
        for i, (key, value) in enumerate(scores_47d.items()):
            if i < len(dimension_names):
                scores_47d_named[dimension_names[i]] = value
            else:
                scores_47d_named[key] = value
                
        return scores_47d
        
    def apply_cultural_perspective(
        self, 
        scores_47d: Dict[str, float], 
        perspective: str
    ) -> Dict[str, float]:
        """
        Apply cultural perspective weights to 47D scores
        
        Args:
            scores_47d: 47-dimensional scores
            perspective: Cultural perspective name
            
        Returns:
            Culturally-adjusted 47D scores
        """
        if perspective not in self.cultural_perspectives:
            raise ValueError(f"Unknown perspective: {perspective}")
            
        weights = self.cultural_weights[perspective]
        
        # Apply weights
        adjusted_scores = {}
        for i, (dim, score) in enumerate(scores_47d.items()):
            if i < len(weights):
                adjusted_scores[dim] = float(score * weights[i])
            else:
                adjusted_scores[dim] = score
                
        # Renormalize to maintain score range
        values = np.array(list(adjusted_scores.values()))
        if values.max() > 100:
            scale_factor = 100 / values.max()
            adjusted_scores = {k: v * scale_factor for k, v in adjusted_scores.items()}
            
        return adjusted_scores
        
    def calculate_cultural_scores(
        self, 
        scores_47d: Dict[str, float]
    ) -> Dict[str, float]:
        """
        Calculate scores for all 8 cultural perspectives
        
        Args:
            scores_47d: 47-dimensional scores
            
        Returns:
            Dictionary with score for each cultural perspective
        """
        cultural_scores = {}
        
        for perspective in self.cultural_perspectives:
            adjusted = self.apply_cultural_perspective(scores_47d, perspective)
            # Calculate overall score as weighted mean
            cultural_scores[perspective] = float(np.mean(list(adjusted.values())))
            
        return cultural_scores
        
    def _get_dimension_names(self) -> List[str]:
        """Get semantic names for all 47 dimensions"""
        names = []
        for base_dim, extended_dims in self.dimension_mapping.items():
            names.extend(extended_dims)
        
        # Ensure we have exactly 47 names
        while len(names) < 47:
            names.append(f'extended_dim_{len(names)}')
        
        return names[:47]
        
    def get_dimension_info(self) -> List[Dict]:
        """
        Get detailed information about all 47 dimensions
        
        Returns:
            List of dictionaries with dimension information
        """
        names = self._get_dimension_names()
        info = []
        
        categories = {
            0: 'Creativity & Innovation',
            8: 'Technical Excellence',
            16: 'Emotional Expression',
            24: 'Contextual Awareness',
            32: 'Innovation & Breakthrough',
            40: 'Impact & Influence'
        }
        
        for i, name in enumerate(names):
            category = 'General'
            for threshold, cat in categories.items():
                if i >= threshold:
                    category = cat
                    
            info.append({
                'id': f'dim_{i}',
                'name': name,
                'category': category,
                'description': f'Measures {name.replace("_", " ")} capability',
                'weight': float(self.correlation_matrix.sum(axis=0)[i])
            })
            
        return info