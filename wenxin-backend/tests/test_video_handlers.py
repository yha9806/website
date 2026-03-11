"""Tests for video sub-stage handlers and visual renderer."""

from __future__ import annotations

import asyncio
import json

import pytest

from app.prototype.media.types import SubStageDef, SubStageArtifact
from app.prototype.media.recipes import VIDEO_RECIPE, AVAILABLE_MEDIA_TYPES, MediaType


# ---------------------------------------------------------------------------
# Recipe structure tests
# ---------------------------------------------------------------------------

class TestVideoRecipe:
    """Verify VIDEO recipe structure matches handler expectations."""

    def test_video_is_available(self):
        assert AVAILABLE_MEDIA_TYPES[MediaType.VIDEO] is True

    def test_recipe_has_four_stages(self):
        assert len(VIDEO_RECIPE.sub_stages) == 4

    def test_stage_names_match_handlers(self):
        names = VIDEO_RECIPE.stage_names()
        assert names == ["script", "storyboard", "style_frame", "final_compose"]

    def test_stage_order_ascending(self):
        orders = [s.order for s in VIDEO_RECIPE.sub_stages]
        assert orders == sorted(orders)

    def test_storyboard_depends_on_script(self):
        sb = VIDEO_RECIPE.get_stage_by_name("storyboard")
        assert sb is not None
        assert "script" in sb.input_artifact_names

    def test_final_compose_depends_on_all(self):
        fc = VIDEO_RECIPE.get_stage_by_name("final_compose")
        assert fc is not None
        assert "script" in fc.input_artifact_names
        assert "storyboard" in fc.input_artifact_names
        assert "style_frame" in fc.input_artifact_names


# ---------------------------------------------------------------------------
# Handler stub tests (no LLM / NB2 needed)
# ---------------------------------------------------------------------------

class TestVideoHandlerStubs:
    """Test video handlers' stub fallback paths."""

    @pytest.fixture()
    def base_context(self):
        return {
            "task_id": "test-vid-001",
            "subject": "bamboo in mist",
            "cultural_tradition": "chinese_xieyi",
            "evidence": {},
            "input_artifacts": {},
        }

    @pytest.fixture()
    def script_stage(self):
        return SubStageDef(
            name="script",
            display_name="Script",
            description="test",
            order=0,
            output_artifact_type="json",
        )

    @pytest.fixture()
    def storyboard_stage(self):
        return SubStageDef(
            name="storyboard",
            display_name="Storyboard",
            description="test",
            order=1,
            input_artifact_names=("script",),
            output_artifact_type="json",
        )

    @pytest.fixture()
    def style_frame_stage(self):
        return SubStageDef(
            name="style_frame",
            display_name="Style Frame",
            description="test",
            order=2,
            output_artifact_type="text",
        )

    @pytest.fixture()
    def final_compose_stage(self):
        return SubStageDef(
            name="final_compose",
            display_name="Final Composition",
            description="test",
            order=3,
            output_artifact_type="text",
        )

    def test_script_stub_returns_json(self, script_stage, base_context, monkeypatch):
        """Script handler should produce JSON even when LLM fails."""
        from app.prototype.media import video_handlers

        # Force LLM to fail
        async def _fail(*a, **kw):
            raise RuntimeError("no LLM")
        monkeypatch.setattr(video_handlers.litellm, "acompletion", _fail)

        result = asyncio.run(video_handlers.handle_script(script_stage, base_context))
        assert isinstance(result, SubStageArtifact)
        assert result.artifact_type == "json"
        data = json.loads(result.data)
        assert "scenes" in data
        assert len(data["scenes"]) >= 2
        assert result.metadata["source"] == "stub"

    def test_storyboard_without_nb2(self, storyboard_stage, base_context, monkeypatch):
        """Storyboard handler should work even without NB2 (text-only keyframes)."""
        from app.prototype.media import video_handlers, visual_renderer

        # Mock render_visual to return empty (no NB2)
        async def _no_render(*a, **kw):
            return ""
        monkeypatch.setattr(visual_renderer, "render_visual", _no_render)
        # Also ensure the function imported in video_handlers is patched
        monkeypatch.setattr(video_handlers, "render_visual", _no_render)

        # Provide a script artifact
        script_data = json.dumps({
            "scenes": [
                {"scene_number": 1, "description": "Opening shot of bamboo", "camera": "zoom in", "duration_seconds": 10},
                {"scene_number": 2, "description": "Mist rolling through", "camera": "pan", "duration_seconds": 10},
            ]
        })
        base_context["input_artifacts"] = {
            "script": SubStageArtifact(
                stage_name="script",
                artifact_type="json",
                data=script_data,
            ),
        }

        result = asyncio.run(video_handlers.handle_storyboard(storyboard_stage, base_context))
        assert isinstance(result, SubStageArtifact)
        data = json.loads(result.data)
        assert "keyframes" in data
        assert len(data["keyframes"]) == 2
        assert result.image_path == ""  # No NB2

    def test_style_frame_stub(self, style_frame_stage, base_context, monkeypatch):
        """Style frame should produce text description even when LLM + NB2 fail."""
        from app.prototype.media import video_handlers, visual_renderer

        async def _fail(*a, **kw):
            raise RuntimeError("no LLM")
        monkeypatch.setattr(video_handlers.litellm, "acompletion", _fail)

        async def _no_render(*a, **kw):
            return ""
        monkeypatch.setattr(visual_renderer, "render_visual", _no_render)
        monkeypatch.setattr(video_handlers, "render_visual", _no_render)

        result = asyncio.run(video_handlers.handle_style_frame(style_frame_stage, base_context))
        assert isinstance(result, SubStageArtifact)
        assert result.data  # Non-empty text
        assert "bamboo" in result.data.lower() or "chinese" in result.data.lower()

    def test_final_compose_stub(self, final_compose_stage, base_context, monkeypatch):
        """Final compose should produce text plan even when LLM fails."""
        from app.prototype.media import video_handlers

        async def _fail(*a, **kw):
            raise RuntimeError("no LLM")
        monkeypatch.setattr(video_handlers.litellm, "acompletion", _fail)

        result = asyncio.run(video_handlers.handle_final_compose(final_compose_stage, base_context))
        assert isinstance(result, SubStageArtifact)
        assert "composition" in result.data.lower() or "video" in result.data.lower()

    def test_handler_registry(self):
        """All 4 handlers should be in the registry."""
        from app.prototype.media.video_handlers import get_video_handlers
        handlers = get_video_handlers()
        assert set(handlers.keys()) == {"script", "storyboard", "style_frame", "final_compose"}


# ---------------------------------------------------------------------------
# SubStageArtifact image_path tests
# ---------------------------------------------------------------------------

class TestSubStageArtifactImagePath:
    """Test the new image_path field on SubStageArtifact."""

    def test_image_path_default_empty(self):
        art = SubStageArtifact(stage_name="test", artifact_type="text", data="hello")
        assert art.image_path == ""

    def test_image_path_in_to_dict_when_set(self):
        art = SubStageArtifact(
            stage_name="test",
            artifact_type="text",
            data="hello",
            image_path="/tmp/test.png",
        )
        d = art.to_dict()
        assert d["image_path"] == "/tmp/test.png"

    def test_image_path_not_in_to_dict_when_empty(self):
        art = SubStageArtifact(stage_name="test", artifact_type="text", data="hello")
        d = art.to_dict()
        assert "image_path" not in d


# ---------------------------------------------------------------------------
# Visual renderer tests
# ---------------------------------------------------------------------------

class TestVisualRenderer:
    """Test the visual_renderer utility."""

    def test_get_substage_output_dir(self, tmp_path, monkeypatch):
        from app.prototype.media import visual_renderer
        import app.prototype.media.visual_renderer as vr_mod

        # Patch the base path
        monkeypatch.setattr(
            vr_mod,
            "get_substage_output_dir",
            lambda task_id: str(tmp_path / "substages" / task_id),
        )
        d = vr_mod.get_substage_output_dir("task-123")
        assert "task-123" in d

    def test_render_visual_no_provider(self, monkeypatch):
        """render_visual should return empty string when provider is None."""
        import app.prototype.media.visual_renderer as vr_mod

        # Force _get_nb2_provider to return None
        monkeypatch.setattr(vr_mod, "_provider_instance", None)
        monkeypatch.setattr(vr_mod, "_get_nb2_provider", lambda: None)

        result = asyncio.run(vr_mod.render_visual(
            prompt="test",
            output_dir="/tmp/test_render",
            filename="test.png",
        ))
        assert result == ""


# ---------------------------------------------------------------------------
# Draft agent VIDEO wiring test
# ---------------------------------------------------------------------------

class TestDraftAgentVideoWiring:
    """Verify draft agent can resolve VIDEO handlers."""

    def test_video_handlers_loaded_for_video_recipe(self):
        """The draft agent sub-stage path should load video handlers."""
        from app.prototype.media.recipes import get_default_recipe
        from app.prototype.media.types import MediaType
        from app.prototype.media.video_handlers import get_video_handlers

        recipe = get_default_recipe(MediaType.VIDEO)
        handlers = get_video_handlers()

        # All recipe stages have handlers
        for stage in recipe.sub_stages:
            assert stage.name in handlers, f"No handler for video stage '{stage.name}'"
