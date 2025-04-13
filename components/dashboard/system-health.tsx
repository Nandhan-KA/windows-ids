"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useWebsocket } from "@/hooks/useWebsocket"

export default function SystemHealth() {
  const [isClient, setIsClient] = useState(false)
  const [cpuUsage, setCpuUsage] = useState(0)
  const [memoryUsage, setMemoryUsage] = useState(0)
  const [diskUsage, setDiskUsage] = useState(0)
  
  const { 
    isConnected, 
    systemMetrics,
    refreshData
  } = useWebsocket();

  // Initialize on client-side only
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update system metrics when data changes
  useEffect(() => {
    if (!systemMetrics || !isConnected) return;

    setCpuUsage(systemMetrics.cpu_percent || 0);
    setMemoryUsage(systemMetrics.memory_percent || 0);
    setDiskUsage(systemMetrics.disk_io_percent || 0);
  }, [systemMetrics, isConnected]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>Resource utilization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>CPU Usage</span>
            <span className="font-medium">{isClient ? `${Math.round(cpuUsage)}%` : '--'}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: isClient ? `${cpuUsage}%` : '0%' }}
            ></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Memory Usage</span>
            <span className="font-medium">{isClient ? `${Math.round(memoryUsage)}%` : '--'}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: isClient ? `${memoryUsage}%` : '0%' }}
            ></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Disk Usage</span>
            <span className="font-medium">{isClient ? `${Math.round(diskUsage)}%` : '--'}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: isClient ? `${diskUsage}%` : '0%' }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 