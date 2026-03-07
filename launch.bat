@echo off
title Smart Load Analyzer
echo Starting Smart Load Analyzer...

REM Try PowerShell first (better experience)
where powershell >nul 2>&1
if %errorlevel% equ 0 (
    powershell -ExecutionPolicy Bypass -File "start-smart-load-analyzer.ps1"
) else (
    REM Fallback to batch script
    call "start-smart-load-analyzer.bat"
)