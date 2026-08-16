@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

rem Set colors
color 0B

echo ===============================================================================
echo.
echo      __  __       _     _                        
echo     ^|  \/  ^|     ^| ^|   ^| ^|                       
echo     ^| \  / ^| __ _^| ^|__ ^| ^| ____ _ _ __ ___   __ _ 
echo     ^| ^|\/^| ^|/ _` ^| '_ \^| ^|/ / _` ^| '_ ` _ \ / _` ^|
echo     ^| ^|  ^| ^| (_^| ^| ^| ^| ^|   ^< (_^| ^| ^| ^| ^| ^| ^| (_^| ^|
echo     ^|_^|  ^|_^|\__,_^|_^| ^|_^|_^|\_\__,_^|_^| ^|_^| ^|_^|\__,_^|
echo.                                                   
echo            INTERN MANAGER - DOCKER STARTUP
echo.
echo ===============================================================================
echo.

rem 1. Check for Admin Privileges
echo [1/3] Checking Permissions...
net session >nul 2>&1
if %errorlevel% equ 0 goto AdminOK

color 0C
echo [WARNING] Administrator privileges required for first-time setup!
echo Please right-click on 'start_app.bat' and select "Run as administrator".
echo.
pause
exit /b 1

:AdminOK
echo [OK] Running as Administrator.
echo.

rem 2. Check for Docker
echo [2/3] Checking Prerequisites (Docker)...
docker --version >nul 2>&1
if %errorlevel% neq 0 goto InstallDocker

rem Check if Docker daemon is running
docker info >nul 2>&1
if %errorlevel% equ 0 goto DockerOK

echo [INFO] Docker is installed, but Docker Desktop daemon is not running.
echo [INFO] Launching Docker Desktop...

if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
) else (
    echo [INFO] Please launch Docker Desktop from your Start Menu.
)

echo [INFO] Waiting for Docker engine to initialize...
set /a attempts=0

:WaitDaemon
timeout /t 4 /nobreak >nul
set /a attempts+=1
docker info >nul 2>&1
if %errorlevel% equ 0 goto DaemonReady
if !attempts! lss 25 (
    echo [INFO] Waiting for Docker engine... (!attempts!/25)
    goto WaitDaemon
)

color 0C
echo.
echo [ERROR] Docker engine failed to start or connection timed out.
echo Please start Docker Desktop manually, wait until it says "Engine running", then run this script again.
pause
exit /b 1

:DaemonReady
echo [OK] Docker engine is up and running.
goto DockerOK

:InstallDocker
color 0E
echo [INFO] Docker is not installed on this system.
echo [INFO] Downloading Docker Desktop Installer (this may take a few minutes)...
powershell -Command "$ErrorActionPreference = 'Stop'; Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe' -OutFile 'DockerInstaller.exe'"

if %errorlevel% equ 0 if exist "DockerInstaller.exe" goto DownloadOK
color 0C
echo.
echo [ERROR] The download failed or was interrupted by a network error. 
echo Please install it manually from: https://www.docker.com/products/docker-desktop/
if exist "DockerInstaller.exe" del DockerInstaller.exe
pause
exit /b 1

:DownloadOK
echo [INFO] Installing Docker Desktop silently...
start /wait DockerInstaller.exe install --quiet --accept-license

if %errorlevel% equ 0 goto InstallOK
color 0C
echo.
echo [ERROR] Failed to install Docker automatically. 
echo Please install it manually from: https://www.docker.com/products/docker-desktop/
pause
exit /b 1

:InstallOK
rem Clean up the installer
del DockerInstaller.exe

color 0A
echo.
echo ===============================================================================
echo [SUCCESS] Docker Desktop has been installed!
echo.
echo A SYSTEM RESTART is required to finish setting up Docker.
echo Please save your work, restart your computer, and run this script again.
echo ===============================================================================
echo.
pause
exit /b 0

:DockerOK
echo [OK] Docker is installed and running.
echo.

rem 3. Build and start containers
echo [3/3] Installing Packages and Building Application...
echo This will automatically set up Python, Node.js, and all required packages.
echo Sit back and relax, this might take a few minutes on the first run!
echo.
docker compose version >nul 2>&1
if %errorlevel% equ 0 (
    docker compose up -d --build
) else (
    docker-compose up -d --build
)

if %errorlevel% equ 0 goto BuildOK
color 0C
echo.
echo [ERROR] Something went wrong during the build process.
echo Make sure the Docker Desktop application is open and running in the system tray.
echo If you see a "500 Internal Server Error" or API error, Docker's engine is stuck.
echo Please restart Docker Desktop from the system tray, or restart your computer.
pause
exit /b 1

:BuildOK
echo.
color 0A
echo [OK] Application successfully built and installed!
echo.

rem 4. Summary and Access
echo ===============================================================================
echo.
echo    [SUCCESS] Application is RUNNING!
echo.
echo    What was installed behind the scenes:
echo      - Node.js (Frontend Environment)
echo      - Python 3 (Backend Environment)
echo      - Flask, SQLite, and all dependencies
echo.
echo    You can now safely close this black window if you want.
echo    The server will keep running in the background via Docker.
echo.
echo    ---^> ACCESS THE APP HERE: http://localhost:5055 ^<---
echo.
echo ===============================================================================
echo.
echo Opening application in your browser...
start http://localhost:5055
pause
