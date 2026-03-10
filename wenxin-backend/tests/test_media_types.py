"""Tests for the multi-modal type system — MediaType, SubStageDef, CreationRecipe, recipes."""

from __future__ import annotations

import pytest

from app.prototype.media.types import (
    CreationRecipe,
    MediaType,
    SubStageArtifact,
    SubStageDef,
    SubStageResult,
)
from app.prototype.media.recipes import (
    AVAILABLE_MEDIA_TYPES,
    IMAGE_STANDARD_RECIPE,
    MODEL_3D_RECIPE,
    RECIPE_REGISTRY,
    SOUND_RECIPE,
    VIDEO_RECIPE,
    get_default_recipe,
    get_recipe,
)


# ---------------------------------------------------------------------------
# MediaType enum
# ---------------------------------------------------------------------------

class TestMediaType:
    def test_values(self):
        assert MediaType.IMAGE.value == "image"
        assert MediaType.VIDEO.value == "video"
        assert MediaType.MODEL_3D.value == "3d_model"
        assert MediaType.SOUND.value == "sound"

    def test_str_comparison(self):
        assert MediaType.IMAGE == "image"
        assert MediaType.VIDEO == "video"

    def test_from_string(self):
        assert MediaType("image") == MediaType.IMAGE
        assert MediaType("3d_model") == MediaType.MODEL_3D

    def test_invalid_value(self):
        with pytest.raises(ValueError):
            MediaType("invalid")


# ---------------------------------------------------------------------------
# SubStageDef
# ---------------------------------------------------------------------------

class TestSubStageDef:
    def test_creation(self):
        stage = SubStageDef(
            name="test_stage",
            display_name="Test Stage",
            description="A test stage",
            order=0,
        )
        assert stage.name == "test_stage"
        assert stage.display_name == "Test Stage"
        assert stage.order == 0
        assert stage.required is True
        assert stage.input_artifact_names == ()
        assert stage.output_artifact_type == "image"
        assert stage.estimated_latency_ms == 5000

    def test_frozen(self):
        stage = SubStageDef(name="s", display_name="S", description="d", order=0)
        with pytest.raises(AttributeError):
            stage.name = "new_name"

    def test_with_inputs(self):
        stage = SubStageDef(
            name="combine",
            display_name="Combine",
            description="Combine artifacts",
            order=2,
            input_artifact_names=("sketch", "palette"),
            output_artifact_type="image",
        )
        assert stage.input_artifact_names == ("sketch", "palette")

    def test_to_dict(self):
        stage = SubStageDef(
            name="s",
            display_name="S",
            description="d",
            order=1,
            input_artifact_names=("a",),
            output_artifact_type="json",
            estimated_latency_ms=1000,
        )
        d = stage.to_dict()
        assert d["name"] == "s"
        assert d["input_artifact_names"] == ["a"]
        assert d["output_artifact_type"] == "json"


# ---------------------------------------------------------------------------
# SubStageArtifact
# ---------------------------------------------------------------------------

class TestSubStageArtifact:
    def test_creation(self):
        artifact = SubStageArtifact(
            stage_name="sketch",
            artifact_type="image",
            data="path/to/image.png",
        )
        assert artifact.stage_name == "sketch"
        assert artifact.artifact_type == "image"
        assert artifact.metadata == {}

    def test_to_dict(self):
        artifact = SubStageArtifact(
            stage_name="palette",
            artifact_type="json",
            data={"colors": ["#fff"]},
            metadata={"source": "llm"},
        )
        d = artifact.to_dict()
        assert d["stage_name"] == "palette"
        assert d["metadata"] == {"source": "llm"}

    def test_none_data(self):
        artifact = SubStageArtifact(stage_name="x", artifact_type="text")
        assert artifact.data is None
        assert artifact.to_dict()["data"] is None


# ---------------------------------------------------------------------------
# SubStageResult
# ---------------------------------------------------------------------------

class TestSubStageResult:
    def test_defaults(self):
        result = SubStageResult(stage_name="test")
        assert result.status == "pending"
        assert result.artifact is None
        assert result.duration_ms == 0
        assert result.error is None

    def test_completed(self):
        artifact = SubStageArtifact(stage_name="t", artifact_type="image", data="img.png")
        result = SubStageResult(
            stage_name="t",
            status="completed",
            artifact=artifact,
            duration_ms=500,
        )
        d = result.to_dict()
        assert d["status"] == "completed"
        assert d["artifact"]["stage_name"] == "t"
        assert d["duration_ms"] == 500

    def test_failed(self):
        result = SubStageResult(
            stage_name="t",
            status="failed",
            error="Provider timeout",
            duration_ms=10000,
        )
        d = result.to_dict()
        assert d["error"] == "Provider timeout"


# ---------------------------------------------------------------------------
# CreationRecipe
# ---------------------------------------------------------------------------

class TestCreationRecipe:
    def test_creation(self):
        recipe = CreationRecipe(
            media_type=MediaType.IMAGE,
            name="test_recipe",
            display_name="Test Recipe",
            sub_stages=(
                SubStageDef(name="a", display_name="A", description="da", order=0),
                SubStageDef(name="b", display_name="B", description="db", order=1),
            ),
        )
        assert recipe.name == "test_recipe"
        assert len(recipe.sub_stages) == 2
        assert recipe.version == "1.0.0"

    def test_frozen(self):
        recipe = CreationRecipe(
            media_type=MediaType.IMAGE,
            name="x",
            display_name="X",
            sub_stages=(),
        )
        with pytest.raises(AttributeError):
            recipe.name = "y"

    def test_invalid_order(self):
        with pytest.raises(ValueError, match="ascending order"):
            CreationRecipe(
                media_type=MediaType.IMAGE,
                name="bad",
                display_name="Bad",
                sub_stages=(
                    SubStageDef(name="b", display_name="B", description="db", order=1),
                    SubStageDef(name="a", display_name="A", description="da", order=0),
                ),
            )

    def test_duplicate_names(self):
        with pytest.raises(ValueError, match="unique"):
            CreationRecipe(
                media_type=MediaType.IMAGE,
                name="dup",
                display_name="Dup",
                sub_stages=(
                    SubStageDef(name="a", display_name="A1", description="d1", order=0),
                    SubStageDef(name="a", display_name="A2", description="d2", order=1),
                ),
            )

    def test_get_stage_by_name(self):
        recipe = CreationRecipe(
            media_type=MediaType.IMAGE,
            name="r",
            display_name="R",
            sub_stages=(
                SubStageDef(name="s1", display_name="S1", description="d", order=0),
                SubStageDef(name="s2", display_name="S2", description="d", order=1),
            ),
        )
        assert recipe.get_stage_by_name("s1") is not None
        assert recipe.get_stage_by_name("s1").display_name == "S1"
        assert recipe.get_stage_by_name("missing") is None

    def test_stage_names(self):
        recipe = CreationRecipe(
            media_type=MediaType.IMAGE,
            name="r",
            display_name="R",
            sub_stages=(
                SubStageDef(name="alpha", display_name="A", description="d", order=0),
                SubStageDef(name="beta", display_name="B", description="d", order=1),
            ),
        )
        assert recipe.stage_names() == ["alpha", "beta"]

    def test_to_dict(self):
        recipe = CreationRecipe(
            media_type=MediaType.VIDEO,
            name="v",
            display_name="V",
            sub_stages=(
                SubStageDef(name="x", display_name="X", description="d", order=0),
            ),
            version="2.0.0",
        )
        d = recipe.to_dict()
        assert d["media_type"] == "video"
        assert d["version"] == "2.0.0"
        assert len(d["sub_stages"]) == 1


# ---------------------------------------------------------------------------
# Recipe Registry
# ---------------------------------------------------------------------------

class TestRecipeRegistry:
    def test_all_recipes_registered(self):
        assert "image_standard" in RECIPE_REGISTRY
        assert "video_standard" in RECIPE_REGISTRY
        assert "3d_model_standard" in RECIPE_REGISTRY
        assert "sound_standard" in RECIPE_REGISTRY

    def test_get_recipe(self):
        r = get_recipe("image_standard")
        assert r is not None
        assert r.media_type == MediaType.IMAGE

    def test_get_recipe_missing(self):
        assert get_recipe("nonexistent") is None

    def test_get_default_recipe(self):
        r = get_default_recipe(MediaType.IMAGE)
        assert r.name == "image_standard"

    def test_get_default_recipe_all_types(self):
        for mt in MediaType:
            r = get_default_recipe(mt)
            assert r.media_type == mt

    def test_image_recipe_stages(self):
        r = IMAGE_STANDARD_RECIPE
        assert len(r.sub_stages) == 6
        names = r.stage_names()
        assert names[0] == "mood_palette"
        assert names[-1] == "final_render"

    def test_video_recipe_stages(self):
        assert len(VIDEO_RECIPE.sub_stages) == 4

    def test_3d_recipe_stages(self):
        assert len(MODEL_3D_RECIPE.sub_stages) == 4

    def test_sound_recipe_stages(self):
        assert len(SOUND_RECIPE.sub_stages) == 4


# ---------------------------------------------------------------------------
# Availability
# ---------------------------------------------------------------------------

class TestAvailability:
    def test_image_available(self):
        assert AVAILABLE_MEDIA_TYPES[MediaType.IMAGE] is True

    def test_others_not_available(self):
        assert AVAILABLE_MEDIA_TYPES[MediaType.VIDEO] is False
        assert AVAILABLE_MEDIA_TYPES[MediaType.MODEL_3D] is False
        assert AVAILABLE_MEDIA_TYPES[MediaType.SOUND] is False
