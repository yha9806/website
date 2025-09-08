"""
VULCA Core Adapter - 6D to 47D Intelligent Extension
Implements the core algorithm for expanding 6-dimensional evaluations to 47 dimensions
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
import json
import os
from .model_profiles import ModelProfileRegistry, ModelProfile

class VULCACoreAdapter:
    """VULCA 6D to 47D intelligent extension adapter with model profile integration"""
    
    def __init__(self, use_model_profiles: bool = True):
        self.base_dims = ['creativity', 'technique', 'emotion', 'context', 'innovation', 'impact']
        self.extended_dims = [f'dim_{i}' for i in range(47)]
        self.cultural_perspectives = [
            'western', 'eastern', 'african', 'latin_american',
            'middle_eastern', 'south_asian', 'oceanic', 'indigenous'
        ]
        
        # Initialize model profile system
        self.use_model_profiles = use_model_profiles
        self.profile_registry = ModelProfileRegistry() if use_model_profiles else None
        
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
    
    def generate_realistic_evaluation(self, model_id: str) -> Dict:
        """
        Generate realistic evaluation using model profiles
        
        Args:
            model_id: Model identifier
            
        Returns:
            Complete evaluation with 6D, 47D, and cultural perspective scores
        """
        if not self.use_model_profiles or not self.profile_registry:
            # Fallback to random generation
            return self._generate_fallback_evaluation(model_id)
        
        # Generate profile-based 6D scores
        scores_6d = self.profile_registry.generate_6d_scores(model_id)
        
        # Expand to 47D using enhanced algorithm
        scores_47d = self.expand_6d_to_47d_with_profile(scores_6d, model_id)
        
        # Generate cultural perspectives
        cultural_perspectives = self.profile_registry.generate_cultural_perspectives(model_id)
        
        return {
            'model_id': model_id,
            'scores_6d': scores_6d,
            'scores_47d': scores_47d,
            'cultural_perspectives': cultural_perspectives,
            'metadata': {
                'algorithm_version': '2.0_profile_based',
                'expansion_method': 'intelligent_profile_mapping',
                'generation_timestamp': None  # Will be set by caller
            }
        }
    
    def expand_6d_to_47d_with_profile(self, scores_6d: Dict[str, float], model_id: str) -> Dict[str, float]:
        """
        Enhanced 47D expansion using model profile characteristics
        
        Args:
            scores_6d: 6D base scores
            model_id: Model identifier for profile lookup
            
        Returns:
            Enhanced 47D scores based on model profile
        """
        # Get base expansion
        base_47d = self.expand_6d_to_47d(scores_6d)
        
        if not self.use_model_profiles or not self.profile_registry:
            return base_47d
        
        profile = self.profile_registry.get_profile(model_id)
        if not profile:
            return base_47d
        
        # Apply profile-specific adjustments
        enhanced_47d = {}
        
        for i, (dim_key, base_score) in enumerate(base_47d.items()):
            # Calculate profile-based adjustment
            adjustment_factor = self._calculate_profile_adjustment(profile, i, dim_key)
            
            # Apply adjustment with bounds checking
            enhanced_score = base_score * adjustment_factor
            
            # Apply performance ceiling/floor constraints
            enhanced_score = max(
                profile.performance_floor * 0.8,  # Allow slightly below floor for realism
                min(enhanced_score, profile.performance_ceiling * 1.05)  # Allow slightly above ceiling
            )
            
            # Add model-specific variance
            variance = np.random.normal(0, enhanced_score * profile.variance_tendency * 0.1)
            final_score = max(0, min(100, enhanced_score + variance))
            
            enhanced_47d[dim_key] = final_score
        
        return enhanced_47d
    
    def _calculate_profile_adjustment(self, profile: ModelProfile, dimension_index: int, dimension_key: str) -> float:
        """
        Calculate profile-based adjustment factor for a specific dimension
        
        Args:
            profile: Model profile
            dimension_index: Index of dimension (0-46)
            dimension_key: Dimension key name
            
        Returns:
            Adjustment factor (0.5-1.5 range)
        """
        base_factor = 1.0
        
        # Map dimension ranges to profile characteristics
        if dimension_index < 8:  # Creativity range
            base_factor = 0.7 + (profile.creative_expression * 0.6)
        elif dimension_index < 16:  # Technical range
            base_factor = 0.7 + (profile.technical_strength * 0.6)
        elif dimension_index < 24:  # Emotional range
            base_factor = 0.7 + (profile.emotional_depth * 0.6)
        elif dimension_index < 32:  # Contextual range
            base_factor = 0.7 + (profile.contextual_awareness * 0.6)
        elif dimension_index < 40:  # Innovation range
            base_factor = 0.7 + (profile.innovation_factor * 0.6)
        elif dimension_index < 47:  # Impact range
            base_factor = 0.7 + (profile.practical_impact * 0.6)
        
        # Apply specialization bonuses
        for specialization, bonus in profile.specialization_bonus.items():
            if self._dimension_matches_specialization(dimension_index, dimension_key, specialization):
                base_factor += bonus * 0.3  # Moderate bonus application
        
        # Apply consistency factor
        consistency_adjustment = 0.9 + (profile.consistency_level * 0.2)
        base_factor *= consistency_adjustment
        
        return max(0.5, min(1.5, base_factor))
    
    def _dimension_matches_specialization(self, dim_index: int, dim_key: str, specialization: str) -> bool:
        """
        Check if dimension matches a specialization area
        
        Args:
            dim_index: Dimension index
            dim_key: Dimension key
            specialization: Specialization name
            
        Returns:
            True if dimension relates to specialization
        """
        specialization_mappings = {
            'reasoning': [0, 1, 2, 8, 9, 32, 33, 34],  # Logic, analysis dimensions
            'mathematics': [8, 9, 10, 32, 33],  # Technical and innovation dimensions
            'code': [8, 9, 10, 11, 32, 33],  # Technical precision dimensions
            'writing': [0, 1, 16, 17, 18, 40, 41],  # Creative and emotional expression
            'vision': [0, 1, 2, 24, 25, 26],  # Creative and contextual
            'multimodal': [0, 1, 24, 25, 26, 40, 41],  # Cross-domain capabilities
            'ethics': [16, 17, 24, 25, 40, 41],  # Emotional and contextual
            'empathy': [16, 17, 18, 19, 20],  # Emotional range
            'efficiency': list(range(8, 16)),  # Technical execution
            'consistency': list(range(47)),  # All dimensions (general improvement)
            'multilingual': [24, 25, 26, 27],  # Contextual awareness
            'cultural': [24, 25, 26, 27, 28],  # Extended contextual range
            'analysis': [8, 9, 32, 33, 40, 41]  # Technical and impact dimensions
        }
        
        return dim_index in specialization_mappings.get(specialization, [])
    
    def _generate_fallback_evaluation(self, model_id: str) -> Dict:
        """
        Generate evaluation without model profiles (fallback method)
        
        Args:
            model_id: Model identifier
            
        Returns:
            Basic evaluation with randomized scores
        """
        # Generate random 6D scores
        scores_6d = {dim: np.random.uniform(40, 85) for dim in self.base_dims}
        
        # Expand to 47D
        scores_47d = self.expand_6d_to_47d(scores_6d)
        
        # Generate balanced cultural perspectives
        cultural_perspectives = {
            perspective: np.random.uniform(50, 80) 
            for perspective in self.cultural_perspectives
        }
        
        return {
            'model_id': model_id,
            'scores_6d': scores_6d,
            'scores_47d': scores_47d,
            'cultural_perspectives': cultural_perspectives,
            'metadata': {
                'algorithm_version': '1.0_fallback',
                'expansion_method': 'random_generation',
                'generation_timestamp': None
            }
        }
    
    def validate_evaluation_quality(self, evaluation: Dict) -> Dict:
        """
        Validate and analyze evaluation quality and realism
        
        Args:
            evaluation: Generated evaluation
            
        Returns:
            Quality analysis report
        """
        scores_6d = evaluation.get('scores_6d', {})
        scores_47d = evaluation.get('scores_47d', {})
        cultural = evaluation.get('cultural_perspectives', {})
        
        # Calculate statistics
        values_6d = list(scores_6d.values())
        values_47d = list(scores_47d.values())
        values_cultural = list(cultural.values())
        
        quality_report = {
            'score_statistics': {
                '6d': {
                    'mean': np.mean(values_6d),
                    'std': np.std(values_6d),
                    'range': (np.min(values_6d), np.max(values_6d))
                },
                '47d': {
                    'mean': np.mean(values_47d),
                    'std': np.std(values_47d),
                    'range': (np.min(values_47d), np.max(values_47d))
                },
                'cultural': {
                    'mean': np.mean(values_cultural),
                    'std': np.std(values_cultural),
                    'range': (np.min(values_cultural), np.max(values_cultural))
                }
            },
            'quality_indicators': {
                'variance_reasonable': 5 < np.std(values_47d) < 20,
                'scores_in_range': all(0 <= s <= 100 for s in values_47d + values_6d + values_cultural),
                'cultural_diversity': max(values_cultural) - min(values_cultural) > 10,
                'consistency_6d_47d': abs(np.mean(values_6d) - np.mean(values_47d)) < 15
            },
            'model_id': evaluation.get('model_id', 'unknown'),
            'generation_method': evaluation.get('metadata', {}).get('expansion_method', 'unknown')
        }
        
        return quality_report