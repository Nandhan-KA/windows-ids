import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple ping endpoint for MongoDB keepalive
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    status: 'success',
    timestamp: new Date().toISOString(),
    message: 'MongoDB backend is reachable'
  }, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 