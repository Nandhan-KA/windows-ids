"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useWebsocket } from "@/hooks/useWebsocket"

// Traffic data structure with time-based points
interface TrafficPoint {
  time: string;
  inbound: number;
  outbound: number;
}

// Protocol statistics
interface ProtocolStat {
  name: string;
  value: number;
}

export default function NetworkTraffic() {
  // Get network data from the websocket hook
  const { 
    networkConnections, 
    systemMetrics, 
    isConnected, 
    isLoading, 
    lastUpdated 
  } = useWebsocket();
  
  // State for network traffic visualization
  const [trafficData, setTrafficData] = useState<TrafficPoint[]>([]);
  const [protocolData, setProtocolData] = useState<ProtocolStat[]>([]);
  const [totalTraffic, setTotalTraffic] = useState({ inbound: 0, outbound: 0 });
  
  // Initialize traffic data with timestamps
  useEffect(() => {
    // Create time-based traffic data points for the last 24 hours
    const initialData: TrafficPoint[] = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourString = time.getHours().toString().padStart(2, '0') + ':00';
      
      initialData.push({
        time: hourString,
        inbound: 0,
        outbound: 0
      });
    }
    
    setTrafficData(initialData);
  }, []);

  // Update traffic data using system metrics and connections
  useEffect(() => {
    if (!systemMetrics || !isConnected) return;

    // Extract network I/O from system metrics
    const networkIoMbps = systemMetrics.network_io_mbps || 0;
    
    // Calculate inbound/outbound split (use 60/40 ratio as an approximation)
    const inboundMbps = networkIoMbps * 0.6;
    const outboundMbps = networkIoMbps * 0.4;
    
    // Update the traffic data with real network information
    setTrafficData(prev => {
      if (!prev || prev.length === 0) return prev;
      
      const newData = [...prev];
      const currentHour = new Date().getHours().toString().padStart(2, '0') + ':00';
      
      // Find the current hour in our data
      const currentHourIndex = newData.findIndex(item => item.time === currentHour);
      
      if (currentHourIndex !== -1) {
        // Update the current hour's data
        // Adding a small value each time to show traffic accumulation over time
        newData[currentHourIndex] = {
          ...newData[currentHourIndex],
          inbound: newData[currentHourIndex].inbound + inboundMbps * 0.1,
          outbound: newData[currentHourIndex].outbound + outboundMbps * 0.1
        };
      }
      
      return newData;
    });
    
    // Calculate total traffic
    const inbound = Math.round(inboundMbps * 60); // Approximate MB transferred if this rate continues for a minute
    const outbound = Math.round(outboundMbps * 60);
    setTotalTraffic(prev => ({
      inbound: prev.inbound + inbound * 0.01, // Scale down to avoid growing too fast
      outbound: prev.outbound + outbound * 0.01
    }));
    
  }, [systemMetrics, isConnected]);

  // Update protocol data based on network connections
  useEffect(() => {
    if (!networkConnections || networkConnections.length === 0) return;
    
    // Count connections by protocol
    const protocolCounts: Record<string, number> = {};
    
    networkConnections.forEach(conn => {
      const protocol = conn.protocol || 'Unknown';
      
      // Handle different protocol naming conventions
      let normalizedProtocol = protocol;
      
      // Normalize protocol names
      if (protocol.includes('TCP')) normalizedProtocol = 'TCP';
      if (protocol.includes('UDP')) normalizedProtocol = 'UDP';
      if (protocol.includes('HTTP') || conn.remote_port === 80 || conn.local_port === 80) normalizedProtocol = 'HTTP';
      if (protocol.includes('HTTPS') || conn.remote_port === 443 || conn.local_port === 443) normalizedProtocol = 'HTTPS';
      if (protocol.includes('DNS') || conn.remote_port === 53 || conn.local_port === 53) normalizedProtocol = 'DNS';
      if (protocol.includes('SSH') || conn.remote_port === 22 || conn.local_port === 22) normalizedProtocol = 'SSH';
      if (protocol.includes('FTP') || conn.remote_port === 21 || conn.local_port === 21) normalizedProtocol = 'FTP';
      
      protocolCounts[normalizedProtocol] = (protocolCounts[normalizedProtocol] || 0) + 1;
    });
    
    // Convert to array for chart
    const protocolStats: ProtocolStat[] = Object.entries(protocolCounts)
      .map(([name, count]) => ({
        name,
        value: count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Take top 6 protocols
    
    // Add "Other" category if needed
    if (Object.keys(protocolCounts).length > 6) {
      const topSixTotal = protocolStats.reduce((sum, item) => sum + item.value, 0);
      const totalConnections = networkConnections.length;
      
      if (totalConnections > topSixTotal) {
        protocolStats.push({
          name: 'Other',
          value: totalConnections - topSixTotal
        });
      }
    }
    
    setProtocolData(protocolStats);
  }, [networkConnections]);
  
  // Show loading state
  if (isLoading || !isConnected) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Total Inbound</h3>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  Loading...
                </Badge>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">Last 24 hours</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Total Outbound</h3>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                  Loading...
                </Badge>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">Last 24 hours</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <h3 className="font-medium mb-4">Network Traffic (24 Hours)</h3>
              <div className="h-[300px] w-full flex items-center justify-center">
                <p className="text-muted-foreground">Loading network traffic data...</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4">Traffic by Protocol</h3>
              <div className="h-[300px] w-full flex items-center justify-center">
                <p className="text-muted-foreground">Loading protocol data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Total Inbound</h3>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                {Math.round(totalTraffic.inbound)} MB
              </Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Last 24 hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Total Outbound</h3>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                {Math.round(totalTraffic.outbound)} MB
              </Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Last 24 hours</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">Network Traffic (24 Hours)</h3>
            <div className="h-[300px] w-full">
              {trafficData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trafficData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="time" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="inbound"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      name="Inbound (MB)"
                    />
                    <Area
                      type="monotone"
                      dataKey="outbound"
                      stackId="1"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.2}
                      name="Outbound (MB)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No traffic data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">Traffic by Protocol ({networkConnections.length} connections)</h3>
            <div className="h-[300px] w-full">
              {protocolData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={protocolData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis type="number" stroke="#888" />
                    <YAxis dataKey="name" type="category" stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#8b5cf6" name="Connections" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No protocol data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
