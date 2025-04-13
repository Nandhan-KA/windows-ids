@echo off
cls
echo ======================================================
echo       USB Attack Simulator for Windows IDS
echo ======================================================
echo.

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed. Please install Python to run this simulator.
    pause
    exit /b 1
)

echo Running USB detector simulation...
echo This will simulate a USB device insertion with suspicious files
echo.

REM Run the USB detector with appropriate arguments - updated to use MongoDB backend
python usb_detector.py --simulate --test --server localhost:5000

echo.
echo Simulation completed.
echo The IDS should now display an alert for the USB device detection.
echo Data has been stored in MongoDB.
echo.
pause 