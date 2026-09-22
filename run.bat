@echo off
title SmartAgri Advisor - Frontend
cd /d "%~dp0"

echo ============================================
echo    SmartAgri Advisor - Frontend Console
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org and try again.
    pause
    exit /b 1
)

if not exist node_modules (
    echo Installing dependencies (first run)...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo Starting dev server at http://localhost:3000
echo Keep this window open. Press Ctrl+C to stop.
echo.
call npm run dev
pause