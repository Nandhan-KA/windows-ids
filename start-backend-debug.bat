@echo off
echo Starting Windows IDS Python Backend in debug mode...
echo ================================================= 
cd backend-python
set NETWORK_ANALYZER_CALLBACK_FIX=true
set ENABLE_MULTIPROCESSING=true
set ENABLE_HIGH_PERFORMANCE=true
set FLASK_ENV=development
set FLASK_APP=app.py
set FLASK_DEBUG=1

echo Environment variables set
echo Starting backend on port 5000...

python app.py

echo.
echo If no output appeared, there may be an error. Check for Python exceptions.
echo Press any key to exit...
pause > nul 