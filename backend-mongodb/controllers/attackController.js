const Attack = require('../models/Attack');
const USBDevice = require('../models/USBDevice');
const { logger } = require('../db');

// Get all attacks
exports.getAllAttacks = async (req, res) => {
  try {
    const attacks = await Attack.find().sort({ timestamp: -1 });
    res.status(200).json(attacks);
  } catch (err) {
    logger.error(`Error getting attacks: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Get a single attack by ID
exports.getAttackById = async (req, res) => {
  try {
    const attack = await Attack.findOne({ id: req.params.id });
    if (!attack) {
      return res.status(404).json({ message: 'Attack not found' });
    }
    res.status(200).json(attack);
  } catch (err) {
    logger.error(`Error getting attack: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Create a new attack (from USB detector or other sources)
exports.createAttack = async (req, res) => {
  try {
    const attackData = req.body;
    
    // Check if attack already exists
    const existingAttack = await Attack.findOne({ id: attackData.id });
    if (existingAttack) {
      return res.status(409).json({ message: 'Attack with this ID already exists' });
    }

    // Create new attack
    const attack = new Attack(attackData);
    await attack.save();
    
    // If it's a USB-related attack, update USB device information
    if (attackData.threat_type === 'USB-Device' || attackData.threat_type === 'USB-Scan') {
      await handleUSBDeviceData(attackData);
    }

    // Return success
    res.status(201).json({
      success: true,
      message: 'Attack recorded successfully',
      data: attack
    });
  } catch (err) {
    logger.error(`Error creating attack: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Update attack status
exports.updateAttackStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const attack = await Attack.findOne({ id: req.params.id });
    if (!attack) {
      return res.status(404).json({ message: 'Attack not found' });
    }
    
    attack.status = status;
    await attack.save();
    
    res.status(200).json({
      success: true,
      message: 'Attack status updated',
      data: attack
    });
  } catch (err) {
    logger.error(`Error updating attack: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Helper function to manage USB device data
async function handleUSBDeviceData(attackData) {
  try {
    if (!attackData.details || !attackData.details.drive_letter) {
      return;
    }
    
    const driveLetter = attackData.details.drive_letter;
    
    // Find or create USB device record
    let usbDevice = await USBDevice.findOne({ drive_letter: driveLetter });
    
    if (usbDevice) {
      // Update existing device
      usbDevice.last_detected = new Date();
      usbDevice.detection_count += 1;
      
      // If this is a scan, add to scans array
      if (attackData.threat_type === 'USB-Scan' && attackData.scan_results) {
        usbDevice.scans.push({
          timestamp: new Date(attackData.timestamp) || new Date(),
          total_files: attackData.scan_results.total_files,
          suspicious_files: attackData.scan_results.suspicious_files,
          suspicious_file_details: attackData.scan_results.suspicious_file_list || []
        });
      }
    } else {
      // Create new USB device entry
      usbDevice = new USBDevice({
        drive_letter: driveLetter,
        volume_name: attackData.details.volume_name,
        size_gb: attackData.details.size_gb,
        filesystem: attackData.details.filesystem,
        serial_number: attackData.details.serial_number,
        first_detected: new Date(attackData.timestamp) || new Date(),
        last_detected: new Date(attackData.timestamp) || new Date()
      });
      
      // If this is a scan, add to scans array
      if (attackData.threat_type === 'USB-Scan' && attackData.scan_results) {
        usbDevice.scans.push({
          timestamp: new Date(attackData.timestamp) || new Date(),
          total_files: attackData.scan_results.total_files,
          suspicious_files: attackData.scan_results.suspicious_files,
          suspicious_file_details: attackData.scan_results.suspicious_file_list || []
        });
      }
    }
    
    await usbDevice.save();
    logger.info(`USB device data updated for ${driveLetter}`);
  } catch (err) {
    logger.error(`Error handling USB device data: ${err.message}`);
  }
} 