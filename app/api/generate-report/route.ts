import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    
    // Get API base URL from environment variable or use default
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
    
    // Forward the request to the Python backend
    const response = await fetch(`${apiBaseUrl}/api/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    // Get the response data
    const responseData = await response.json()
    
    // Return the response data
    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || 'Failed to generate report' }, 
        { status: response.status }
      )
    }
    
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
} 