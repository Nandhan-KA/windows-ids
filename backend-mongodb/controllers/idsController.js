const IDSEvent = require('../models/IDSEvent');
const { logger } = require('../db');

// Get all IDS events
exports.getAllIDSEvents = async (req, res) => {
  try {
    const events = await IDSEvent.find().sort({ timestamp: -1 });
    res.status(200).json(events);
  } catch (err) {
    logger.error(`Error getting IDS events: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Get a single IDS event by ID
exports.getIDSEventById = async (req, res) => {
  try {
    const event = await IDSEvent.findOne({ id: req.params.id });
    if (!event) {
      return res.status(404).json({ message: 'IDS event not found' });
    }
    res.status(200).json(event);
  } catch (err) {
    logger.error(`Error getting IDS event: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Create a new IDS event
exports.createIDSEvent = async (req, res) => {
  try {
    const eventData = req.body;
    
    // Check if event already exists
    const existingEvent = await IDSEvent.findOne({ id: eventData.id });
    if (existingEvent) {
      return res.status(409).json({ message: 'IDS event with this ID already exists' });
    }

    // Create new event
    const event = new IDSEvent(eventData);
    await event.save();
    
    // Return success
    res.status(201).json({
      success: true,
      message: 'IDS event recorded successfully',
      data: event
    });
  } catch (err) {
    logger.error(`Error creating IDS event: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Update IDS event status
exports.updateIDSEventStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const event = await IDSEvent.findOne({ id: req.params.id });
    if (!event) {
      return res.status(404).json({ message: 'IDS event not found' });
    }
    
    event.status = status;
    await event.save();
    
    res.status(200).json({
      success: true,
      message: 'IDS event status updated',
      data: event
    });
  } catch (err) {
    logger.error(`Error updating IDS event: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Get IDS statistics
exports.getIDSStatistics = async (req, res) => {
  try {
    const totalEvents = await IDSEvent.countDocuments();
    
    // Count by severity
    const criticalEvents = await IDSEvent.countDocuments({ severity: 'critical' });
    const highEvents = await IDSEvent.countDocuments({ severity: 'high' });
    const mediumEvents = await IDSEvent.countDocuments({ severity: 'medium' });
    const lowEvents = await IDSEvent.countDocuments({ severity: 'low' });
    
    // Count by status
    const activeEvents = await IDSEvent.countDocuments({ status: 'active' });
    const resolvedEvents = await IDSEvent.countDocuments({ status: 'resolved' });
    
    // Count by event type
    const networkEvents = await IDSEvent.countDocuments({ event_type: 'network' });
    const hostEvents = await IDSEvent.countDocuments({ event_type: 'host' });
    const applicationEvents = await IDSEvent.countDocuments({ event_type: 'application' });
    const systemEvents = await IDSEvent.countDocuments({ event_type: 'system' });
    
    // Get recent events (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const recentEvents = await IDSEvent.countDocuments({
      timestamp: { $gte: oneDayAgo }
    });
    
    res.status(200).json({
      totalEvents,
      bySeverity: {
        critical: criticalEvents,
        high: highEvents,
        medium: mediumEvents,
        low: lowEvents
      },
      byStatus: {
        active: activeEvents,
        resolved: resolvedEvents
      },
      byType: {
        network: networkEvents,
        host: hostEvents,
        application: applicationEvents,
        system: systemEvents
      },
      recentEvents
    });
  } catch (err) {
    logger.error(`Error getting IDS statistics: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
}; 