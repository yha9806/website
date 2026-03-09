"""
VULCA - Visual Understanding & Linguistic Cultural Assessment
HuggingFace Space Demo

Benchmarking 42 AI models across 47 dimensions and 8 cultural perspectives.
"""

import gradio as gr
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from pathlib import Path

# ---------------------------------------------------------------------------
# Static leaderboard data (representative subset of 42 models)
# Scores are on a 0-100 scale across 6 VULCA dimensions:
#   Creativity, Technique, Emotion, Context, Innovation, Impact
# ---------------------------------------------------------------------------

DIMENSIONS = ["Creativity", "Technique", "Emotion", "Context", "Innovation", "Impact"]

LEADERBOARD_DATA = [
    # (Rank, Model, Organization, Type, Creativity, Technique, Emotion, Context, Innovation, Impact, Overall)
    (1,  "GPT-4o",              "OpenAI",        "Multimodal", 93, 91, 89, 88, 92, 87, 90.2),
    (2,  "Claude 3.5 Sonnet",   "Anthropic",     "Multimodal", 91, 90, 93, 86, 90, 88, 89.8),
    (3,  "Gemini 1.5 Pro",      "Google",        "Multimodal", 90, 89, 87, 90, 89, 86, 88.6),
    (4,  "Qwen-VL-Max",         "Alibaba",       "Multimodal", 89, 88, 86, 92, 87, 85, 87.9),
    (5,  "GPT-4 Vision",        "OpenAI",        "Multimodal", 88, 91, 88, 83, 91, 84, 87.5),
    (6,  "Claude 3 Opus",       "Anthropic",     "Multimodal", 87, 92, 93, 85, 84, 83, 87.2),
    (7,  "Qwen2-72B",           "Alibaba",       "Text",       89, 88, 91, 96, 82, 80, 87.0),
    (8,  "InternVL2-26B",       "Shanghai AI",   "Multimodal", 85, 87, 84, 89, 86, 83, 85.8),
    (9,  "Llama 3 70B",         "Meta",          "Text",       88, 85, 87, 78, 88, 82, 85.2),
    (10, "Gemini 1.5 Flash",    "Google",        "Multimodal", 84, 86, 83, 85, 85, 81, 84.1),
    (11, "Yi-VL-34B",           "01.AI",         "Multimodal", 84, 82, 85, 89, 84, 80, 84.0),
    (12, "LLaVA-1.6-34B",       "UW/Microsoft",  "Multimodal", 82, 85, 81, 80, 86, 79, 82.3),
    (13, "DeepSeek-VL-7B",      "DeepSeek",      "Multimodal", 81, 83, 80, 82, 83, 78, 81.3),
    (14, "ERNIE 4.0",           "Baidu",         "Text",       80, 85, 87, 94, 76, 75, 81.0),
    (15, "CogVLM2-19B",        "Zhipu AI",      "Multimodal", 79, 82, 80, 84, 80, 77, 80.4),
    (16, "Phi-3-Vision",        "Microsoft",     "Multimodal", 78, 84, 76, 75, 82, 76, 78.6),
    (17, "Mistral Large 2",     "Mistral AI",    "Text",       80, 79, 78, 74, 81, 75, 78.0),
    (18, "ChatGLM3-6B",         "Zhipu AI",      "Text",       76, 78, 83, 87, 73, 72, 77.5),
    (19, "Idefics2-8B",         "HuggingFace",   "Multimodal", 75, 77, 74, 73, 78, 71, 74.8),
    (20, "MiniCPM-V-2.6",       "OpenBMB",       "Multimodal", 74, 76, 75, 78, 74, 70, 74.5),
]


def _build_leaderboard_headers():
    """Return column headers for the leaderboard DataFrame."""
    return ["Rank", "Model", "Organization", "Type",
            "Creativity", "Technique", "Emotion",
            "Context", "Innovation", "Impact", "Overall"]


def _build_leaderboard_rows(model_type="All", sort_by="Overall"):
    """Filter and sort leaderboard rows."""
    rows = LEADERBOARD_DATA
    if model_type != "All":
        rows = [r for r in rows if r[3] == model_type]
    col_map = {
        "Overall": 10, "Creativity": 4, "Technique": 5,
        "Emotion": 6, "Context": 7, "Innovation": 8, "Impact": 9,
    }
    sort_idx = col_map.get(sort_by, 10)
    rows = sorted(rows, key=lambda r: r[sort_idx], reverse=True)
    # Re-rank after sort/filter
    return [[i + 1] + list(r[1:]) for i, r in enumerate(rows)]


# ---------------------------------------------------------------------------
# Radar chart generation
# ---------------------------------------------------------------------------

VULCA_COPPER = "#B0683A"
VULCA_COPPER_LIGHT = "#D4956B"
VULCA_INK = "#334155"
VULCA_CREAM = "#FAF7F2"
VULCA_GOLD = "#C9A96E"


def _create_radar_chart(scores: dict[str, float], title: str = "VULCA 6D Evaluation"):
    """Create a professional radar chart for 6D scores."""
    labels = list(scores.keys())
    values = list(scores.values())
    num_vars = len(labels)

    # Compute angle for each axis
    angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    # Close the polygon
    values_closed = values + [values[0]]
    angles_closed = angles + [angles[0]]

    fig, ax = plt.subplots(figsize=(6, 6), subplot_kw=dict(polar=True))
    fig.patch.set_facecolor(VULCA_CREAM)
    ax.set_facecolor(VULCA_CREAM)

    # Draw the filled area
    ax.fill(angles_closed, values_closed, color=VULCA_COPPER, alpha=0.15)
    ax.plot(angles_closed, values_closed, color=VULCA_COPPER, linewidth=2.5, linestyle="-")

    # Draw data points
    ax.scatter(angles, values, color=VULCA_COPPER, s=80, zorder=5, edgecolors="white", linewidths=1.5)

    # Add score labels next to each point
    for angle, value, label in zip(angles, values, labels):
        ha = "left" if 0 < angle < np.pi else "right"
        if abs(angle) < 0.1 or abs(angle - np.pi) < 0.1:
            ha = "center"
        offset = 6
        ax.annotate(
            f"{value:.0f}",
            xy=(angle, value),
            fontsize=13,
            fontweight="bold",
            color=VULCA_COPPER,
            ha=ha,
            va="bottom",
        )

    # Configure grid
    ax.set_xticks(angles)
    ax.set_xticklabels(labels, fontsize=12, fontweight="600", color=VULCA_INK)
    ax.set_ylim(0, 100)
    ax.set_yticks([20, 40, 60, 80, 100])
    ax.set_yticklabels(["20", "40", "60", "80", "100"], fontsize=9, color="#94a3b8")
    ax.yaxis.grid(True, color="#e2e8f0", linewidth=0.7)
    ax.xaxis.grid(True, color="#cbd5e1", linewidth=0.7)
    ax.spines["polar"].set_color("#cbd5e1")

    # Title
    ax.set_title(title, fontsize=16, fontweight="bold", color=VULCA_INK, pad=24)

    plt.tight_layout()
    return fig


# ---------------------------------------------------------------------------
# Mock evaluation logic
# ---------------------------------------------------------------------------

def _mock_evaluate(description: str, image):
    """Generate mock 6D scores based on input heuristics."""
    if not description and image is None:
        return None, "Please provide an artwork description or upload an image."

    # Seed based on input to get deterministic-ish but varied results
    seed_text = description or "image-upload"
    seed_val = sum(ord(c) for c in seed_text) % 10000
    rng = np.random.RandomState(seed_val)

    # Base scores with some variation
    base = rng.uniform(55, 85, size=6)

    # Boost scores based on keywords in description
    desc_lower = (description or "").lower()
    keyword_boosts = {
        "creative": (0, 8),
        "original": (0, 6),
        "innovative": (4, 8),
        "novel": (4, 6),
        "technique": (1, 7),
        "skill": (1, 5),
        "emotion": (2, 8),
        "feeling": (2, 6),
        "moving": (2, 7),
        "culture": (3, 9),
        "tradition": (3, 7),
        "historical": (3, 6),
        "impact": (5, 7),
        "powerful": (5, 6),
        "abstract": (0, 5),
        "surreal": (0, 7),
        "realistic": (1, 6),
        "portrait": (2, 5),
        "landscape": (3, 5),
    }
    for kw, (dim_idx, boost) in keyword_boosts.items():
        if kw in desc_lower:
            base[dim_idx] = min(98, base[dim_idx] + boost)

    # Image presence boosts technique and impact slightly
    if image is not None:
        base[1] = min(98, base[1] + 4)  # technique
        base[5] = min(98, base[5] + 3)  # impact

    # Longer descriptions tend to indicate more thoughtful work
    if description and len(description) > 100:
        base = np.minimum(98, base + 3)

    scores = {dim: round(float(val), 1) for dim, val in zip(DIMENSIONS, base)}
    overall = round(float(np.mean(base)), 1)

    fig = _create_radar_chart(scores)

    # Build a formatted result summary
    summary_lines = [
        f"## VULCA 6D Evaluation Results",
        f"",
        f"**Overall Score: {overall}/100**",
        f"",
    ]
    # Find best and weakest dimensions
    best_dim = max(scores, key=scores.get)
    weak_dim = min(scores, key=scores.get)

    for dim, val in scores.items():
        bar_len = int(val / 5)
        bar = "=" * bar_len
        marker = ""
        if dim == best_dim:
            marker = " (Strongest)"
        elif dim == weak_dim:
            marker = " (Growth Area)"
        summary_lines.append(f"- **{dim}**: {val}{marker}")

    summary_lines.extend([
        "",
        "---",
        f"*Strongest dimension: **{best_dim}** ({scores[best_dim]})*",
        f"*Growth area: **{weak_dim}** ({scores[weak_dim]})*",
        "",
        "> Note: This is a demonstration using heuristic scoring. "
        "The full VULCA pipeline uses multi-agent evaluation with "
        "cultural anchoring across 47 fine-grained dimensions.",
    ])

    return fig, "\n".join(summary_lines)


# ---------------------------------------------------------------------------
# Leaderboard filter callback
# ---------------------------------------------------------------------------

def update_leaderboard(model_type, sort_by):
    """Return filtered/sorted leaderboard data."""
    rows = _build_leaderboard_rows(model_type, sort_by)
    return rows


# ---------------------------------------------------------------------------
# Build Gradio UI
# ---------------------------------------------------------------------------

custom_css = Path(__file__).parent / "style.css"
css_text = custom_css.read_text() if custom_css.exists() else ""

HEADER_MD = """
<div style="text-align: center; padding: 20px 0 10px 0;">
  <h1 style="color: #B0683A; font-size: 2.2em; margin-bottom: 4px; font-weight: 800; letter-spacing: -0.5px;">
    VULCA
  </h1>
  <p style="color: #334155; font-size: 1.1em; font-weight: 500; margin-top: 0;">
    Visual Understanding &amp; Linguistic Cultural Assessment
  </p>
  <p style="color: #64748b; font-size: 0.92em; max-width: 700px; margin: 8px auto 0 auto; line-height: 1.5;">
    Benchmarking AI models on cultural and artistic understanding across
    <strong>47 dimensions</strong> and <strong>8 cultural perspectives</strong>.
  </p>
</div>
"""

with gr.Blocks(
    css=css_text,
    title="VULCA - Cultural AI Evaluation",
    theme=gr.themes.Soft(
        primary_hue=gr.themes.Color(
            c50="#FFF8F0", c100="#FDEBD0", c200="#F5D0A9",
            c300="#D4956B", c400="#C8845A", c500="#B0683A",
            c600="#8E5230", c700="#704028", c800="#523020",
            c900="#3A2018", c950="#2A1810",
        ),
        secondary_hue=gr.themes.Color(
            c50="#F8FAFC", c100="#F1F5F9", c200="#E2E8F0",
            c300="#CBD5E1", c400="#94A3B8", c500="#64748B",
            c600="#475569", c700="#334155", c800="#1E293B",
            c900="#0F172A", c950="#020617",
        ),
        neutral_hue=gr.themes.Color(
            c50="#FAF7F2", c100="#F0EBE3", c200="#E2DDD5",
            c300="#C5BFB7", c400="#A8A29E", c500="#78716C",
            c600="#57534E", c700="#44403C", c800="#292524",
            c900="#1C1917", c950="#0C0A09",
        ),
        font=gr.themes.GoogleFont("Inter"),
        radius_size=gr.themes.sizes.radius_lg,
    ),
) as demo:

    gr.Markdown(HEADER_MD)

    with gr.Tabs():
        # ==================================================================
        # Tab 1: Leaderboard
        # ==================================================================
        with gr.Tab("Leaderboard", id="leaderboard"):
            gr.Markdown(
                "### AI Model Rankings\n"
                "Comparative evaluation of 42 AI models on cultural and artistic understanding. "
                "Filter by model type and sort by any dimension."
            )

            with gr.Row():
                type_filter = gr.Dropdown(
                    choices=["All", "Multimodal", "Text"],
                    value="All",
                    label="Model Type",
                    interactive=True,
                    scale=1,
                )
                sort_dropdown = gr.Dropdown(
                    choices=["Overall"] + DIMENSIONS,
                    value="Overall",
                    label="Sort By",
                    interactive=True,
                    scale=1,
                )

            initial_rows = _build_leaderboard_rows()
            leaderboard_table = gr.DataFrame(
                value=initial_rows,
                headers=_build_leaderboard_headers(),
                datatype=["number", "str", "str", "str",
                           "number", "number", "number",
                           "number", "number", "number", "number"],
                interactive=False,
                wrap=True,
            )

            type_filter.change(
                fn=update_leaderboard,
                inputs=[type_filter, sort_dropdown],
                outputs=[leaderboard_table],
            )
            sort_dropdown.change(
                fn=update_leaderboard,
                inputs=[type_filter, sort_dropdown],
                outputs=[leaderboard_table],
            )

            gr.Markdown(
                "<p style='color: #94a3b8; font-size: 0.85em; text-align: center; margin-top: 8px;'>"
                "Showing top 20 of 42 evaluated models. "
                "Scores are on a 0-100 scale. "
                "Full results available at <a href='https://vulcaart.art' target='_blank'>vulcaart.art</a>."
                "</p>"
            )

        # ==================================================================
        # Tab 2: Try Evaluation
        # ==================================================================
        with gr.Tab("Try Evaluation", id="evaluate"):
            gr.Markdown(
                "### Try the VULCA Evaluation Pipeline\n"
                "Describe an artwork or upload an image to see a demonstration "
                "of our 6-dimensional cultural evaluation."
            )

            with gr.Row(equal_height=True):
                with gr.Column(scale=1):
                    description_input = gr.Textbox(
                        label="Artwork Description",
                        placeholder=(
                            "Describe the artwork you want to evaluate...\n\n"
                            "Example: A surreal oil painting depicting a floating "
                            "city above misty mountains, blending traditional "
                            "Chinese ink wash technique with modern abstract "
                            "expressionism. The work explores themes of cultural "
                            "displacement and technological progress."
                        ),
                        lines=8,
                        max_lines=15,
                    )
                    image_input = gr.Image(
                        label="Upload Artwork (optional)",
                        type="pil",
                        height=200,
                    )
                    evaluate_btn = gr.Button(
                        "Evaluate",
                        variant="primary",
                        size="lg",
                    )

                with gr.Column(scale=1):
                    radar_output = gr.Plot(
                        label="6D Radar Chart",
                    )
                    results_output = gr.Markdown(
                        label="Evaluation Results",
                    )

            evaluate_btn.click(
                fn=_mock_evaluate,
                inputs=[description_input, image_input],
                outputs=[radar_output, results_output],
            )

            gr.Examples(
                examples=[
                    [
                        "A vibrant street mural in Mexico City depicting Frida Kahlo surrounded by "
                        "marigold flowers and Aztec geometric patterns. The technique combines spray "
                        "paint with hand-painted traditional motifs, creating emotional tension between "
                        "modern urban culture and indigenous heritage.",
                        None,
                    ],
                    [
                        "An AI-generated landscape in the style of traditional Chinese shanshui "
                        "painting, with layered mountains dissolving into digital pixel fragments at "
                        "the edges. Creative synthesis of Eastern ink wash aesthetics with glitch art.",
                        None,
                    ],
                    [
                        "A minimalist ceramic sculpture of a single teardrop, glazed in deep indigo. "
                        "The piece sits on a wooden base inscribed with a haiku about impermanence. "
                        "Technically precise, emotionally restrained yet powerful.",
                        None,
                    ],
                ],
                inputs=[description_input, image_input],
                label="Example Artworks",
            )

        # ==================================================================
        # Tab 3: About
        # ==================================================================
        with gr.Tab("About", id="about"):
            gr.Markdown(
                """
                ## About VULCA

                **VULCA** (Visual Understanding & Linguistic Cultural Assessment) is a
                comprehensive benchmarking platform for evaluating AI models on their ability
                to understand, interpret, and generate culturally grounded artistic content.

                ---

                ### Key Statistics

                | Metric | Value |
                |--------|-------|
                | AI Models Evaluated | 42 |
                | Organizations | 15 |
                | Evaluation Dimensions | 47 (grouped into 6 core) |
                | Cultural Perspectives | 8 |
                | Benchmark Samples | 7,410 |
                | Supported Languages | EN, ZH, JA, RU |

                ---

                ### 6D Evaluation Framework

                The VULCA framework organizes evaluation into six core dimensions, each
                expanded into fine-grained sub-dimensions (47 total):

                1. **Creativity** -- Originality, imagination, divergent thinking, artistic vision
                2. **Technique** -- Technical execution, compositional skill, medium mastery
                3. **Emotion** -- Emotional depth, resonance, affective expression
                4. **Context** -- Cultural awareness, historical grounding, contextual understanding
                5. **Innovation** -- Novel approaches, boundary-pushing, cross-domain synthesis
                6. **Impact** -- Lasting influence, transformative power, audience engagement

                ---

                ### 8 Cultural Perspectives

                Evaluations are anchored across eight cultural traditions to ensure
                cross-cultural fairness:

                - East Asian (Chinese, Japanese, Korean)
                - South Asian
                - Southeast Asian
                - Middle Eastern & Islamic
                - European Classical
                - African
                - Latin American
                - Indigenous & Oceanian

                ---

                ### Research

                - **VULCA Framework**: EMNLP 2025 Findings
                  ([DOI](https://doi.org/10.18653/v1/2025.findings-emnlp.103))
                - **VULCA-Bench**: [arXiv:2601.07986](https://arxiv.org/abs/2601.07986)
                  -- L1-L5 layered definitions with 7,410 benchmark samples

                ---

                ### Links

                - **Website**: [vulcaart.art](https://vulcaart.art)
                - **GitHub**: [github.com/yha9806/EMNLP2025-VULCA](https://github.com/yha9806/EMNLP2025-VULCA)
                - **Demo Booking**: [cal.com/vulcaart/demo](https://cal.com/vulcaart/demo)

                ---

                ### Team

                **Yu, Haorui** -- First Author & Lead Developer

                VULCA is developed as part of ongoing research in cross-cultural AI evaluation,
                building on the VULCA Framework (EMNLP 2025) and VULCA-Bench datasets.

                ---

                <p style="color: #94a3b8; text-align: center; font-size: 0.85em;">
                Built with Gradio. Scores shown in the demo are illustrative;
                the full pipeline uses multi-agent evaluation with cultural anchoring.
                </p>
                """
            )

# ---------------------------------------------------------------------------
# Launch
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
