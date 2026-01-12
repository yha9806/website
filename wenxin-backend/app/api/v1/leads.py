"""Lead capture API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Request, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import math
import logging

from app.core.database import get_db
from app.core.auth import get_current_superuser
from app.models.lead import Lead, LeadStatus, LeadSource, LeadUseCase
from app.schemas.lead import (
    LeadCreate,
    LeadResponse,
    LeadSubmitResponse,
    LeadUpdate,
    LeadListResponse,
    LeadStatusEnum,
    LeadSourceEnum
)
from app.services.notification import notification_service
from app.services.email import email_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=LeadSubmitResponse, status_code=201)
async def submit_lead(
    lead_data: LeadCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a new lead (public endpoint).

    Captures demo requests and sales inquiries from the website.
    No authentication required.
    """
    # Extract request metadata
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")[:500]  # Truncate if too long
    referrer = request.headers.get("referer", "")[:500]

    # Map enum values
    use_case_map = {
        "ai_labs": LeadUseCase.AI_LABS,
        "research": LeadUseCase.RESEARCH,
        "museums": LeadUseCase.MUSEUMS,
        "enterprise": LeadUseCase.ENTERPRISE,
        "other": LeadUseCase.OTHER
    }

    source_map = {
        "book_demo": LeadSource.BOOK_DEMO,
        "pricing": LeadSource.PRICING,
        "product": LeadSource.PRODUCT,
        "solutions": LeadSource.SOLUTIONS,
        "contact": LeadSource.CONTACT,
        "other": LeadSource.OTHER
    }

    # Create lead record
    lead = Lead(
        name=lead_data.name,
        email=lead_data.email,
        organization=lead_data.organization,
        role=lead_data.role,
        use_case=use_case_map.get(lead_data.use_case.value, LeadUseCase.OTHER),
        timeline=lead_data.timeline,
        message=lead_data.message,
        source_page=source_map.get(lead_data.source_page.value, LeadSource.BOOK_DEMO),
        status=LeadStatus.NEW,
        ip_address=ip_address,
        user_agent=user_agent,
        referrer=referrer
    )

    db.add(lead)
    await db.flush()
    await db.refresh(lead)

    # Get lead ID as string
    lead_id = str(lead.id)

    # Send internal notification in background (non-blocking)
    background_tasks.add_task(
        _send_lead_notification,
        lead_id=lead_id,
        name=lead_data.name,
        email=lead_data.email,
        organization=lead_data.organization,
        role=lead_data.role,
        use_case=lead_data.use_case.value,
        timeline=lead_data.timeline,
        message=lead_data.message,
        source_page=lead_data.source_page.value
    )

    return LeadSubmitResponse(
        success=True,
        message="Thank you for your interest! We'll be in touch within 24 hours.",
        lead_id=lead_id
    )


async def _send_lead_notification(
    lead_id: str,
    name: str,
    email: str,
    organization: Optional[str],
    role: Optional[str],
    use_case: str,
    timeline: Optional[str],
    message: Optional[str],
    source_page: str
):
    """Background task to send lead notification and confirmation email."""
    # Send internal team notification
    try:
        await notification_service.notify_new_lead(
            lead_id=lead_id,
            name=name,
            email=email,
            organization=organization,
            role=role,
            use_case=use_case,
            timeline=timeline,
            message=message,
            source_page=source_page
        )
    except Exception as e:
        # Log error but don't fail - notification is best-effort
        logger.error(f"Failed to send internal notification for lead {lead_id}: {e}")

    # Send confirmation email to the lead
    try:
        await email_service.send_lead_confirmation(
            to_email=email,
            name=name,
            use_case=use_case,
            lead_id=lead_id
        )
    except Exception as e:
        # Log error but don't fail - email is best-effort
        logger.error(f"Failed to send confirmation email for lead {lead_id}: {e}")


@router.get("/", response_model=LeadListResponse)
async def list_leads(
    status: Optional[LeadStatusEnum] = Query(None, description="Filter by status"),
    source: Optional[LeadSourceEnum] = Query(None, description="Filter by source"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_superuser)
):
    """
    List all leads (admin only).

    Supports filtering by status and source, with pagination.
    """
    # Build query
    query = select(Lead)
    count_query = select(func.count(Lead.id))

    # Apply filters
    if status:
        status_map = {
            "new": LeadStatus.NEW,
            "contacted": LeadStatus.CONTACTED,
            "qualified": LeadStatus.QUALIFIED,
            "demo_scheduled": LeadStatus.DEMO_SCHEDULED,
            "converted": LeadStatus.CONVERTED,
            "closed": LeadStatus.CLOSED
        }
        if status.value in status_map:
            query = query.where(Lead.status == status_map[status.value])
            count_query = count_query.where(Lead.status == status_map[status.value])

    if source:
        source_map = {
            "book_demo": LeadSource.BOOK_DEMO,
            "pricing": LeadSource.PRICING,
            "product": LeadSource.PRODUCT,
            "solutions": LeadSource.SOLUTIONS,
            "contact": LeadSource.CONTACT,
            "other": LeadSource.OTHER
        }
        if source.value in source_map:
            query = query.where(Lead.source_page == source_map[source.value])
            count_query = count_query.where(Lead.source_page == source_map[source.value])

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    # Apply pagination and ordering
    query = query.order_by(Lead.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    # Execute query
    result = await db.execute(query)
    leads = result.scalars().all()

    return LeadListResponse(
        leads=[_lead_to_response(lead) for lead in leads],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_superuser)
):
    """
    Get a specific lead by ID (admin only).
    """
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    return _lead_to_response(lead)


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_superuser)
):
    """
    Update lead status (admin only).
    """
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Update fields
    if lead_update.status:
        status_map = {
            "new": LeadStatus.NEW,
            "contacted": LeadStatus.CONTACTED,
            "qualified": LeadStatus.QUALIFIED,
            "demo_scheduled": LeadStatus.DEMO_SCHEDULED,
            "converted": LeadStatus.CONVERTED,
            "closed": LeadStatus.CLOSED
        }
        if lead_update.status.value in status_map:
            lead.status = status_map[lead_update.status.value]

    if lead_update.contacted_at:
        lead.contacted_at = lead_update.contacted_at

    await db.flush()
    await db.refresh(lead)

    return _lead_to_response(lead)


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_superuser)
):
    """
    Delete a lead (admin only).
    """
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    await db.delete(lead)
    return None


def _lead_to_response(lead: Lead) -> LeadResponse:
    """Convert Lead model to LeadResponse schema."""
    return LeadResponse(
        id=str(lead.id),
        name=lead.name,
        email=lead.email,
        organization=lead.organization,
        role=lead.role,
        use_case=lead.use_case.value if lead.use_case else "other",
        timeline=lead.timeline,
        message=lead.message,
        source_page=lead.source_page.value if lead.source_page else "book_demo",
        status=lead.status.value if lead.status else "new",
        created_at=lead.created_at,
        updated_at=lead.updated_at
    )
