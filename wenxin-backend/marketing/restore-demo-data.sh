#!/usr/bin/env bash
# Restore NB2 demo data (images + sessions) for video recording / demos.
#
# Usage:
#   cd wenxin-backend
#   bash marketing/restore-demo-data.sh
#
# What it does:
#   1. Extracts real NB2-generated images into checkpoints/draft/
#   2. Merges NB2 session records into data/sessions.jsonl (dedup by session_id)

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ARCHIVE="$SCRIPT_DIR/nb2-demo-data.tar.gz"

# Reassemble from split parts if needed
if [ ! -f "$ARCHIVE" ]; then
  PARTS="$SCRIPT_DIR/nb2-demo-data.tar.gz.part"
  if ls "${PARTS}"* 1>/dev/null 2>&1; then
    echo "Reassembling archive from split parts..."
    cat "${PARTS}"* > "$ARCHIVE"
  else
    echo "Error: $ARCHIVE not found (and no split parts found)"
    exit 1
  fi
fi

cd "$BACKEND_DIR/app/prototype"

echo "Extracting NB2 images to checkpoints/draft/..."
tar xzf "$ARCHIVE" --no-same-owner checkpoints/ 2>/dev/null || tar xzf "$ARCHIVE" --no-same-owner -C . 2>/dev/null

# Merge sessions
echo "Merging NB2 session records..."
TEMP_SESSIONS=$(mktemp)
tar xzf "$ARCHIVE" --to-stdout nb2_sessions.jsonl 2>/dev/null > "$TEMP_SESSIONS" || true

if [ -s "$TEMP_SESSIONS" ]; then
  python3 -c "
import json, sys

# Load existing session IDs
existing_ids = set()
sessions_file = 'data/sessions.jsonl'
try:
    with open(sessions_file) as f:
        for line in f:
            s = json.loads(line)
            existing_ids.add(s.get('session_id', ''))
except FileNotFoundError:
    pass

# Append new sessions
added = 0
with open('$TEMP_SESSIONS') as f:
    new_lines = []
    for line in f:
        s = json.loads(line)
        if s.get('session_id', '') not in existing_ids:
            new_lines.append(line.strip())
            added += 1

if new_lines:
    with open(sessions_file, 'a') as f:
        f.write('\n'.join(new_lines) + '\n')

print(f'Added {added} new sessions ({len(existing_ids)} already existed)')
"
fi

rm -f "$TEMP_SESSIONS"

# Count restored images
IMG_COUNT=$(find checkpoints/draft/ -name "*.png" -size +100k 2>/dev/null | wc -l)
echo ""
echo "Done! Restored $IMG_COUNT NB2 images across $(cat "$SCRIPT_DIR/session_ids.txt" 2>/dev/null | wc -l || echo '?') sessions."
echo "Start the backend and visit /gallery to verify."
