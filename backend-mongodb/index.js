require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const { connectDB, logger } = require('./db');
const mongoose = require('mongoose');

// Import routes
const attackRoutes = require('./routes/attackRoutes');
const usbRoutes = require('./routes/usbRoutes');
const idsRoutes = require('./routes/idsRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
let mongoConnection = null;
connectDB()
  .then(connection => {
    mongoConnection = connection;
    logger.info('MongoDB connection established');
  })
  .catch(err => {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
    // Don't exit process here to allow reconnection attempts
  });

// Add MongoDB connection state monitoring with reconnection attempt
const checkMongoConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    logger.warn('MongoDB connection is not established. Attempting to reconnect...');
    connectDB()
      .then(connection => {
        mongoConnection = connection;
        logger.info('MongoDB connection re-established');
      })
      .catch(err => {
        logger.error(`Failed to reconnect to MongoDB: ${err.message}`);
      });
  }
};

// Check MongoDB connection every 30 seconds
setInterval(checkMongoConnection, 30000);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(bodyParser.json());
app.use(morgan('combined'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error processing request: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Routes
app.use('/api/attacks', attackRoutes);
app.use('/api/usb-devices', usbRoutes);
app.use('/api/ids-events', idsRoutes);

// Ping endpoint for health check and keepalive
app.get('/api/ping', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoConnection ? 'connected' : 'disconnected',
    version: '1.0.0'
  });
});

// Special route for USB detector and IDS to send alerts
app.post('/api/debug/simulate-attack', async (req, res) => {
  try {
    // Get the alert data
    const alertData = req.body;
    
    if (!alertData) {
      return res.status(400).json({
        success: false,
        message: 'No alert data provided'
      });
    }
    
    logger.info(`Received alert: ${alertData.type || alertData.threat_type || 'unknown type'}`);
    
    // Determine alert type and store accordingly
    if (alertData.threat_type === 'USB-Device' || alertData.threat_type === 'USB-Scan') {
      try {
        // Handle USB-related data
        const Attack = require('./models/Attack');
        
        // Generate ID if not present
        if (!alertData.id) {
          alertData.id = `usb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        // Use findOneAndUpdate with upsert instead of direct save to handle duplicates
        await Attack.findOneAndUpdate(
          { id: alertData.id },
          alertData,
          { upsert: true, new: true, runValidators: true }
        );
        
        // Update USB device info
        const attackController = require('./controllers/attackController');
        if (typeof attackController.handleUSBDeviceData === 'function') {
          await attackController.handleUSBDeviceData(alertData);
        } else {
          logger.error('handleUSBDeviceData function not found in attackController');
        }
        
        logger.info(`Saved USB alert data to MongoDB`);
      } catch (modelError) {
        logger.error(`Error processing USB alert: ${modelError.message}`);
        return res.status(500).json({ 
          success: false, 
          error: `Error processing USB alert: ${modelError.message}` 
        });
      }
    } else if (alertData.event_type && ['network', 'host', 'application', 'system', 'other'].includes(alertData.event_type)) {
      try {
        // This is an IDS event
        const IDSEvent = require('./models/IDSEvent');
        
        // Generate ID if not present
        if (!alertData.id) {
          alertData.id = `event-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        }
        
        // Use findOneAndUpdate with upsert instead of direct save to handle duplicates
        await IDSEvent.findOneAndUpdate(
          { id: alertData.id },
          alertData,
          { upsert: true, new: true, runValidators: true }
        );
        
        logger.info(`Saved IDS event data to MongoDB`);
      } catch (modelError) {
        logger.error(`Error processing IDS event: ${modelError.message}`);
        return res.status(500).json({ 
          success: false, 
          error: `Error processing IDS event: ${modelError.message}` 
        });
      }
    } else {
      try {
        // Handle as generic attack
        const Attack = require('./models/Attack');
        
        // Generate ID if not present
        if (!alertData.id) {
          alertData.id = `gen-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        }
        
        // Use findOneAndUpdate with upsert instead of direct save to handle duplicates
        await Attack.findOneAndUpdate(
          { id: alertData.id },
          alertData,
          { upsert: true, new: true, runValidators: true }
        );
        
        logger.info(`Saved generic attack data to MongoDB`);
      } catch (modelError) {
        logger.error(`Error processing generic attack: ${modelError.message}`);
        return res.status(500).json({ 
          success: false, 
          error: `Error processing generic attack: ${modelError.message}` 
        });
      }
    }
    
    // Forward to existing endpoint if a proxy URL is specified
    if (process.env.NEXTJS_PROXY_URL) {
      try {
        const axios = require('axios');
        await axios.post(`${process.env.NEXTJS_PROXY_URL}/api/debug/simulate-attack`, alertData);
        logger.info(`Forwarded alert to Next.js endpoint`);
      } catch (proxyError) {
        logger.error(`Error forwarding to Next.js: ${proxyError.message}`);
        // Continue even if proxy forwarding fails
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Alert data received and saved to MongoDB'
    });
  } catch (err) {
    logger.error(`Error handling alert: ${err.message}`);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Windows IDS MongoDB API is running',
    mongodb: mongoConnection ? 'connected' : 'disconnected',
    endpoints: {
      attacks: '/api/attacks',
      usbDevices: '/api/usb-devices',
      idsEvents: '/api/ids-events',
      simulateAttack: '/api/debug/simulate-attack',
      ping: '/api/ping'
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
}); 