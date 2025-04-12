"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Wifi, WifiOff, ChevronsLeft, ChevronsRight, Activity, ExternalLink, Shield, Network, Clock } from "lucide-react"
import { useWebsocket } from "@/hooks/useWebsocket"
import { sendWindowsNotification } from "@/lib/utils"
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

// Traffic data point type
interface TrafficDataPoint {
  time: string;
  inbound: number;
  outbound: number;
}

export default function NetworkActivity() {
  const [data, setData] = useState<TrafficDataPoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isRealTime, setIsRealTime] = useState(true);
  const [highlightedConnection, setHighlightedConnection] = useState<number | null>(null);
  const [expandedChart, setExpandedChart] = useState(false);
  const [showNetworkPulse, setShowNetworkPulse] = useState(false);
  
  // Get real-time data from our WebSocket hook
  const { 
    isConnected, 
    networkConnections, 
    securityEvents, 
    systemMetrics,
    refreshData,
    lastUpdated: dataLastUpdated
  } = useWebsocket();

  // Initialize the chart data
  useEffect(() => {
    // Initialize chart with empty data points for the past 12 hours
    const initialData: TrafficDataPoint[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 30 * 60 * 1000); // Every 30 minutes
      initialData.push({
        time: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
        inbound: 0,
        outbound: 0
      });
    }
    
    setData(initialData);
  }, []);

  // Check for suspicious connections and send notifications
  useEffect(() => {
    if (!networkConnections?.length) return;
    
    // Check for suspicious connections
    const suspiciousConnections = networkConnections.filter(conn => {
      return conn.status === "Suspicious" || 
             conn.status === "SUSPICIOUS" || 
             conn.status === "suspicious";
    });
    
    if (suspiciousConnections.length > 0) {
      suspiciousConnections.forEach(conn => {
        const ip = conn.ip || conn.remote_ip || (conn.remote && conn.remote.split(':')[0]) || 'unknown';
        const port = conn.port || conn.remote_port || (conn.remote && conn.remote.split(':')[1]) || 'unknown';
        
        sendWindowsNotification(
          "Suspicious Connection Detected", 
          `IP: ${ip}, Port: ${port}, Protocol: ${conn.protocol || 'unknown'}`
        );
      });
    }
    
    if (dataLastUpdated) {
      setLastUpdated(new Date(dataLastUpdated));
      // Trigger pulse animation when new data arrives
      setShowNetworkPulse(true);
      setTimeout(() => setShowNetworkPulse(false), 2000);
    } else {
      setLastUpdated(new Date());
    }
  }, [networkConnections, dataLastUpdated]);
  
  // Update network data chart based on real metrics
  useEffect(() => {
    if (!isRealTime || !systemMetrics || !isConnected) return;
    
    // Get the current network I/O from metrics
    const networkIoMbps = systemMetrics.network_io_mbps || 0;
    
    // Calculate inbound and outbound
    const inboundMbps = Math.round(networkIoMbps * 0.6); // 60% of traffic is inbound
    const outboundMbps = Math.round(networkIoMbps * 0.4); // 40% of traffic is outbound
    
    // Create a timestamp
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Add to chart data
    setData(prevData => {
      // Keep last 12 data points
      const newData = [...prevData.slice(1), { 
        time: timeString, 
        inbound: inboundMbps,
        outbound: outboundMbps 
      }];
      return newData;
    });
    
  }, [systemMetrics, isRealTime, isConnected]);

  const handleRefresh = async () => {
    setIsLoading(true);
    refreshData();
    // Add small delay to show loading animation
    setTimeout(() => setIsLoading(false), 800);
  };

  const toggleRealTime = () => {
    setIsRealTime(!isRealTime);
  };

  // Format connections for display
  const formatConnection = (connection: any) => {
    // Extract IP and port from different possible formats
    let ip = 'unknown';
    let port = 'unknown';
    
    if (connection.ip) {
      ip = connection.ip;
    } else if (connection.remote_ip) {
      ip = connection.remote_ip;
    } else if (connection.remote) {
      const parts = connection.remote.split(':');
      if (parts.length > 0) ip = parts[0];
      if (parts.length > 1) port = parts[1];
    }
    
    if (connection.port) {
      port = connection.port;
    } else if (connection.remote_port) {
      port = connection.remote_port;
    }
    
    // Get status
    const status = connection.status || 'Unknown';
    
    // Get protocol
    const protocol = connection.protocol || 'Unknown';
    
    return { ip, port, status, protocol };
  };

  const toggleExpandChart = () => {
    setExpandedChart(!expandedChart);
  };

  const handleConnectionClick = (index: number) => {
    setHighlightedConnection(highlightedConnection === index ? null : index);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className={`md:col-span-2 transition-all duration-500 ease-in-out ${
        expandedChart ? "md:col-span-3" : "md:col-span-2"
      }`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center">
              <span className="relative">
                {showNetworkPulse && (
                  <span className="absolute -inset-1 animate-ping rounded-full bg-primary/20"></span>
                )}
                <Wifi className="h-5 w-5 mr-2 text-primary" />
              </span>
              Network Traffic
            </CardTitle>
            <CardDescription>Inbound and outbound network traffic</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className={`transition-all duration-300 ${isRealTime ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}`}
              onClick={toggleRealTime}
            >
              {isRealTime ? "Real-Time: ON" : "Real-Time: OFF"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="transition-transform duration-200 hover:scale-105"
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpandChart}
              className="transition-transform duration-200 hover:scale-105"
              title={expandedChart ? "Collapse" : "Expand"}
            >
              {expandedChart ? 
                <ChevronsLeft className="h-4 w-4" /> : 
                <ChevronsRight className="h-4 w-4" />
              }
            </Button>
            <div 
              title={isConnected ? "Backend Connected" : "Backend Disconnected"}
              className="transition-all duration-300"
            >
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500 animate-pulse" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`transition-all duration-500 ease-in-out ${
            expandedChart ? "h-[400px]" : "h-[300px]"
          } w-full group`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
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
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s ease"
                  }}
                  animationDuration={200}
                />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  name="Inbound (Mbps)"
                  className="transition-opacity duration-300 group-hover:opacity-90"
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  stackId="1"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.2}
                  name="Outbound (Mbps)"
                  className="transition-opacity duration-300 group-hover:opacity-90"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-right flex items-center justify-end gap-2">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              <span>Inbound</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <span className="h-2 w-2 rounded-full bg-orange-500"></span>
              <span>Outbound</span>
            </div>
            <div className="ml-auto flex items-center">
              <Clock className="h-3 w-3 mr-1 text-muted-foreground/70" />
              Last updated: {lastUpdated.toLocaleTimeString()}
              {systemMetrics && (
                <Badge variant="outline" className="ml-2 text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  {systemMetrics.network_io_mbps.toFixed(2)} MB/s
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!expandedChart && (
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Active Connections
            </CardTitle>
            <CardDescription>
              Current network connections ({networkConnections?.length || 0})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[320px] overflow-auto pr-1 connection-list">
              {networkConnections && networkConnections.length > 0 ? (
                networkConnections.slice(0, 5).map((connection, i) => {
                  const { ip, port, status, protocol } = formatConnection(connection);
                  const isSuspicious = status.toLowerCase() === "suspicious";
                  return (
                    <div 
                      key={i} 
                      className={`flex flex-col gap-1 p-3 rounded-lg border bg-card/50 cursor-pointer
                        transition-all duration-150 ease-in-out
                        ${highlightedConnection === i ? 'border-primary ring-1 ring-primary/20 transform scale-[1.02]' : 'hover:border-primary/50'}
                        ${isSuspicious ? 'border-red-500/30 bg-red-500/5' : ''}
                      `}
                      onClick={() => handleConnectionClick(i)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isSuspicious ? (
                            <Shield className="h-4 w-4 text-red-500" />
                          ) : (
                            <Network className="h-4 w-4 text-primary/60" />
                          )}
                          <div className="font-medium">
                            {ip}
                            <span className="text-xs ml-1 text-muted-foreground">:{port}</span>
                          </div>
                        </div>
                        <Badge 
                          variant={isSuspicious ? "destructive" : "outline"}
                          className={`${isSuspicious ? 'animate-pulse' : ''}`}
                        >
                          {status}
                        </Badge>
                      </div>
                      
                      {highlightedConnection === i && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm animate-in fade-in slide-in-from-top-5 duration-300">
                          <div className="p-2 bg-muted/30 rounded">
                            <span className="text-xs font-medium">Protocol</span>
                            <p>{protocol}</p>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <span className="text-xs font-medium">Duration</span>
                            <p>5m 23s</p>
                          </div>
                          <div className="col-span-2 flex justify-end gap-2 mt-2">
                            <Button size="sm" variant="outline" className="text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                            {isSuspicious && (
                              <Button size="sm" variant="destructive" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Block
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <WifiOff className="h-10 w-10 mb-2 opacity-20" />
                  <p>No active connections</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-4" 
                    onClick={handleRefresh}
                  >
                    <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
