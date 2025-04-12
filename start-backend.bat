@echo off
echo Starting Windows IDS Python Backend...
echo.

REM Add the external analyzer directory to PYTHONPATH
set "PYTHONPATH=%PYTHONPATH%;C:\Users\nandhanka\Desktop\ids"
echo Added C:\Users\nandhanka\Desktop\ids to PYTHONPATH

REM Run setup to ensure network_monitor.py is in the right place
python backend-python/setup_analyzer.py
echo.

echo Starting Python backend server...
cd backend-python
python app.py

pause 