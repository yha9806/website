"""Skill executors for non-cultural evaluation dimensions."""

from app.prototype.skills.executors.base import BaseSkillExecutor
from app.prototype.skills.executors.brand_executor import BrandExecutor
from app.prototype.skills.executors.audience_executor import AudienceExecutor
from app.prototype.skills.executors.trend_executor import TrendExecutor

__all__ = [
    "BaseSkillExecutor",
    "BrandExecutor",
    "AudienceExecutor",
    "TrendExecutor",
]
