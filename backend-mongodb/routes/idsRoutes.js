const express = require('express');
const router = express.Router();
const idsController = require('../controllers/idsController');

// Get all IDS events
router.get('/', idsController.getAllIDSEvents);

// Get IDS event statistics
router.get('/statistics', idsController.getIDSStatistics);

// Get IDS event by ID
router.get('/:id', idsController.getIDSEventById);

// Create a new IDS event
router.post('/', idsController.createIDSEvent);

// Update IDS event status
router.patch('/:id/status', idsController.updateIDSEventStatus);

module.exports = router; 