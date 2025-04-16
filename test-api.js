const http = require('http');

function testAPI() {
  console.log('Fetching from root endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status code: ${res.statusCode}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data.substring(0, 200) + '...');
    });
  });
  
  req.on('error', (error) => {
    console.error('Error fetching data:', error.message);
  });
  
  req.end();
}

testAPI(); 