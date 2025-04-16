@echo off
echo Starting Windows IDS Python Backend (HIGH PERFORMANCE MODE)...

cd backend-python

REM Set environment variables
set PYTHONUNBUFFERED=1
set DEBUG=1
set ENABLE_MULTIPROCESSING=true
set ENABLE_HIGH_PERFORMANCE=true
set PORT=5000

REM Check if the port is already in use
netstat -ano | find ":%PORT% " | find "LISTENING" > nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Warning: Port %PORT% is already in use!
    echo This might be the MongoDB backend or another service.
    echo.
    echo Options:
    echo 1. Stop any service using port %PORT%
    echo 2. Change the port in .env.local file
    echo.
    choice /C 12 /N /M "Choose an option (1 or 2) or press Ctrl+C to exit: "
    if ERRORLEVEL 2 goto change_port
    if ERRORLEVEL 1 goto continue
)

:continue
echo ================================================
echo Windows IDS Backend (High Performance Mode)
echo ================================================
echo.
echo This backend is running with:
echo  - Multiprocessing: Enabled
echo  - High Performance Mode: Enabled
echo  - Optimized data collection
echo.
echo This should provide near real-time updates to the frontend.
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.

python app.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error: Failed to start the backend server.
    echo Check for any error messages above.
    pause
    exit /b 1
)
goto end

:change_port
set NEW_PORT=5001
echo.
echo Updating port to %NEW_PORT% in .env.local...
cd ..
if exist .env.local (
    type .env.local | findstr /v "NEXT_PUBLIC_API_URL BACKEND_URL" > .env.local.tmp
    echo NEXT_PUBLIC_API_URL=http://localhost:%NEW_PORT%>> .env.local.tmp
    echo BACKEND_URL=http://localhost:%NEW_PORT%>> .env.local.tmp
    move /y .env.local.tmp .env.local > nul
    echo Port updated in .env.local
) else (
    echo NEXT_PUBLIC_API_URL=http://localhost:%NEW_PORT%> .env.local
    echo BACKEND_URL=http://localhost:%NEW_PORT%>> .env.local
    echo Created .env.local with new port
)
cd backend-python
echo.
echo Using PORT=%NEW_PORT%
set PORT=%NEW_PORT%
goto continue

:end
pause 