import asyncio
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.evaluation_task import EvaluationTask, TaskStatus
from app.models.ai_model import AIModel
from app.services.ai_providers.mock_provider import MockProvider
from app.services.ai_providers import TaskType as ProviderTaskType


class EvaluationEngine:
    """Engine for executing AI evaluation tasks"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.provider = MockProvider()  # Use mock provider for now
        
    async def execute_evaluation(self, task_id: str):
        """Execute a single evaluation task with simulated progress stages"""
        try:
            # Get task
            result = await self.db.execute(
                select(EvaluationTask).where(EvaluationTask.id == task_id)
            )
            task = result.scalar_one_or_none()
            
            if not task:
                print(f"Task {task_id} not found")
                return
                
            # Update status to running
            task.status = TaskStatus.RUNNING
            task.started_at = datetime.utcnow()
            await self.db.commit()
            
            # Add realistic delay to simulate processing time
            stage_delays = {
                "poem": [15, 45, 30, 20],      # analyzing, generating, refining, evaluating
                "story": [20, 35, 60, 25],     # analyzing, structuring, writing, evaluating  
                "painting": [18, 40, 80, 22],  # analyzing, composing, rendering, evaluating
                "music": [25, 70, 50, 18]      # analyzing, composing, arranging, evaluating
            }
            
            delays = stage_delays.get(task.task_type, [15, 45, 30, 20])
            
            # Simulate stages with delays (shortened for demo)
            for i, delay in enumerate(delays):
                # Use shorter delays for demo (divide by 3)
                await asyncio.sleep(delay / 3)
                print(f"Task {task_id} - Stage {i+1}/{len(delays)} completed")
            
            # Execute based on task type
            if task.task_type == "poem":
                result = await self._evaluate_poem(task)
            elif task.task_type == "story":
                result = await self._evaluate_story(task)
            elif task.task_type == "painting":
                result = await self._evaluate_painting(task)
            elif task.task_type == "music":
                result = await self._evaluate_music(task)
            else:
                raise ValueError(f"Unknown task type: {task.task_type}")
            
            # Update task with results
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.utcnow()
            task.result = result["content"]
            task.raw_response = result["raw"]
            task.auto_score = result["score"]
            task.evaluation_metrics = result["metrics"]
            task.final_score = result["score"]  # Use auto score as initial final score
            
            await self.db.commit()
            print(f"Task {task_id} completed successfully")
            
        except Exception as e:
            print(f"Error executing task {task_id}: {str(e)}")
            traceback.print_exc()
            
            # Update task with error
            try:
                result = await self.db.execute(
                    select(EvaluationTask).where(EvaluationTask.id == task_id)
                )
                task = result.scalar_one_or_none()
                if task:
                    task.status = TaskStatus.FAILED
                    task.completed_at = datetime.utcnow()
                    task.error_message = str(e)
                    await self.db.commit()
            except:
                pass
    
    async def _evaluate_poem(self, task: EvaluationTask) -> Dict[str, Any]:
        """Evaluate poem generation"""
        # Generate poem
        response = await self.provider.generate_poem(
            prompt=task.prompt,
            **task.parameters
        )
        
        # Calculate scores
        metrics = self._calculate_poem_metrics(response)
        score = sum(metrics.values()) / len(metrics) * 100
        
        return {
            "content": {
                "title": response.title,
                "content": response.content,
                "style": response.style
            },
            "raw": response.model_dump(),
            "score": score,
            "metrics": metrics
        }
    
    async def _evaluate_story(self, task: EvaluationTask) -> Dict[str, Any]:
        """Evaluate story generation"""
        # Generate story
        response = await self.provider.generate_story(
            prompt=task.prompt,
            max_length=task.parameters.get("max_length", 500),
            **task.parameters
        )
        
        # Calculate scores
        metrics = self._calculate_story_metrics(response)
        score = sum(metrics.values()) / len(metrics) * 100
        
        return {
            "content": {
                "title": response.title,
                "content": response.content,
                "genre": response.genre,
                "word_count": response.word_count
            },
            "raw": response.model_dump(),
            "score": score,
            "metrics": metrics
        }
    
    async def _evaluate_painting(self, task: EvaluationTask) -> Dict[str, Any]:
        """Evaluate painting generation"""
        # Generate image
        response = await self.provider.generate_image(
            prompt=task.prompt,
            style=task.parameters.get("style"),
            **task.parameters
        )
        
        # Calculate scores
        metrics = self._calculate_painting_metrics(response)
        score = sum(metrics.values()) / len(metrics) * 100
        
        return {
            "content": {
                "image_url": response.image_url,
                "prompt_used": response.prompt_used
            },
            "raw": response.model_dump(),
            "score": score,
            "metrics": metrics
        }
    
    async def _evaluate_music(self, task: EvaluationTask) -> Dict[str, Any]:
        """Evaluate music generation"""
        # Generate music
        response = await self.provider.generate_music(
            prompt=task.prompt,
            duration=task.parameters.get("duration"),
            **task.parameters
        )
        
        # Calculate scores
        metrics = self._calculate_music_metrics(response)
        score = sum(metrics.values()) / len(metrics) * 100
        
        return {
            "content": {
                "notation": response.notation,
                "lyrics": response.lyrics
            },
            "raw": response.model_dump(),
            "score": score,
            "metrics": metrics
        }
    
    def _calculate_poem_metrics(self, response) -> Dict[str, float]:
        """Calculate evaluation metrics for poem"""
        # Simple mock scoring for now
        metrics = {
            "rhythm": 0.8,
            "imagery": 0.75,
            "emotion": 0.85,
            "creativity": 0.7,
            "cultural_relevance": 0.9
        }
        
        # Adjust based on content
        if response.content and len(response.content) > 50:
            metrics["creativity"] += 0.1
        if response.style:
            metrics["cultural_relevance"] += 0.05
            
        # Normalize to 0-1 range
        for key in metrics:
            metrics[key] = min(1.0, metrics[key])
            
        return metrics
    
    def _calculate_story_metrics(self, response) -> Dict[str, float]:
        """Calculate evaluation metrics for story"""
        metrics = {
            "narrative_structure": 0.75,
            "character_development": 0.7,
            "plot_coherence": 0.8,
            "creativity": 0.65,
            "engagement": 0.8
        }
        
        # Adjust based on content
        if response.word_count > 300:
            metrics["narrative_structure"] += 0.1
        if response.genre:
            metrics["plot_coherence"] += 0.05
            
        # Normalize
        for key in metrics:
            metrics[key] = min(1.0, metrics[key])
            
        return metrics
    
    def _calculate_painting_metrics(self, response) -> Dict[str, float]:
        """Calculate evaluation metrics for painting"""
        metrics = {
            "composition": 0.8,
            "color_harmony": 0.75,
            "detail": 0.7,
            "creativity": 0.85,
            "prompt_adherence": 0.9
        }
        
        # Since we're using mock provider, these are fixed
        # Real implementation would analyze the actual image
        
        return metrics
    
    def _calculate_music_metrics(self, response) -> Dict[str, float]:
        """Calculate evaluation metrics for music"""
        metrics = {
            "melody": 0.75,
            "harmony": 0.7,
            "rhythm": 0.8,
            "creativity": 0.65,
            "emotional_impact": 0.8
        }
        
        # Adjust based on content
        if response.notation:
            metrics["melody"] += 0.1
        if response.lyrics:
            metrics["emotional_impact"] += 0.05
            
        # Normalize
        for key in metrics:
            metrics[key] = min(1.0, metrics[key])
            
        return metrics