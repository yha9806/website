#!/bin/bash
# Test environment startup script for E2E tests
# This script starts both frontend and backend servers for testing

echo "🚀 Starting test environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=5173
BACKEND_PORT=8001
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
BACKEND_URL="http://localhost:${BACKEND_PORT}"

# Cleanup function
cleanup() {
    echo -e "${YELLOW}Cleaning up test environment...${NC}"
    # Kill frontend and backend processes
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up trap for cleanup on exit
trap cleanup EXIT INT TERM

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}Waiting for ${service_name} to be ready at ${url}...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
            echo -e "${GREEN}✓ ${service_name} is ready!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    echo -e "${RED}✗ ${service_name} failed to start after ${max_attempts} attempts${NC}"
    return 1
}

# Step 1: Initialize test database
echo -e "${YELLOW}Step 1: Initializing test database...${NC}"
cd ../../wenxin-backend
python init_test_db.py
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to initialize test database${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Test database initialized${NC}"

# Step 2: Start backend server
echo -e "${YELLOW}Step 2: Starting backend server...${NC}"
cd ../wenxin-backend
export DATABASE_URL="sqlite+aiosqlite:///./test.db"
export ENVIRONMENT="test"
python -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
wait_for_service "${BACKEND_URL}/health" "Backend API"
if [ $? -ne 0 ]; then
    echo -e "${RED}Backend failed to start. Check backend.log for details${NC}"
    cat backend.log
    exit 1
fi

# Step 3: Start frontend server
echo -e "${YELLOW}Step 3: Starting frontend server...${NC}"
cd ../wenxin-moyun
export VITE_API_BASE_URL="${BACKEND_URL}"
npm run dev -- --port $FRONTEND_PORT > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to be ready
wait_for_service "${FRONTEND_URL}" "Frontend"
if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend failed to start. Check frontend.log for details${NC}"
    cat frontend.log
    exit 1
fi

echo -e "${GREEN}✅ Test environment is ready!${NC}"
echo -e "Frontend: ${FRONTEND_URL}"
echo -e "Backend: ${BACKEND_URL}"
echo -e "API Docs: ${BACKEND_URL}/docs"

# Keep the script running
echo -e "${YELLOW}Press Ctrl+C to stop the test environment${NC}"
wait