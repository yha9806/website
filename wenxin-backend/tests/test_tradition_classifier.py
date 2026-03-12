"""Tests for the tradition classifier — heuristic-based cultural tradition detection.

Validates both the classify_tradition() function directly and the
GET /api/v1/prototype/classify-tradition endpoint.
"""

from __future__ import annotations

import pytest

from app.prototype.cultural_pipelines.tradition_classifier import (
    TraditionClassification,
    classify_tradition,
)


# ---------------------------------------------------------------------------
# Direct function tests
# ---------------------------------------------------------------------------


class TestClassifyTradition:
    """Test the classify_tradition() function."""

    # ── Tier 1: keyword matches (high confidence, instant) ──

    def test_keyword_japanese(self):
        result = classify_tradition("a zen garden painting")
        assert result.tradition == "japanese_wabi_sabi"
        assert result.method == "keyword"
        assert result.confidence >= 0.90

    def test_keyword_chinese(self):
        result = classify_tradition("chinese ink wash landscape")
        assert result.tradition == "chinese_xieyi"
        assert result.method == "keyword"
        assert result.confidence >= 0.90

    def test_keyword_persian(self):
        result = classify_tradition("islamic geometric tiles")
        assert result.tradition == "persian_miniature"
        assert result.method == "keyword"

    def test_keyword_african(self):
        result = classify_tradition("african tribal mask")
        assert result.tradition == "african_ubuntu"
        assert result.method == "keyword"

    def test_keyword_western(self):
        result = classify_tradition("oil portrait of a duke")
        assert result.tradition == "western_classical"
        assert result.method == "keyword"

    def test_keyword_korean(self):
        result = classify_tradition("joseon dynasty court painting")
        assert result.tradition == "korean_minhwa"
        assert result.method == "keyword"

    def test_keyword_aboriginal(self):
        result = classify_tradition("dreamtime serpent story")
        assert result.tradition == "aboriginal_dreamtime"
        assert result.method == "keyword"

    # ── Tier 2: heuristic matches (nuanced inputs without obvious keywords) ──

    def test_heuristic_cherry_blossom(self):
        """Cherry blossoms in spring rain -> japanese_wabi_sabi (no explicit 'japanese' keyword)."""
        result = classify_tradition("a painting of cherry blossoms in spring rain")
        assert result.tradition == "japanese_wabi_sabi"
        assert result.method == "heuristic"
        assert result.confidence > 0.3

    def test_heuristic_dong_yuan_hemp_fiber(self):
        """Dong Yuan hemp-fiber texture strokes -> chinese_xieyi."""
        result = classify_tradition("Dong Yuan hemp-fiber texture strokes")
        assert result.tradition == "chinese_xieyi"
        assert result.method == "heuristic"
        assert result.confidence > 0.3

    def test_heuristic_geometric_arabesque(self):
        """Geometric arabesque patterns -> persian_miniature.

        'arabesque' is a Tier-1 keyword, so this may match via keyword or heuristic.
        """
        result = classify_tradition("geometric arabesque patterns")
        assert result.tradition == "persian_miniature"
        assert result.method in ("keyword", "heuristic")
        assert result.confidence > 0.3

    def test_heuristic_abstract_oil(self):
        """Abstract oil painting -> western_classical.

        'oil' is a Tier-1 keyword, so this may match via keyword or heuristic.
        """
        result = classify_tradition("abstract oil painting")
        assert result.tradition == "western_classical"
        assert result.method in ("keyword", "heuristic")
        assert result.confidence > 0.2

    def test_heuristic_ubuntu_communal_mask(self):
        """Ubuntu spirit communal mask -> african_ubuntu."""
        result = classify_tradition("ubuntu spirit communal mask")
        assert result.tradition == "african_ubuntu"
        # ubuntu is a keyword match
        assert result.confidence > 0.5

    def test_heuristic_sumi_e_technique(self):
        """Sumi-e brush technique -> japanese_wabi_sabi."""
        result = classify_tradition("sumi-e brush technique on washi paper")
        assert result.tradition == "japanese_wabi_sabi"
        assert result.confidence > 0.3

    def test_heuristic_chiaroscuro(self):
        """Chiaroscuro lighting in a portrait -> western_classical."""
        result = classify_tradition("dramatic chiaroscuro lighting in a portrait")
        assert result.tradition == "western_classical"
        assert result.method == "heuristic"
        assert result.confidence > 0.3

    def test_heuristic_kente_cloth(self):
        """Kente cloth pattern -> african_ubuntu."""
        result = classify_tradition("kente cloth weaving pattern with golden thread")
        assert result.tradition == "african_ubuntu"
        assert result.method == "heuristic"
        assert result.confidence > 0.3

    def test_heuristic_mughal_court(self):
        """Mughal court scene -> indian_miniature (via keyword match)."""
        result = classify_tradition("a court scene from the Mughal era")
        assert result.tradition == "indian_miniature"

    def test_heuristic_monet_impressionist(self):
        """Monet-style water lilies -> western_classical."""
        result = classify_tradition("Monet-style water lilies at sunset")
        assert result.tradition == "western_classical"
        assert result.confidence > 0.3

    def test_heuristic_shan_shui_landscape(self):
        """Shan shui mountain landscape -> chinese_xieyi."""
        result = classify_tradition("shan shui mountain and water landscape")
        assert result.tradition == "chinese_xieyi"
        assert result.method == "heuristic"
        assert result.confidence > 0.3

    def test_heuristic_isfahan_tilework(self):
        """Isfahan mosque tilework -> persian_miniature."""
        result = classify_tradition("Isfahan mosque with turquoise tilework")
        assert result.tradition == "persian_miniature"
        assert result.method == "heuristic"
        assert result.confidence > 0.3

    def test_heuristic_dot_painting(self):
        """Dot painting of the desert -> aboriginal_dreamtime."""
        result = classify_tradition("dot painting of the desert landscape")
        assert result.tradition == "aboriginal_dreamtime"
        assert result.method == "heuristic"
        assert result.confidence > 0.3

    def test_heuristic_madhubani(self):
        """Madhubani art with natural dyes -> indian_miniature."""
        result = classify_tradition("Madhubani art painted with natural dyes")
        assert result.tradition == "indian_miniature"
        assert result.method == "heuristic"
        assert result.confidence > 0.3

    def test_heuristic_celadon_pottery(self):
        """Celadon pottery glaze -> korean_minhwa."""
        result = classify_tradition("celadon pottery with crane motif")
        assert result.tradition == "korean_minhwa"
        assert result.method == "heuristic"
        assert result.confidence > 0.2

    # ── Edge cases ──

    def test_empty_string(self):
        result = classify_tradition("")
        assert result.tradition == "chinese_xieyi"
        assert result.method == "default"
        assert result.confidence == 0.0

    def test_whitespace_only(self):
        result = classify_tradition("   ")
        assert result.tradition == "chinese_xieyi"
        assert result.method == "default"

    def test_generic_no_cultural_signals(self):
        """A generic subject with no cultural signals should return default."""
        result = classify_tradition("a picture of a cat sitting on a table")
        assert result.tradition == "chinese_xieyi"
        assert result.method == "default"
        assert result.confidence == 0.0

    def test_runner_up_populated(self):
        """When multiple traditions match, runner_up should be populated."""
        # Bamboo is shared between Japanese and Chinese
        result = classify_tradition("bamboo grove with lotus flowers in mist")
        assert result.runner_up is not None
        assert result.runner_up_confidence > 0.0

    def test_case_insensitive(self):
        """Classification should be case-insensitive."""
        result = classify_tradition("CHERRY BLOSSOM IN SPRING RAIN")
        assert result.tradition == "japanese_wabi_sabi"

    def test_return_type(self):
        """Verify the return is a TraditionClassification dataclass."""
        result = classify_tradition("anything")
        assert isinstance(result, TraditionClassification)
        assert isinstance(result.tradition, str)
        assert isinstance(result.confidence, (int, float))
        assert isinstance(result.method, str)


# ---------------------------------------------------------------------------
# API endpoint tests (if httpx / TestClient available)
# ---------------------------------------------------------------------------


@pytest.fixture
def client():
    """Create a FastAPI TestClient for the prototype router."""
    try:
        from fastapi import FastAPI
        from starlette.testclient import TestClient

        from app.prototype.api.routes import router

        app = FastAPI()
        app.include_router(router)
        return TestClient(app)
    except ImportError:
        pytest.skip("starlette TestClient not available")


class TestClassifyTraditionEndpoint:
    """Test the GET /api/v1/prototype/classify-tradition endpoint."""

    def test_endpoint_cherry_blossom(self, client):
        resp = client.get(
            "/api/v1/prototype/classify-tradition",
            params={"subject": "cherry blossoms in spring rain"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["tradition"] == "japanese_wabi_sabi"
        assert data["confidence"] > 0.3
        assert data["method"] == "heuristic"

    def test_endpoint_keyword_match(self, client):
        resp = client.get(
            "/api/v1/prototype/classify-tradition",
            params={"subject": "zen garden meditation"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["tradition"] == "japanese_wabi_sabi"
        assert data["method"] == "keyword"
        assert data["confidence"] >= 0.90

    def test_endpoint_missing_subject(self, client):
        resp = client.get("/api/v1/prototype/classify-tradition")
        assert resp.status_code == 422  # validation error

    def test_endpoint_empty_subject(self, client):
        resp = client.get(
            "/api/v1/prototype/classify-tradition",
            params={"subject": ""},
        )
        # min_length=1 validation should reject empty string
        assert resp.status_code == 422

    def test_endpoint_response_fields(self, client):
        resp = client.get(
            "/api/v1/prototype/classify-tradition",
            params={"subject": "geometric arabesque patterns on mosque walls"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "tradition" in data
        assert "confidence" in data
        assert "method" in data
        # With multiple matches, runner_up might be present
        assert isinstance(data["confidence"], (int, float))

    def test_endpoint_dong_yuan(self, client):
        resp = client.get(
            "/api/v1/prototype/classify-tradition",
            params={"subject": "Dong Yuan hemp-fiber texture strokes"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["tradition"] == "chinese_xieyi"

    def test_endpoint_abstract_oil(self, client):
        resp = client.get(
            "/api/v1/prototype/classify-tradition",
            params={"subject": "abstract oil painting"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["tradition"] == "western_classical"

    def test_endpoint_ubuntu_communal_mask(self, client):
        resp = client.get(
            "/api/v1/prototype/classify-tradition",
            params={"subject": "ubuntu spirit communal mask"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["tradition"] == "african_ubuntu"
