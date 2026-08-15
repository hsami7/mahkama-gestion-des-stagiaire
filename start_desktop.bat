@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

color 0B
echo ===============================================================================
echo            INTERN MANAGER - DESKTOP APPLICATION LAUNCHER
echo ===============================================================================
echo.

rem Check if Docker backend container is running
docker ps --format "{{.Names}}" | findstr /i "mahkama_intern_manager" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Backend server container is not running. Starting backend now...
    docker-compose up -d
)

echo [INFO] Launching Desktop Window...
npx electron .

