# Smart Load Analyzer - Intelligent Startup Script
# Starts error handler first, ensures all services are running, then launches the site

param(
    [switch]$NoOpen,  # Don't open browser automatically
    [switch]$Quiet    # Minimal output
)

# Set console properties
$Host.UI.RawUI.WindowTitle = "Smart Load Analyzer - Startup Manager"
if (-not $Quiet) {
    Clear-Host
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║              Smart Load Analyzer - Startup                ║" -ForegroundColor Cyan
    Write-Host "║                  Intelligent Launch System                ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# Configuration
$ErrorHandlerPort = 9999
$BackendPort = 5000
$FrontendPort = 8080
$MaxWaitTime = 60  # Maximum wait time in seconds
$CheckInterval = 3  # Check every 3 seconds

# Create logs directory if it doesn't exist
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to check service health
function Test-ServiceHealth {
    param([string]$Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# Function to get system status from error handler
function Get-SystemStatus {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$ErrorHandlerPort/status" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $status = $response.Content | ConvertFrom-Json
        return $status
    }
    catch {
        return $null
    }
}

# Step 1: Start Error Handler
if (-not $Quiet) {
    Write-Host "[1/4] Starting Error Handler and Auto-Recovery System..." -ForegroundColor Yellow
    Write-Host ""
}

# Check if error handler is already running
if (Test-Port $ErrorHandlerPort) {
    if (-not $Quiet) {
        Write-Host "✓ Error Handler already running" -ForegroundColor Green
    }
} else {
    # Start error handler in background
    $errorHandlerProcess = Start-Process -FilePath "node" -ArgumentList "error-handler.js" -WindowStyle Hidden -PassThru -RedirectStandardOutput "logs\error-handler-output.log" -RedirectStandardError "logs\error-handler-error.log"
    
    if (-not $Quiet) {
        Write-Host "✓ Error Handler started (PID: $($errorHandlerProcess.Id))" -ForegroundColor Green
    }
}

# Step 2: Wait for Error Handler to be ready
if (-not $Quiet) {
    Write-Host "[2/4] Waiting for Error Handler to initialize..." -ForegroundColor Yellow
}

$waitTime = 0
$errorHandlerReady = $false

while ($waitTime -lt $MaxWaitTime -and -not $errorHandlerReady) {
    Start-Sleep -Seconds $CheckInterval
    $waitTime += $CheckInterval
    
    if (Test-ServiceHealth "http://localhost:$ErrorHandlerPort/status") {
        $errorHandlerReady = $true
        if (-not $Quiet) {
            Write-Host "✓ Error Handler ready and responding" -ForegroundColor Green
        }
    } else {
        if (-not $Quiet) {
            Write-Host "  Waiting for Error Handler... ($waitTime/$MaxWaitTime seconds)" -ForegroundColor Gray
        }
    }
}

if (-not $errorHandlerReady) {
    Write-Host "✗ Error Handler failed to start within $MaxWaitTime seconds" -ForegroundColor Red
    Write-Host "  Attempting manual service start..." -ForegroundColor Yellow
    
    # Manual fallback start
    if (-not (Test-Port $BackendPort)) {
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
        Write-Host "✓ Backend started manually" -ForegroundColor Green
    }
    
    if (-not (Test-Port $FrontendPort)) {
        Start-Process -FilePath "python" -ArgumentList "-m", "http.server", "8080" -WorkingDirectory "frontend" -WindowStyle Hidden
        Write-Host "✓ Frontend started manually" -ForegroundColor Green
    }
    
    Start-Sleep -Seconds 5
} else {
    # Step 3: Check and wait for all services
    if (-not $Quiet) {
        Write-Host "[3/4] Checking system health and auto-recovery..." -ForegroundColor Yellow
    }
    
    $allServicesReady = $false
    $waitTime = 0
    
    while ($waitTime -lt $MaxWaitTime -and -not $allServicesReady) {
        $status = Get-SystemStatus
        
        if ($status -and $status.backend -eq "running" -and $status.frontend -eq "running") {
            $allServicesReady = $true
            if (-not $Quiet) {
                Write-Host "✓ Backend: Running (Port $BackendPort)" -ForegroundColor Green
                Write-Host "✓ Frontend: Running (Port $FrontendPort)" -ForegroundColor Green
                Write-Host "✓ All services operational" -ForegroundColor Green
            }
        } else {
            if (-not $Quiet) {
                $backendStatus = if ($status) { $status.backend } else { "unknown" }
                $frontendStatus = if ($status) { $status.frontend } else { "unknown" }
                Write-Host "  Backend: $backendStatus | Frontend: $frontendStatus | Auto-recovery in progress... ($waitTime/$MaxWaitTime)" -ForegroundColor Gray
            }
            Start-Sleep -Seconds $CheckInterval
            $waitTime += $CheckInterval
        }
    }
    
    if (-not $allServicesReady) {
        Write-Host "⚠ Services taking longer than expected to start" -ForegroundColor Yellow
        Write-Host "  The error handler will continue working in the background" -ForegroundColor Gray
    }
}

# Step 4: Launch the application
if (-not $Quiet) {
    Write-Host "[4/4] Launching Smart Load Analyzer..." -ForegroundColor Yellow
    Write-Host ""
}

# Give services a moment to fully initialize
Start-Sleep -Seconds 2

# Open browser unless -NoOpen is specified
if (-not $NoOpen) {
    if (-not $Quiet) {
        Write-Host "✓ Opening Smart Load Analyzer in your browser..." -ForegroundColor Green
    }
    Start-Process "http://localhost:$FrontendPort"
}

# Final status report
if (-not $Quiet) {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                    Launch Complete!                        ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Smart Load Analyzer is now running:" -ForegroundColor White
    Write-Host "  • Main Application: " -NoNewline -ForegroundColor Gray
    Write-Host "http://localhost:$FrontendPort" -ForegroundColor Cyan
    Write-Host "  • Site Status:      " -NoNewline -ForegroundColor Gray
    Write-Host "http://localhost:$FrontendPort/site-status.html" -ForegroundColor Cyan
    Write-Host "  • Backend API:      " -NoNewline -ForegroundColor Gray
    Write-Host "http://localhost:$BackendPort" -ForegroundColor Cyan
    Write-Host "  • Error Handler:    " -NoNewline -ForegroundColor Gray
    Write-Host "http://localhost:$ErrorHandlerPort" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The error handler is monitoring all services in the background." -ForegroundColor Green
    Write-Host "If any service fails, it will be automatically restarted." -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop monitoring, or close this window to continue in background." -ForegroundColor Yellow
    Write-Host ""
}

# Keep script running to show it's monitoring (optional)
if (-not $Quiet) {
    try {
        while ($true) {
            Start-Sleep -Seconds 30
            $status = Get-SystemStatus
            if ($status) {
                $timestamp = Get-Date -Format "HH:mm:ss"
                Write-Host "[$timestamp] System Status: Backend=$($status.backend) | Frontend=$($status.frontend)" -ForegroundColor DarkGray
            }
        }
    }
    catch {
        Write-Host "Monitoring stopped. Services continue running in background." -ForegroundColor Yellow
    }
}