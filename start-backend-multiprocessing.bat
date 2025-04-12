@echo off
echo Starting Windows IDS Python Backend (with multiprocessing)...

cd backend-python
set PYTHONUNBUFFERED=1
set DEBUG=1

echo ====================================
echo Windows IDS Backend (Multiprocessing)
echo ====================================
echo.
echo This window shows the output from the Python backend server
echo that provides data to the Windows IDS frontend.
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.

python app.py

pause 