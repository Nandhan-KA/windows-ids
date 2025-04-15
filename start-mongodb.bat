@echo off
echo ============================================================
echo              Starting MongoDB Backend
echo ============================================================
echo.

cd backend-mongodb

IF NOT EXIST node_modules (
  echo Installing dependencies...
  call npm install
) ELSE (
  echo Dependencies already installed
)

echo.
echo Starting MongoDB backend on http://localhost:5000
echo.
echo Use Ctrl+C to stop the server when done
echo.

npm start 