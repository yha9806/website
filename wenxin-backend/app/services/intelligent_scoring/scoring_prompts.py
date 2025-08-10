"""
Scoring prompts for different content types
"""

class ScoringPrompts:
    """Centralized prompts for AI content evaluation"""
    
    POEM_EVALUATION = """
Please evaluate this poem on the following dimensions (0-1 scale):

**Poem**: {content}
**Style**: {style}

Rate each dimension from 0.0 to 1.0:

1. **Rhythm** (韵律): Meter, flow, musicality
2. **Imagery** (意境): Vivid descriptions, sensory details  
3. **Emotion** (情感): Emotional depth and resonance
4. **Creativity** (创意): Originality and uniqueness
5. **Cultural Relevance** (文化相关性): Cultural authenticity and appropriateness

Return only a JSON object with the scores:
{{"rhythm": 0.x, "imagery": 0.x, "emotion": 0.x, "creativity": 0.x, "cultural_relevance": 0.x}}
"""

    STORY_EVALUATION = """
Please evaluate this story on the following dimensions (0-1 scale):

**Story**: {content}
**Genre**: {genre}
**Word Count**: {word_count}

Rate each dimension from 0.0 to 1.0:

1. **Narrative Structure** (叙事结构): Plot organization, pacing
2. **Character Development** (人物发展): Character depth and growth
3. **Plot Coherence** (情节连贯性): Logical flow and consistency
4. **Creativity** (创意): Originality of plot and approach
5. **Engagement** (参与度): Reader interest and emotional connection

Return only a JSON object with the scores:
{{"narrative_structure": 0.x, "character_development": 0.x, "plot_coherence": 0.x, "creativity": 0.x, "engagement": 0.x}}
"""

    PAINTING_EVALUATION = """
Please evaluate this painting prompt and generated concept on the following dimensions (0-1 scale):

**Prompt**: {prompt}
**Style**: {style}

Rate each dimension from 0.0 to 1.0:

1. **Composition** (构图): Visual arrangement and balance
2. **Color Harmony** (色彩和谐): Color usage and relationships
3. **Detail** (细节): Level of detail and complexity
4. **Creativity** (创意): Originality and artistic innovation
5. **Prompt Adherence** (提示词匹配度): How well the result matches the prompt

Return only a JSON object with the scores:
{{"composition": 0.x, "color_harmony": 0.x, "detail": 0.x, "creativity": 0.x, "prompt_adherence": 0.x}}
"""

    MUSIC_EVALUATION = """
Please evaluate this music composition on the following dimensions (0-1 scale):

**Composition**: {content}
**Style**: {style}

Rate each dimension from 0.0 to 1.0:

1. **Melody** (旋律): Melodic quality and memorability
2. **Harmony** (和声): Harmonic progression and richness
3. **Rhythm** (节奏): Rhythmic patterns and complexity
4. **Creativity** (创意): Musical innovation and uniqueness
5. **Emotional Impact** (情感影响): Emotional depth and expression

Return only a JSON object with the scores:
{{"melody": 0.x, "harmony": 0.x, "rhythm": 0.x, "creativity": 0.x, "emotional_impact": 0.x}}
"""