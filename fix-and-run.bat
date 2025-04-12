@echo off
echo Windows IDS System - Fix and Run Script
echo =======================================
echo.

:: Verify Node.js is installed
echo Checking if Node.js is installed...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Error: Node.js is not installed or not in the path
  echo Please install Node.js and try again
  exit /b 1
)

:: Verify Python is installed
echo Checking if Python is installed...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Error: Python is not installed or not in the path
  echo Please install Python and try again
  exit /b 1
)

:: Set required environment variables
echo Setting environment variables...
set NETWORK_ANALYZER_CALLBACK_FIX=true
set ENABLE_MULTIPROCESSING=true
set ENABLE_HIGH_PERFORMANCE=true
set FLASK_ENV=development

:: Kill any existing processes
echo Cleaning up any existing processes...
taskkill /FI "WINDOWTITLE eq Windows IDS Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Windows IDS Frontend*" /F >nul 2>&1
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *Python*" >nul 2>&1

:: Create .env.local file with configuration
echo Creating environment configuration...
echo BACKEND_URL=http://localhost:5000 > .env.local
echo NEXT_PUBLIC_API_URL=http://localhost:5000/api >> .env.local
echo ENABLE_MULTIPROCESSING=true >> .env.local
echo ENABLE_HIGH_PERFORMANCE=true >> .env.local

:: Stop any existing Python processes using port 5000
echo Checking for processes using port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
  echo Stopping process with PID: %%a
  taskkill /F /PID %%a >nul 2>&1
)

:: Create a modified start-backend script with the proper fixes
echo Creating fixed backend startup script...
echo @echo off > start-backend-fixed.bat
echo echo Starting Windows IDS Python Backend with fixes... >> start-backend-fixed.bat
echo echo ================================================= >> start-backend-fixed.bat
echo cd backend-python >> start-backend-fixed.bat
echo set NETWORK_ANALYZER_CALLBACK_FIX=true >> start-backend-fixed.bat
echo set ENABLE_MULTIPROCESSING=true >> start-backend-fixed.bat
echo set ENABLE_HIGH_PERFORMANCE=true >> start-backend-fixed.bat
echo set FLASK_ENV=development >> start-backend-fixed.bat
echo python app.py >> start-backend-fixed.bat

:: Start the backend process in a new window
echo Starting backend with fixes...
start "Windows IDS Backend" cmd /c "start-backend-fixed.bat"

:: Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 10 /nobreak

:: Check if backend is running
echo Checking if backend is running...
curl -s http://localhost:5000/api/system/metrics >nul
if %ERRORLEVEL% NEQ 0 (
  echo Error: Backend failed to start properly
  echo Check the backend window for errors
  echo Proceeding anyway with frontend startup...
) else (
  echo Backend is running successfully
)

:: Build the frontend to apply changes
echo Building frontend...
call npm run build

:: Start the frontend
echo Starting frontend...
start "Windows IDS Frontend" cmd /c "npm run dev"

echo.
echo System started! 
echo - Backend is running on http://localhost:5000
echo - Frontend is accessible via the URL shown in the frontend window
echo.
echo Use the Attack Simulation panel in the Security section to test attacks
echo If attacks still don't appear, try refreshing the page or restarting the system
echo.
echo Press any key to stop all services...
pause > nul

:: Kill processes when the user presses a key
echo Shutting down services...
taskkill /FI "WINDOWTITLE eq Windows IDS Backend*" /F
taskkill /FI "WINDOWTITLE eq Windows IDS Frontend*" /F
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *Python*"
echo Done. 