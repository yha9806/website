"""Dynamic weight modulation for L1-L5 evaluation.

Replaces fixed cultural weight lookup with:
    w_d = base_w_d * (1 + alpha * (1 - confidence_d)) * decay(round) * signal_boost(signals)

Normalized so sum(w) = 1.0 always.

Based on VULCA v2 dynamic fusion design (docs/vulca-l1l5-dynamic-fusion-design.md).
"""

from __future__ import annotations

from app.prototype.agents.critic_config import DIMENSIONS
from app.prototype.agents.layer_state import CrossLayerSignal, LayerState


def compute_dynamic_weights(
    base_weights: dict[str, float],
    layer_states: dict[str, LayerState],
    round_num: int = 1,
    cross_layer_signals: list[CrossLayerSignal] | None = None,
    alpha: float = 0.5,
    decay_rate: float = 0.05,
    max_deviation: float = 0.20,
) -> dict[str, float]:
    """Compute modulated weights based on confidence, round, and signals.

    Parameters
    ----------
    base_weights : dict
        Fixed cultural weight table (sum = 1.0).
    layer_states : dict
        Current LayerState for each dimension.
    round_num : int
        Current evaluation round (1-based).
    cross_layer_signals : list
        Active cross-layer signals.
    alpha : float
        Confidence modulation strength. Higher = stronger boost for
        low-confidence dimensions.
    decay_rate : float
        Per-round weight decay toward uniform.
    max_deviation : float
        Maximum allowed deviation from base weight per dimension.

    Returns
    -------
    dict mapping dimension ID → modulated weight (sum = 1.0).
    """
    signals = cross_layer_signals or []

    # Step 1: Confidence modulation
    # Low confidence → weight increases (need more evaluation)
    raw: dict[str, float] = {}
    for dim in DIMENSIONS:
        base = base_weights.get(dim, 0.2)
        ls = layer_states.get(dim)
        conf = ls.confidence if ls else 0.5

        # Modulate: boost low-confidence dimensions
        confidence_factor = 1.0 + alpha * (1.0 - conf)
        raw[dim] = base * confidence_factor

    # Step 2: Round decay — later rounds decay toward uniform
    decay = 1.0 - decay_rate * (round_num - 1)
    decay = max(0.5, decay)  # floor at 50% of original emphasis
    uniform = 1.0 / len(DIMENSIONS)
    for dim in DIMENSIONS:
        raw[dim] = decay * raw[dim] + (1.0 - decay) * uniform

    # Step 3: Signal boost — REINTERPRET/CONFLICT targets get boosted
    _LABEL_TO_DIM = {
        "L1": "visual_perception", "L2": "technical_analysis",
        "L3": "cultural_context", "L4": "critical_interpretation",
        "L5": "philosophical_aesthetic",
    }
    signal_boost: dict[str, float] = {dim: 1.0 for dim in DIMENSIONS}
    for sig in signals:
        if sig.signal_type.value in ("reinterpret", "conflict", "evidence_gap"):
            target_dim = _LABEL_TO_DIM.get(sig.target_layer, sig.target_layer)
            if target_dim in signal_boost:
                signal_boost[target_dim] += 0.2 * sig.strength

    for dim in DIMENSIONS:
        raw[dim] *= signal_boost[dim]

    # Step 4: Clamp deviation from base
    for dim in DIMENSIONS:
        base = base_weights.get(dim, 0.2)
        lo = max(0.01, base - max_deviation)
        hi = base + max_deviation
        raw[dim] = max(lo, min(hi, raw[dim]))

    # Step 5: Normalize to sum = 1.0
    total = sum(raw.values())
    if total < 1e-12:
        return {dim: 1.0 / len(DIMENSIONS) for dim in DIMENSIONS}

    return {dim: raw[dim] / total for dim in DIMENSIONS}
