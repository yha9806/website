"""
Test if IntelligentScorer is using AI or fallback
"""
import asyncio
from app.services.intelligent_scoring.ai_scorer import IntelligentScorer

async def test_scorer():
    scorer = IntelligentScorer()
    
    print(f"Scorer initialized")
    print(f"Use AI: {scorer.use_ai}")
    print(f"OpenAI client: {scorer.openai_client}")
    
    # Test scoring
    score = await scorer.score(
        prompt="Write a poem about spring",
        response="Cherry blossoms bloom,\nGentle breeze carries petals,\nSpring awakens earth.",
        criteria=["rhythm", "imagery", "emotion"],
        scoring_prompt="Rate this haiku from 0-100"
    )
    
    print(f"Score: {score}")
    
    # Test analysis
    analysis = await scorer.analyze_response(
        response="Cherry blossoms bloom,\nGentle breeze carries petals,\nSpring awakens earth.",
        criteria=["rhythm", "imagery", "emotion"]
    )
    
    print(f"Analysis: {analysis}")

if __name__ == "__main__":
    asyncio.run(test_scorer())