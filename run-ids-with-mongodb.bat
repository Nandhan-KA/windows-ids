@echo off
echo ============================================================
echo             Windows IDS with MongoDB - Complete Setup
echo ============================================================
echo.

REM Set environment variables
set MONGODB_PORT=5000
set FRONTEND_PORT=3000
set WAIT_TIME=10

REM Check for MongoDB backend folder
if not exist "backend-mongodb" (
    echo [ERROR] MongoDB backend folder not found.
    echo Make sure you run this script from the project root directory.
    pause
    exit /b 1
)

echo [1/4] Starting MongoDB backend...
start cmd /k "cd backend-mongodb && npm install && npm start"

echo.
echo [INFO] Waiting for MongoDB backend to initialize (%WAIT_TIME% seconds)...
timeout /t %WAIT_TIME% /nobreak > nul

echo.
echo [2/4] Starting Next.js frontend...
start cmd /k "npm run dev"

echo.
echo [INFO] Waiting for Next.js to initialize (%WAIT_TIME% seconds)...
timeout /t %WAIT_TIME% /nobreak > nul

echo.
echo [3/4] Running test attack simulations...

REM Run USB attack simulation - creates test data in MongoDB
echo.
echo [INFO] Simulating USB attack...
start cmd /k "simulate_usb_attack.bat && timeout /t 10 && exit"

REM Wait for USB simulation to be registered
timeout /t 5 /nobreak > nul

REM Run general attack simulation - creates more test data in MongoDB
echo.
echo [INFO] Simulating network attacks...
start cmd /k "attack_multi_mongodb.bat && exit"

echo.
echo [INFO] Waiting for attacks to be registered (%WAIT_TIME% seconds)...
timeout /t %WAIT_TIME% /nobreak > nul

echo.
echo [4/4] Opening MongoDB Logs page to verify data storage...
start http://localhost:%FRONTEND_PORT%/logs?tab=mongodb

echo.
echo ============================================================
echo                      SYSTEM IS RUNNING
echo ============================================================
echo.
echo MongoDB Backend: http://localhost:%MONGODB_PORT%
echo Next.js Frontend: http://localhost:%FRONTEND_PORT%
echo MongoDB Logs: http://localhost:%FRONTEND_PORT%/logs?tab=mongodb
echo.
echo - All attack data, threat data, and IDS events are stored in MongoDB
echo - Test attacks have been simulated and stored in the database
echo - Browser has been opened to MongoDB logs page to verify storage
echo.
echo NOTE: To run additional attack simulations:
echo  - USB Attacks: Run simulate_usb_attack.bat
echo  - Network Attacks: Run attack_simulator.bat or attack_multi_mongodb.bat
echo  - IDS Events: Run simulate-ids-events.bat
echo.
echo Press any key to close this window (system will continue running)...
pause > nul 