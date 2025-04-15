/**
 * Windows IDS Application Starter
 * 
 * This script starts both the Next.js frontend and the MongoDB backend.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const LOGS_DIR = path.join(__dirname, 'logs');
const FRONTEND_LOG = path.join(LOGS_DIR, 'frontend.log');
const MONGODB_LOG = path.join(LOGS_DIR, 'mongodb.log');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Initialize logger
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${message}`);
}

// Start MongoDB backend
function startMongoDBBackend() {
  log('Starting MongoDB backend...');
  
  const mongoLogStream = fs.createWriteStream(MONGODB_LOG, { flags: 'a' });
  
  // Start MongoDB backend process
  const mongoProcess = spawn('node', ['scripts/start-mongodb.js'], {
    stdio: ['ignore', mongoLogStream, mongoLogStream]
  });
  
  mongoProcess.on('error', (error) => {
    log(`MongoDB backend error: ${error.message}`);
  });
  
  mongoProcess.on('exit', (code) => {
    if (code !== 0) {
      log(`MongoDB backend exited with code ${code}`);
    }
  });
  
  return mongoProcess;
}

// Start Next.js frontend
function startFrontend() {
  log('Starting Next.js frontend...');
  
  const frontendLogStream = fs.createWriteStream(FRONTEND_LOG, { flags: 'a' });
  
  // Start Next.js frontend process
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', frontendLogStream, frontendLogStream]
  });
  
  frontendProcess.on('error', (error) => {
    log(`Frontend error: ${error.message}`);
  });
  
  frontendProcess.on('exit', (code) => {
    if (code !== 0) {
      log(`Frontend exited with code ${code}`);
    }
  });
  
  return frontendProcess;
}

// Main function
function main() {
  log('Windows IDS Application starting...');
  
  // Start MongoDB backend first
  const mongoProcess = startMongoDBBackend();
  
  // Wait a bit to ensure MongoDB has started
  setTimeout(() => {
    // Then start the frontend
    const frontendProcess = startFrontend();
    
    log('All services started. Press Ctrl+C to stop all services.');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('Stopping all services...');
      
      // Kill processes
      mongoProcess.kill();
      frontendProcess.kill();
      
      log('All services stopped.');
      process.exit(0);
    });
  }, 5000);
}

// Start everything
main(); 