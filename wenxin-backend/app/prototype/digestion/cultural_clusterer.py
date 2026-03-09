"""CulturalClusterer — cluster sessions by cultural features using cosine similarity.

Uses pure Python + math stdlib (no scipy/sklearn dependency).
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field

logger = logging.getLogger("vulca")


@dataclass
class CulturalCluster:
    """A cluster of sessions with similar cultural features."""

    cluster_id: str = ""
    feature_centroid: dict[str, float] = field(default_factory=dict)
    session_ids: list[str] = field(default_factory=list)
    size: int = 0
    tradition: str = ""

    def to_dict(self) -> dict:
        return {
            "cluster_id": self.cluster_id,
            "feature_centroid": self.feature_centroid,
            "session_ids": self.session_ids,
            "size": self.size,
            "tradition": self.tradition,
        }


def _cosine_similarity(a: dict[str, float], b: dict[str, float]) -> float:
    """Cosine similarity between two feature dicts."""
    keys = set(a.keys()) | set(b.keys())
    if not keys:
        return 0.0
    dot = sum(a.get(k, 0.0) * b.get(k, 0.0) for k in keys)
    norm_a = math.sqrt(sum(a.get(k, 0.0) ** 2 for k in keys))
    norm_b = math.sqrt(sum(b.get(k, 0.0) ** 2 for k in keys))
    if norm_a < 1e-8 or norm_b < 1e-8:
        return 0.0
    return dot / (norm_a * norm_b)


def _compute_centroid(features_list: list[dict[str, float]]) -> dict[str, float]:
    """Compute the centroid (mean) of a list of feature dicts."""
    if not features_list:
        return {}
    all_keys = set()
    for f in features_list:
        all_keys.update(f.keys())
    centroid: dict[str, float] = {}
    n = len(features_list)
    for k in all_keys:
        centroid[k] = round(sum(f.get(k, 0.0) for f in features_list) / n, 4)
    return centroid


class CulturalClusterer:
    """Cluster sessions by cultural features using greedy centroid-based clustering."""

    def __init__(self, similarity_threshold: float = 0.85) -> None:
        self._threshold = similarity_threshold

    def cluster(self, sessions: list[dict]) -> list[CulturalCluster]:
        """Cluster sessions by their cultural_features vectors.

        Parameters
        ----------
        sessions : list[dict]
            Session dicts (must have 'cultural_features' and 'session_id' keys).

        Returns
        -------
        list[CulturalCluster]
            Clusters with centroids and session IDs.
        """
        # Filter sessions that have cultural features
        valid = [
            s for s in sessions
            if s.get("cultural_features") and isinstance(s["cultural_features"], dict)
        ]
        if not valid:
            return []

        clusters: list[CulturalCluster] = []
        assigned: set[str] = set()

        for session in valid:
            sid = session.get("session_id", "")
            if sid in assigned:
                continue

            features = session["cultural_features"]
            tradition = session.get("tradition", "default")

            # Try to find an existing cluster to join
            best_cluster = None
            best_sim = -1.0
            for cluster in clusters:
                sim = _cosine_similarity(features, cluster.feature_centroid)
                if sim > self._threshold and sim > best_sim:
                    best_cluster = cluster
                    best_sim = sim

            if best_cluster is not None:
                best_cluster.session_ids.append(sid)
                best_cluster.size += 1
                # Recompute centroid
                cluster_features = [
                    s["cultural_features"] for s in valid
                    if s.get("session_id", "") in set(best_cluster.session_ids)
                ]
                best_cluster.feature_centroid = _compute_centroid(cluster_features)
            else:
                # Create new cluster
                cluster_id = f"cluster-{len(clusters):03d}"
                clusters.append(CulturalCluster(
                    cluster_id=cluster_id,
                    feature_centroid=dict(features),
                    session_ids=[sid],
                    size=1,
                    tradition=tradition,
                ))
            assigned.add(sid)

        logger.info("CulturalClusterer: %d sessions → %d clusters", len(valid), len(clusters))
        return clusters
