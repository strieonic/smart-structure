@echo off
setlocal enabledelayedexpansion

echo ========================================
echo System Verification Script
echo ========================================
echo.

set ERRORS=0

REM Check Node.js
echo [1/10] Checking Node.js...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js !NODE_VERSION! installed
)

REM Check npm
echo [2/10] Checking npm...
npm --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm !NPM_VERSION! installed
)

REM Check PostgreSQL
echo [3/10] Checking PostgreSQL...
psql --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] PostgreSQL command not found in PATH
) else (
    for /f "tokens=*" %%i in ('psql --version') do set PG_VERSION=%%i
    echo [OK] !PG_VERSION!
)

REM Check Python
echo [4/10] Checking Python...
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Python not found (needed for frontend server)
) else (
    for /f "tokens=*" %%i in ('python --version') do set PY_VERSION=%%i
    echo [OK] !PY_VERSION! installed
)

REM Check if node_modules exists
echo [5/10] Checking dependencies...
if exist "node_modules\" (
    echo [OK] node_modules folder exists
) else (
    echo [ERROR] node_modules not found - run: npm install
    set /a ERRORS+=1
)

REM Check if .env exists
echo [6/10] Checking environment file...
if exist ".env" (
    echo [OK] .env file exists
) else (
    echo [ERROR] .env file not found - copy from .env.example
    set /a ERRORS+=1
)

REM Check if Prisma client is generated
echo [7/10] Checking Prisma client...
if exist "node_modules\.prisma\client\" (
    echo [OK] Prisma client generated
) else (
    echo [ERROR] Prisma client not generated - run: npm run prisma:generate
    set /a ERRORS+=1
)

REM Check frontend files
echo [8/10] Checking frontend files...
if exist "frontend\index.html" (
    if exist "frontend\script.js" (
        if exist "frontend\style.css" (
            echo [OK] All frontend files present
        ) else (
            echo [ERROR] frontend\style.css missing
            set /a ERRORS+=1
        )
    ) else (
        echo [ERROR] frontend\script.js missing
        set /a ERRORS+=1
    )
) else (
    echo [ERROR] frontend\index.html missing
    set /a ERRORS+=1
)

REM Check if ports are available
echo [9/10] Checking ports...
netstat -ano | findstr :5000 > nul
if %errorlevel% == 0 (
    echo [WARNING] Port 5000 already in use
) else (
    echo [OK] Port 5000 available
)

netstat -ano | findstr :8080 > nul
if %errorlevel% == 0 (
    echo [WARNING] Port 8080 already in use
) else (
    echo [OK] Port 8080 available
)

REM Check database connection
echo [10/10] Checking database...
if exist ".env" (
    findstr /C:"DATABASE_URL" .env > nul
    if %errorlevel% == 0 (
        echo [OK] DATABASE_URL configured in .env
    ) else (
        echo [ERROR] DATABASE_URL not found in .env
        set /a ERRORS+=1
    )
) else (
    echo [SKIP] Cannot check database (no .env file)
)

echo.
echo ========================================
echo Verification Complete
echo ========================================

if %ERRORS% == 0 (
    echo [SUCCESS] All checks passed!
    echo.
    echo You can now run: start-all.bat
) else (
    echo [FAILED] Found %ERRORS% error(s)
    echo.
    echo Please fix the errors above before starting the application.
)

echo.
pause
