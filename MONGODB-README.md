# Windows IDS with MongoDB Integration

This document explains how to run the Windows IDS system with MongoDB integration for persistent data storage.

## Quick Start

### Windows

Run the complete setup with one command:

```
run-ids-with-mongodb.bat
```

This script will:
1. Start the MongoDB backend
2. Start the Next.js frontend
3. Run test attack simulations 
4. Open the MongoDB logs page in your browser to verify data storage

### Linux/macOS

Run the complete setup with one command:

```
chmod +x run-ids-with-mongodb.sh
./run-ids-with-mongodb.sh
```

## Verification

After running the script, you can verify the MongoDB integration is working by:

1. Checking the MongoDB logs page at: http://localhost:3000/logs?tab=mongodb
2. Looking for green "success" indicators in the logs 
3. Verifying that the attack counts display non-zero numbers

## Manual Testing

If you want to manually test the MongoDB integration:

1. Start the system using one of the scripts above
2. Go to the MongoDB logs page (http://localhost:3000/logs?tab=mongodb)
3. Click the "Send Test Data" button to generate a test entry
4. Observe the logs to confirm successful storage

## Running Individual Components

### MongoDB Backend Only

```
cd backend-mongodb
npm install
npm start
```

### Next.js Frontend Only

```
npm run dev
```

### Running Specific Attack Simulations

- **USB Attacks**: `simulate_usb_attack.bat` (Windows) or `./simulate_usb_attack.sh` (Linux)
- **Network Attacks**: `attack_simulator.bat` or `attack_multi_mongodb.bat` (Windows)
- **IDS Events**: `simulate-ids-events.bat` (Windows) or `node simulate_ids_event.js` (any OS)

## Troubleshooting

### MongoDB Connection Issues

If you see connection errors:
1. Verify that port 5000 is not already in use by another application
2. Check that the MongoDB backend is running (`backend-mongodb/mongodb.log` should show "MongoDB Connected")
3. Verify that `.env.local` has the correct MongoDB URI

### Fixing Frontend URL Issues

If the frontend can't connect to MongoDB:
1. Make sure `NEXT_PUBLIC_MONGODB_API_URL` is set to `http://localhost:5000` in `.env.local`
2. Restart both the MongoDB backend and the frontend

## About the MongoDB Integration

All data from the Windows IDS system is automatically stored in MongoDB:
- USB device insertions and scan results
- Attack detection and monitoring data
- IDS events from the intrusion detection system
- Test entries and manually generated data

The MongoDB database provides persistent storage that survives system restarts and allows for historical data analysis. 