"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { useState, useEffect } from "react"
import { useWebsocket } from "@/hooks/useWebsocket"
import { Skeleton } from "@/components/ui/skeleton"
import { Cpu, HardDrive, MemoryStick, Network } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function SystemMonitoring() {
  const [data, setData] = useState<any[]>([])
  const { 
    isConnected, 
    isLoading, 
    systemMetrics, 
    lastUpdated,
    fetchErrors,
    refreshData,
    pollInterval
  } = useWebsocket()
  const [loading, setLoading] = useState(true)
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('')
  const [updateRate, setUpdateRate] = useState<number>(0)
  const [updateCounter, setUpdateCounter] = useState<number>(0)
  const [lastMetricsUpdate, setLastMetricsUpdate] = useState<any>(null)

  // Create chart data from system metrics
  useEffect(() => {
    // Only process metrics if we have valid data
    if (systemMetrics && typeof systemMetrics === 'object' &&
       (systemMetrics.cpu_percent !== undefined || 
        systemMetrics.memory_percent !== undefined)) {
        
      const timestamp = new Date().toLocaleTimeString();
      
      // Add the new metrics to the chart data
      setData(prevData => {
        const newData = [...prevData, {
          timestamp,
          cpu: systemMetrics.cpu_percent ?? 0,
          memory: systemMetrics.memory_percent ?? 0,
          disk: systemMetrics.disk_io_percent ?? 0,
          network: systemMetrics.network_io_mbps ?? 0
        }];
        
        // Keep only the last 20 data points
        if (newData.length > 20) {
          return newData.slice(newData.length - 20);
        }
        return newData;
      });
      
      // If we have data, we're no longer loading
      if (loading) {
        setLoading(false);
      }
    }
  }, [systemMetrics, loading]);

  // After 5 seconds, stop showing loading state even if no data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [loading]);

  // Track FPS (updates per second)
  useEffect(() => {
    let lastTime = Date.now();
    let frames = 0;
    
    const interval = setInterval(() => {
      const currentCounter = updateCounter;
      const now = Date.now();
      const elapsed = now - lastTime;
      
      // Calculate updates per second
      if (elapsed > 0) {
        setUpdateRate(Math.round((currentCounter - frames) / (elapsed / 1000)));
        frames = currentCounter;
        lastTime = now;
      }
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [updateCounter]);
  
  // Calculate time since last update
  useEffect(() => {
    if (!lastUpdated) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - lastUpdated.getTime();
      
      if (diff < 1000) {
        setTimeSinceUpdate('just now');
      } else if (diff < 60000) {
        setTimeSinceUpdate(`${Math.floor(diff / 1000)}s ago`);
      } else {
        setTimeSinceUpdate(`${Math.floor(diff / 60000)}m ago`);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Track last metrics to detect changes
  useEffect(() => {
    // Compare with last metrics to see if anything changed
    if (JSON.stringify(systemMetrics) !== JSON.stringify(lastMetricsUpdate)) {
      setLastMetricsUpdate(systemMetrics);
      setUpdateCounter(prev => prev + 1);
    }
  }, [systemMetrics, lastMetricsUpdate]);

  // Display loading state
  if (isLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium">System Resources</h3>
            <p className="text-sm text-muted-foreground">Loading metrics...</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshData()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium">System Resources</h3>
          <div className="text-sm text-muted-foreground flex gap-4">
            {isConnected ? (
              <>
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Connected
                </span>
                <span>Last updated: {timeSinceUpdate}</span>
                <span className="text-blue-500 font-semibold">
                  {updateRate} updates/sec
                </span>
                <span>
                  Polling: {pollInterval ? `${pollInterval}ms` : 'unknown'}
                </span>
                {fetchErrors.length > 0 && (
                  <span className="text-destructive">
                    Errors: {fetchErrors.join(', ')}
                  </span>
                )}
              </>
            ) : (
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-destructive mr-2"></span>
                Disconnected
              </span>
            )}
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refreshData()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {fetchErrors.length > 0 && (
        <div className="p-3 mb-4 rounded-md bg-destructive/10 text-destructive text-sm">
          <p className="font-medium">Error fetching metrics:</p>
          <ul className="list-disc pl-5 mt-1">
            {fetchErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{systemMetrics?.cpu_percent?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">CPU Usage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{systemMetrics?.memory_percent?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Memory Usage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{systemMetrics?.disk_io_percent?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Disk I/O</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{systemMetrics?.network_io_mbps?.toFixed(2) || 0} MB/s</div>
            <p className="text-xs text-muted-foreground">Network Traffic</p>
          </CardContent>
        </Card>
      </div>

      <div className="h-[400px] w-full">
        {!isConnected && (
          <div className="flex items-center justify-center h-full border rounded-md bg-muted/30">
            <p className="text-muted-foreground">Connecting to backend...</p>
          </div>
        )}
        
        {isConnected && data.length === 0 && (
          <div className="flex items-center justify-center h-full border rounded-md bg-muted/30">
            <p className="text-muted-foreground">Waiting for data...</p>
          </div>
        )}
        
        {data.length > 0 && (
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
              <XAxis dataKey="timestamp" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU %" isAnimationActive={false} dot={false} />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="#10b981"
                name="Memory %"
                isAnimationActive={false}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="disk"
                stroke="#f97316"
                name="Disk I/O %"
                isAnimationActive={false}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="network"
                stroke="#8b5cf6"
                name="Network (MB/s)"
                isAnimationActive={false}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
