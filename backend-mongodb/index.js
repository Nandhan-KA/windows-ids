require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const { connectDB, logger } = require('./db');

// Import routes
const attackRoutes = require('./routes/attackRoutes');
const usbRoutes = require('./routes/usbRoutes');
const idsRoutes = require('./routes/idsRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(morgan('combined'));

// Routes
app.use('/api/attacks', attackRoutes);
app.use('/api/usb-devices', usbRoutes);
app.use('/api/ids-events', idsRoutes);

// Special route for USB detector and IDS to send alerts
app.post('/api/debug/simulate-attack', async (req, res) => {
  try {
    // Get the alert data
    const alertData = req.body;
    
    logger.info(`Received alert: ${alertData.type || 'unknown type'}`);
    
    // Determine alert type and store accordingly
    if (alertData.threat_type === 'USB-Device' || alertData.threat_type === 'USB-Scan') {
      // Handle USB-related data
      const Attack = require('./models/Attack');
      const attack = new Attack(alertData);
      await attack.save();
      
      // Update USB device info
      const { handleUSBDeviceData } = require('./controllers/attackController');
      await handleUSBDeviceData(alertData);
      
      logger.info(`Saved USB alert data to MongoDB`);
    } else if (alertData.event_type && ['network', 'host', 'application', 'system', 'other'].includes(alertData.event_type)) {
      // This is an IDS event
      const IDSEvent = require('./models/IDSEvent');
      const idsEvent = new IDSEvent(alertData);
      await idsEvent.save();
      
      logger.info(`Saved IDS event data to MongoDB`);
    } else {
      // Handle as generic attack
      const Attack = require('./models/Attack');
      const attack = new Attack(alertData);
      await attack.save();
      
      logger.info(`Saved generic attack data to MongoDB`);
    }
    
    // Forward to existing endpoint if a proxy URL is specified
    if (process.env.NEXTJS_PROXY_URL) {
      const axios = require('axios');
      await axios.post(`${process.env.NEXTJS_PROXY_URL}/api/debug/simulate-attack`, alertData);
      logger.info(`Forwarded alert to Next.js endpoint`);
    }
    
    res.status(200).json({
      success: true,
      message: 'Alert data received and saved to MongoDB'
    });
  } catch (err) {
    logger.error(`Error handling alert: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Windows IDS MongoDB API is running',
    endpoints: {
      attacks: '/api/attacks',
      usbDevices: '/api/usb-devices',
      idsEvents: '/api/ids-events',
      simulateAttack: '/api/debug/simulate-attack'
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
}); 