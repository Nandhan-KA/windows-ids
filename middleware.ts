import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // For SSE connections, ensure proper headers
  if (request.nextUrl.pathname.includes('/simulate-attack-stream')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Connection', 'keep-alive');
  }
  
  return response;
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware
export const config = {
  matcher: [
    // Match API routes
    '/api/:path*',
  ],
}; 