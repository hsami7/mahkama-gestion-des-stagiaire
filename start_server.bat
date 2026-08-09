@echo off
echo ==============================================
echo Mahkama Intern Manager - Windows Server Startup
echo ==============================================

cd /d "%~dp0"

echo Installing dependencies...
cd backend
pip install -r requirements.txt

echo Starting Waitress Production Server on Port 5055...
echo The app will be accessible at http://localhost:5055
echo (Or http://YOUR_SERVER_IP:5055 from other computers on the network)
echo.
waitress-serve --port=5055 app:app
pause
