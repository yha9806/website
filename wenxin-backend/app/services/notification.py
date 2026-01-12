"""
Lead notification service for internal team alerts.

Supports:
- Discord webhooks
- Slack webhooks
- Email notifications (future)
"""
import httpx
import logging
from datetime import datetime
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class LeadNotificationService:
    """Service to send internal notifications when new leads are captured."""

    def __init__(self):
        self.webhook_url = settings.LEAD_NOTIFICATION_WEBHOOK_URL
        self.notification_email = settings.LEAD_NOTIFICATION_EMAIL
        self.enabled = settings.ENABLE_LEAD_NOTIFICATIONS

    async def notify_new_lead(
        self,
        lead_id: str,
        name: str,
        email: str,
        organization: Optional[str] = None,
        role: Optional[str] = None,
        use_case: str = "other",
        timeline: Optional[str] = None,
        message: Optional[str] = None,
        source_page: str = "book_demo"
    ) -> bool:
        """
        Send notification about a new lead submission.

        Returns True if notification was sent successfully, False otherwise.
        Failures are logged but do not raise exceptions to avoid blocking lead submission.
        """
        if not self.enabled:
            logger.debug("Lead notifications are disabled")
            return False

        # Try webhook notification first
        if self.webhook_url:
            return await self._send_webhook_notification(
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

        # Log if no notification channel configured
        logger.warning("No notification channel configured (webhook or email)")
        return False

    async def _send_webhook_notification(
        self,
        lead_id: str,
        name: str,
        email: str,
        organization: Optional[str],
        role: Optional[str],
        use_case: str,
        timeline: Optional[str],
        message: Optional[str],
        source_page: str
    ) -> bool:
        """Send notification via Discord/Slack webhook."""
        try:
            # Format use case for display
            use_case_display = {
                "ai_labs": "AI Labs",
                "research": "Research",
                "museums": "Museums",
                "enterprise": "Enterprise",
                "other": "Other"
            }.get(use_case, use_case)

            # Format source page for display
            source_display = {
                "book_demo": "Book Demo",
                "pricing": "Pricing",
                "product": "Product",
                "solutions": "Solutions",
                "contact": "Contact",
                "other": "Other"
            }.get(source_page, source_page)

            # Build message content
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

            # Determine if it's Discord or Slack based on URL pattern
            is_discord = "discord" in self.webhook_url.lower()

            if is_discord:
                # Discord webhook format
                payload = self._build_discord_payload(
                    lead_id=lead_id,
                    name=name,
                    email=email,
                    organization=organization,
                    role=role,
                    use_case_display=use_case_display,
                    timeline=timeline,
                    message=message,
                    source_display=source_display,
                    timestamp=timestamp
                )
            else:
                # Slack webhook format (also works for generic webhooks)
                payload = self._build_slack_payload(
                    lead_id=lead_id,
                    name=name,
                    email=email,
                    organization=organization,
                    role=role,
                    use_case_display=use_case_display,
                    timeline=timeline,
                    message=message,
                    source_display=source_display,
                    timestamp=timestamp
                )

            # Send webhook request
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )

                if response.status_code in (200, 201, 204):
                    logger.info(f"Lead notification sent successfully for lead {lead_id}")
                    return True
                else:
                    logger.error(
                        f"Webhook returned status {response.status_code}: {response.text}"
                    )
                    return False

        except httpx.TimeoutException:
            logger.error("Webhook notification timed out")
            return False
        except Exception as e:
            logger.error(f"Failed to send webhook notification: {e}")
            return False

    def _build_discord_payload(
        self,
        lead_id: str,
        name: str,
        email: str,
        organization: Optional[str],
        role: Optional[str],
        use_case_display: str,
        timeline: Optional[str],
        message: Optional[str],
        source_display: str,
        timestamp: str
    ) -> dict:
        """Build Discord webhook payload with rich embed."""
        # Build fields list
        fields = [
            {"name": "Name", "value": name, "inline": True},
            {"name": "Email", "value": email, "inline": True},
            {"name": "Use Case", "value": use_case_display, "inline": True},
        ]

        if organization:
            fields.append({"name": "Organization", "value": organization, "inline": True})

        if role:
            fields.append({"name": "Role", "value": role, "inline": True})

        if timeline:
            timeline_display = {
                "immediate": "Immediate (This month)",
                "1-3_months": "1-3 months",
                "3-6_months": "3-6 months",
                "exploring": "Just exploring"
            }.get(timeline, timeline)
            fields.append({"name": "Timeline", "value": timeline_display, "inline": True})

        fields.append({"name": "Source", "value": source_display, "inline": True})

        if message:
            # Truncate long messages
            truncated_msg = message[:500] + "..." if len(message) > 500 else message
            fields.append({"name": "Message", "value": truncated_msg, "inline": False})

        return {
            "embeds": [{
                "title": "New Lead Submission",
                "description": f"A new demo request has been submitted via VULCA.",
                "color": 3447003,  # Blue color
                "fields": fields,
                "footer": {
                    "text": f"Lead ID: {lead_id} | {timestamp}"
                }
            }]
        }

    def _build_slack_payload(
        self,
        lead_id: str,
        name: str,
        email: str,
        organization: Optional[str],
        role: Optional[str],
        use_case_display: str,
        timeline: Optional[str],
        message: Optional[str],
        source_display: str,
        timestamp: str
    ) -> dict:
        """Build Slack webhook payload with blocks."""
        # Build info lines
        info_lines = [
            f"*Name:* {name}",
            f"*Email:* {email}",
            f"*Use Case:* {use_case_display}",
        ]

        if organization:
            info_lines.append(f"*Organization:* {organization}")

        if role:
            info_lines.append(f"*Role:* {role}")

        if timeline:
            timeline_display = {
                "immediate": "Immediate (This month)",
                "1-3_months": "1-3 months",
                "3-6_months": "3-6 months",
                "exploring": "Just exploring"
            }.get(timeline, timeline)
            info_lines.append(f"*Timeline:* {timeline_display}")

        info_lines.append(f"*Source:* {source_display}")

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "New Lead Submission",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "\n".join(info_lines)
                }
            }
        ]

        if message:
            truncated_msg = message[:500] + "..." if len(message) > 500 else message
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Message:*\n{truncated_msg}"
                }
            })

        blocks.append({
            "type": "context",
            "elements": [{
                "type": "mrkdwn",
                "text": f"Lead ID: `{lead_id}` | {timestamp}"
            }]
        })

        return {
            "text": f"New lead from {name} ({email})",  # Fallback text
            "blocks": blocks
        }


# Singleton instance
notification_service = LeadNotificationService()
