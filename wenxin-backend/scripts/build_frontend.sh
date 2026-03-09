#!/bin/bash
# Build the React frontend and copy to wenxin-backend/frontend/dist/
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$(dirname "$BACKEND_DIR")/wenxin-moyun"

echo "Building frontend from: $FRONTEND_DIR"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Build
echo "Building production bundle..."
npm run build

# Copy to backend
echo "Copying to backend..."
rm -rf "$BACKEND_DIR/frontend/dist"
mkdir -p "$BACKEND_DIR/frontend"
cp -r dist "$BACKEND_DIR/frontend/dist"

echo "Done! Frontend built at: $BACKEND_DIR/frontend/dist/"
ls -la "$BACKEND_DIR/frontend/dist/"
