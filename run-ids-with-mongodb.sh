#!/bin/bash

echo "============================================================"
echo "            Windows IDS with MongoDB - Complete Setup"
echo "============================================================"
echo

# Set environment variables
MONGODB_PORT=5000
FRONTEND_PORT=3000
WAIT_TIME=10

# Check for MongoDB backend folder
if [ ! -d "backend-mongodb" ]; then
    echo "[ERROR] MongoDB backend folder not found."
    echo "Make sure you run this script from the project root directory."
    read -p "Press Enter to exit..."
    exit 1
fi

echo "[1/4] Starting MongoDB backend..."
cd backend-mongodb
npm install &
PID_NPM=$!
wait $PID_NPM
npm start &
PID_MONGODB=$!
cd ..

echo
echo "[INFO] Waiting for MongoDB backend to initialize ($WAIT_TIME seconds)..."
sleep $WAIT_TIME

echo
echo "[2/4] Starting Next.js frontend..."
npm run dev &
PID_FRONTEND=$!

echo
echo "[INFO] Waiting for Next.js to initialize ($WAIT_TIME seconds)..."
sleep $WAIT_TIME

echo
echo "[3/4] Running test attack simulations..."

# Run USB attack simulation - creates test data in MongoDB
echo
echo "[INFO] Simulating USB attack..."
if [ -f "simulate_usb_attack.sh" ]; then
    chmod +x simulate_usb_attack.sh
    ./simulate_usb_attack.sh &
    PID_USB=$!
else
    echo "[WARN] USB attack simulation script not found. Skipping."
fi

# Wait for USB simulation to be registered
sleep 5

# Run general attack simulation - creates more test data in MongoDB
echo
echo "[INFO] Simulating network attacks..."
if [ -f "attack_multi.py" ]; then
    python attack_multi.py --target localhost --port $MONGODB_PORT --attack all &
    PID_ATTACK=$!
else
    echo "[WARN] Network attack simulation script not found. Skipping."
fi

echo
echo "[INFO] Waiting for attacks to be registered ($WAIT_TIME seconds)..."
sleep $WAIT_TIME

echo
echo "[4/4] Opening MongoDB Logs page to verify data storage..."
# Try to open browser based on OS
if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:$FRONTEND_PORT/logs?tab=mongodb"
elif command -v open > /dev/null; then
    open "http://localhost:$FRONTEND_PORT/logs?tab=mongodb"
else
    echo "[INFO] Could not open browser automatically. Please visit:"
    echo "http://localhost:$FRONTEND_PORT/logs?tab=mongodb"
fi

echo
echo "============================================================"
echo "                     SYSTEM IS RUNNING"
echo "============================================================"
echo
echo "MongoDB Backend: http://localhost:$MONGODB_PORT"
echo "Next.js Frontend: http://localhost:$FRONTEND_PORT"
echo "MongoDB Logs: http://localhost:$FRONTEND_PORT/logs?tab=mongodb"
echo
echo "- All attack data, threat data, and IDS events are stored in MongoDB"
echo "- Test attacks have been simulated and stored in the database"
echo "- Browser has been opened to MongoDB logs page to verify storage"
echo
echo "NOTE: To run additional attack simulations:"
echo " - USB Attacks: Run ./simulate_usb_attack.sh"
echo " - Network Attacks: Run python attack_multi.py"
echo " - IDS Events: Run node simulate_ids_event.js"
echo
echo "Press Ctrl+C to stop all services when done"
echo

# Wait for user to press Ctrl+C
wait 