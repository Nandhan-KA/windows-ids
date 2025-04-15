/**
 * MongoDB Connection Test
 * 
 * This script tests the connection to the MongoDB backend
 * Run with: node test-mongodb.js
 */

const http = require('http');

const MONGODB_API_URL = process.env.MONGODB_API_URL || 'http://localhost:5000';

console.log(`Testing MongoDB backend at ${MONGODB_API_URL}`);
console.log('---------------------------------------------------');

// Make a request to the ping endpoint
const pingReq = http.get(`${MONGODB_API_URL}/api/ping`, (res) => {
  console.log(`MongoDB Ping Status: ${res.statusCode} ${res.statusMessage}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('Response:', JSON.parse(data));
      console.log('\n✅ MongoDB backend is running properly.');
      
      // Test the API endpoints
      testAPIEndpoints();
    } else {
      console.log('\n❌ MongoDB backend is not responding properly.');
      console.log('Make sure backend-mongodb is running with:');
      console.log('  cd backend-mongodb && npm start');
    }
  });
});

pingReq.on('error', (error) => {
  console.error('\n❌ Could not connect to MongoDB backend:', error.message);
  console.log('Make sure MongoDB backend is running with:');
  console.log('  cd backend-mongodb && npm start');
});

pingReq.setTimeout(5000, () => {
  console.error('\n❌ Connection to MongoDB backend timed out.');
  console.log('Make sure MongoDB backend is running with:');
  console.log('  cd backend-mongodb && npm start');
  pingReq.abort();
});

// Test API endpoints
function testAPIEndpoints() {
  console.log('\nTesting API endpoints...');
  
  // Get the root endpoint to see available endpoints
  const rootReq = http.get(`${MONGODB_API_URL}/`, (res) => {
    console.log(`Root API Status: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log('Available endpoints:', Object.keys(response.endpoints).join(', '));
        console.log('\n✅ API endpoints are available.');
      } else {
        console.log('\n⚠️ API root endpoint is not responding properly.');
      }
    });
  });
  
  rootReq.on('error', (error) => {
    console.error('\n❌ Could not connect to API root endpoint:', error.message);
  });
} 