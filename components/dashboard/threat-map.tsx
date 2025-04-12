"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Globe, Shield, AlertTriangle, Crosshair, RefreshCw, BarChart4 } from "lucide-react"

// Mock data for threat locations
const threatData = [
  { id: 1, country: "United States", ip: "104.23.99.12", count: 156, type: "Brute Force" },
  { id: 2, country: "China", ip: "121.45.67.89", count: 89, type: "Port Scan" },
  { id: 3, country: "Russia", ip: "95.173.136.70", count: 67, type: "DDoS" },
  { id: 4, country: "Brazil", ip: "187.45.23.10", count: 42, type: "Malware" },
  { id: 5, country: "India", ip: "59.144.97.45", count: 38, type: "Phishing" },
]

export default function ThreatMap() {
  const [activeThreats, setActiveThreats] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedThreat, setSelectedThreat] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [showPulse, setShowPulse] = useState(false)
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate changing active threats count
  useEffect(() => {
    const interval = setInterval(() => {
      const newCount = Math.floor(Math.random() * 10) + 30;
      setActiveThreats(newCount)
      
      // Trigger pulse animation when threat count changes
      setShowPulse(true)
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = setTimeout(() => setShowPulse(false), 2000)
    }, 5000)

    return () => {
      clearInterval(interval)
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
    }
  }, [])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setActiveThreats(Math.floor(Math.random() * 10) + 30)
      setIsLoading(false)
    }, 800)
  }

  const handleThreatClick = (id: number) => {
    setSelectedThreat(selectedThreat === id ? null : id)
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary animate-[spin_10s_linear_infinite]" /> 
            Global Threat Map
          </CardTitle>
          <CardDescription>Active threats by geographic location</CardDescription>
        </div>
        <Badge 
          variant="outline" 
          className={`relative bg-red-500/10 text-red-500 border-red-500/20 transition-all duration-300 ${
            showPulse ? 'scale-110' : ''
          }`}
        >
          {showPulse && (
            <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20"></span>
          )}
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
          {activeThreats} Active Threats
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={() => setViewMode('map')}
              className="transition-all duration-200 hover:scale-105"
            >
              <Globe className="h-4 w-4 mr-1" /> Map View
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="transition-all duration-200 hover:scale-105"
            >
              <BarChart4 className="h-4 w-4 mr-1" /> List View
            </Button>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            className="transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {viewMode === 'map' ? (
          <div className="relative h-[400px] w-full bg-muted/20 rounded-lg border flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-grid-primary/20 bg-[size:20px_20px] opacity-10"></div>
            
            {/* Animated radar circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-[300px] w-[300px] rounded-full border-2 border-dashed border-primary/20 animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute h-[200px] w-[200px] rounded-full border-2 border-dashed border-primary/20 animate-[spin_15s_linear_infinite_reverse]"></div>
              <div className="absolute h-[100px] w-[100px] rounded-full border-2 border-dashed border-primary/20 animate-[spin_5s_linear_infinite]"></div>
              <div className="absolute h-10 w-10 rounded-full bg-primary/10 animate-pulse"></div>
            </div>
            
            {/* Threat dots */}
            <div className="absolute top-[20%] left-[30%] h-3 w-3 bg-red-500 rounded-full animate-ping"></div>
            <div className="absolute top-[60%] left-[70%] h-3 w-3 bg-orange-500 rounded-full animate-ping [animation-duration:2s]"></div>
            <div className="absolute top-[40%] left-[50%] h-3 w-3 bg-yellow-500 rounded-full animate-ping [animation-duration:3s]"></div>
            <div className="absolute top-[70%] left-[20%] h-3 w-3 bg-red-500 rounded-full animate-ping [animation-duration:2.5s]"></div>
            <div className="absolute top-[30%] left-[80%] h-3 w-3 bg-orange-500 rounded-full animate-ping [animation-duration:1.5s]"></div>
            
            <div className="relative z-10 text-center text-muted-foreground group-hover:scale-105 transition-transform duration-300">
              <Shield className="h-12 w-12 mx-auto mb-2 text-primary/50" />
              <p>Interactive threat map visualization</p>
              <p className="text-xs">(Hover over regions to see threat details)</p>
            </div>
          </div>
        ) : (
          <div className="h-[400px] overflow-auto pr-2">
            {threatData.map((threat) => (
              <div 
                key={threat.id} 
                className={`mb-3 p-3 rounded-md border bg-card transition-all duration-200 cursor-pointer ${
                  selectedThreat === threat.id ? 'border-primary ring-1 ring-primary/20 scale-102' : 'hover:border-primary/50'
                }`}
                onClick={() => handleThreatClick(threat.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-1.5">
                      <Crosshair className="h-4 w-4 text-red-500" />
                      {threat.country}
                    </div>
                    <div className="text-xs text-muted-foreground">{threat.ip}</div>
                  </div>
                  <Badge variant={selectedThreat === threat.id ? "default" : "outline"}>
                    {threat.count} hits
                  </Badge>
                </div>
                
                {selectedThreat === threat.id && (
                  <div className="mt-3 text-sm grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-5 duration-300">
                    <div className="p-2 bg-muted/30 rounded">
                      <span className="text-xs font-medium">Attack Type</span>
                      <p>{threat.type}</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <span className="text-xs font-medium">First Seen</span>
                      <p>2 hours ago</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <span className="text-xs font-medium">Last Seen</span>
                      <p>5 minutes ago</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <span className="text-xs font-medium">Risk Level</span>
                      <p className="text-orange-500">Medium</p>
                    </div>
                    
                    <div className="col-span-2 flex justify-end mt-1">
                      <Button size="sm" variant="outline" className="text-xs">Block IP</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
