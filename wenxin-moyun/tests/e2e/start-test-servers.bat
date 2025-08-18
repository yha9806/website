@echo off
REM Test environment startup script for E2E tests (Windows)
REM This script starts both frontend and backend servers for testing

echo Starting test environment...

REM Configuration
set FRONTEND_PORT=5173
set BACKEND_PORT=8001
set FRONTEND_URL=http://localhost:%FRONTEND_PORT%
set BACKEND_URL=http://localhost:%BACKEND_PORT%

REM Step 1: Initialize test database
echo Step 1: Initializing test database...
cd ..\..\..\..\wenxin-backend
python init_test_db.py
if %errorlevel% neq 0 (
    echo Failed to initialize test database
    exit /b 1
)
echo Test database initialized

REM Step 2: Start backend server
echo Step 2: Starting backend server...
set DATABASE_URL=sqlite+aiosqlite:///./test.db
set ENVIRONMENT=test
start /b cmd /c "python -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload > backend.log 2>&1"

REM Wait for backend to be ready
echo Waiting for backend API to be ready...
timeout /t 5 /nobreak > nul
:WAIT_BACKEND
curl -s -o nul -w "%%{http_code}" "%BACKEND_URL%/health" | findstr /r "200 301 302" > nul
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak > nul
    goto WAIT_BACKEND
)
echo Backend API is ready!

REM Step 3: Start frontend server
echo Step 3: Starting frontend server...
cd ..\wenxin-moyun
set VITE_API_BASE_URL=%BACKEND_URL%
start /b cmd /c "npm run dev -- --port %FRONTEND_PORT% > frontend.log 2>&1"

REM Wait for frontend to be ready
echo Waiting for frontend to be ready...
timeout /t 5 /nobreak > nul
:WAIT_FRONTEND
curl -s -o nul -w "%%{http_code}" "%FRONTEND_URL%" | findstr /r "200 301 302" > nul
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak > nul
    goto WAIT_FRONTEND
)
echo Frontend is ready!

echo.
echo Test environment is ready!
echo Frontend: %FRONTEND_URL%
echo Backend: %BACKEND_URL%
echo API Docs: %BACKEND_URL%/docs
echo.
echo Press any key to stop the test environment...
pause > nul

REM Cleanup
echo Stopping test environment...
taskkill /f /im python.exe > nul 2>&1
taskkill /f /im node.exe > nul 2>&1