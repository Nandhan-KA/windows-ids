@echo off
echo =========================================
echo   Multi-Attack Simulator for MongoDB
echo =========================================
echo.

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed. Please install Python to run this simulator.
    pause
    exit /b 1
)

REM Set up variables
set TARGET=localhost
set PORT=5000
set ATTACKS=all
set SEVERITY=medium

echo This script will simulate multiple attacks and store them in MongoDB.
echo Target: %TARGET%:%PORT%
echo.
echo Make sure the MongoDB backend is running!
echo.

REM Check MongoDB server
ping -n 1 %TARGET% > nul
if %errorlevel% neq 0 (
    echo ERROR: Cannot reach target %TARGET%
    pause
    exit /b 1
)

REM Run the attack simulator
python attack_multi.py --target %TARGET% --port %PORT% --attack %ATTACKS% --severity %SEVERITY%

echo.
echo All attack data has been sent to the MongoDB database.
echo.
pause 