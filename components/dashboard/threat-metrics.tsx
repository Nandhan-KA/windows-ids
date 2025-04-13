"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowUpRight } from "lucide-react"
import { useWebsocket } from "@/hooks/useWebsocket"
import Link from "next/link"

export default function ThreatMetrics() {
  const [threatCount, setThreatCount] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [lastAttackTime, setLastAttackTime] = useState<string | null>(null)
  
  const { 
    isConnected, 
    securityEvents,
    refreshData
  } = useWebsocket()

  // Initialize on client-side only
  useEffect(() => {
    setIsClient(true)
    
    // Load threats from local storage on initial load
    const storedThreats = localStorage.getItem('simulatedAttacks');
    if (storedThreats) {
      try {
        const parsedThreats = JSON.parse(storedThreats);
        // Count threats in the last 24 hours
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentThreats = parsedThreats.filter((event: any) => 
          new Date(event.timestamp) > last24Hours
        );
        
        setThreatCount(recentThreats.length);
        
        // Set last attack time
        if (recentThreats.length > 0) {
          const sortedThreats = [...recentThreats].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setLastAttackTime(new Date(sortedThreats[0].timestamp).toLocaleTimeString());
        }
      } catch (error) {
        console.error("Error loading threats from storage:", error);
      }
    }
  }, [])

  // Update threat count based on security events
  useEffect(() => {
    if (!securityEvents || !isConnected) return

    // Count events in the last 24 hours that have threat status
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentThreats = securityEvents.filter(event => {
      return event.type === 'threat' && 
             new Date(event.timestamp) > last24Hours
    })
    
    setThreatCount(recentThreats.length)
    
    // Update the latest attack time
    if (recentThreats.length > 0) {
      const sortedThreats = [...recentThreats].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setLastAttackTime(new Date(sortedThreats[0].timestamp).toLocaleTimeString());
    }
  }, [securityEvents, isConnected])

  // Subscribe to custom event for simulation updates
  useEffect(() => {
    const handleSimulatedAttack = (e: CustomEvent) => {
      setThreatCount(prev => prev + 1);
      setLastAttackTime(new Date().toLocaleTimeString());
    };

    window.addEventListener('simulated-attack' as any, handleSimulatedAttack as any);
    
    return () => {
      window.removeEventListener('simulated-attack' as any, handleSimulatedAttack as any);
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{isClient ? threatCount : '—'}</p>
              <p className="text-xs text-muted-foreground">In the last 24 hours</p>
              {lastAttackTime && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Last attack: {lastAttackTime}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/threats">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 