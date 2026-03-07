@echo off
echo ========================================
echo Smart Load Distribution Analyzer
echo With Intelligent Error Monitoring
echo ========================================
echo.

echo Starting Error Handler & Auto-Recovery System...
echo.
echo This will:
echo   - Automatically start backend and frontend servers
echo   - Monitor server health continuously
echo   - Auto-restart servers if they crash
echo   - Fix common errors automatically
echo   - Show notifications for issues
echo   - Use AI for complex error debugging
echo.

start "Error Handler" cmd /k "node error-handler.js"

echo.
echo ========================================
echo System Started with Monitoring!
echo ========================================
echo Backend:       http://localhost:5000
echo Frontend:      http://localhost:8080
echo Notifications: http://localhost:9999
echo Logs:          logs/error-handler.log
echo ========================================
echo.
echo The error handler is running in a separate window.
echo Close that window to stop monitoring.
echo.
echo Opening frontend in 5 seconds...
timeout /t 5 /nobreak > nul
start http://localhost:8080

echo.
pause
