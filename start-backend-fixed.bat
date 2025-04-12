@echo off 
echo Starting Windows IDS Python Backend with fixes... 
echo ================================================= 
cd backend-python 
set NETWORK_ANALYZER_CALLBACK_FIX=true 
set ENABLE_MULTIPROCESSING=true 
set ENABLE_HIGH_PERFORMANCE=true 
set FLASK_ENV=development 
python app.py 
