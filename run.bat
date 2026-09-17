@echo off
setlocal enabledelayedexpansion
title Veridian Internal Service Agent - Dev Launcher

echo ==============================================================================
echo       VERIDIAN INTERNAL SERVICE AGENT - LOCAL DEVELOPMENT LAUNCHER
echo ==============================================================================
echo.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

:: 1. Verify Backend Environment
echo [1/3] Checking Backend setup...
if not exist "%BACKEND_DIR%\.venv" (
    echo [*] Creating Python virtual environment in backend\.venv...
    python -m venv "%BACKEND_DIR%\.venv"
    echo [*] Installing backend dependencies...
    "%BACKEND_DIR%\.venv\Scripts\pip.exe" install -r "%BACKEND_DIR%\requirements.txt"
) else (
    echo [OK] Backend virtual environment found.
)

:: 2. Verify Frontend Environment
echo.
echo [2/3] Checking Frontend setup...
if not exist "%FRONTEND_DIR%\.env.local" (
    if exist "%FRONTEND_DIR%\.env.example" (
        echo [*] Initializing frontend\.env.local from .env.example...
        copy "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env.local" >nul
    )
)
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [*] Installing frontend npm dependencies...
    cd /d "%FRONTEND_DIR%" && npm install
    cd /d "%ROOT_DIR%"
) else (
    echo [OK] Frontend dependencies found.
)

:: 3. Launch Services
echo.
echo [3/3] Starting Backend (FastAPI) and Frontend (Next.js)...
echo.

:: Launch FastAPI in a dedicated command window
start "Veridian Backend (FastAPI)" /D "%BACKEND_DIR%" cmd /k ".venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000"

:: Launch Next.js in a dedicated command window
start "Veridian Frontend (Next.js)" /D "%FRONTEND_DIR%" cmd /k "npm run dev"

echo ==============================================================================
echo  Services launched in dedicated console windows:
echo  - Frontend:   http://localhost:3000
echo  - Backend:    http://127.0.0.1:8000
echo  - Health API: http://127.0.0.1:8000/health
echo  - API Docs:   http://127.0.0.1:8000/docs
echo ==============================================================================
echo.
echo To stop the servers, close the respective popup command windows.
pause
