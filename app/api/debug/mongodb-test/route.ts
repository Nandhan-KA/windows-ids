import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// MongoDB backend URL
const MONGODB_API_URL = process.env.MONGODB_API_URL || 'http://localhost:5000';

// Define error details type
interface ErrorDetails {
  message: string;
  status?: number;
  data?: any;
  request_made?: boolean;
  no_response?: boolean;
}

export async function GET(req: NextRequest) {
  try {
    // Test MongoDB connection by calling the ping endpoint
    const response = await axios.get(`${MONGODB_API_URL}/api/ping`, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5 second timeout
    });
    
    return NextResponse.json({
      success: true,
      message: "MongoDB backend connection successful",
      mongodb_url: MONGODB_API_URL,
      mongodb_response: response.data,
      status: response.status,
      headers: Object.fromEntries(req.headers)
    });
  } catch (error: any) {
    console.error('Error testing MongoDB connection:', error);
    
    let errorDetails: ErrorDetails = {
      message: error.message
    };
    
    if (error.response) {
      // The server responded with a status other than 2xx
      errorDetails = {
        ...errorDetails,
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // The request was made but no response was received
      errorDetails = {
        ...errorDetails,
        request_made: true,
        no_response: true
      };
    }
    
    return NextResponse.json({
      success: false,
      message: "Failed to connect to MongoDB backend",
      mongodb_url: MONGODB_API_URL,
      error: errorDetails,
      headers: Object.fromEntries(req.headers)
    }, {
      status: 500
    });
  }
}

// Test sending data to MongoDB
export async function POST(req: NextRequest) {
  try {
    // Get the test data or create a default test object
    let testData;
    try {
      testData = await req.json();
    } catch (e) {
      // Use default test data if no JSON provided
      testData = {
        id: `test-${Date.now()}`,
        title: "MongoDB Connection Test",
        type: "test",
        threat_type: "Test",
        severity: "info",
        timestamp: new Date().toISOString(),
        source: "mongodb-test-api"
      };
    }
    
    console.log(`Sending test data to MongoDB at ${MONGODB_API_URL}/api/debug/simulate-attack`);
    
    // Send the test data to MongoDB
    const response = await axios.post(`${MONGODB_API_URL}/api/debug/simulate-attack`, testData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5 second timeout
    });
    
    return NextResponse.json({
      success: true,
      message: "Test data successfully sent to MongoDB",
      mongodb_url: MONGODB_API_URL,
      mongodb_response: response.data,
      test_data: testData
    });
  } catch (error: any) {
    console.error('Error sending test data to MongoDB:', error);
    
    let errorDetails: ErrorDetails = {
      message: error.message
    };
    
    if (error.response) {
      // The server responded with a status other than 2xx
      errorDetails = {
        ...errorDetails,
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // The request was made but no response was received
      errorDetails = {
        ...errorDetails,
        request_made: true,
        no_response: true
      };
    }
    
    return NextResponse.json({
      success: false,
      message: "Failed to send test data to MongoDB",
      mongodb_url: MONGODB_API_URL,
      error: errorDetails
    }, {
      status: 500
    });
  }
} 