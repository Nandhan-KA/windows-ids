const mongoose = require('mongoose');

const attackSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  source_ip: String,
  target: String,
  title: {
    type: String,
    required: true
  },
  description: String,
  threat_type: String,
  status: {
    type: String,
    enum: ['active', 'resolved', 'investigating', 'dismissed'],
    default: 'active'
  },
  details: mongoose.Schema.Types.Mixed,
  scan_results: {
    total_files: Number,
    suspicious_files: Number,
    suspicious_file_list: [mongoose.Schema.Types.Mixed]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attack', attackSchema); 