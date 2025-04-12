@echo off
echo Testing Multiprocessing Monitor...

cd backend-python
set PYTHONUNBUFFERED=1

echo ====================================
echo Windows IDS Multiprocessing Test
echo ====================================
echo.
echo This will test the multiprocessing monitor implementation
echo to ensure it's collecting data correctly.
echo.

python test_multiprocessing.py

echo.
echo Test completed.
pause 