@echo off
echo Starting Windows IDS Python Backend (HIGH PERFORMANCE MODE)...

cd backend-python
set PYTHONUNBUFFERED=1
set DEBUG=1
set ENABLE_MULTIPROCESSING=true
set ENABLE_HIGH_PERFORMANCE=true

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

pause 