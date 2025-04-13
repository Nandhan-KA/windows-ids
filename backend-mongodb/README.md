# Windows IDS MongoDB Backend

This is a MongoDB backend for the Windows IDS system that stores all attack data, USB monitoring data, IDS events, threats, and alerts.

## Features

- Store all USB device insertions and scan results
- Store all IDS events and alerts
- Store all attack data and general alerts
- Provide API endpoints for retrieving and updating data
- Compatible with the existing front-end

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   NODE_ENV=development
   NEXTJS_PROXY_URL=http://localhost:3000
   ```

3. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Attacks

- `GET /api/attacks` - Get all attacks
- `GET /api/attacks/:id` - Get attack by ID
- `POST /api/attacks` - Create a new attack
- `PATCH /api/attacks/:id/status` - Update attack status

### USB Devices

- `GET /api/usb-devices` - Get all USB devices
- `GET /api/usb-devices/statistics` - Get USB device statistics
- `GET /api/usb-devices/:id` - Get USB device by ID
- `PATCH /api/usb-devices/:id/block` - Update USB device block status

### IDS Events

- `GET /api/ids-events` - Get all IDS events
- `GET /api/ids-events/statistics` - Get IDS event statistics
- `GET /api/ids-events/:id` - Get IDS event by ID
- `POST /api/ids-events` - Create a new IDS event
- `PATCH /api/ids-events/:id/status` - Update IDS event status

### Compatibility Endpoint

- `POST /api/debug/simulate-attack` - Receive attack/IDS event data and forward to the Next.js front-end

## Integration with Existing Application

This MongoDB backend is designed to be a drop-in replacement for the existing storage system. It stores all data in MongoDB while maintaining compatibility with the existing front-end by forwarding data to the Next.js app.

## Data Types

### USB Data
The system stores information about USB device insertions, including device details and scan results for potentially malicious files.

### IDS Events
The system stores IDS events of various types (network, host, application, system) with detailed information about each security event detected by the intrusion detection system.

### General Attacks
The system stores general attack information that doesn't fit into the USB or IDS categories. 