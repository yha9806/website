"""
Quality metrics calculation for content evaluation
"""
import math
from typing import Dict, Any, List


class QualityMetrics:
    """Calculate quality metrics for different content types"""
    
    def calculate_poem_base_score(self, features: Dict[str, Any]) -> float:
        """Calculate base quality score for poems"""
        score = 0.5  # Base score
        
        # Length penalties and bonuses
        line_count = features.get('line_count', 0)
        if 2 <= line_count <= 8:  # Optimal range for poems
            score += 0.1
        elif line_count > 20:  # Too long
            score -= 0.05
            
        # Word count consideration
        word_count = features.get('word_count', 0)
        if 10 <= word_count <= 100:  # Good range
            score += 0.05
            
        # Chinese poetry bonuses
        if features.get('is_traditional_form', False):
            score += 0.1
            
        if features.get('chinese_character_count', 0) > 0:
            char_ratio = features['chinese_character_count'] / features.get('character_count', 1)
            if char_ratio > 0.7:  # Predominantly Chinese
                score += 0.05
                
        return min(1.0, max(0.1, score))
    
    def calculate_story_base_score(self, features: Dict[str, Any]) -> float:
        """Calculate base quality score for stories"""
        score = 0.5  # Base score
        
        # Word count scoring
        word_count = features.get('word_count', 0)
        if 100 <= word_count <= 1000:  # Good range for short stories
            score += 0.1
        elif word_count > 2000:  # Very long
            score += 0.05
        elif word_count < 50:  # Too short
            score -= 0.1
            
        # Sentence structure bonus
        avg_sentence_length = features.get('avg_sentence_length', 0)
        if 8 <= avg_sentence_length <= 20:  # Good sentence length
            score += 0.05
            
        # Dialogue bonus (indicates character interaction)
        if features.get('has_dialogue', False):
            score += 0.05
            
        # Paragraph structure
        paragraph_count = features.get('paragraph_count', 0)
        if paragraph_count >= 2:  # Well-structured
            score += 0.05
            
        return min(1.0, max(0.1, score))
    
    def calculate_painting_base_score(self, features: Dict[str, Any]) -> float:
        """Calculate base quality score for painting prompts"""
        score = 0.5  # Base score
        
        # Prompt detail bonus
        word_count = features.get('word_count', 0)
        if word_count >= 5:  # Detailed prompt
            score += 0.1
        if word_count >= 10:  # Very detailed
            score += 0.05
            
        # Artistic element bonuses
        if features.get('color_mentions', 0) > 0:
            score += 0.05
        if features.get('style_mentions', 0) > 0:
            score += 0.05
        if features.get('composition_mentions', 0) > 0:
            score += 0.05
            
        # Complexity bonus
        complexity = features.get('complexity_score', 0)
        if 0.5 <= complexity <= 2.0:  # Good complexity range
            score += 0.1
            
        return min(1.0, max(0.1, score))
    
    def calculate_music_base_score(self, features: Dict[str, Any]) -> float:
        """Calculate base quality score for music"""
        score = 0.5  # Base score
        
        # Musical notation bonus
        if features.get('has_key_signature', False):
            score += 0.1
        if features.get('has_tempo_marking', False):
            score += 0.1
            
        # Structure bonus
        line_count = features.get('line_count', 0)
        if line_count >= 4:  # Good structure
            score += 0.05
            
        # Content richness
        if features.get('has_lyrics', False):
            score += 0.05
        if features.get('musical_notation_count', 0) > 5:
            score += 0.05
            
        return min(1.0, max(0.1, score))
    
    def normalize_ai_scores(self, raw_scores: Dict[str, float]) -> Dict[str, float]:
        """Normalize AI evaluation scores to ensure reasonable distribution"""
        normalized = {}
        
        for key, value in raw_scores.items():
            # Apply sigmoid-like transformation to prevent extreme scores
            normalized_value = 1 / (1 + math.exp(-6 * (value - 0.5)))
            
            # Ensure minimum quality threshold
            normalized_value = max(0.3, normalized_value)
            
            # Add small random variation to prevent identical scores
            import random
            random.seed(hash(str(value) + key))  # Deterministic randomness
            variation = (random.random() - 0.5) * 0.1  # ±5% variation
            normalized_value = max(0.1, min(1.0, normalized_value + variation))
            
            normalized[key] = round(normalized_value, 3)
            
        return normalized
    
    def combine_scores(self, ai_scores: Dict[str, float], base_score: float, 
                      weights: Dict[str, float] = None) -> Dict[str, float]:
        """Combine AI evaluation scores with base content analysis"""
        if weights is None:
            weights = {key: 1.0 for key in ai_scores.keys()}
            
        combined = {}
        for key, ai_score in ai_scores.items():
            weight = weights.get(key, 1.0)
            
            # Weighted combination: 70% AI score, 30% base analysis
            combined_score = (ai_score * 0.7 + base_score * 0.3) * weight
            combined[key] = max(0.1, min(1.0, combined_score))
            
        return combined