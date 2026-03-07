"""Community agents for the VULCA platform.

Provides three autonomous agents:
  - CuratorAgent    -- curates featured skills based on quality criteria
  - DiscussantAgent -- posts template-driven discussion comments
  - SkillCreatorAgent -- detects feedback patterns and auto-creates skills
"""

from app.prototype.community.curator_agent import CuratorAgent
from app.prototype.community.discussant_agent import DiscussantAgent
from app.prototype.community.skill_creator_agent import SkillCreatorAgent

__all__ = [
    "CuratorAgent",
    "DiscussantAgent",
    "SkillCreatorAgent",
]
