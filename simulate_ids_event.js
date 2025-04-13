#!/usr/bin/env node

/**
 * IDS Event Simulator
 * 
 * This script generates simulated IDS events and sends them to the MongoDB backend.
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const config = {
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000/api/debug/simulate-attack',
  numEvents: parseInt(process.env.NUM_EVENTS || '1', 10),
  eventTypes: ['network', 'host', 'application', 'system', 'other'],
  severities: ['low', 'medium', 'high', 'critical']
};

// Helper function to generate a random IDS event
function generateRandomIDSEvent() {
  const eventType = config.eventTypes[Math.floor(Math.random() * config.eventTypes.length)];
  const severity = config.severities[Math.floor(Math.random() * config.severities.length)];
  const timestamp = new Date().toISOString();
  const id = `ids-${crypto.randomBytes(8).toString('hex')}-${Date.now()}`;
  
  // Generate random IPs
  const sourceIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  const destIP = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  
  // Base event data
  const eventData = {
    id,
    timestamp,
    event_type: eventType,
    severity,
    source_ip: sourceIP,
    destination_ip: destIP,
    protocol: ['TCP', 'UDP', 'ICMP', 'HTTP', 'SMB'][Math.floor(Math.random() * 5)],
    port: Math.floor(Math.random() * 65535),
    status: 'active',
    tags: ['simulated', 'test', eventType]
  };
  
  // Add event-type specific data
  switch (eventType) {
    case 'network':
      eventData.title = `Network Intrusion - ${['Port Scan', 'Suspicious Traffic', 'DDoS Attempt', 'Brute Force'][Math.floor(Math.random() * 4)]}`;
      eventData.description = `Detected suspicious network activity from ${sourceIP} to ${destIP}`;
      eventData.raw_data = {
        packet_count: Math.floor(Math.random() * 1000),
        traffic_mb: (Math.random() * 100).toFixed(2),
        duration_sec: Math.floor(Math.random() * 300)
      };
      break;
      
    case 'host':
      eventData.title = `Host Security - ${['Unauthorized Access', 'Privilege Escalation', 'Suspicious Process', 'File System Change'][Math.floor(Math.random() * 4)]}`;
      eventData.description = `Detected suspicious activity on the host system`;
      eventData.user = ['admin', 'system', 'guest', 'user1'][Math.floor(Math.random() * 4)];
      eventData.process = ['svchost.exe', 'explorer.exe', 'cmd.exe', 'powershell.exe'][Math.floor(Math.random() * 4)];
      break;
      
    case 'application':
      eventData.title = `Application Security - ${['SQL Injection', 'XSS Attempt', 'Authentication Failure', 'API Abuse'][Math.floor(Math.random() * 4)]}`;
      eventData.description = `Detected suspicious application activity`;
      eventData.raw_data = {
        app_name: ['WebApp', 'Database', 'API Server', 'Auth Service'][Math.floor(Math.random() * 4)],
        request_path: ['/login', '/admin', '/api/users', '/data'][Math.floor(Math.random() * 4)]
      };
      break;
      
    case 'system':
      eventData.title = `System Security - ${['Configuration Change', 'Registry Modification', 'System File Change', 'Service Creation'][Math.floor(Math.random() * 4)]}`;
      eventData.description = `Detected suspicious system change`;
      eventData.raw_data = {
        component: ['Registry', 'Filesystem', 'Services', 'Scheduler'][Math.floor(Math.random() * 4)],
        change_type: ['Create', 'Modify', 'Delete', 'Execute'][Math.floor(Math.random() * 4)]
      };
      break;
      
    default: // other
      eventData.title = `Security Event - Unknown Type`;
      eventData.description = `Detected unusual activity`;
      break;
  }
  
  return eventData;
}

// Send events to the server
async function sendEvents() {
  console.log(`Sending ${config.numEvents} simulated IDS events to ${config.serverUrl}`);
  
  for (let i = 0; i < config.numEvents; i++) {
    const eventData = generateRandomIDSEvent();
    try {
      console.log(`Sending event: ${eventData.title}`);
      const response = await axios.post(config.serverUrl, eventData);
      console.log(`Response: ${response.status} - ${response.statusText}`);
      
      // Small delay between requests
      if (i < config.numEvents - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error sending event:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  }
}

// Run the script
sendEvents().then(() => {
  console.log('Finished sending simulated IDS events');
}).catch(error => {
  console.error('Error:', error.message);
}); 