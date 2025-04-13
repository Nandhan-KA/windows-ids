@echo off
echo ======================================================
echo       Windows IDS with MongoDB Backend
echo ======================================================
echo.

echo Starting MongoDB backend...
start cmd /k "cd backend-mongodb && npm install && npm start"

echo Waiting for MongoDB backend to start...
timeout /t 5 /nobreak

echo Starting Next.js frontend...
start cmd /k "npm run dev"

echo.
echo System is running!
echo - MongoDB Backend: http://localhost:5000
echo - Next.js Frontend: http://localhost:3000
echo.
echo All attack data, threat data, and IDS events are now being stored in MongoDB.
echo. 