import { NextRequest, NextResponse } from 'next/server';

// Simulated firewall rules
const firewallRules = [
  {
    id: "rule-1",
    name: "Block SSH Access",
    action: "Block",
    protocol: "TCP",
    direction: "Inbound",
    remoteAddress: "Any",
    localPort: "22",
    status: "Enabled",
    priority: 100
  },
  {
    id: "rule-2",
    name: "Allow Web Traffic",
    action: "Allow",
    protocol: "TCP",
    direction: "Inbound",
    remoteAddress: "Any",
    localPort: "80,443",
    status: "Enabled",
    priority: 110
  },
  {
    id: "rule-3",
    name: "Block Telnet",
    action: "Block",
    protocol: "TCP",
    direction: "Inbound",
    remoteAddress: "Any",
    localPort: "23",
    status: "Enabled",
    priority: 120
  },
  {
    id: "rule-4",
    name: "Allow DNS",
    action: "Allow",
    protocol: "UDP",
    direction: "Outbound",
    remoteAddress: "Any",
    localPort: "53",
    status: "Enabled",
    priority: 130
  },
  {
    id: "rule-5",
    name: "Block Known Malicious IPs",
    action: "Block",
    protocol: "Any",
    direction: "Any",
    remoteAddress: "10.0.0.1,192.168.1.100",
    localPort: "Any",
    status: "Enabled",
    priority: 90
  }
];

export async function GET(request: NextRequest) {
  try {
    // Return simulated firewall rules
    return NextResponse.json(firewallRules);
  } catch (error) {
    console.error("Error fetching firewall rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch firewall rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // In a real implementation, we would add the rule to the system
    // For the simulation, we just return success
    
    // Generate an ID for the new rule
    const newRule = {
      id: `rule-${Date.now()}`,
      ...data,
      status: data.status || "Enabled",
      priority: data.priority || 100
    };
    
    // Return the new rule
    return NextResponse.json({
      success: true,
      message: "Firewall rule created successfully",
      rule: newRule
    });
  } catch (error) {
    console.error("Error creating firewall rule:", error);
    return NextResponse.json(
      { error: "Failed to create firewall rule" },
      { status: 500 }
    );
  }
} 