const mongoose = require('mongoose');

const idsEventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  event_type: {
    type: String,
    required: true,
    enum: ['network', 'host', 'application', 'system', 'other']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  source_ip: String,
  destination_ip: String,
  protocol: String,
  port: Number,
  user: String,
  process: String,
  title: {
    type: String,
    required: true
  },
  description: String,
  raw_data: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['active', 'resolved', 'investigating', 'dismissed'],
    default: 'active'
  },
  mitigation_actions: [String],
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('IDSEvent', idsEventSchema); 