"""Lead model for capturing demo requests and sales inquiries."""
from sqlalchemy import Column, String, Text, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base
from app.core.config import settings


class LeadStatus(str, enum.Enum):
    """Lead status in the sales funnel."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    DEMO_SCHEDULED = "demo_scheduled"
    CONVERTED = "converted"
    CLOSED = "closed"


class LeadSource(str, enum.Enum):
    """Source page where lead was captured."""
    BOOK_DEMO = "book_demo"
    PRICING = "pricing"
    PRODUCT = "product"
    SOLUTIONS = "solutions"
    CONTACT = "contact"
    OTHER = "other"


class LeadUseCase(str, enum.Enum):
    """Primary use case selected by the lead."""
    AI_LABS = "ai_labs"
    RESEARCH = "research"
    MUSEUMS = "museums"
    ENTERPRISE = "enterprise"
    OTHER = "other"


class Lead(Base):
    """
    Lead model for capturing demo requests and sales inquiries.

    Fields capture essential information for:
    - Sales follow-up (name, email, organization)
    - Lead qualification (role, use_case, timeline)
    - Context (message, source_page)
    """
    __tablename__ = "leads"

    # Use String for SQLite, UUID for PostgreSQL
    if settings.DATABASE_URL.startswith("sqlite"):
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Contact Information
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    organization = Column(String(200), nullable=True)
    role = Column(String(100), nullable=True)  # e.g., "Research Scientist", "Product Manager"

    # Lead Qualification
    use_case = Column(Enum(LeadUseCase), default=LeadUseCase.OTHER)
    timeline = Column(String(50), nullable=True)  # e.g., "Immediate", "1-3 months", "Exploring"
    message = Column(Text, nullable=True)  # Additional context from the lead

    # Tracking
    source_page = Column(Enum(LeadSource), default=LeadSource.BOOK_DEMO)
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, index=True)

    # Metadata
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    referrer = Column(String(500), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    contacted_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Lead {self.email} - {self.status.value}>"
