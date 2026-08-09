@echo off
echo ==============================================
echo Checking Administrator Privileges...
echo ==============================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Administrator privileges are required to install Python and Node.js.
    echo Requesting permissions...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo Privileges acquired. Starting setup wizard...
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "setup_server.ps1"
