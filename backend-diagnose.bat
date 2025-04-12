@echo off
echo Windows IDS Backend Diagnostics
echo =============================
echo.

cd backend-python
echo Checking Python version...
python --version

echo.
echo Checking required packages...
pip list | findstr flask
pip list | findstr eventlet
pip list | findstr tensorflow
pip list | findstr psutil

echo.
echo Checking port availability...
netstat -aon | findstr :5000

echo.
echo Setting environment variables...
set NETWORK_ANALYZER_CALLBACK_FIX=true
set ENABLE_MULTIPROCESSING=true
set ENABLE_HIGH_PERFORMANCE=true
set FLASK_DEBUG=1

echo.
echo Attempting to start backend in diagnostic mode...
echo This will show all error messages...
python app.py

echo.
echo If backend started successfully, press Ctrl+C to exit 