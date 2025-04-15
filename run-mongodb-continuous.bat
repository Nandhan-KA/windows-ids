@echo off
echo ============================================================
echo             MongoDB Backend - Continuous Run Mode
echo ============================================================
echo.

REM Set environment variables
set MONGODB_PORT=5000
set FRONTEND_PORT=3000

REM Check for MongoDB backend folder
if not exist "backend-mongodb" (
    echo [ERROR] MongoDB backend folder not found.
    echo Make sure you run this script from the project root directory.
    pause
    exit /b 1
)

echo [1/2] Starting MongoDB backend...
start cmd /k "cd backend-mongodb && npm install && npm start"

echo.
echo [INFO] Waiting for MongoDB backend to initialize (10 seconds)...
timeout /t 10 /nobreak > nul

echo.
echo [2/2] Opening MongoDB Logs page to verify connection...
start http://localhost:%FRONTEND_PORT%/logs?tab=mongodb

echo.
echo ============================================================
echo                     MONGODB IS RUNNING
echo ============================================================
echo.
echo MongoDB Backend: http://localhost:%MONGODB_PORT%
echo MongoDB Logs: http://localhost:%FRONTEND_PORT%/logs?tab=mongodb
echo.
echo - MongoDB is running in continuous mode
echo - NO automatic attacks will be generated
echo - All manual attack data will be stored in MongoDB
echo.
echo IMPORTANT: The frontend must be started separately with:
echo  npm run dev
echo.
echo Press any key to close this window (MongoDB will continue running)...
pause > nul 