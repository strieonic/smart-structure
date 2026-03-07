@echo off
title Smart Load Analyzer - Quick Start
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║            Smart Load Analyzer - Quick Start            ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo Starting Error Handler and Auto-Recovery System...

REM Check if error handler is already running
curl -s -f http://localhost:9999/status >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Error Handler already running
) else (
    echo   Starting new Error Handler...
    start /B /MIN "Error Handler" node error-handler.js
    echo ✓ Error Handler started
)

echo Waiting for services to initialize...
timeout /t 5 /nobreak >nul

echo Opening Smart Load Analyzer...
start "" "http://localhost:8080"

echo.
echo ✓ Smart Load Analyzer is starting!
echo ✓ Error handler is monitoring all services
echo ✓ Browser should open automatically
echo.
echo Services:
echo   • Main App: http://localhost:8080
echo   • Status:   http://localhost:8080/site-status.html
echo   • Backend:  http://localhost:5000
echo.
echo This window can be closed - services run in background.
timeout /t 3 /nobreak >nul