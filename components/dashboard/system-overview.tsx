"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { useWebsocket } from "@/hooks/useWebsocket"
import { RefreshCcw, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface MetricsDataPoint {
  time: string;
  cpu: number;
  memory: number;
  network: number;
}

export default function SystemOverview() {
  const [data, setData] = useState<MetricsDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [formattedTime, setFormattedTime] = useState<string>('--:--:--');
  const [isClient, setIsClient] = useState<boolean>(false);

  const { 
    isConnected, 
    systemMetrics,
    refreshData,
    lastUpdated: dataLastUpdated
  } = useWebsocket();

  // Client-side only code
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize with empty data points
  useEffect(() => {
    // Initialize chart with empty data points for the past 12 hours
    const initialData: MetricsDataPoint[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 30 * 60 * 1000); // Every 30 minutes
      initialData.push({
        time: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
        cpu: 0,
        memory: 0,
        network: 0
      });
    }
    
    setData(initialData);
    setIsLoading(false);
  }, []);

  // Update with real metrics
  useEffect(() => {
    if (!systemMetrics || !isConnected) return;
    
    // Create a timestamp
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Add to chart data
    setData(prevData => {
      // Keep last 12 data points
      const newData = [...prevData.slice(1), { 
        time: timeString, 
        cpu: systemMetrics.cpu_percent || 0,
        memory: systemMetrics.memory_percent || 0,
        network: systemMetrics.network_io_mbps || 0
      }];
      return newData;
    });
    
    if (dataLastUpdated) {
      setLastUpdated(new Date(dataLastUpdated));
    } else {
      setLastUpdated(new Date());
    }
  }, [systemMetrics, isConnected, dataLastUpdated]);

  // Update formatted time on the client side only
  useEffect(() => {
    if (isClient) {
      setFormattedTime(formatTime(lastUpdated));
    }
  }, [lastUpdated, isClient]);

  // Helper function for consistent time formatting
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    refreshData();
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>System Resource Usage</CardTitle>
          <CardDescription>Real-time system resource monitoring</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <div title={isConnected ? "Backend Connected" : "Backend Disconnected"}>
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
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
                <Line type="monotone" dataKey="cpu" stroke="#3b82f6" activeDot={{ r: 8 }} name="CPU %" />
                <Line type="monotone" dataKey="memory" stroke="#10b981" name="Memory %" />
                <Line type="monotone" dataKey="network" stroke="#f97316" name="Network (Mbps)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-2 text-right">
          Last updated: {isClient ? formattedTime : '--:--:--'}
          {systemMetrics && isClient && ` • CPU: ${systemMetrics.cpu_percent}% • Memory: ${systemMetrics.memory_percent}%`}
        </div>
      </CardContent>
    </Card>
  )
}
