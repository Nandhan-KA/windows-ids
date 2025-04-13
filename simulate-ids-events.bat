@echo off
echo Simulating IDS events...
set NUM_EVENTS=5
set SERVER_URL=http://localhost:5000/api/debug/simulate-attack

cd %~dp0
node simulate_ids_event.js

echo Done!
pause 