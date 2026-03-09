"""Test ConceptCrystallizer."""
from __future__ import annotations
import pytest
from unittest.mock import patch
from app.prototype.digestion.concept_crystallizer import ConceptCrystallizer, CulturalConcept
from app.prototype.digestion.cultural_clusterer import CulturalCluster


class TestConceptCrystallizer:
    def test_empty_clusters(self):
        c = ConceptCrystallizer()
        assert c.crystallize([], []) == []

    def test_small_cluster_ignored(self):
        cluster = CulturalCluster(cluster_id="c1", size=2, session_ids=["s1", "s2"],
                                   feature_centroid={"a": 0.5}, tradition="default")
        c = ConceptCrystallizer(min_cluster_size=5)
        assert c.crystallize([cluster], []) == []

    def test_large_cluster_crystallized(self):
        cluster = CulturalCluster(
            cluster_id="c1", size=6,
            session_ids=[f"s{i}" for i in range(6)],
            feature_centroid={"l5_emphasis": 0.9, "cultural_depth": 0.8},
            tradition="chinese_xieyi",
        )
        sessions = [
            {"session_id": f"s{i}", "intent": f"test {i}", "tradition": "chinese_xieyi"}
            for i in range(6)
        ]
        c = ConceptCrystallizer(min_cluster_size=5)
        # Will use rule-based since no LLM
        concepts = c.crystallize([cluster], sessions)
        assert len(concepts) == 1
        assert concepts[0].name != ""
        assert concepts[0].confidence > 0

    def test_concept_to_dict(self):
        c = CulturalConcept(name="test_concept", description="A test")
        d = c.to_dict()
        assert d["name"] == "test_concept"
