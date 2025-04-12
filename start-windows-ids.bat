@echo off
echo Windows IDS - Starting Application...
echo.

REM Check if Python is installed
python --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js v18 or higher.
    pause
    exit /b 1
)

REM Install Python dependencies if needed
echo Checking Python dependencies...
cd backend-python
python -c "import flask" > nul 2>&1 || pip install flask flask-cors flask-socketio psutil python-dotenv
cd ..

REM Check if .env.local exists, create if not
if not exist .env.local (
    echo Creating .env.local file...
    echo # Email Configuration > .env.local
    echo SMTP_HOST=smtp.zoho.in >> .env.local
    echo SMTP_PORT=587 >> .env.local
    echo SMTP_USER=noreply@scholarpeak.in >> .env.local
    echo SMTP_PASS=TMtdYTcbSghf >> .env.local
)

REM Start Python backend in a new window
echo Starting Python backend...
start "Windows IDS - Python Backend" cmd /c "cd backend-python && python app.py"

REM Wait 2 seconds to let the backend start
timeout /t 2 > nul

REM Start Next.js frontend
echo Starting Next.js frontend...
echo.
echo Once the application has started, visit http://localhost:3000 in your browser.
echo.
echo Press Ctrl+C twice in this window to stop the application when you're done.
echo.
npm run dev 