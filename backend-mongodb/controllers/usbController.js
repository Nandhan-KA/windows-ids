const USBDevice = require('../models/USBDevice');
const { logger } = require('../db');

// Get all USB devices
exports.getAllUSBDevices = async (req, res) => {
  try {
    const devices = await USBDevice.find().sort({ last_detected: -1 });
    res.status(200).json(devices);
  } catch (err) {
    logger.error(`Error getting USB devices: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Get a single USB device
exports.getUSBDeviceById = async (req, res) => {
  try {
    const device = await USBDevice.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'USB device not found' });
    }
    res.status(200).json(device);
  } catch (err) {
    logger.error(`Error getting USB device: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Update USB device block status
exports.updateBlockStatus = async (req, res) => {
  try {
    const { is_blocked } = req.body;
    
    const device = await USBDevice.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'USB device not found' });
    }
    
    device.is_blocked = is_blocked;
    await device.save();
    
    res.status(200).json({
      success: true,
      message: `USB device ${is_blocked ? 'blocked' : 'unblocked'} successfully`,
      data: device
    });
  } catch (err) {
    logger.error(`Error updating USB device: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Get USB device statistics
exports.getUSBStatistics = async (req, res) => {
  try {
    const totalDevices = await USBDevice.countDocuments();
    const blockedDevices = await USBDevice.countDocuments({ is_blocked: true });
    
    // Get devices with suspicious files
    const devicesWithSuspiciousFiles = await USBDevice.find({
      'scans.suspicious_files': { $gt: 0 }
    });
    
    // Calculate total suspicious files
    let totalSuspiciousFiles = 0;
    for (const device of devicesWithSuspiciousFiles) {
      for (const scan of device.scans) {
        totalSuspiciousFiles += scan.suspicious_files || 0;
      }
    }
    
    // Get recent device detections (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentDevices = await USBDevice.countDocuments({
      last_detected: { $gte: thirtyDaysAgo }
    });
    
    res.status(200).json({
      totalDevices,
      blockedDevices,
      devicesWithThreats: devicesWithSuspiciousFiles.length,
      totalSuspiciousFiles,
      recentDevices
    });
  } catch (err) {
    logger.error(`Error getting USB statistics: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
}; 