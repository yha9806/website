"""Pydantic schemas for Lead API."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class LeadStatusEnum(str, Enum):
    """Lead status in the sales funnel."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    DEMO_SCHEDULED = "demo_scheduled"
    CONVERTED = "converted"
    CLOSED = "closed"


class LeadSourceEnum(str, Enum):
    """Source page where lead was captured."""
    BOOK_DEMO = "book_demo"
    PRICING = "pricing"
    PRODUCT = "product"
    SOLUTIONS = "solutions"
    CONTACT = "contact"
    OTHER = "other"


class LeadUseCaseEnum(str, Enum):
    """Primary use case selected by the lead."""
    AI_LABS = "ai_labs"
    RESEARCH = "research"
    MUSEUMS = "museums"
    ENTERPRISE = "enterprise"
    OTHER = "other"


class LeadCreate(BaseModel):
    """Schema for creating a new lead (public API)."""
    name: str = Field(..., min_length=1, max_length=100, description="Contact name")
    email: EmailStr = Field(..., description="Contact email")
    organization: Optional[str] = Field(None, max_length=200, description="Organization name")
    role: Optional[str] = Field(None, max_length=100, description="Job role/title")
    use_case: LeadUseCaseEnum = Field(LeadUseCaseEnum.OTHER, description="Primary use case")
    timeline: Optional[str] = Field(None, max_length=50, description="Evaluation timeline")
    message: Optional[str] = Field(None, max_length=2000, description="Additional message")
    source_page: LeadSourceEnum = Field(LeadSourceEnum.BOOK_DEMO, description="Source page")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Dr. Jane Smith",
                "email": "jane.smith@university.edu",
                "organization": "Stanford University",
                "role": "Research Scientist",
                "use_case": "research",
                "timeline": "1-3 months",
                "message": "Interested in evaluating LLMs for cultural understanding research.",
                "source_page": "book_demo"
            }
        }


class LeadResponse(BaseModel):
    """Schema for lead response (includes ID and timestamps)."""
    id: str
    name: str
    email: str
    organization: Optional[str] = None
    role: Optional[str] = None
    use_case: LeadUseCaseEnum
    timeline: Optional[str] = None
    message: Optional[str] = None
    source_page: LeadSourceEnum
    status: LeadStatusEnum
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadSubmitResponse(BaseModel):
    """Response after successful lead submission."""
    success: bool = True
    message: str = "Thank you for your interest! We'll be in touch within 24 hours."
    lead_id: str

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Thank you for your interest! We'll be in touch within 24 hours.",
                "lead_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class LeadUpdate(BaseModel):
    """Schema for updating lead status (admin API)."""
    status: Optional[LeadStatusEnum] = None
    contacted_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "status": "contacted",
                "contacted_at": "2025-01-12T10:30:00Z"
            }
        }


class LeadListResponse(BaseModel):
    """Schema for paginated lead list (admin API)."""
    leads: list[LeadResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
