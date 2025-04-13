"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, ArrowUpRight } from "lucide-react"
import { useWebsocket } from "@/hooks/useWebsocket"
import Link from "next/link"

export default function NetworkMetrics() {
  const [connectionCount, setConnectionCount] = useState(0)
  const [isClient, setIsClient] = useState(false)
  
  const { 
    isConnected, 
    networkConnections,
    refreshData
  } = useWebsocket()

  // Initialize on client-side only
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update connection count based on network data
  useEffect(() => {
    if (!networkConnections || !isConnected) return
    setConnectionCount(networkConnections.length)
  }, [networkConnections, isConnected])

  // Format the connection count (e.g., 1.2K)
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Network Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{isClient ? formatCount(connectionCount) : '—'}</p>
              <p className="text-xs text-muted-foreground">Connections monitored</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/network">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 