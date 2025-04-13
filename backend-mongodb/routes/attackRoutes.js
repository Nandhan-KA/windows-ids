const express = require('express');
const router = express.Router();
const attackController = require('../controllers/attackController');

// Get all attacks
router.get('/', attackController.getAllAttacks);

// Get attack by ID
router.get('/:id', attackController.getAttackById);

// Create a new attack
router.post('/', attackController.createAttack);

// Update attack status
router.patch('/:id/status', attackController.updateAttackStatus);

module.exports = router; 