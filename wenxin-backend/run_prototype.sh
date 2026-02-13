#!/bin/bash
# Load .env and execute the given command in the prototype venv.
# Usage: ./run_prototype.sh python3 app/prototype/tools/validate_api_connections.py
set -a
source "$(dirname "$0")/.env"
set +a
exec "$@"
