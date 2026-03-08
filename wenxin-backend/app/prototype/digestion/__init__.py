"""Digestion System — three-layer self-evolution from session data.

Layers:
1. Perception: DigestAggregator — aggregate sessions by tradition/skill/time
2. Digestion: PatternDetector + PreferenceLearner — find trends and learn preferences
3. Evolution: ContextEvolver — safely update evolved_context.json
"""
