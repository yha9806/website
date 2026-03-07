"""VULCA API client stub for community agents.

If WU-12 delivers the canonical VulcaAPIClient, replace this stub with an
import from the shared location.
"""

from dataclasses import dataclass, field
from typing import Any

import httpx


@dataclass
class VulcaAPIClient:
    """Lightweight async HTTP client for the VULCA backend API."""

    base_url: str = "http://localhost:8001"
    api_key: str = ""
    _client: httpx.AsyncClient = field(default=None, init=False, repr=False)  # type: ignore[assignment]

    def _ensure_client(self) -> httpx.AsyncClient:
        if self._client is None:
            headers: dict[str, str] = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=30.0,
            )
        return self._client

    async def evaluate(
        self,
        image_url: str,
        intent: str = "",
        tradition: str = "default",
    ) -> dict[str, Any]:
        client = self._ensure_client()
        resp = await client.post(
            "/api/v1/evaluate",
            json={"image_url": image_url, "intent": intent, "tradition": tradition},
        )
        resp.raise_for_status()
        return resp.json()

    async def submit_feedback(
        self,
        evaluation_id: str,
        rating: float,
        comment: str = "",
        feedback_type: str = "implicit",
    ) -> dict[str, Any]:
        client = self._ensure_client()
        resp = await client.post(
            "/api/v1/feedback",
            json={
                "evaluation_id": evaluation_id,
                "rating": rating,
                "comment": comment,
                "feedback_type": feedback_type,
            },
        )
        resp.raise_for_status()
        return resp.json()

    async def get_skills(self) -> list[dict[str, Any]]:
        """GET /api/v1/skills -- list all community skills."""
        client = self._ensure_client()
        resp = await client.get("/api/v1/skills")
        resp.raise_for_status()
        return resp.json()

    async def get_skill(self, skill_id: str) -> dict[str, Any]:
        """GET /api/v1/skills/{id}."""
        client = self._ensure_client()
        resp = await client.get(f"/api/v1/skills/{skill_id}")
        resp.raise_for_status()
        return resp.json()

    async def create_skill(self, payload: dict[str, Any]) -> dict[str, Any]:
        """POST /api/v1/skills -- create a new skill."""
        client = self._ensure_client()
        resp = await client.post("/api/v1/skills", json=payload)
        resp.raise_for_status()
        return resp.json()

    async def post_discussion(
        self, skill_id: str, comment: str
    ) -> dict[str, Any]:
        """POST /api/v1/skills/{id}/discussions."""
        client = self._ensure_client()
        resp = await client.post(
            f"/api/v1/skills/{skill_id}/discussions",
            json={"comment": comment},
        )
        resp.raise_for_status()
        return resp.json()

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None
