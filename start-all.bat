@echo off
echo Starting Windows IDS System...
echo.

:: Start the high-performance backend in a new window
echo Starting backend in high-performance mode...
start "Windows IDS Backend" cmd /c ".\start-backend-highperf.bat"

:: Wait a moment for backend to initialize
timeout /t 5 /nobreak

:: Start the frontend
echo Starting frontend...
start "Windows IDS Frontend" cmd /c "npm run dev"

echo.
echo Both services started! 
echo - Backend is running in high-performance mode
echo - Frontend is accessible via the URL shown in the frontend window
echo.
echo Press any key to stop all services...
pause > nul

:: Kill processes when the user presses a key
echo Shutting down services...
taskkill /FI "WINDOWTITLE eq Windows IDS Backend*" /F
taskkill /FI "WINDOWTITLE eq Windows IDS Frontend*" /F
echo Done. 