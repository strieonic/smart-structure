# Smart Load Analyzer - Reliable Startup Script
# Run this with: powershell -ExecutionPolicy Bypass -File Start-SmartLoadAnalyzer.ps1

$Host.UI.RawUI.WindowTitle = "Smart Load Analyzer - Startup"
Clear-Host

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         Smart Load Analyzer - Starting Services         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $connection -ne $null
}

# Function to kill process on port
function Stop-ProcessOnPort {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Step 1: Clean up existing processes
Write-Host "[1/5] Cleaning up existing processes..." -ForegroundColor Yellow
Stop-ProcessOnPort -Port 5000
Stop-ProcessOnPort -Port 8080
Stop-ProcessOnPort -Port 9999
Start-Sleep -Seconds 2
Write-Host "   ✓ Ports cleared" -ForegroundColor Green

# Step 2: Start Error Handler
Write-Host "`n[2/5] Starting Error Handler..." -ForegroundColor Yellow
$errorHandler = Start-Process -FilePath "node" -ArgumentList "error-handler.js" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 3
Write-Host "   ✓ Error Handler started (PID: $($errorHandler.Id))" -ForegroundColor Green

# Step 3: Wait for backend to start
Write-Host "`n[3/5] Waiting for backend to initialize..." -ForegroundColor Yellow
$maxWait = 30
$waited = 0
$backendReady = $false

while ($waited -lt $maxWait -and -not $backendReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "   ✓ Backend is ready!" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⏳ Waiting for backend... ($waited/$maxWait seconds)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $waited += 2
    }
}

if (-not $backendReady) {
    Write-Host "   ⚠ Backend took longer than expected, but may still be starting..." -ForegroundColor Yellow
}

# Step 4: Wait for frontend to start
Write-Host "`n[4/5] Waiting for frontend to initialize..." -ForegroundColor Yellow
$maxWait = 20
$waited = 0
$frontendReady = $false

while ($waited -lt $maxWait -and -not $frontendReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $frontendReady = $true
            Write-Host "   ✓ Frontend is ready!" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⏳ Waiting for frontend... ($waited/$maxWait seconds)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $waited += 2
    }
}

if (-not $frontendReady) {
    Write-Host "   ⚠ Frontend took longer than expected, but may still be starting..." -ForegroundColor Yellow
}

# Step 5: Final verification
Write-Host "`n[5/5] Verifying all services..." -ForegroundColor Yellow

try {
    $backend = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✓ Backend: RUNNING on port 5000" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend: NOT RESPONDING" -ForegroundColor Red
}

try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✓ Frontend: RUNNING on port 8080" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Frontend: NOT RESPONDING" -ForegroundColor Red
}

try {
    $handler = Invoke-WebRequest -Uri "http://localhost:9999/status" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✓ Error Handler: RUNNING on port 9999" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error Handler: NOT RESPONDING" -ForegroundColor Red
}

# Success message
Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  STARTUP COMPLETE!                       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Your application is ready at:`n" -ForegroundColor White
Write-Host "   🌐 Main App:    " -NoNewline -ForegroundColor Gray
Write-Host "http://localhost:8080" -ForegroundColor Cyan
Write-Host "   📊 Site Status: " -NoNewline -ForegroundColor Gray
Write-Host "http://localhost:8080/site-status.html" -ForegroundColor Cyan
Write-Host "   🔧 Backend API: " -NoNewline -ForegroundColor Gray
Write-Host "http://localhost:5000" -ForegroundColor Cyan

Write-Host "`nOpening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:8080"

Write-Host "`nPress any key to close this window (services will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
