"""
VULCA Model Profiles System
Provides realistic model characteristics for intelligent data generation
"""

from typing import Dict, List, Tuple, Optional
import numpy as np
from dataclasses import dataclass
from enum import Enum


class ModelCategory(Enum):
    """Model categories based on characteristics"""
    FRONTIER = "frontier"           # GPT-4o, Claude Opus, etc.
    SPECIALIZED = "specialized"     # DeepSeek-R1, Code models
    EFFICIENCY = "efficiency"       # GPT-4o-mini, Claude Haiku
    RESEARCH = "research"          # Experimental models
    MULTIMODAL = "multimodal"      # Vision-capable models


class CulturalAlignment(Enum):
    """Cultural alignment tendencies"""
    WESTERN_FOCUSED = "western_focused"
    EASTERN_FOCUSED = "eastern_focused"
    BALANCED = "balanced"
    DIVERSE = "diverse"


@dataclass
class ModelProfile:
    """Comprehensive model profile for realistic scoring"""
    
    # Basic info
    model_id: str
    name: str
    category: ModelCategory
    provider: str
    
    # Core characteristics (0-1 scale)
    technical_strength: float       # Code, logic, reasoning
    creative_expression: float      # Art, writing, imagination
    emotional_depth: float          # Empathy, emotional understanding
    contextual_awareness: float     # Cultural, situational context
    innovation_factor: float        # Originality, novel approaches
    practical_impact: float         # Real-world applicability
    
    # Secondary attributes
    consistency_level: float        # How consistent across tasks (0-1)
    specialization_bonus: Dict[str, float]  # Extra strength in specific areas
    cultural_alignment: CulturalAlignment
    multimodal_capable: bool
    
    # Performance characteristics
    performance_ceiling: float      # Maximum achievable score (0-100)
    performance_floor: float        # Minimum typical score (0-100)
    variance_tendency: float        # How much scores vary (0-1)


class ModelProfileRegistry:
    """Registry of all model profiles with intelligent scoring"""
    
    def __init__(self):
        self.profiles: Dict[str, ModelProfile] = {}
        self._initialize_model_profiles()
    
    def _initialize_model_profiles(self):
        """Initialize profiles for all 42 models"""
        
        # OpenAI Models (Frontier)
        self.profiles.update({
            "gpt-5": ModelProfile(
                model_id="gpt-5",
                name="GPT-5",
                category=ModelCategory.FRONTIER,
                provider="OpenAI",
                technical_strength=0.95,
                creative_expression=0.90,
                emotional_depth=0.85,
                contextual_awareness=0.90,
                innovation_factor=0.88,
                practical_impact=0.92,
                consistency_level=0.90,
                specialization_bonus={"reasoning": 0.15, "analysis": 0.12},
                cultural_alignment=CulturalAlignment.WESTERN_FOCUSED,
                multimodal_capable=True,
                performance_ceiling=95.0,
                performance_floor=75.0,
                variance_tendency=0.15
            ),
            
            "o1": ModelProfile(
                model_id="o1",
                name="O1 Reasoning",
                category=ModelCategory.SPECIALIZED,
                provider="OpenAI",
                technical_strength=0.98,
                creative_expression=0.70,
                emotional_depth=0.60,
                contextual_awareness=0.80,
                innovation_factor=0.85,
                practical_impact=0.90,
                consistency_level=0.85,
                specialization_bonus={"reasoning": 0.25, "mathematics": 0.20},
                cultural_alignment=CulturalAlignment.WESTERN_FOCUSED,
                multimodal_capable=False,
                performance_ceiling=92.0,
                performance_floor=70.0,
                variance_tendency=0.20
            ),
            
            "gpt-4o": ModelProfile(
                model_id="gpt-4o",
                name="GPT-4o",
                category=ModelCategory.MULTIMODAL,
                provider="OpenAI",
                technical_strength=0.90,
                creative_expression=0.88,
                emotional_depth=0.82,
                contextual_awareness=0.88,
                innovation_factor=0.85,
                practical_impact=0.90,
                consistency_level=0.88,
                specialization_bonus={"vision": 0.20, "multimodal": 0.15},
                cultural_alignment=CulturalAlignment.BALANCED,
                multimodal_capable=True,
                performance_ceiling=90.0,
                performance_floor=72.0,
                variance_tendency=0.12
            ),
        })
        
        # Anthropic Models (High emotional intelligence)
        self.profiles.update({
            "claude-opus-4-1-20250805": ModelProfile(
                model_id="claude-opus-4-1-20250805",
                name="Claude Opus 4.1",
                category=ModelCategory.FRONTIER,
                provider="Anthropic",
                technical_strength=0.88,
                creative_expression=0.92,
                emotional_depth=0.95,
                contextual_awareness=0.90,
                innovation_factor=0.87,
                practical_impact=0.85,
                consistency_level=0.90,
                specialization_bonus={"writing": 0.18, "ethics": 0.15, "empathy": 0.20},
                cultural_alignment=CulturalAlignment.BALANCED,
                multimodal_capable=True,
                performance_ceiling=88.0,
                performance_floor=70.0,
                variance_tendency=0.10
            ),
            
            "claude-3-5-sonnet-20241022": ModelProfile(
                model_id="claude-3-5-sonnet-20241022",
                name="Claude 3.5 Sonnet",
                category=ModelCategory.FRONTIER,
                provider="Anthropic",
                technical_strength=0.85,
                creative_expression=0.90,
                emotional_depth=0.92,
                contextual_awareness=0.88,
                innovation_factor=0.84,
                practical_impact=0.82,
                consistency_level=0.88,
                specialization_bonus={"writing": 0.15, "analysis": 0.12},
                cultural_alignment=CulturalAlignment.BALANCED,
                multimodal_capable=True,
                performance_ceiling=85.0,
                performance_floor=68.0,
                variance_tendency=0.12
            ),
        })
        
        # DeepSeek Models (Technical specialists)
        self.profiles.update({
            "deepseek-r1": ModelProfile(
                model_id="deepseek-r1",
                name="DeepSeek R1",
                category=ModelCategory.SPECIALIZED,
                provider="DeepSeek",
                technical_strength=0.95,
                creative_expression=0.70,
                emotional_depth=0.65,
                contextual_awareness=0.75,
                innovation_factor=0.90,
                practical_impact=0.88,
                consistency_level=0.80,
                specialization_bonus={"reasoning": 0.20, "mathematics": 0.25, "code": 0.18},
                cultural_alignment=CulturalAlignment.EASTERN_FOCUSED,
                multimodal_capable=False,
                performance_ceiling=88.0,
                performance_floor=65.0,
                variance_tendency=0.25
            ),
            
            "deepseek-v3": ModelProfile(
                model_id="deepseek-v3",
                name="DeepSeek V3",
                category=ModelCategory.FRONTIER,
                provider="DeepSeek",
                technical_strength=0.90,
                creative_expression=0.75,
                emotional_depth=0.70,
                contextual_awareness=0.80,
                innovation_factor=0.85,
                practical_impact=0.85,
                consistency_level=0.82,
                specialization_bonus={"code": 0.20, "analysis": 0.15},
                cultural_alignment=CulturalAlignment.EASTERN_FOCUSED,
                multimodal_capable=False,
                performance_ceiling=82.0,
                performance_floor=62.0,
                variance_tendency=0.20
            ),
        })
        
        # Qwen Models (Multilingual, culturally diverse)
        self.profiles.update({
            "qwen-max-2025-01-25": ModelProfile(
                model_id="qwen-max-2025-01-25",
                name="Qwen Max",
                category=ModelCategory.FRONTIER,
                provider="Alibaba",
                technical_strength=0.88,
                creative_expression=0.82,
                emotional_depth=0.78,
                contextual_awareness=0.92,
                innovation_factor=0.80,
                practical_impact=0.85,
                consistency_level=0.85,
                specialization_bonus={"multilingual": 0.25, "cultural": 0.20},
                cultural_alignment=CulturalAlignment.EASTERN_FOCUSED,
                multimodal_capable=True,
                performance_ceiling=80.0,
                performance_floor=60.0,
                variance_tendency=0.18
            ),
            
            "qwen-plus": ModelProfile(
                model_id="qwen-plus",
                name="Qwen Plus",
                category=ModelCategory.EFFICIENCY,
                provider="Alibaba",
                technical_strength=0.82,
                creative_expression=0.78,
                emotional_depth=0.75,
                contextual_awareness=0.88,
                innovation_factor=0.75,
                practical_impact=0.80,
                consistency_level=0.82,
                specialization_bonus={"multilingual": 0.20, "efficiency": 0.15},
                cultural_alignment=CulturalAlignment.EASTERN_FOCUSED,
                multimodal_capable=True,
                performance_ceiling=75.0,
                performance_floor=55.0,
                variance_tendency=0.15
            ),
        })
        
        # Add more model profiles for efficiency models
        self.profiles.update({
            "gpt-4o-mini": ModelProfile(
                model_id="gpt-4o-mini",
                name="GPT-4o Mini",
                category=ModelCategory.EFFICIENCY,
                provider="OpenAI",
                technical_strength=0.80,
                creative_expression=0.75,
                emotional_depth=0.70,
                contextual_awareness=0.75,
                innovation_factor=0.72,
                practical_impact=0.78,
                consistency_level=0.85,
                specialization_bonus={"efficiency": 0.20, "speed": 0.15},
                cultural_alignment=CulturalAlignment.WESTERN_FOCUSED,
                multimodal_capable=True,
                performance_ceiling=72.0,
                performance_floor=55.0,
                variance_tendency=0.10
            ),
            
            "claude-3-haiku-20240307": ModelProfile(
                model_id="claude-3-haiku-20240307",
                name="Claude 3 Haiku",
                category=ModelCategory.EFFICIENCY,
                provider="Anthropic",
                technical_strength=0.75,
                creative_expression=0.80,
                emotional_depth=0.85,
                contextual_awareness=0.78,
                innovation_factor=0.70,
                practical_impact=0.75,
                consistency_level=0.88,
                specialization_bonus={"efficiency": 0.18, "consistency": 0.15},
                cultural_alignment=CulturalAlignment.BALANCED,
                multimodal_capable=False,
                performance_ceiling=70.0,
                performance_floor=50.0,
                variance_tendency=0.08
            ),
        })
    
    def get_profile(self, model_id: str) -> Optional[ModelProfile]:
        """Get profile for specific model"""
        return self.profiles.get(model_id)
    
    def get_profiles_by_category(self, category: ModelCategory) -> List[ModelProfile]:
        """Get all profiles in a category"""
        return [profile for profile in self.profiles.values() 
                if profile.category == category]
    
    def get_profiles_by_provider(self, provider: str) -> List[ModelProfile]:
        """Get all profiles from a provider"""
        return [profile for profile in self.profiles.values() 
                if profile.provider == provider]
    
    def generate_6d_scores(self, model_id: str, base_randomness: float = 0.1) -> Dict[str, float]:
        """Generate realistic 6D scores based on model profile"""
        profile = self.get_profile(model_id)
        if not profile:
            # Fallback for unknown models
            return {
                'creativity': np.random.uniform(40, 80),
                'technique': np.random.uniform(40, 80),
                'emotion': np.random.uniform(40, 80),
                'context': np.random.uniform(40, 80),
                'innovation': np.random.uniform(40, 80),
                'impact': np.random.uniform(40, 80)
            }
        
        # Base scores from profile characteristics
        base_scores = {
            'creativity': profile.creative_expression,
            'technique': profile.technical_strength,
            'emotion': profile.emotional_depth,
            'context': profile.contextual_awareness,
            'innovation': profile.innovation_factor,
            'impact': profile.practical_impact
        }
        
        # Convert to 0-100 scale with realistic variance
        scores = {}
        for dim, base_value in base_scores.items():
            # Apply performance ceiling/floor
            scaled_base = profile.performance_floor + (base_value * (profile.performance_ceiling - profile.performance_floor))
            
            # Add variance based on model consistency
            variance_range = scaled_base * profile.variance_tendency * (1 + base_randomness)
            variance = np.random.normal(0, variance_range / 3)  # 3-sigma rule
            
            # Apply specialization bonuses
            bonus = 0
            for spec, boost in profile.specialization_bonus.items():
                if spec in dim or dim in spec:
                    bonus = boost * scaled_base
                    break
            
            final_score = max(0, min(100, scaled_base + variance + bonus))
            scores[dim] = final_score
        
        return scores
    
    def generate_cultural_perspectives(self, model_id: str) -> Dict[str, float]:
        """Generate cultural perspective scores based on model alignment"""
        profile = self.get_profile(model_id)
        if not profile:
            # Fallback: balanced cultural scores
            return {perspective: np.random.uniform(60, 80) 
                   for perspective in ['western', 'eastern', 'african', 'latin_american',
                                    'middle_eastern', 'south_asian', 'oceanic', 'indigenous']}
        
        base_score = 70  # Neutral baseline
        variance = 10
        
        scores = {}
        cultural_boosts = {
            CulturalAlignment.WESTERN_FOCUSED: {
                'western': 15, 'eastern': -5, 'african': 0, 'latin_american': 5,
                'middle_eastern': 0, 'south_asian': -3, 'oceanic': 2, 'indigenous': 0
            },
            CulturalAlignment.EASTERN_FOCUSED: {
                'western': -5, 'eastern': 18, 'african': 0, 'latin_american': 0,
                'middle_eastern': 3, 'south_asian': 12, 'oceanic': 0, 'indigenous': 2
            },
            CulturalAlignment.BALANCED: {
                'western': 8, 'eastern': 8, 'african': 5, 'latin_american': 8,
                'middle_eastern': 5, 'south_asian': 8, 'oceanic': 5, 'indigenous': 5
            },
            CulturalAlignment.DIVERSE: {
                'western': 5, 'eastern': 5, 'african': 12, 'latin_american': 12,
                'middle_eastern': 12, 'south_asian': 5, 'oceanic': 15, 'indigenous': 18
            }
        }
        
        boosts = cultural_boosts[profile.cultural_alignment]
        for perspective in ['western', 'eastern', 'african', 'latin_american',
                           'middle_eastern', 'south_asian', 'oceanic', 'indigenous']:
            boost = boosts.get(perspective, 0)
            score = base_score + boost + np.random.normal(0, variance / 3)
            scores[perspective] = max(20, min(100, score))
        
        return scores
    
    def get_model_characteristics_summary(self, model_id: str) -> Dict:
        """Get human-readable summary of model characteristics"""
        profile = self.get_profile(model_id)
        if not profile:
            return {"error": f"Profile not found for model: {model_id}"}
        
        return {
            "name": profile.name,
            "provider": profile.provider,
            "category": profile.category.value,
            "strengths": [
                k for k, v in {
                    "Technical": profile.technical_strength,
                    "Creative": profile.creative_expression,
                    "Emotional": profile.emotional_depth,
                    "Contextual": profile.contextual_awareness,
                    "Innovation": profile.innovation_factor,
                    "Impact": profile.practical_impact
                }.items() if v > 0.85
            ],
            "specializations": list(profile.specialization_bonus.keys()),
            "cultural_alignment": profile.cultural_alignment.value,
            "multimodal": profile.multimodal_capable,
            "expected_score_range": f"{profile.performance_floor:.0f}-{profile.performance_ceiling:.0f}",
            "consistency": "High" if profile.consistency_level > 0.85 else "Medium" if profile.consistency_level > 0.75 else "Variable"
        }