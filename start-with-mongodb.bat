@echo off
echo ============================================================
echo           Windows IDS with MongoDB - Starting Up
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
start "MongoDB Backend" cmd /k "cd backend-mongodb && npm install && npm start"

echo.
echo [INFO] Waiting for MongoDB backend to initialize (10 seconds)...
timeout /t 10 /nobreak > nul

echo.
echo [2/2] Starting Next.js frontend...
echo.
echo ============================================================
echo                  STARTING NEXT.JS APP
echo ============================================================
echo.
echo MongoDB Backend: http://localhost:%MONGODB_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo - Both services are now running
echo - All attack data will be stored in MongoDB
echo - Press Ctrl+C in each window to stop the services
echo.

npm run dev 