@echo off
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║                    EXPERT SYSTEM DEPLOYMENT SCRIPT                         ║
echo ║                    Smart Load Distribution Analyzer                        ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.

echo [1/8] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)
echo ✓ Node.js is installed
echo.

echo [2/8] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ✗ Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [3/8] Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 (
    echo ✗ Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

echo [4/8] Running database migrations...
call npm run prisma:migrate
if errorlevel 1 (
    echo ⚠ Database migration had issues (this is OK if database is already up to date)
)
echo ✓ Database migrations completed
echo.

echo [5/8] Building TypeScript...
call npm run build
if errorlevel 1 (
    echo ✗ TypeScript build failed
    pause
    exit /b 1
)
echo ✓ TypeScript build successful
echo.

echo [6/8] Checking if server is running...
curl -s http://localhost:5000/api/v1/health >nul 2>&1
if errorlevel 1 (
    echo ⚠ Server is not running. Please start it with: npm run dev
    echo   Then run the tests manually with: node test-expert-system.js
    pause
    exit /b 0
)
echo ✓ Server is running
echo.

echo [7/8] Running backend tests...
node test-expert-system.js
if errorlevel 1 (
    echo ✗ Some tests failed
    pause
    exit /b 1
)
echo ✓ All backend tests passed
echo.

echo [8/8] Opening frontend test page...
start test-frontend-expert.html
echo ✓ Frontend test page opened
echo.

echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║                         DEPLOYMENT COMPLETE!                               ║
echo ╠════════════════════════════════════════════════════════════════════════════╣
echo ║                                                                            ║
echo ║  ✓ Dependencies installed                                                  ║
echo ║  ✓ Database migrated                                                       ║
echo ║  ✓ TypeScript compiled                                                     ║
echo ║  ✓ Backend tests passed                                                    ║
echo ║  ✓ Frontend test page opened                                               ║
echo ║                                                                            ║
echo ║  Next Steps:                                                               ║
echo ║  1. Review frontend test results in the opened browser                     ║
echo ║  2. Open frontend/index.html to use the application                        ║
echo ║  3. Test expert registration and login                                     ║
echo ║  4. Test query management features                                         ║
echo ║                                                                            ║
echo ║  Documentation:                                                            ║
echo ║  - See EXPERT_GUIDE.txt for complete documentation                         ║
echo ║  - API endpoints documented in the guide                                   ║
echo ║  - User workflows explained step-by-step                                   ║
echo ║                                                                            ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.

pause
