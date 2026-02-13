#!/usr/bin/env bash
# Daily validation runner for Step 2 VULCA prototype.
#
# Usage:
#   TOGETHER_API_KEY=... bash tools/run_daily.sh together_flux d01
#   bash tools/run_daily.sh mock d00
#
# Arguments:
#   $1  provider   "mock" or "together_flux" (default: mock)
#   $2  day_label  e.g. "d01", "d02" (default: d00)

set -euo pipefail

PROVIDER="${1:-mock}"
DAY="${2:-d00}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROTO_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$(dirname "$(dirname "$PROTO_DIR")")"
REPORTS_DIR="$PROTO_DIR/reports"
REPO_ROOT="$(dirname "$BACKEND_DIR")"

cd "$BACKEND_DIR"

echo "============================================================"
echo "  VULCA Daily Run: $DAY  |  Provider: $PROVIDER"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

FAIL=0

# --- Step 1: Provider validation ---
echo ""
echo "[1/4] Provider validation..."
if [ "$PROVIDER" = "together_flux" ]; then
    if [ -z "${TOGETHER_API_KEY:-}" ]; then
        echo "  ERROR: TOGETHER_API_KEY not set"
        exit 1
    fi
    if ! python3 "$SCRIPT_DIR/validate_provider_real.py" 2>&1 | tail -5; then
        echo "  WARN: Provider validation had issues"
        FAIL=$((FAIL + 1))
    fi
else
    echo "  Using mock provider — skipping real API check"
fi

# --- Step 2: Full regression (6 scripts) ---
echo ""
echo "[2/4] Full regression suite..."
for script in validate_critic.py validate_queen.py validate_pipeline_e2e.py \
              validate_archivist.py validate_fallback.py validate_regression.py; do
    echo "  Running $script..."
    if ! python3 "$SCRIPT_DIR/$script" 2>&1 | tail -3; then
        echo "  FAIL: $script"
        FAIL=$((FAIL + 1))
    fi
done

# --- Step 3: Benchmark ---
echo ""
echo "[3/4] Benchmark run..."
OUTPUT_JSON="$REPORTS_DIR/bench-$DAY-$PROVIDER.json"
BENCH_ARGS="--provider $PROVIDER --output $OUTPUT_JSON"
if [ "$PROVIDER" = "together_flux" ]; then
    BENCH_ARGS="$BENCH_ARGS --steps 4 --width 256 --height 256"
fi
if ! python3 "$SCRIPT_DIR/run_benchmark.py" $BENCH_ARGS 2>&1; then
    echo "  FAIL: benchmark"
    FAIL=$((FAIL + 1))
fi

# --- Step 4: Post-plan validation hook ---
echo ""
echo "[4/4] Post-plan validation hook..."
HOOK="$REPO_ROOT/.claude/hooks/post-plan-validate.sh"
if [ -f "$HOOK" ]; then
    if ! bash "$HOOK" 2>&1 | tail -3; then
        echo "  WARN: Hook had issues"
    fi
else
    echo "  Hook not found at $HOOK — skipping"
fi

# --- Summary ---
echo ""
echo "============================================================"
if [ $FAIL -eq 0 ]; then
    echo "  DAILY RUN COMPLETE: ALL PASSED"
else
    echo "  DAILY RUN COMPLETE: $FAIL FAILURE(S)"
fi
echo "  Benchmark output: $OUTPUT_JSON"
echo "============================================================"

exit $FAIL
