@echo off
title Smart Load Analyzer - Startup
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║         Smart Load Analyzer - Starting Services         ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Kill any existing processes on our ports
echo [1/4] Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9999') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul
echo    ✓ Ports cleared

REM Start Error Handler
echo.
echo [2/4] Starting Error Handler...
start /B /MIN "Error Handler" node error-handler.js
timeout /t 3 /nobreak >nul
echo    ✓ Error Handler started

REM Wait for services to initialize
echo.
echo [3/4] Waiting for services to initialize...
timeout /t 10 /nobreak >nul

REM Check if services are running
echo.
echo [4/4] Verifying services...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5000/api/v1/health' -UseBasicParsing -TimeoutSec 2 | Out-Null; Write-Host '   ✓ Backend: Running' -ForegroundColor Green } catch { Write-Host '   ✗ Backend: Not responding' -ForegroundColor Red }"
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8080' -UseBasicParsing -TimeoutSec 2 | Out-Null; Write-Host '   ✓ Frontend: Running' -ForegroundColor Green } catch { Write-Host '   ✗ Frontend: Not responding' -ForegroundColor Red }"
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:9999/status' -UseBasicParsing -TimeoutSec 2 | Out-Null; Write-Host '   ✓ Error Handler: Running' -ForegroundColor Green } catch { Write-Host '   ✗ Error Handler: Not responding' -ForegroundColor Red }"

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                  STARTUP COMPLETE!                       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo Your application is ready at:
echo.
echo   🌐 Main App:    http://localhost:8080
echo   📊 Site Status: http://localhost:8080/site-status.html
echo   🔧 Backend API: http://localhost:5000
echo.
echo Opening browser...
start "" "http://localhost:8080"
echo.
echo Press any key to close this window (services will continue running)...
pause >nul
