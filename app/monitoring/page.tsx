"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProcessMonitoring from "@/components/monitoring/process-monitoring"
import { EventMonitoring } from "@/components/monitoring/event-monitoring"
import SystemMonitoring from "@/components/monitoring/system-monitoring"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useWebsocket } from "@/hooks/useWebsocket"
import { useEffect } from "react"

export default function MonitoringPage() {
  const { isConnected } = useWebsocket()

  useEffect(() => {
    // Clean up function
    return () => {
      // No need to disconnect, the WebSocket hook handles this
    }
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Monitoring</h1>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="text-green-500" />
              <Badge variant="outline" className="bg-green-500/10">Connected</Badge>
            </>
          ) : (
            <>
              <WifiOff className="text-red-500" />
              <Badge variant="outline" className="bg-red-500/10">Disconnected</Badge>
            </>
          )}
          <Button variant="outline" size="icon" title="Refresh Data">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="system">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system">System Resources</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
        </TabsList>
        <TabsContent value="system">
          <SystemMonitoring />
        </TabsContent>
        <TabsContent value="processes">
          <ProcessMonitoring />
        </TabsContent>
        <TabsContent value="events">
          <EventMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  )
}
