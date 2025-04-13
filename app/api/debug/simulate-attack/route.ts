import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Store connected clients for server-sent events
export const clients = new Set<ReadableStreamController<any>>();

// Store pending attack events
export const pendingAttacks: any[] = [];

// MongoDB backend URL
const MONGODB_API_URL = process.env.MONGODB_API_URL || 'http://localhost:5000';

// Helper function to send data to MongoDB
async function sendToMongoDB(data: any): Promise<boolean> {
  try {
    const response = await axios.post(`${MONGODB_API_URL}/api/debug/simulate-attack`, data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Error sending to MongoDB:', error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  // Create a stream for server-sent events
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to our set
      clients.add(controller);
      
      // Send any pending attacks
      if (pendingAttacks.length > 0) {
        pendingAttacks.forEach(attack => {
          const data = `data: ${JSON.stringify({ attack })}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        });
      }
      
      // Remove client when connection closes
      req.signal.addEventListener('abort', () => {
        clients.delete(controller);
      });
    }
  });
  
  // Return the stream as an SSE response
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Parse the attack data from the request
    const attackData = await req.json();
    
    // Add CORS headers to enable cross-origin requests
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 200,
        headers
      });
    }
    
    // Validate the attack data
    if (!attackData) {
      return NextResponse.json({ success: false, error: 'No attack data provided' }, { 
        status: 400,
        headers
      });
    }
    
    // Check if running in browser environment and directly save to localStorage
    // This won't run in Node.js but helps when the endpoint is called from the client side
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Save to localStorage
        const existingAttacksJson = localStorage.getItem('simulatedAttacks');
        const existingAttacks = existingAttacksJson ? JSON.parse(existingAttacksJson) : [];
        existingAttacks.unshift(attackData);
        localStorage.setItem('simulatedAttacks', JSON.stringify(existingAttacks));
        
        // Dispatch custom event
        const simulatedAttackEvent = new CustomEvent('simulated-attack', { 
          detail: attackData 
        });
        window.dispatchEvent(simulatedAttackEvent);
      } catch (e) {
        console.error('Error directly saving to browser storage:', e);
      }
    }
    
    // Add attack to pending attacks (keep only last 10)
    pendingAttacks.unshift(attackData);
    if (pendingAttacks.length > 10) {
      pendingAttacks.length = 10;
    }
    
    // Save to MongoDB in server environment
    if (typeof window === 'undefined') {
      try {
        await sendToMongoDB(attackData);
        console.log('Attack data sent to MongoDB from server-side');
      } catch (e) {
        console.error('Error sending data to MongoDB from server-side:', e);
      }
    }
    
    // Broadcast the attack to all connected clients
    const data = `data: ${JSON.stringify({ attack: attackData })}\n\n`;
    for (const client of clients) {
      client.enqueue(new TextEncoder().encode(data));
    }
    
    // Return success
    return NextResponse.json({ 
      success: true,
      message: "Attack alert received and broadcast to clients",
      saved: typeof window !== 'undefined' && window.localStorage ? true : false,
      mongodb: typeof window === 'undefined' ? true : false
    }, { 
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error handling attack simulation:', error);
    return NextResponse.json({ success: false, error: String(error) }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}

// Handle OPTIONS requests
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 