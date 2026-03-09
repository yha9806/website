#!/usr/bin/env bash
# publish.sh - One-click PyPI publish for vulca package
#
# Usage:
#   ./scripts/publish.sh          # Upload to PyPI (production)
#   ./scripts/publish.sh --test   # Upload to TestPyPI
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Parse flags
USE_TEST_PYPI=false
for arg in "$@"; do
    case "$arg" in
        --test) USE_TEST_PYPI=true ;;
        *) echo "Unknown flag: $arg"; echo "Usage: $0 [--test]"; exit 1 ;;
    esac
done

cd "$PROJECT_DIR"
echo "==> Working directory: $PROJECT_DIR"

# ---- 1. Check prerequisites ------------------------------------------------
for cmd in python3 twine; do
    if ! command -v "$cmd" &>/dev/null; then
        echo "ERROR: '$cmd' is not installed."
        if [ "$cmd" = "twine" ]; then
            echo "  Install it with:  pip install twine build"
        fi
        exit 1
    fi
done

if ! python3 -m build --version &>/dev/null; then
    echo "ERROR: 'build' module is not installed."
    echo "  Install it with:  pip install build"
    exit 1
fi

# ---- 2. Clean old artifacts -------------------------------------------------
echo "==> Cleaning old dist/"
rm -rf dist/ build/ *.egg-info

# ---- 3. Build sdist + wheel -------------------------------------------------
echo "==> Building sdist and wheel..."
python3 -m build

# ---- 4. Validate -----------------------------------------------------------
echo "==> Running twine check..."
twine check dist/*

# ---- 5. Upload --------------------------------------------------------------
if [ "$USE_TEST_PYPI" = true ]; then
    echo "==> Uploading to TestPyPI..."
    twine upload --repository testpypi dist/*
    echo ""
    echo "Done! View at: https://test.pypi.org/project/vulca/"
    echo "Install with:  pip install -i https://test.pypi.org/simple/ vulca"
else
    echo "==> Uploading to PyPI..."
    twine upload dist/*
    echo ""
    echo "Done! View at: https://pypi.org/project/vulca/"
    echo "Install with:  pip install vulca"
fi
