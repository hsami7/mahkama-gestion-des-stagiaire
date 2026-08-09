Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Mahkama Intern Manager - Auto Setup Wizard" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check Administrator Privileges
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "This script is running without Administrator privileges."
    Write-Host "The setup.bat file should automatically ask for permission."
    Pause
    exit
}

# 2. Install Python
$pythonInstalled = Get-Command "python" -ErrorAction SilentlyContinue
if (!$pythonInstalled) {
    Write-Host "Python is not installed. Downloading Python 3.12..." -ForegroundColor Yellow
    $pythonInstaller = "$env:TEMP\python-installer.exe"
    
    # Use modern TLS for download
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.12.3/python-3.12.3-amd64.exe" -OutFile $pythonInstaller
    
    Write-Host "Installing Python silently (this may take a minute)..." -ForegroundColor Yellow
    Start-Process -FilePath $pythonInstaller -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1 Include_test=0" -Wait
    Write-Host "Python installed successfully." -ForegroundColor Green
    
    # Refresh PATH in current process
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "Python is already installed." -ForegroundColor Green
}

# 3. Install Node.js
$nodeInstalled = Get-Command "node" -ErrorAction SilentlyContinue
if (!$nodeInstalled) {
    Write-Host "Node.js is not installed. Downloading Node.js LTS..." -ForegroundColor Yellow
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi" -OutFile $nodeInstaller
    
    Write-Host "Installing Node.js silently..." -ForegroundColor Yellow
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart" -Wait
    Write-Host "Node.js installed successfully." -ForegroundColor Green
} else {
    Write-Host "Node.js is already installed." -ForegroundColor Green
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "Please press any key to close this window." -ForegroundColor Yellow
Write-Host "Then, you can run 'build_frontend.bat' and 'start_server.bat'." -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan

Pause
