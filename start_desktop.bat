@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

color 0B
echo ===============================================================================
echo            INTERN MANAGER - DESKTOP APPLICATION LAUNCHER
echo ===============================================================================
echo.

rem Check if Docker daemon is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Docker daemon is not running. Launching Docker Desktop...
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )
    echo [INFO] Waiting for Docker engine...
    :WaitLoop
    timeout /t 3 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto WaitLoop
)

rem Check if Docker backend container is running
docker ps --format "{{.Names}}" | findstr /i "mahkama_intern_manager" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Backend server container is not running. Starting backend now...
    docker-compose up -d
)

echo [INFO] Launching Desktop Window...
npx electron .
