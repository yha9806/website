"""
VULCA Deep Integration - Core Algorithm Research
Based on EMNLP2025 VULCA Framework principles
Extracted and adapted for 47-dimension AI model evaluation
"""

from typing import Dict, List, Tuple
import numpy as np
from dataclasses import dataclass
from enum import Enum


class DimensionCategory(Enum):
    """Categories for the 47 dimensions"""
    COGNITIVE = "cognitive"
    CREATIVE = "creative"
    SOCIAL = "social"


@dataclass
class VULCADimension:
    """Single dimension in the 47D framework"""
    name: str
    category: DimensionCategory
    weight: float
    description: str
    cultural_sensitivity: float  # 0-1, how much cultural perspective affects this


# Define the 47 dimensions based on VULCA research
VULCA_47_DIMENSIONS = [
    # Cognitive Dimensions (16)
    VULCADimension("logical_reasoning", DimensionCategory.COGNITIVE, 0.03, 
                   "Ability to process logical structures and deduce conclusions", 0.2),
    VULCADimension("pattern_recognition", DimensionCategory.COGNITIVE, 0.025,
                   "Identifying patterns and regularities in data", 0.1),
    VULCADimension("analytical_depth", DimensionCategory.COGNITIVE, 0.025,
                   "Depth of analysis and problem decomposition", 0.15),
    VULCADimension("knowledge_integration", DimensionCategory.COGNITIVE, 0.02,
                   "Combining information from multiple sources", 0.25),
    VULCADimension("contextual_understanding", DimensionCategory.COGNITIVE, 0.025,
                   "Understanding context and implicit information", 0.4),
    VULCADimension("abstraction_capability", DimensionCategory.COGNITIVE, 0.02,
                   "Ability to work with abstract concepts", 0.1),
    VULCADimension("temporal_reasoning", DimensionCategory.COGNITIVE, 0.015,
                   "Understanding temporal relationships and sequences", 0.2),
    VULCADimension("spatial_reasoning", DimensionCategory.COGNITIVE, 0.015,
                   "Processing spatial relationships and transformations", 0.1),
    VULCADimension("causal_inference", DimensionCategory.COGNITIVE, 0.02,
                   "Understanding cause-effect relationships", 0.3),
    VULCADimension("memory_utilization", DimensionCategory.COGNITIVE, 0.015,
                   "Effective use of context and memory", 0.1),
    VULCADimension("attention_focus", DimensionCategory.COGNITIVE, 0.015,
                   "Maintaining relevant focus throughout tasks", 0.15),
    VULCADimension("cognitive_flexibility", DimensionCategory.COGNITIVE, 0.02,
                   "Adapting thinking strategies to new situations", 0.25),
    VULCADimension("metacognition", DimensionCategory.COGNITIVE, 0.015,
                   "Self-awareness of reasoning processes", 0.2),
    VULCADimension("problem_decomposition", DimensionCategory.COGNITIVE, 0.02,
                   "Breaking complex problems into manageable parts", 0.1),
    VULCADimension("hypothesis_generation", DimensionCategory.COGNITIVE, 0.015,
                   "Creating testable hypotheses", 0.15),
    VULCADimension("evidence_evaluation", DimensionCategory.COGNITIVE, 0.02,
                   "Assessing quality and relevance of evidence", 0.25),
    
    # Creative Dimensions (16)
    VULCADimension("creative_synthesis", DimensionCategory.CREATIVE, 0.025,
                   "Combining ideas in novel ways", 0.35),
    VULCADimension("artistic_expression", DimensionCategory.CREATIVE, 0.02,
                   "Expressing ideas with aesthetic consideration", 0.5),
    VULCADimension("innovation_index", DimensionCategory.CREATIVE, 0.025,
                   "Generating truly novel solutions", 0.3),
    VULCADimension("narrative_construction", DimensionCategory.CREATIVE, 0.02,
                   "Building coherent and engaging narratives", 0.4),
    VULCADimension("metaphorical_thinking", DimensionCategory.CREATIVE, 0.015,
                   "Using metaphors and analogies effectively", 0.45),
    VULCADimension("imaginative_depth", DimensionCategory.CREATIVE, 0.02,
                   "Depth and richness of imaginative content", 0.35),
    VULCADimension("stylistic_versatility", DimensionCategory.CREATIVE, 0.015,
                   "Adapting style to different contexts", 0.4),
    VULCADimension("conceptual_blending", DimensionCategory.CREATIVE, 0.015,
                   "Merging concepts from different domains", 0.25),
    VULCADimension("divergent_thinking", DimensionCategory.CREATIVE, 0.02,
                   "Generating multiple alternative solutions", 0.2),
    VULCADimension("aesthetic_sensitivity", DimensionCategory.CREATIVE, 0.015,
                   "Appreciation and creation of beauty", 0.6),
    VULCADimension("humor_generation", DimensionCategory.CREATIVE, 0.01,
                   "Creating and understanding humor", 0.7),
    VULCADimension("emotional_resonance", DimensionCategory.CREATIVE, 0.02,
                   "Creating emotionally impactful content", 0.5),
    VULCADimension("originality_score", DimensionCategory.CREATIVE, 0.02,
                   "Uniqueness of generated content", 0.3),
    VULCADimension("creative_flexibility", DimensionCategory.CREATIVE, 0.015,
                   "Adapting creative approach to constraints", 0.35),
    VULCADimension("symbolic_representation", DimensionCategory.CREATIVE, 0.015,
                   "Using symbols and representations effectively", 0.4),
    VULCADimension("creative_coherence", DimensionCategory.CREATIVE, 0.015,
                   "Maintaining consistency in creative works", 0.25),
    
    # Social Dimensions (15)
    VULCADimension("cultural_awareness", DimensionCategory.SOCIAL, 0.025,
                   "Understanding cultural contexts and nuances", 0.8),
    VULCADimension("empathy_modeling", DimensionCategory.SOCIAL, 0.02,
                   "Understanding and modeling others' emotions", 0.6),
    VULCADimension("social_appropriateness", DimensionCategory.SOCIAL, 0.02,
                   "Responding appropriately to social contexts", 0.7),
    VULCADimension("communication_clarity", DimensionCategory.SOCIAL, 0.025,
                   "Clear and effective communication", 0.3),
    VULCADimension("collaborative_ability", DimensionCategory.SOCIAL, 0.02,
                   "Working effectively with others", 0.4),
    VULCADimension("ethical_reasoning", DimensionCategory.SOCIAL, 0.025,
                   "Considering ethical implications", 0.65),
    VULCADimension("perspective_taking", DimensionCategory.SOCIAL, 0.02,
                   "Understanding different viewpoints", 0.55),
    VULCADimension("conflict_resolution", DimensionCategory.SOCIAL, 0.015,
                   "Addressing and resolving conflicts", 0.5),
    VULCADimension("emotional_intelligence", DimensionCategory.SOCIAL, 0.02,
                   "Understanding and managing emotions", 0.6),
    VULCADimension("social_prediction", DimensionCategory.SOCIAL, 0.015,
                   "Predicting social outcomes and reactions", 0.45),
    VULCADimension("trust_building", DimensionCategory.SOCIAL, 0.015,
                   "Establishing and maintaining trust", 0.5),
    VULCADimension("fairness_assessment", DimensionCategory.SOCIAL, 0.02,
                   "Evaluating and ensuring fairness", 0.7),
    VULCADimension("diversity_handling", DimensionCategory.SOCIAL, 0.02,
                   "Managing diverse perspectives and backgrounds", 0.75),
    VULCADimension("social_impact_awareness", DimensionCategory.SOCIAL, 0.015,
                   "Understanding broader social implications", 0.6),
    VULCADimension("interpersonal_sensitivity", DimensionCategory.SOCIAL, 0.015,
                   "Sensitivity to interpersonal dynamics", 0.65),
]


class VULCAAlgorithmV2:
    """
    VULCA Algorithm Version 2.0
    Based on EMNLP2025 research for intelligent 6D to 47D expansion
    """
    
    def __init__(self):
        self.dimensions = VULCA_47_DIMENSIONS
        self._build_correlation_matrix()
        
    def _build_correlation_matrix(self):
        """Build the correlation matrix between 6D and 47D"""
        # This maps how each 6D dimension influences the 47D dimensions
        self.correlation_matrix = {
            'creativity': {
                'creative_synthesis': 0.15,
                'artistic_expression': 0.12,
                'innovation_index': 0.13,
                'narrative_construction': 0.10,
                'metaphorical_thinking': 0.08,
                'imaginative_depth': 0.10,
                'stylistic_versatility': 0.07,
                'conceptual_blending': 0.06,
                'divergent_thinking': 0.08,
                'aesthetic_sensitivity': 0.05,
                'humor_generation': 0.03,
                'emotional_resonance': 0.08,
                'originality_score': 0.10,
                'creative_flexibility': 0.07,
                'symbolic_representation': 0.05,
                'creative_coherence': 0.06,
                # Minor influence on cognitive
                'cognitive_flexibility': 0.03,
                'abstraction_capability': 0.02,
            },
            'technique': {
                'logical_reasoning': 0.12,
                'pattern_recognition': 0.10,
                'analytical_depth': 0.11,
                'problem_decomposition': 0.09,
                'evidence_evaluation': 0.08,
                'attention_focus': 0.07,
                'memory_utilization': 0.06,
                'spatial_reasoning': 0.05,
                'temporal_reasoning': 0.05,
                # Some creative aspects
                'creative_coherence': 0.04,
                'stylistic_versatility': 0.03,
                # Communication
                'communication_clarity': 0.08,
            },
            'emotion': {
                'empathy_modeling': 0.15,
                'emotional_intelligence': 0.14,
                'emotional_resonance': 0.12,
                'interpersonal_sensitivity': 0.10,
                'perspective_taking': 0.08,
                'social_appropriateness': 0.07,
                'trust_building': 0.06,
                # Creative emotional aspects
                'narrative_construction': 0.05,
                'humor_generation': 0.04,
                'artistic_expression': 0.06,
            },
            'context': {
                'contextual_understanding': 0.14,
                'cultural_awareness': 0.12,
                'social_appropriateness': 0.10,
                'knowledge_integration': 0.09,
                'temporal_reasoning': 0.07,
                'causal_inference': 0.08,
                'social_prediction': 0.06,
                'diversity_handling': 0.08,
                'fairness_assessment': 0.07,
            },
            'innovation': {
                'innovation_index': 0.15,
                'creative_synthesis': 0.12,
                'divergent_thinking': 0.10,
                'conceptual_blending': 0.09,
                'originality_score': 0.11,
                'hypothesis_generation': 0.08,
                'creative_flexibility': 0.07,
                'metacognition': 0.05,
                'cognitive_flexibility': 0.06,
            },
            'impact': {
                'social_impact_awareness': 0.12,
                'ethical_reasoning': 0.11,
                'collaborative_ability': 0.09,
                'communication_clarity': 0.08,
                'trust_building': 0.07,
                'conflict_resolution': 0.06,
                'fairness_assessment': 0.08,
                'emotional_resonance': 0.06,
                'narrative_construction': 0.05,
                'evidence_evaluation': 0.05,
            }
        }
    
    def expand_6d_to_47d(self, scores_6d: Dict[str, float]) -> Dict[str, float]:
        """
        Intelligently expand 6D scores to 47D using correlation matrix
        
        Args:
            scores_6d: Dictionary with 6 dimension scores (0-100)
            
        Returns:
            Dictionary with 47 dimension scores (0-100)
        """
        scores_47d = {}
        
        # Initialize all dimensions with base values
        for dim in self.dimensions:
            scores_47d[dim.name] = 0.0
        
        # Apply correlation matrix
        for source_dim, source_score in scores_6d.items():
            if source_dim in self.correlation_matrix:
                correlations = self.correlation_matrix[source_dim]
                for target_dim, weight in correlations.items():
                    if target_dim in scores_47d:
                        # Add weighted contribution
                        scores_47d[target_dim] += source_score * weight
        
        # Add noise and normalize
        np.random.seed(42)  # For reproducibility
        for dim in self.dimensions:
            # Add small random variation (±5%)
            noise = np.random.normal(0, 2.5)
            scores_47d[dim.name] = np.clip(scores_47d[dim.name] + noise, 0, 100)
        
        # Normalize to reasonable range while maintaining relative differences
        max_score = max(scores_47d.values()) if scores_47d else 1
        avg_6d = sum(scores_6d.values()) / 6
        
        for dim in scores_47d:
            # Normalize and scale based on original average
            normalized = (scores_47d[dim] / max_score) * avg_6d
            # Add variation based on dimension weight
            dim_obj = next(d for d in self.dimensions if d.name == dim)
            variation = np.random.normal(0, 5) * dim_obj.weight * 10
            scores_47d[dim] = np.clip(normalized + variation, 0, 100)
        
        return scores_47d
    
    def calculate_overall_score(self, scores_47d: Dict[str, float]) -> float:
        """Calculate weighted overall score from 47D scores"""
        total = 0
        weight_sum = 0
        
        for dim in self.dimensions:
            if dim.name in scores_47d:
                total += scores_47d[dim.name] * dim.weight
                weight_sum += dim.weight
        
        return total / weight_sum if weight_sum > 0 else 0
    
    def apply_cultural_perspective(self, 
                                  scores_47d: Dict[str, float],
                                  perspective: str) -> Dict[str, float]:
        """
        Apply cultural perspective adjustments to scores
        
        Args:
            scores_47d: Base 47D scores
            perspective: Cultural perspective (e.g., 'western', 'eastern', 'global')
            
        Returns:
            Adjusted scores based on cultural perspective
        """
        adjusted_scores = scores_47d.copy()
        
        # Cultural adjustment factors (stronger impact)
        adjustments = {
            'western': {
                'innovation_index': 1.25,
                'creative_synthesis': 1.20,
                'logical_reasoning': 1.15,
                'divergent_thinking': 1.18,
                'originality_score': 1.22,
                'hypothesis_generation': 1.12,
                # Slightly reduce social dimensions
                'social_appropriateness': 0.92,
                'collaborative_ability': 0.95,
            },
            'eastern': {
                'cultural_awareness': 1.30,
                'social_appropriateness': 1.25,
                'collaborative_ability': 1.22,
                'contextual_understanding': 1.18,
                'empathy_modeling': 1.20,
                'perspective_taking': 1.15,
                # Slightly reduce individual creative dimensions
                'originality_score': 0.90,
                'divergent_thinking': 0.93,
            },
            'global': {
                'diversity_handling': 1.20,
                'fairness_assessment': 1.18,
                'ethical_reasoning': 1.15,
                'cultural_awareness': 1.12,
                'communication_clarity': 1.10,
                'social_impact_awareness': 1.08,
            }
        }
        
        if perspective in adjustments:
            for dim_name, factor in adjustments[perspective].items():
                if dim_name in adjusted_scores:
                    adjusted_scores[dim_name] = min(100, adjusted_scores[dim_name] * factor)
        
        return adjusted_scores


def generate_dimension_metadata() -> List[Dict]:
    """Generate metadata for all 47 dimensions"""
    metadata = []
    for dim in VULCA_47_DIMENSIONS:
        metadata.append({
            'name': dim.name,
            'display_name': dim.name.replace('_', ' ').title(),
            'category': dim.category.value,
            'weight': dim.weight,
            'description': dim.description,
            'cultural_sensitivity': dim.cultural_sensitivity,
            'tier_required': 'free' if dim.weight > 0.022 else 'paid'  # Top 10 are free
        })
    return metadata


if __name__ == "__main__":
    # Test the algorithm
    algorithm = VULCAAlgorithmV2()
    
    # Sample 6D scores
    scores_6d = {
        'creativity': 85,
        'technique': 78,
        'emotion': 82,
        'context': 75,
        'innovation': 88,
        'impact': 80
    }
    
    # Expand to 47D
    scores_47d = algorithm.expand_6d_to_47d(scores_6d)
    
    # Calculate overall score
    overall = algorithm.calculate_overall_score(scores_47d)
    
    print(f"Original 6D average: {sum(scores_6d.values()) / 6:.2f}")
    print(f"Expanded 47D overall score: {overall:.2f}")
    print(f"\nTop 10 dimensions:")
    
    # Sort and show top 10
    sorted_dims = sorted(scores_47d.items(), key=lambda x: x[1], reverse=True)
    for name, score in sorted_dims[:10]:
        print(f"  {name.replace('_', ' ').title()}: {score:.2f}")