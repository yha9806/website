"""Task sampler for blind evaluation experiment.

Selects 30 tasks from index.v1.json (24 samples) and tasks-20.json (20 benchmarks),
categorized into three groups of 10:
  - poetic:   ambiguous/atmospheric subjects testing L4/L5
  - cultural: strong cultural constraints testing L3/L5
  - taboo:    taboo/cross-cultural subjects testing L1-L3 + taboo handling
"""

from __future__ import annotations

import json
from pathlib import Path

from app.prototype.blind_eval.experiment_config import BlindTask

_DATA_ROOT = Path(__file__).resolve().parent.parent / "data"
_INDEX_PATH = _DATA_ROOT / "samples" / "index.v1.json"
_TASKS_PATH = _DATA_ROOT / "benchmarks" / "tasks-20.json"

# ── Category assignments ──────────────────────────────────────────────
# Maps sample_id / task_id → category + expected emphasis layers

_POETIC_IDS: dict[str, list[str]] = {
    # From index.v1.json
    "vulca-bench-0001": ["L4", "L5"],       # 董源潇湘图
    "vulca-bench-0003": ["L4", "L5"],       # 徐渭墨葡萄
    "vulca-bench-0004": ["L3", "L4", "L5"], # 八大山人荷花水鸟
    "vulca-bench-0007": ["L4", "L5"],       # 透纳雨蒸汽
    "vulca-bench-0008": ["L4", "L5"],       # 莫奈睡莲
    "vulca-bench-0023": ["L4", "L5"],       # 黄公望富春山居
    "vulca-bench-0017": ["L2", "L4"],       # 透纳水彩
    # From tasks-20.json
    "bench-011": ["L4", "L5"],              # 马远一角构图
    "bench-017": ["L4", "L5"],              # 张大千泼墨
    "bench-008": ["L2", "L4"],              # Turner atmospheric
}

_CULTURAL_IDS: dict[str, list[str]] = {
    # From index.v1.json
    "vulca-bench-0013": ["L2", "L3"],       # 宋徽宗瑞鹤图
    "vulca-bench-0014": ["L2", "L3"],       # 张萱虢国夫人
    "vulca-bench-0015": ["L2", "L3", "L5"], # 阿尔罕布拉宫
    "vulca-bench-0016": ["L2", "L3"],       # 蓝色清真寺
    "vulca-bench-0019": ["L2", "L3", "L4"], # 贝宁青铜
    "vulca-bench-0020": ["L3", "L5"],       # 肯特织物
    "vulca-bench-0021": ["L2", "L3", "L4"], # 莫卧儿细密画
    "vulca-bench-0022": ["L2", "L3", "L5"], # 阿旃陀石窟
    # From tasks-20.json
    "bench-005": ["L2", "L3"],              # Alhambra tessellation
    "bench-018": ["L2", "L3"],              # 仇英汉宫春晓
}

_TABOO_IDS: dict[str, list[str]] = {
    # From index.v1.json
    "vulca-bench-0009": ["L1", "L3", "L5"], # 跨文化对比
    "vulca-bench-0010": ["L1", "L2"],       # 通用构图分析
    "vulca-bench-0011": ["L1", "L2", "L3"], # 色彩理论
    "vulca-bench-0012": ["L2", "L3", "L5"], # 蔡国强火药
    "vulca-bench-0002": ["L1", "L2", "L4"], # 齐白石虾 (写意→写实 tension)
    "vulca-bench-0024": ["L1", "L2", "L3"], # 蒙娜丽莎
    # From tasks-20.json
    "bench-010": ["L1", "L3"],              # "primitive art" taboo trigger
    "bench-020": ["L1", "L3"],              # "oriental uncivilized" taboo trigger
    "bench-009": ["L3", "L5"],              # cross-cultural contemporary
    "bench-019": ["L1", "L2"],              # abstract minimalist
}


def _load_index_samples() -> dict[str, dict]:
    """Load index.v1.json into {sample_id: sample_dict}."""
    if not _INDEX_PATH.exists():
        return {}
    data = json.loads(_INDEX_PATH.read_text(encoding="utf-8"))
    return {s["sample_id"]: s for s in data.get("samples", [])}


def _load_benchmark_tasks() -> dict[str, dict]:
    """Load tasks-20.json into {task_id: task_dict}."""
    if not _TASKS_PATH.exists():
        return {}
    tasks = json.loads(_TASKS_PATH.read_text(encoding="utf-8"))
    return {t["task_id"]: t for t in tasks}


def _make_blind_task(
    task_id: str,
    subject: str,
    tradition: str,
    category: str,
    emphasis: list[str],
) -> BlindTask:
    return BlindTask(
        task_id=task_id,
        subject=subject,
        tradition=tradition,
        category=category,
        expected_emphasis=emphasis,
    )


def sample_tasks(n_per_category: int = 10) -> list[BlindTask]:
    """Sample blind evaluation tasks: n_per_category per category.

    Returns list of BlindTask, sorted by category then task_id.
    """
    index_samples = _load_index_samples()
    bench_tasks = _load_benchmark_tasks()
    tasks: list[BlindTask] = []

    for category, id_map in [
        ("poetic", _POETIC_IDS),
        ("cultural", _CULTURAL_IDS),
        ("taboo", _TABOO_IDS),
    ]:
        collected = 0
        for tid, emphasis in id_map.items():
            if collected >= n_per_category:
                break
            # Try index samples first
            if tid in index_samples:
                s = index_samples[tid]
                tasks.append(_make_blind_task(
                    task_id=tid,
                    subject=s["subject_en"],
                    tradition=s["cultural_tradition"],
                    category=category,
                    emphasis=emphasis,
                ))
                collected += 1
            elif tid in bench_tasks:
                t = bench_tasks[tid]
                tasks.append(_make_blind_task(
                    task_id=tid,
                    subject=t["subject"],
                    tradition=t["cultural_tradition"],
                    category=category,
                    emphasis=emphasis,
                ))
                collected += 1

    tasks.sort(key=lambda t: (t.category, t.task_id))
    return tasks


def get_category_counts(tasks: list[BlindTask]) -> dict[str, int]:
    """Return {category: count} for a list of tasks."""
    counts: dict[str, int] = {}
    for t in tasks:
        counts[t.category] = counts.get(t.category, 0) + 1
    return counts
