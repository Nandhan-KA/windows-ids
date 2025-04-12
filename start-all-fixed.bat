@echo off
echo Starting Windows IDS System...
echo.

:: Set environment variable to fix network analyzer callback issue
echo Setting environment variables...
set NETWORK_ANALYZER_CALLBACK_FIX=true

:: Check if backend API is already running
echo Checking if backend is already running...
curl -s http://localhost:5000/api/system/metrics > nul
if %ERRORLEVEL% EQU 0 (
  echo Backend is already running.
) else (
  :: Start the high-performance backend in a new window
  echo Starting backend in high-performance mode...
  start "Windows IDS Backend" cmd /c ".\start-backend-highperf.bat"
  
  :: Wait for backend to initialize
  echo Waiting for backend to initialize...
  timeout /t 8 /nobreak
)

:: Verify critical API endpoints are accessible
echo Verifying API endpoints...
curl -s http://localhost:5000/api/combined-data > nul
if %ERRORLEVEL% NEQ 0 (
  echo Warning: Backend may not be fully initialized.
  echo Please check the backend window for any errors.
  timeout /t 3 /nobreak
)

:: Start the frontend
echo Starting frontend...
start "Windows IDS Frontend" cmd /c "npm run dev"

echo.
echo Both services started! 
echo - Backend is running in high-performance mode
echo - Frontend is accessible via the URL shown in the frontend window
echo.
echo If attacks aren't showing up, try the following:
echo  1. Navigate to /security/attack-monitoring in the frontend
echo  2. Manually trigger an attack via the Attack Simulation panel
echo.
echo Press any key to stop all services...
pause > nul

:: Kill processes when the user presses a key
echo Shutting down services...
taskkill /FI "WINDOWTITLE eq Windows IDS Backend*" /F
taskkill /FI "WINDOWTITLE eq Windows IDS Frontend*" /F
echo Done. 