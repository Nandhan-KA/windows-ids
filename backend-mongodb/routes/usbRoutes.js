const express = require('express');
const router = express.Router();
const usbController = require('../controllers/usbController');

// Get all USB devices
router.get('/', usbController.getAllUSBDevices);

// Get USB device stats
router.get('/statistics', usbController.getUSBStatistics);

// Get USB device by ID
router.get('/:id', usbController.getUSBDeviceById);

// Update USB device block status
router.patch('/:id/block', usbController.updateBlockStatus);

module.exports = router; 