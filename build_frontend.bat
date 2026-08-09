@echo off
echo ==============================================
echo Mahkama Intern Manager - Build Frontend
echo ==============================================

cd /d "%~dp0"
echo Installing frontend dependencies...
call npm install
echo Building React app...
call npm run build
echo Build complete. The "dist" folder is ready to be served.
pause
