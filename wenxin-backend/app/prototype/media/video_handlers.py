"""VIDEO sub-stage handlers — LLM-powered script/storyboard + NB2 visual generation.

Each handler follows the StageHandler protocol:
    async (stage_def: SubStageDef, context: dict) -> SubStageArtifact

Video pipeline: script → storyboard (visual keyframes) → style_frame → final_compose
"""

from __future__ import annotations

import json
import logging
from typing import Any

import litellm

from app.prototype.agents.model_router import MODEL_FAST
from app.prototype.media.types import SubStageArtifact, SubStageDef
from app.prototype.media.visual_renderer import render_visual, get_substage_output_dir

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = 15


def _extract_json(text: str) -> dict | None:
    """Best-effort JSON extraction from LLM response text."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        start = 1 if lines[0].startswith("```") else 0
        end = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
        cleaned = "\n".join(lines[start:end]).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    brace_start = cleaned.find("{")
    brace_end = cleaned.rfind("}")
    if brace_start != -1 and brace_end > brace_start:
        try:
            return json.loads(cleaned[brace_start : brace_end + 1])
        except json.JSONDecodeError:
            pass
    # Try array
    bracket_start = cleaned.find("[")
    bracket_end = cleaned.rfind("]")
    if bracket_start != -1 and bracket_end > bracket_start:
        try:
            return json.loads(cleaned[bracket_start : bracket_end + 1])
        except json.JSONDecodeError:
            pass
    return None


def _gather_previous_outputs(context: dict[str, Any]) -> str:
    """Summarize previous sub-stage artifacts for downstream prompts."""
    input_artifacts = context.get("input_artifacts", {})
    if not input_artifacts:
        return ""
    parts: list[str] = []
    for name, artifact in input_artifacts.items():
        data = artifact.data if artifact else None
        if data is not None:
            data_str = str(data)[:800]
            parts.append(f"[{name}]: {data_str}")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# script — structured video script (JSON)
# ---------------------------------------------------------------------------

async def handle_script(stage_def: SubStageDef, context: dict[str, Any]) -> SubStageArtifact:
    """Generate a structured video script with scenes, shots, and timing.

    Produces a JSON object with scenes containing shot descriptions,
    dialogue/narration, camera movement, and estimated duration.
    """
    subject = context.get("subject", "abstract art")
    tradition = context.get("cultural_tradition", context.get("tradition", "default"))

    try:
        tradition_clause = (
            f" rooted in the '{tradition}' artistic tradition"
            if tradition and tradition != "default" else ""
        )
        response = await litellm.acompletion(
            model=MODEL_FAST,
            messages=[{
                "role": "user",
                "content": (
                    f"Create a short video script (30-60 seconds) about '{subject}'{tradition_clause}.\n"
                    "Return a JSON object with:\n"
                    "- \"title\": string\n"
                    "- \"total_duration_seconds\": number\n"
                    "- \"scenes\": array of objects, each with:\n"
                    "  - \"scene_number\": int\n"
                    "  - \"description\": visual description (50-80 words)\n"
                    "  - \"camera\": camera movement (e.g. \"slow pan left\", \"zoom in\")\n"
                    "  - \"narration\": optional voice-over text\n"
                    "  - \"duration_seconds\": number\n"
                    "  - \"mood\": mood/atmosphere keyword\n"
                    "Aim for 3-5 scenes. Return ONLY valid JSON."
                ),
            }],
            timeout=_DEFAULT_TIMEOUT,
        )

        content = response.choices[0].message.content
        script_data = _extract_json(content)

        if script_data is None:
            script_data = {
                "title": f"Video: {subject}",
                "total_duration_seconds": 30,
                "scenes": [{"scene_number": 1, "description": content[:300], "camera": "static", "duration_seconds": 30}],
                "raw_response": content,
            }

        return SubStageArtifact(
            stage_name=stage_def.name,
            artifact_type="json",
            data=json.dumps(script_data),
            metadata={"source": "llm", "model": MODEL_FAST, "tradition": tradition},
        )

    except Exception as exc:
        logger.warning("video script LLM call failed, using stub: %s", exc)
        stub = {
            "title": f"Video: {subject}",
            "total_duration_seconds": 30,
            "scenes": [
                {"scene_number": 1, "description": f"Opening: wide establishing shot of {subject}", "camera": "slow zoom in", "duration_seconds": 8, "mood": "contemplative"},
                {"scene_number": 2, "description": f"Detail: close-up revealing textures and cultural elements", "camera": "slow pan", "duration_seconds": 10, "mood": "intimate"},
                {"scene_number": 3, "description": f"Finale: pull back to reveal the complete artwork in context", "camera": "dolly out", "duration_seconds": 12, "mood": "expansive"},
            ],
        }
        return SubStageArtifact(
            stage_name=stage_def.name,
            artifact_type="json",
            data=json.dumps(stub),
            metadata={"source": "stub", "error": str(exc)},
        )


# ---------------------------------------------------------------------------
# storyboard — visual keyframes via NB2
# ---------------------------------------------------------------------------

async def handle_storyboard(stage_def: SubStageDef, context: dict[str, Any]) -> SubStageArtifact:
    """Generate storyboard keyframes — one NB2 image per scene.

    Reads the script from the previous stage and renders a keyframe
    for each scene using NB2. Falls back to text descriptions if
    NB2 is unavailable.
    """
    subject = context.get("subject", "abstract art")
    tradition = context.get("cultural_tradition", context.get("tradition", "default"))
    task_id = context.get("task_id", "unknown")
    tradition_display = tradition.replace("_", " ") if tradition else ""

    # Parse script from previous stage
    input_artifacts = context.get("input_artifacts", {})
    script_artifact = input_artifacts.get("script")
    scenes = []
    if script_artifact and script_artifact.data:
        try:
            script_data = json.loads(str(script_artifact.data))
            scenes = script_data.get("scenes", [])
        except (json.JSONDecodeError, TypeError):
            pass

    if not scenes:
        scenes = [
            {"scene_number": 1, "description": f"Establishing shot of {subject}", "mood": "contemplative"},
            {"scene_number": 2, "description": f"Detail view of {subject}", "mood": "intimate"},
            {"scene_number": 3, "description": f"Final wide shot of {subject}", "mood": "expansive"},
        ]

    # Generate keyframes — one per scene (max 5 to avoid quota issues)
    keyframes: list[dict] = []
    output_dir = get_substage_output_dir(task_id)

    for scene in scenes[:5]:
        scene_num = scene.get("scene_number", len(keyframes) + 1)
        desc = scene.get("description", subject)
        camera = scene.get("camera", "")
        mood = scene.get("mood", "")

        prompt = f"{tradition_display} artwork, {desc}"
        if camera:
            prompt += f", {camera} camera angle"
        if mood:
            prompt += f", {mood} atmosphere"

        image_path = await render_visual(
            prompt=prompt,
            output_dir=output_dir,
            filename=f"storyboard_frame_{scene_num}.png",
            width=768,
            height=512,
        )

        keyframes.append({
            "scene_number": scene_num,
            "description": desc,
            "image_path": image_path,
            "has_visual": bool(image_path),
        })

    # Text summary of storyboard
    summary_parts = [f"Storyboard for '{subject}' — {len(keyframes)} keyframes:"]
    for kf in keyframes:
        visual_tag = " [IMAGE]" if kf["has_visual"] else " [TEXT ONLY]"
        summary_parts.append(f"  Frame {kf['scene_number']}: {kf['description'][:100]}{visual_tag}")

    # Use first keyframe image_path as the artifact's primary image
    primary_image = next((kf["image_path"] for kf in keyframes if kf["image_path"]), "")

    return SubStageArtifact(
        stage_name=stage_def.name,
        artifact_type="json",
        data=json.dumps({"keyframes": keyframes}),
        image_path=primary_image,
        metadata={
            "source": "nb2" if primary_image else "text_only",
            "total_frames": len(keyframes),
            "visual_frames": sum(1 for kf in keyframes if kf["has_visual"]),
        },
    )


# ---------------------------------------------------------------------------
# style_frame — high-quality reference frame via NB2
# ---------------------------------------------------------------------------

async def handle_style_frame(stage_def: SubStageDef, context: dict[str, Any]) -> SubStageArtifact:
    """Generate a high-quality style reference frame using NB2.

    Uses LLM to craft an optimal prompt, then renders at higher resolution.
    """
    subject = context.get("subject", "abstract art")
    tradition = context.get("cultural_tradition", context.get("tradition", "default"))
    task_id = context.get("task_id", "unknown")
    previous = _gather_previous_outputs(context)

    try:
        tradition_clause = f" in the '{tradition}' tradition" if tradition and tradition != "default" else ""
        response = await litellm.acompletion(
            model=MODEL_FAST,
            messages=[{
                "role": "user",
                "content": (
                    f"Create a detailed visual description for a high-quality style reference frame "
                    f"of a video about '{subject}'{tradition_clause}.\n"
                    + (f"\nContext from previous stages:\n{previous[:600]}\n" if previous else "")
                    + "\nDescribe in 100-150 words: the exact visual style, color grading, "
                    "lighting, texture, and mood that should define this video's aesthetic. "
                    "Return ONLY the description, no explanation."
                ),
            }],
            timeout=_DEFAULT_TIMEOUT,
        )
        content = response.choices[0].message.content
    except Exception as exc:
        logger.warning("style_frame LLM call failed: %s", exc)
        tradition_display = tradition.replace("_", " ") if tradition else "artistic"
        content = (
            f"A cinematic frame depicting {subject} in {tradition_display} style. "
            "Rich warm tones, dramatic lighting with soft shadows, "
            "painterly texture, contemplative atmosphere."
        )

    # Render high-quality style frame
    image_path = await render_visual(
        prompt=content,
        output_dir=get_substage_output_dir(task_id),
        filename="style_frame.png",
        width=1024,
        height=576,  # 16:9 cinematic
    )

    return SubStageArtifact(
        stage_name=stage_def.name,
        artifact_type="text",
        data=content,
        image_path=image_path,
        metadata={
            "source": "llm" if content else "stub",
            "model": MODEL_FAST,
            "has_visual": bool(image_path),
        },
    )


# ---------------------------------------------------------------------------
# final_compose — assembly description (text plan for video composition)
# ---------------------------------------------------------------------------

async def handle_final_compose(stage_def: SubStageDef, context: dict[str, Any]) -> SubStageArtifact:
    """Generate the final video composition plan.

    Synthesizes all prior stages (script, storyboard, style frame) into
    a production-ready composition specification. Actual video rendering
    would be handled by a separate video generation service.
    """
    subject = context.get("subject", "abstract art")
    tradition = context.get("cultural_tradition", context.get("tradition", "default"))
    previous = _gather_previous_outputs(context)

    try:
        response = await litellm.acompletion(
            model=MODEL_FAST,
            messages=[{
                "role": "user",
                "content": (
                    f"Create a final video composition plan for a short art video about '{subject}' "
                    f"in the '{tradition}' tradition.\n"
                    + (f"\nPrevious stages:\n{previous[:1000]}\n" if previous else "")
                    + "\nProvide a concise composition plan (200-300 words) covering:\n"
                    "1. SEQUENCE: Scene order with transitions (dissolve, cut, fade)\n"
                    "2. PACING: Rhythm and tempo of the edit\n"
                    "3. AUDIO: Music/sound design direction\n"
                    "4. COLOR GRADING: Overall color treatment\n"
                    "5. TYPOGRAPHY: Any title cards or text overlays\n"
                    "6. OUTPUT SPEC: Resolution, frame rate, duration\n"
                ),
            }],
            timeout=_DEFAULT_TIMEOUT,
        )
        content = response.choices[0].message.content
    except Exception as exc:
        logger.warning("final_compose LLM call failed: %s", exc)
        content = (
            f"Video composition plan for '{subject}':\n"
            "SEQUENCE: 3-scene arc with dissolve transitions.\n"
            "PACING: Slow, contemplative rhythm (2-3 seconds per transition).\n"
            "AUDIO: Ambient instrumental, culturally appropriate.\n"
            "COLOR GRADING: Warm tones, subtle desaturation for painterly feel.\n"
            "OUTPUT: 1080p, 24fps, 30-45 seconds."
        )

    return SubStageArtifact(
        stage_name=stage_def.name,
        artifact_type="text",
        data=content,
        metadata={"source": "llm", "model": MODEL_FAST},
    )


# ---------------------------------------------------------------------------
# Handler registry for VIDEO sub-stages
# ---------------------------------------------------------------------------

VIDEO_HANDLERS: dict[str, Any] = {
    "script": handle_script,
    "storyboard": handle_storyboard,
    "style_frame": handle_style_frame,
    "final_compose": handle_final_compose,
}


def get_video_handlers() -> dict[str, Any]:
    """Return a copy of the VIDEO sub-stage handler registry."""
    return dict(VIDEO_HANDLERS)
