@echo off
title SnapStudio AI — Local Engine Launcher
color 0A

echo ======================================================================
echo   SnapStudio AI — Starting Local CPU Backend & Frontend
echo ======================================================================
echo.

REM 1. Start Python Backend
echo [1/3] Launching Python Backend Server (Port 7860)...
start "SnapStudio Local Backend (Port 7860)" cmd /k "cd /d %~dp0 && python backend_app.py"

REM 2. Start Next.js Frontend
echo [2/3] Launching Next.js Frontend (Port 3000)...
start "SnapStudio Next.js Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

REM 3. Wait and Open Browser
echo [3/3] Waiting for servers to boot...
timeout /t 5 /nobreak >nul
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000

echo.
echo ======================================================================
echo   SnapStudio AI is now RUNNING locally!
echo   • Backend:  http://127.0.0.1:7860
echo   • Frontend: http://localhost:3000
echo.
echo   Simply paste http://127.0.0.1:7860 into the header bar to connect.
echo ======================================================================
pause
