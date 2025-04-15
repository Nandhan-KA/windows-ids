# Windows IDS - Intrusion Detection System

A real-time intrusion detection system for Windows with admin privileges, network monitoring, automated reporting, and more.

## Features

- **Admin Privileges** - Request and use admin privileges for enhanced system monitoring
- **Real-time Network Monitoring** - Monitor network traffic and connections in real-time
- **Custom Network Analyzer Integration** - Support for your custom Tkinter network analyzer
- **Automated Reporting** - Schedule security reports to be sent via email at regular intervals
- **Windows Security Alerts** - Receive real-time notifications about security threats
- **Comprehensive Dashboard** - View system status, threats, and network activity
- **Attack Simulation** - Test your security posture with simulated attacks
- **MongoDB Integration** - Persistent storage for security events

## Setup

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- NPM or PNPM
- MongoDB (local or Atlas)
- Windows operating system

### Environment Configuration

Create a `.env.local` file in the root directory with your email settings:

```
# Email Configuration
SMTP_HOST=smtp.zoho.in
SMTP_PORT=587
SMTP_USER=noreply@scholarpeak.in
SMTP_PASS=TMtdYTcbSghf
```

### Installation

1. Install frontend dependencies:

```bash
npm install --legacy-peer-deps
```

2. Install Python backend dependencies:

```bash
cd backend-python
pip install -r requirements.txt
```

3. Set up your custom network analyzer:
   - Ensure your custom analyzer (network_analyzer_tkinter.py) is available at the path: `C:\Users\nandhanka\Desktop\ids\network_analyzer_tkinter.py`
   - If it's in a different location, update the path in `backend-python/network_integration.py`

4. Configure MongoDB:
   - Create a `.env` file in the `backend-mongodb` directory
   - Add your MongoDB connection string:
     ```
     MONGODB_URI=your_mongodb_connection_string
     PORT=5000
     NODE_ENV=development
     ```

## Running the Application

### Option 1: Python Backend with Custom Network Analyzer (Recommended)

The Python backend uses your custom network analyzer for real-time traffic monitoring.

```bash
cd backend-python
python app.py
```

The Python backend will:
1. Automatically detect and load your custom network analyzer
2. Integrate its data with the IDS system
3. Start on port 5000

### Option 2: Python Backend without Custom Analyzer

If your custom network analyzer is not available, the system will fall back to built-in monitoring:

```bash
cd backend-python
python app.py
```

### Option 3: Node.js Backend

If you prefer using the Node.js backend (without custom analyzer support):

```bash
cd backend
npm install
npm run dev
```

### Start the Frontend

In a new terminal:

```bash
npm run dev
```

The frontend will be available at http://localhost:3000.

### Easy Method (Windows)
Double-click the `start.bat` file in the root directory. This will start both the MongoDB backend and the Next.js frontend.

### Using npm scripts
To start everything in one command:
```
npm run start:all
```

To start only the MongoDB backend:
```
npm run start:mongodb
```

To start only the Next.js frontend:
```
npm run dev
```

## Using the Application

1. Open http://localhost:3000 in your web browser
2. Go to Settings > Admin to request admin privileges
3. Use the Dashboard to monitor system and network activity
4. Configure email reporting in the Reporting section
5. Explore the other features like Attack Simulation and Firewall configuration

## Custom Network Analyzer Integration

The system integrates with your custom Tkinter-based network analyzer:

- File path: `C:\Users\nandhanka\Desktop\ids\network_analyzer_tkinter.py`
- Real-time data from your analyzer is automatically fed into the IDS system
- All network traffic data can be viewed in the Network Traffic section
- Suspicious connections detected by your analyzer will trigger alerts
- API endpoints allow controlling the analyzer from the UI

## Python vs Node.js Backend

### Python Backend Advantages
- Direct access to Windows system information
- Real network connection monitoring with psutil
- Better identification of suspicious activities
- Actual admin privilege checking
- Real system metrics (CPU, memory, network traffic)
- **Support for your custom network analyzer**

### Node.js Backend Advantages
- Simpler setup
- Lower system requirements
- Compatible with more platforms

## Reporting

- **Automatic Reports**: Configure in the Reporting section to send reports every 10 minutes (adjustable)
- **Manual Reports**: Use the "Generate Report" button to send an immediate report
- **Recipient**: Reports are sent to developer.nandhank@gmail.com by default (configurable)

## Real-time Updates

The application uses Socket.IO for real-time updates from the backend server:

- Network connections are updated in real-time
- Security events are shown as they occur
- Windows notifications appear for suspicious activities

## Architecture

- **Frontend**: Next.js with React, Tailwind CSS, and shadcn/UI
- **Backend Options**: 
  - Python (Flask, psutil, WebSockets) with your custom network analyzer - recommended for real data
  - Python without custom analyzer - good alternative
  - Node.js (Express, Socket.IO) - simpler option
- **Integrations**: ZohoMail for email reporting
- **MongoDB Backend**: A persistent storage backend that runs alongside the application

The MongoDB backend automatically keeps connections alive and ensures all data is properly stored and retrieved.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 