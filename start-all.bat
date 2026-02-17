@echo off
echo ========================================
echo Smart Load Distribution Analyzer
echo Starting Backend and Frontend
echo ========================================
echo.

REM Check if backend is already running
netstat -ano | findstr :5000 > nul
if %errorlevel% == 0 (
    echo Backend already running on port 5000
) else (
    echo Starting Backend...
    start "Backend Server" cmd /k "npm run dev"
    timeout /t 5 /nobreak > nul
)

REM Check if frontend is already running
netstat -ano | findstr :8080 > nul
if %errorlevel% == 0 (
    echo Frontend already running on port 8080
) else (
    echo Starting Frontend...
    start "Frontend Server" cmd /k "cd frontend && python -m http.server 8080"
    timeout /t 2 /nobreak > nul
)

echo.
echo ========================================
echo Services Started!
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:8080
echo Health:   http://localhost:5000/api/v1/health
echo ========================================
echo.
echo Opening browser...
timeout /t 2 /nobreak > nul
start http://localhost:8080

echo.
echo Press any key to stop all services...
pause > nul

echo.
echo Stopping services...
taskkill /FI "WINDOWTITLE eq Backend Server*" /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Server*" /F > nul 2>&1

echo Services stopped.
pause
