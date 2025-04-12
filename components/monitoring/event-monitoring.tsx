"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { AlertTriangle, Info, ShieldAlert } from "lucide-react"
import { useWebsocket } from "@/hooks/useWebsocket"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/components/monitoring/columns"

// Mock data for system events
const eventTypes = [
  { type: "info", icon: Info, color: "text-blue-500" },
  { type: "warning", icon: AlertTriangle, color: "text-amber-500" },
  { type: "critical", icon: ShieldAlert, color: "text-red-500" },
]

const eventSources = ["System", "Security", "Application", "Network", "Firewall"]

const eventMessages = [
  "User login successful",
  "Failed login attempt",
  "Service started",
  "Service stopped",
  "File access denied",
  "Registry key modified",
  "Network connection established",
  "Network connection terminated",
  "Firewall rule triggered",
  "Suspicious file detected",
  "System update installed",
  "Driver loaded",
  "Process terminated unexpectedly",
  "Scheduled task executed",
  "USB device connected",
  "Disk space warning",
]

const generateRandomEvent = () => {
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
  const source = eventSources[Math.floor(Math.random() * eventSources.length)]
  const message = eventMessages[Math.floor(Math.random() * eventMessages.length)]

  return {
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    type: eventType.type,
    icon: eventType.icon,
    color: eventType.color,
    source,
    message,
  }
}

export function EventMonitoring() {
  const [filter, setFilter] = useState<string>("all")
  const { isConnected, securityEvents } = useWebsocket()
  const [loading, setLoading] = useState(true)
  
  // Map event status to icon and color
  const getEventStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'critical':
        return { icon: ShieldAlert, color: "text-red-500" };
      case 'warning':
        return { icon: AlertTriangle, color: "text-amber-500" };
      default:
        return { icon: Info, color: "text-blue-500" };
    }
  };
  
  // Use effect to check data and set loading state
  useEffect(() => {
    // If we've received security events, stop loading
    if (Array.isArray(securityEvents) && securityEvents.length > 0) {
      setLoading(false);
    }
    
    // Set a timeout to avoid indefinite loading
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [securityEvents, loading]);

  // Display loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">System Events Log</h3>
            <Badge variant="outline"><Skeleton className="h-4 w-8" /></Badge>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3 text-sm border rounded-md bg-card/50">
                  <Skeleton className="h-5 w-5 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // Display connection error state
  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">System Events Log</h3>
            <Badge variant="outline">Disconnected</Badge>
          </div>
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">Connecting to security events feed...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate security events
  const validEvents = Array.isArray(securityEvents) ? securityEvents : [];
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">System Events Log</h3>
          <Badge variant="outline">{validEvents.length} Events</Badge>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-2">
            {validEvents.length > 0 ? (
              validEvents.map((event) => {
                if (!event || !event.id) return null;
                
                const { icon: EventIcon, color } = getEventStyle(event.status);
                const timestamp = event.timestamp 
                  ? new Date(event.timestamp).toLocaleTimeString()
                  : new Date().toLocaleTimeString();
                  
                return (
                  <div key={event.id} className="flex gap-3 p-3 text-sm border rounded-md bg-card/50">
                    <EventIcon className={`h-5 w-5 mt-0.5 ${color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{event.category || event.source || 'System'}</span>
                        <Badge variant="outline" className="text-xs">
                          {timestamp}
                        </Badge>
                      </div>
                      <p className="mt-1">{event.message || 'Event recorded'}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-72">
                <p className="text-muted-foreground">No security events recorded</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
