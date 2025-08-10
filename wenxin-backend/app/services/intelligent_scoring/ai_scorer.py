"""
AI-powered content scoring system
"""
import json
import asyncio
import logging
from typing import Dict, Any, Optional
from openai import AsyncOpenAI
import os

from .content_analyzer import ContentAnalyzer
from .quality_metrics import QualityMetrics
from .scoring_prompts import ScoringPrompts

logger = logging.getLogger(__name__)


class IntelligentScorer:
    """Main intelligent scoring engine using AI for content evaluation"""
    
    def __init__(self):
        # Try to initialize OpenAI client, but don't fail if no API key
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "your-openai-key-here":
            try:
                self.openai_client = AsyncOpenAI(api_key=api_key)
                self.use_ai = True
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")
                self.openai_client = None
                self.use_ai = False
        else:
            logger.info("No OpenAI API key found, using fallback scoring")
            self.openai_client = None
            self.use_ai = False
            
        self.content_analyzer = ContentAnalyzer()
        self.quality_metrics = QualityMetrics()
        self.prompts = ScoringPrompts()
        
    async def evaluate_poem(self, content: str, style: Optional[str] = None, **kwargs) -> Dict[str, float]:
        """Intelligently evaluate poem quality using AI + content analysis"""
        try:
            # Step 1: Content analysis
            features = self.content_analyzer.analyze_poem(content, style)
            base_score = self.quality_metrics.calculate_poem_base_score(features)
            
            # Step 2: AI evaluation or fallback
            if self.use_ai:
                try:
                    ai_scores = await self._get_ai_poem_scores(content, style or "modern")
                    # Step 3: Combine scores
                    final_scores = self.quality_metrics.combine_scores(ai_scores, base_score)
                except Exception as e:
                    logger.warning(f"AI evaluation failed, using fallback: {e}")
                    final_scores = self._generate_fallback_poem_scores(features)
            else:
                final_scores = self._generate_fallback_poem_scores(features)
            
            logger.info(f"Poem evaluation completed: {final_scores}")
            return final_scores
            
        except Exception as e:
            logger.error(f"Error in poem evaluation: {e}")
            # Fallback to enhanced base scoring
            features = self.content_analyzer.analyze_poem(content, style)
            return self._generate_fallback_poem_scores(features)
    
    async def evaluate_story(self, content: str, genre: Optional[str] = None, 
                           word_count: Optional[int] = None, **kwargs) -> Dict[str, float]:
        """Intelligently evaluate story quality using AI + content analysis"""
        try:
            # Step 1: Content analysis
            features = self.content_analyzer.analyze_story(content, genre)
            base_score = self.quality_metrics.calculate_story_base_score(features)
            
            # Step 2: AI evaluation or fallback
            if self.use_ai:
                try:
                    ai_scores = await self._get_ai_story_scores(
                        content, genre or "general", word_count or features['word_count']
                    )
                    # Step 3: Combine scores
                    final_scores = self.quality_metrics.combine_scores(ai_scores, base_score)
                except Exception as e:
                    logger.warning(f"AI evaluation failed, using fallback: {e}")
                    final_scores = self._generate_fallback_story_scores(features)
            else:
                final_scores = self._generate_fallback_story_scores(features)
            
            logger.info(f"Story evaluation completed: {final_scores}")
            return final_scores
            
        except Exception as e:
            logger.error(f"Error in story evaluation: {e}")
            # Fallback to enhanced base scoring
            features = self.content_analyzer.analyze_story(content, genre)
            return self._generate_fallback_story_scores(features)
    
    async def evaluate_painting(self, prompt: str, style: Optional[str] = None, **kwargs) -> Dict[str, float]:
        """Intelligently evaluate painting prompt and concept"""
        try:
            # Step 1: Content analysis
            features = self.content_analyzer.analyze_painting_prompt(prompt, style)
            base_score = self.quality_metrics.calculate_painting_base_score(features)
            
            # Step 2: AI evaluation or fallback
            if self.use_ai:
                try:
                    ai_scores = await self._get_ai_painting_scores(prompt, style or "realistic")
                    # Step 3: Combine scores
                    final_scores = self.quality_metrics.combine_scores(ai_scores, base_score)
                except Exception as e:
                    logger.warning(f"AI evaluation failed, using fallback: {e}")
                    final_scores = self._generate_fallback_painting_scores(features)
            else:
                final_scores = self._generate_fallback_painting_scores(features)
            
            logger.info(f"Painting evaluation completed: {final_scores}")
            return final_scores
            
        except Exception as e:
            logger.error(f"Error in painting evaluation: {e}")
            # Fallback to enhanced base scoring
            features = self.content_analyzer.analyze_painting_prompt(prompt, style)
            return self._generate_fallback_painting_scores(features)
    
    async def evaluate_music(self, content: str, style: Optional[str] = None, **kwargs) -> Dict[str, float]:
        """Intelligently evaluate music composition"""
        try:
            # Step 1: Content analysis
            features = self.content_analyzer.analyze_music_composition(content, style)
            base_score = self.quality_metrics.calculate_music_base_score(features)
            
            # Step 2: AI evaluation or fallback
            if self.use_ai:
                try:
                    ai_scores = await self._get_ai_music_scores(content, style or "classical")
                    # Step 3: Combine scores
                    final_scores = self.quality_metrics.combine_scores(ai_scores, base_score)
                except Exception as e:
                    logger.warning(f"AI evaluation failed, using fallback: {e}")
                    final_scores = self._generate_fallback_music_scores(features)
            else:
                final_scores = self._generate_fallback_music_scores(features)
            
            logger.info(f"Music evaluation completed: {final_scores}")
            return final_scores
            
        except Exception as e:
            logger.error(f"Error in music evaluation: {e}")
            # Fallback to enhanced base scoring
            features = self.content_analyzer.analyze_music_composition(content, style)
            return self._generate_fallback_music_scores(features)
    
    async def _get_ai_poem_scores(self, content: str, style: str) -> Dict[str, float]:
        """Get AI evaluation scores for poem"""
        prompt = self.prompts.POEM_EVALUATION.format(content=content, style=style)
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "You are an expert poetry critic. Provide objective, precise evaluations in JSON format only."
            }, {
                "role": "user", 
                "content": prompt
            }],
            temperature=0.3,
            max_tokens=150
        )
        
        try:
            scores_json = response.choices[0].message.content.strip()
            scores = json.loads(scores_json)
            return self.quality_metrics.normalize_ai_scores(scores)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI poem scores: {e}")
            raise
    
    async def _get_ai_story_scores(self, content: str, genre: str, word_count: int) -> Dict[str, float]:
        """Get AI evaluation scores for story"""
        prompt = self.prompts.STORY_EVALUATION.format(
            content=content[:1000] + "..." if len(content) > 1000 else content,
            genre=genre,
            word_count=word_count
        )
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "You are an expert literary critic. Provide objective, precise evaluations in JSON format only."
            }, {
                "role": "user",
                "content": prompt
            }],
            temperature=0.3,
            max_tokens=150
        )
        
        try:
            scores_json = response.choices[0].message.content.strip()
            scores = json.loads(scores_json)
            return self.quality_metrics.normalize_ai_scores(scores)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI story scores: {e}")
            raise
    
    async def _get_ai_painting_scores(self, prompt: str, style: str) -> Dict[str, float]:
        """Get AI evaluation scores for painting"""
        eval_prompt = self.prompts.PAINTING_EVALUATION.format(prompt=prompt, style=style)
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "You are an expert art critic. Provide objective, precise evaluations in JSON format only."
            }, {
                "role": "user",
                "content": eval_prompt
            }],
            temperature=0.3,
            max_tokens=150
        )
        
        try:
            scores_json = response.choices[0].message.content.strip()
            scores = json.loads(scores_json)
            return self.quality_metrics.normalize_ai_scores(scores)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI painting scores: {e}")
            raise
    
    async def _get_ai_music_scores(self, content: str, style: str) -> Dict[str, float]:
        """Get AI evaluation scores for music"""
        prompt = self.prompts.MUSIC_EVALUATION.format(content=content, style=style)
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "You are an expert music critic. Provide objective, precise evaluations in JSON format only."
            }, {
                "role": "user",
                "content": prompt
            }],
            temperature=0.3,
            max_tokens=150
        )
        
        try:
            scores_json = response.choices[0].message.content.strip()
            scores = json.loads(scores_json)
            return self.quality_metrics.normalize_ai_scores(scores)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI music scores: {e}")
            raise
    
    def _generate_fallback_poem_scores(self, features: Dict[str, Any]) -> Dict[str, float]:
        """Generate enhanced fallback scores for poems"""
        base = self.quality_metrics.calculate_poem_base_score(features)
        
        # Generate varied scores based on content features
        scores = {
            "rhythm": base + (0.1 if features.get('is_traditional_form', False) else -0.05),
            "imagery": base + (0.05 if features.get('word_count', 0) > 30 else 0),
            "emotion": base + (0.08 if features.get('chinese_character_count', 0) > 0 else 0),
            "creativity": base + (0.03 if features.get('line_count', 0) != 4 else 0),
            "cultural_relevance": base + (0.12 if features.get('chinese_character_count', 0) > 10 else 0)
        }
        
        # Normalize to valid range
        return {k: max(0.1, min(1.0, v)) for k, v in scores.items()}
    
    def _generate_fallback_story_scores(self, features: Dict[str, Any]) -> Dict[str, float]:
        """Generate enhanced fallback scores for stories"""
        base = self.quality_metrics.calculate_story_base_score(features)
        
        scores = {
            "narrative_structure": base + (0.1 if features.get('paragraph_count', 0) > 2 else 0),
            "character_development": base + (0.08 if features.get('has_dialogue', False) else 0),
            "plot_coherence": base + (0.05 if 200 <= features.get('word_count', 0) <= 800 else 0),
            "creativity": base + (0.03 if features.get('genre') != 'unknown' else 0),
            "engagement": base + (0.07 if features.get('dialogue_count', 0) > 2 else 0)
        }
        
        return {k: max(0.1, min(1.0, v)) for k, v in scores.items()}
    
    def _generate_fallback_painting_scores(self, features: Dict[str, Any]) -> Dict[str, float]:
        """Generate enhanced fallback scores for paintings"""
        base = self.quality_metrics.calculate_painting_base_score(features)
        
        scores = {
            "composition": base + (0.1 if features.get('composition_mentions', 0) > 0 else 0),
            "color_harmony": base + (0.08 if features.get('color_mentions', 0) > 1 else 0),
            "detail": base + (0.05 if features.get('word_count', 0) > 8 else 0),
            "creativity": base + (0.07 if features.get('has_specific_style', False) else 0),
            "prompt_adherence": base + (0.06 if features.get('complexity_score', 0) > 0.7 else 0)
        }
        
        return {k: max(0.1, min(1.0, v)) for k, v in scores.items()}
    
    def _generate_fallback_music_scores(self, features: Dict[str, Any]) -> Dict[str, float]:
        """Generate enhanced fallback scores for music"""
        base = self.quality_metrics.calculate_music_base_score(features)
        
        scores = {
            "melody": base + (0.1 if features.get('musical_notation_count', 0) > 3 else 0),
            "harmony": base + (0.08 if features.get('has_key_signature', False) else 0),
            "rhythm": base + (0.06 if features.get('has_tempo_marking', False) else 0),
            "creativity": base + (0.05 if features.get('line_count', 0) > 4 else 0),
            "emotional_impact": base + (0.09 if features.get('has_lyrics', False) else 0)
        }
        
        return {k: max(0.1, min(1.0, v)) for k, v in scores.items()}