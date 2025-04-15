import { NextRequest, NextResponse } from 'next/server';

// Simulated blocked IPs
const blockedIPs = [
  {
    id: "ip-1",
    address: "198.51.100.12",
    reason: "Brute Force Attempt",
    blockDate: "2025-04-12T14:48:00.000Z",
    attemptCount: 32,
    country: "Unknown"
  },
  {
    id: "ip-2",
    address: "203.0.113.5",
    reason: "Port Scanning",
    blockDate: "2025-04-11T08:22:14.000Z",
    attemptCount: 115,
    country: "Unknown"
  },
  {
    id: "ip-3",
    address: "192.0.2.11",
    reason: "DDoS Participation",
    blockDate: "2025-04-10T19:17:43.000Z",
    attemptCount: 457,
    country: "Unknown"
  }
];

export async function GET(request: NextRequest) {
  try {
    // Return simulated blocked IPs
    return NextResponse.json(blockedIPs);
  } catch (error) {
    console.error("Error fetching blocked IPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocked IPs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // In a real implementation, we would block the IP in the firewall
    // For the simulation, we just return success
    
    // Generate an ID for the new blocked IP
    const newBlockedIP = {
      id: `ip-${Date.now()}`,
      address: data.address,
      reason: data.reason || "Manual Block",
      blockDate: new Date().toISOString(),
      attemptCount: data.attemptCount || 1,
      country: data.country || "Unknown"
    };
    
    // Return the new blocked IP
    return NextResponse.json({
      success: true,
      message: "IP address blocked successfully",
      blockedIP: newBlockedIP
    });
  } catch (error) {
    console.error("Error blocking IP:", error);
    return NextResponse.json(
      { error: "Failed to block IP address" },
      { status: 500 }
    );
  }
} 