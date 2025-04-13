@echo off
echo ╔══════════════════════════════════════════════╗
echo ║                                              ║
echo ║         Windows IDS USB Monitor              ║
echo ║                                              ║
echo ╚══════════════════════════════════════════════╝

rem Check if Python is installed
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.8 or higher.
    pause
    exit /b 1
)

rem Check if required modules are installed
echo Checking required Python modules...
python -c "import wmi" > nul 2>&1
if %errorlevel% neq 0 (
    echo Installing required modules...
    pip install wmi pywin32
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install required modules.
        pause
        exit /b 1
    )
)

echo Starting USB Monitor...
echo This will monitor for USB device insertions and alert the IDS system.
echo.
echo Logs will be saved to usb_detector.log
echo.
echo Press Ctrl+C to stop the monitor.
echo.

rem Start the USB monitor
python usb_detector.py

pause 