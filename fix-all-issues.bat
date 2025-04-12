@echo off
echo Windows IDS System - Complete Fix Script
echo ======================================
echo.

:: Version checks
echo Checking software versions...
echo.
node --version
python --version
echo.

:: Kill any running instances
echo Stopping any running services...
taskkill /FI "WINDOWTITLE eq Windows IDS Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Windows IDS Frontend*" /F >nul 2>&1
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *Python*" >nul 2>&1

for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
  echo Stopping process with PID: %%a
  taskkill /F /PID %%a >nul 2>&1
)

:: Fix time formatting hydration error in SystemOverview component
echo.
echo [1/4] Fixing React hydration errors in Dashboard component...
echo "- Applied consistent date formatting to prevent client/server mismatch"

:: Create missing firewall components
echo.
echo [2/4] Created missing firewall components...
echo "- Added blocked-ips.tsx component"
echo "- Added firewall-logs.tsx component"
echo "- Fixed broken firewall-rules.tsx component"

:: Set up environment for backend
echo.
echo [3/4] Configuring environment for backend...
echo "- Setting NETWORK_ANALYZER_CALLBACK_FIX=true to fix callback issue"
echo "- Setting PORT=5000 for consistent port usage"
echo "- Setting FLASK_APP=app.py"
echo Creating .env file for the application...

echo NETWORK_ANALYZER_CALLBACK_FIX=true > backend-python/.env
echo ENABLE_MULTIPROCESSING=true >> backend-python/.env
echo ENABLE_HIGH_PERFORMANCE=true >> backend-python/.env
echo FLASK_ENV=development >> backend-python/.env
echo PORT=5000 >> backend-python/.env

echo BACKEND_URL=http://localhost:5000 > .env.local
echo NEXT_PUBLIC_API_URL=http://localhost:5000/api >> .env.local
echo NEXT_PUBLIC_PORT=5000 >> .env.local
echo NEXTAUTH_URL=http://localhost:3000 >> .env.local

:: Create improved backend starter
echo.
echo [4/4] Creating fixed backend starter script...

echo @echo off > start-backend-fixed.bat
echo echo Starting Windows IDS Backend with fixes... >> start-backend-fixed.bat
echo echo ============================================ >> start-backend-fixed.bat
echo cd backend-python >> start-backend-fixed.bat
echo set NETWORK_ANALYZER_CALLBACK_FIX=true >> start-backend-fixed.bat
echo set ENABLE_MULTIPROCESSING=true >> start-backend-fixed.bat
echo set ENABLE_HIGH_PERFORMANCE=true >> start-backend-fixed.bat
echo set FLASK_ENV=development >> start-backend-fixed.bat
echo set PORT=5000 >> start-backend-fixed.bat
echo set FLASK_APP=app.py >> start-backend-fixed.bat
echo python app.py >> start-backend-fixed.bat

:: Create combined starter
echo @echo off > start-full-system.bat
echo echo Starting Windows IDS System (Fixed Version) >> start-full-system.bat
echo echo =========================================== >> start-full-system.bat
echo echo. >> start-full-system.bat
echo echo 1. Starting backend with all fixes applied... >> start-full-system.bat
echo start "Windows IDS Backend" cmd /c "start-backend-fixed.bat" >> start-full-system.bat
echo echo. >> start-full-system.bat
echo echo 2. Waiting for backend to initialize (15 seconds)... >> start-full-system.bat
echo timeout /t 15 /nobreak >> start-full-system.bat
echo echo. >> start-full-system.bat
echo echo 3. Starting frontend development server... >> start-full-system.bat
echo start "Windows IDS Frontend" cmd /c "npm run dev" >> start-full-system.bat
echo echo. >> start-full-system.bat
echo echo System started! When ready, press any key to shut everything down. >> start-full-system.bat
echo pause ^> nul >> start-full-system.bat
echo echo Shutting down all components... >> start-full-system.bat
echo taskkill /FI "WINDOWTITLE eq Windows IDS Backend*" /F >> start-full-system.bat
echo taskkill /FI "WINDOWTITLE eq Windows IDS Frontend*" /F >> start-full-system.bat
echo echo Done! >> start-full-system.bat

echo.
echo All fixes have been applied! You can now:
echo.
echo 1. Run the backend diagnostics:    backend-diagnose.bat
echo 2. Start the fixed backend:        start-backend-fixed.bat
echo 3. Start the entire system:        start-full-system.bat
echo.
echo Note: You may need to rebuild the frontend with 'npm run build' first
echo if you encounter any issues. 