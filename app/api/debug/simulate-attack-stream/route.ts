import { NextRequest, NextResponse } from 'next/server';
import { clients, pendingAttacks } from '../simulate-attack/route';

export async function GET(req: NextRequest) {
  // Create a stream for server-sent events
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to our set
      clients.add(controller);
      
      // Send any pending attacks immediately
      if (pendingAttacks.length > 0) {
        pendingAttacks.forEach((attack: any) => {
          const data = `data: ${JSON.stringify({ attack })}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        });
      }
      
      // Send initial keepalive
      controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
      
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
    },
  });
} 