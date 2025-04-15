import { NextRequest, NextResponse } from 'next/server';

// Generate random date within last week
function getRandomDate() {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(lastWeek.getTime() + Math.random() * (now.getTime() - lastWeek.getTime())).toISOString();
}

// Generate a batch of simulated firewall logs
function generateFirewallLogs(count: number) {
  const actions = ["BLOCK", "ALLOW"];
  const protocols = ["TCP", "UDP", "ICMP"];
  const ports = [22, 80, 443, 3389, 445, 53, 25, 21];
  
  const logs = [];
  
  for (let i = 0; i < count; i++) {
    const sourceIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const destinationIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const action = actions[Math.floor(Math.random() * actions.length)];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const port = ports[Math.floor(Math.random() * ports.length)];
    const timestamp = getRandomDate();
    
    logs.push({
      id: `log-${i}`,
      timestamp,
      source_ip: sourceIP,
      destination_ip: destinationIP,
      source_port: Math.floor(Math.random() * 65535) + 1,
      destination_port: port,
      protocol,
      action,
      rule_name: action === "BLOCK" ? "Suspicious Traffic Blocked" : "Normal Traffic Allowed",
      bytes: Math.floor(Math.random() * 10000)
    });
  }
  
  // Sort by timestamp, most recent first
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const action = searchParams.get('action');
    
    // Generate logs
    let logs = generateFirewallLogs(100);
    
    // Filter by action if specified
    if (action && (action === 'ALLOW' || action === 'BLOCK')) {
      logs = logs.filter(log => log.action === action);
    }
    
    // Limit results
    logs = logs.slice(0, limit);
    
    return NextResponse.json({
      logs,
      total: logs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching firewall logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch firewall logs" },
      { status: 500 }
    );
  }
} 