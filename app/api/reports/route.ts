import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Get API base URL from environment variable or use default
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
    
    // Forward the request to the Python backend
    const response = await fetch(`${apiBaseUrl}/api/reports`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // Get the response data
    const responseData = await response.json()
    
    // Return the response data
    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || 'Failed to get reports' }, 
        { status: response.status }
      )
    }
    
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error getting reports:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
} 