const mongoose = require('mongoose');

const usbDeviceSchema = new mongoose.Schema({
  drive_letter: {
    type: String,
    required: true
  },
  volume_name: String,
  size_gb: Number,
  filesystem: String,
  serial_number: String,
  first_detected: {
    type: Date,
    default: Date.now
  },
  last_detected: {
    type: Date,
    default: Date.now
  },
  is_blocked: {
    type: Boolean,
    default: false
  },
  detection_count: {
    type: Number,
    default: 1
  },
  scans: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    total_files: Number,
    suspicious_files: Number,
    suspicious_file_details: [mongoose.Schema.Types.Mixed]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('USBDevice', usbDeviceSchema); 