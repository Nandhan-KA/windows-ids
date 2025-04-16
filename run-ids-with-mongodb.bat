@echo off
echo ============================================================
echo             Windows IDS with MongoDB - Complete Setup
echo ============================================================
echo.

REM Set environment variables
set MONGODB_PORT=5000
set PYTHON_BACKEND_PORT=5001
set FRONTEND_PORT=3000
set WAIT_TIME=10

REM Update environment files
echo Updating environment configuration...
echo NEXT_PUBLIC_API_URL=http://localhost:%PYTHON_BACKEND_PORT%> .env.local.tmp
echo BACKEND_URL=http://localhost:%PYTHON_BACKEND_PORT%>> .env.local.tmp
echo NEXT_PUBLIC_MONGODB_API_URL=http://localhost:%MONGODB_PORT%>> .env.local.tmp
echo ENABLE_MULTIPROCESSING=true>> .env.local.tmp
echo ENABLE_HIGH_PERFORMANCE=true>> .env.local.tmp
move /y .env.local.tmp .env.local > nul

REM Check for MongoDB backend folder
if not exist "backend-mongodb" (
    echo [ERROR] MongoDB backend folder not found.
    echo Make sure you run this script from the project root directory.
    pause
    exit /b 1
)

echo [1/5] Starting MongoDB backend...
start cmd /k "cd backend-mongodb && npm install && npm start"

echo.
echo [INFO] Waiting for MongoDB backend to initialize (%WAIT_TIME% seconds)...
timeout /t %WAIT_TIME% /nobreak > nul

REM Verify MongoDB is running
curl -s http://localhost:%MONGODB_PORT%/api/ping > nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] MongoDB backend is not responding.
    echo Check the MongoDB console window for errors.
    echo Try increasing the WAIT_TIME variable in this script.
    pause
    exit /b 1
)
echo [OK] MongoDB backend is running.

echo.
echo [2/5] Starting Python backend on port %PYTHON_BACKEND_PORT%...
start cmd /k "cd backend-python && set DEBUG=1 && set ENABLE_MULTIPROCESSING=true && set ENABLE_HIGH_PERFORMANCE=true && python app.py --port %PYTHON_BACKEND_PORT%"

echo.
echo [INFO] Waiting for Python backend to initialize (%WAIT_TIME% seconds)...
timeout /t %WAIT_TIME% /nobreak > nul

REM Verify Python backend is running
curl -s http://localhost:%PYTHON_BACKEND_PORT%/api/system/metrics > nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Python backend may not be fully initialized.
    echo This might be normal if the backend takes longer to start.
) else (
    echo [OK] Python backend is running.
)

echo.
echo [3/5] Starting Next.js frontend...
start cmd /k "npm run dev"

echo.
echo [INFO] Waiting for Next.js to initialize (%WAIT_TIME% seconds)...
timeout /t %WAIT_TIME% /nobreak > nul

echo.
echo [4/5] Running test attack simulations...

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
echo [5/5] Opening MongoDB Logs page to verify data storage...
start http://localhost:%FRONTEND_PORT%/logs?tab=mongodb

echo.
echo ============================================================
echo                      SYSTEM IS RUNNING
echo ============================================================
echo.
echo MongoDB Backend: http://localhost:%MONGODB_PORT%
echo Python Backend: http://localhost:%PYTHON_BACKEND_PORT%
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