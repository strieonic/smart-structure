@echo off
title Smart Load Analyzer - Startup Manager
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              Smart Load Analyzer - Startup                ║
echo ║                  Intelligent Launch System                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1/4] Starting Error Handler & Auto-Recovery System...
echo.

REM Start error handler in background
start /B /MIN "Error Handler" cmd /c "node error-handler.js > logs\startup.log 2>&1"

echo ✓ Error Handler started in background
echo [2/4] Waiting for services to initialize...
echo.

REM Wait for error handler to start
timeout /t 3 /nobreak >nul

echo [3/4] Checking system health...
echo.

REM Wait for services to be ready (max 30 seconds)
set /a counter=0
:check_services
set /a counter+=1

REM Check if error handler is responding
curl -s -f http://localhost:9999/status >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Error Handler: Running
    goto :check_backend
) else (
    if %counter% lss 10 (
        echo   Waiting for Error Handler... (%counter%/10^)
        timeout /t 3 /nobreak >nul
        goto :check_services
    ) else (
        echo ✗ Error Handler failed to start
        goto :manual_start
    )
)

:check_backend
REM Check backend status via error handler
for /f "tokens=*" %%i in ('curl -s http://localhost:9999/status 2^>nul') do set status_response=%%i

echo %status_response% | findstr "running" >nul
if %errorlevel% equ 0 (
    echo ✓ Backend: Running
    echo ✓ Frontend: Running
    echo ✓ All services operational
) else (
    echo   Services starting... (Auto-recovery in progress^)
    timeout /t 5 /nobreak >nul
)

echo.
echo [4/4] Launching Smart Load Analyzer...
echo.

REM Wait a moment for everything to be ready
timeout /t 2 /nobreak >nul

REM Open the site in default browser
echo ✓ Opening Smart Load Analyzer in your browser...
start "" "http://localhost:8080"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    Launch Complete!                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Smart Load Analyzer is now running:
echo   • Main Application: http://localhost:8080
echo   • Site Status:      http://localhost:8080/site-status.html
echo   • Backend API:      http://localhost:5000
echo   • Error Handler:    http://localhost:9999
echo.
echo The error handler is monitoring all services in the background.
echo If any service fails, it will be automatically restarted.
echo.
echo Press any key to close this window (services will continue running)...
pause >nul
exit

:manual_start
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                  Manual Start Required                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo The automatic startup encountered an issue.
echo Starting services manually...
echo.

echo Starting Backend...
start /MIN "Backend" cmd /c "npm run dev"
timeout /t 5 /nobreak >nul

echo Starting Frontend...
start /MIN "Frontend" cmd /c "cd frontend && python -m http.server 8080"
timeout /t 3 /nobreak >nul

echo.
echo Manual start complete. Opening browser...
start "" "http://localhost:8080"

echo.
echo Press any key to close this window...
pause >nul
exit