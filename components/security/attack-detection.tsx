"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShieldAlert, ShieldCheck, Shield, Play, AlertTriangle, Timer, Swords } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useWebsocket } from "@/hooks/useWebsocket"
import { useToast } from "@/components/ui/use-toast"

// Define interfaces for attack alerts and signatures
interface AttackAlert {
  timestamp: string
  signature: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  connection: any
  details: string
}

interface AttackSignature {
  name: string
  description: string
  severity: string
}

export default function AttackDetection() {
  const [attackAlerts, setAttackAlerts] = useState<AttackAlert[]>([])
  const [attackSignatures, setAttackSignatures] = useState<AttackSignature[]>([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [attackType, setAttackType] = useState("portscan")
  const [targetIp, setTargetIp] = useState("127.0.0.1")
  const [duration, setDuration] = useState([10])
  const { isConnected } = useWebsocket()
  const { toast } = useToast()

  // Define severity colors
  const severityColors = {
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    critical: "bg-red-700/10 text-red-700 border-red-700/20"
  }

  // Define attack type descriptions
  const attackDescriptions = {
    portscan: "Simulates scanning multiple ports on a target to find open services.",
    bruteforce: "Simulates login attempts with multiple passwords on authentication services.",
    ddos: "Simulates a distributed denial of service attack with multiple source IPs.",
    malicious_port: "Simulates connections to known malicious ports used by malware."
  }

  // Fetch attack alerts
  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attacks/alerts`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setAttackAlerts(data.alerts)
      }
    } catch (error) {
      console.error('Error fetching attack alerts:', error)
    }
  }

  // Fetch attack signatures
  const fetchSignatures = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attacks/signatures`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setAttackSignatures(data.signatures)
      }
    } catch (error) {
      console.error('Error fetching attack signatures:', error)
    }
  }

  // Load initial data
  useEffect(() => {
    setLoading(true)
    Promise.all([fetchAlerts(), fetchSignatures()]).finally(() => {
      setLoading(false)
    })

    // Custom WebSocket type that includes our pingInterval property
    interface CustomWebSocket extends WebSocket {
      pingInterval?: NodeJS.Timeout;
    }

    // Set up WebSocket for real-time attack alerts
    const wsHost = process.env.NEXT_PUBLIC_API_URL?.replace('http://', '') || 'localhost:5000'
    let socket: CustomWebSocket | null = null
    let reconnectAttempt = 0
    const maxReconnectAttempts = 5
    
    function setupWebSocket() {
      // Close existing connection if any
      if (socket) {
        socket.close()
      }
      
      try {
        console.log(`Connecting to WebSocket at ws://${wsHost}/ws`)
        socket = new WebSocket(`ws://${wsHost}/ws`) as CustomWebSocket
        
        socket.onopen = () => {
          console.log('WebSocket connection established')
          reconnectAttempt = 0 // Reset reconnect counter on success
          
          // Set up ping interval to keep connection alive (every 30 seconds)
          const pingInterval = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'ping' }))
            } else {
              clearInterval(pingInterval)
            }
          }, 30000)
          
          // Store the interval so we can clear it later
          if (socket) {
            socket.pingInterval = pingInterval
          }
        }
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Handle pong response from server
            if (data.type === 'pong') {
              console.log('Received pong from server')
              return
            }
            
            // Handle direct attack alerts
            if (data.type === 'attack-alert') {
              setAttackAlerts(prev => [data.alert, ...prev])
              
              // Show toast notification for critical alerts
              if (data.alert.severity === 'critical' || data.alert.severity === 'high') {
                toast({
                  title: `${data.alert.severity.toUpperCase()} Severity Attack Detected`,
                  description: data.alert.details,
                  variant: "destructive"
                })
              }
            }
            
            // Handle security events that are categorized as attacks
            if (data.type === 'security-events') {
              // Filter for events with category 'Attack'
              const attackEvents = data.data?.filter((event: any) => event.category === 'Attack') || []
              
              if (attackEvents.length > 0) {
                // Convert security events to attack alert format
                const newAttackAlerts = attackEvents.map((event: any) => ({
                  timestamp: event.timestamp,
                  signature: event.message,
                  description: event.details,
                  severity: event.status === 'critical' ? 'critical' : 
                            event.status === 'warning' ? 'high' : 'medium',
                  connection: {
                    remote_ip: event.source,
                    remote_port: '',
                    protocol: ''
                  },
                  details: event.details
                }))
                
                // Add new attacks to the state
                setAttackAlerts(prev => [...newAttackAlerts, ...prev])
                
                // Show toast for high severity alerts
                newAttackAlerts.forEach((alert: AttackAlert) => {
                  if (alert.severity === 'critical' || alert.severity === 'high') {
                    toast({
                      title: `${alert.severity.toUpperCase()} Severity Attack Detected`,
                      description: alert.details,
                      variant: "destructive"
                    })
                  }
                })
              }
            }
          } catch (error) {
            console.error('Error handling WebSocket message', error)
          }
        }
        
        socket.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
        
        socket.onclose = (event) => {
          console.log(`WebSocket closed: ${event.code} ${event.reason}`)
          
          // Clear ping interval if it exists
          if (socket && socket.pingInterval) {
            clearInterval(socket.pingInterval)
          }
          
          // Attempt to reconnect with backoff strategy
          reconnectAttempt++
          if (reconnectAttempt <= maxReconnectAttempts) {
            const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempt - 1), 30000)
            console.log(`WebSocket reconnecting in ${backoffTime}ms (attempt ${reconnectAttempt}/${maxReconnectAttempts})`)
            setTimeout(setupWebSocket, backoffTime)
          } else {
            console.error(`Maximum reconnect attempts (${maxReconnectAttempts}) reached`)
            toast({
              title: "Connection Error",
              description: "Could not connect to event stream. Some real-time alerts may not be displayed.",
              variant: "destructive",
              duration: 10000,
            })
          }
        }
      } catch (error) {
        console.error('Error setting up WebSocket', error)
      }
    }
    
    // Initial connection
    setupWebSocket()

    return () => {
      if (socket) {
        // Clear ping interval if it exists
        if (socket.pingInterval) {
          clearInterval(socket.pingInterval)
        }
        socket.close()
      }
    }
  }, [])

  // Simulate an attack
  const simulateAttack = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSimulating(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attacks/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: attackType,
          target: targetIp,
          duration: duration[0]
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        toast({
          title: "Attack Simulation Started",
          description: data.message
        })
      } else {
        toast({
          title: "Simulation Failed",
          description: data.message,
          variant: "destructive"
        })
        setSimulating(false)
      }
    } catch (error) {
      console.error('Error simulating attack:', error)
      toast({
        title: "Simulation Error",
        description: "Failed to start attack simulation",
        variant: "destructive"
      })
      setSimulating(false)
    }
  }

  // Format severity level for display
  const formatSeverity = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1)
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString()
    } catch (e) {
      return timestamp
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px] md:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attack Detection</h1>
          <p className="text-muted-foreground">Monitor and detect attack patterns in real-time</p>
        </div>
        <Button variant="outline" onClick={() => {
          fetchAlerts()
          fetchSignatures()
        }}>
          <ShieldCheck className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attack signatures card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Attack Signatures</span>
            </CardTitle>
            <CardDescription>Active attack signatures being monitored</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px] pr-4">
              {attackSignatures.length > 0 ? (
                <div className="space-y-3">
                  {attackSignatures.map((signature, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{signature.name}</h3>
                          <p className="text-sm text-muted-foreground">{signature.description}</p>
                        </div>
                        <Badge variant="outline" className={
                          severityColors[signature.severity as keyof typeof severityColors] || severityColors.low
                        }>
                          {formatSeverity(signature.severity)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium mb-2">No signatures loaded</p>
                  <p className="text-sm text-muted-foreground">
                    No attack signatures are currently active in the system
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Attack alerts and simulation card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <Tabs defaultValue="alerts">
              <div className="flex items-center justify-between">
                <CardTitle>Attack Monitoring</CardTitle>
                <TabsList>
                  <TabsTrigger value="alerts">Alerts</TabsTrigger>
                  <TabsTrigger value="simulation">Simulation</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>
                Monitor real-time attack alerts or simulate attacks for testing
              </CardDescription>
            </Tabs>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="alerts">
              <TabsContent value="alerts" className="mt-0">
                {!isConnected && (
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Not connected</AlertTitle>
                    <AlertDescription>
                      Real-time attack alerts are not available because the WebSocket connection is closed.
                    </AlertDescription>
                  </Alert>
                )}
                
                <ScrollArea className="h-[450px] pr-4">
                  {attackAlerts.length > 0 ? (
                    <div className="space-y-3">
                      {attackAlerts.map((alert, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className={`rounded-full p-1 ${
                                  severityColors[alert.severity] || severityColors.low
                                }`}>
                                  <ShieldAlert className="h-4 w-4" />
                                </div>
                                <h3 className="font-medium">{alert.signature}</h3>
                                <Badge variant="outline" className={
                                  severityColors[alert.severity] || severityColors.low
                                }>
                                  {formatSeverity(alert.severity)}
                                </Badge>
                              </div>
                              <p className="mt-1">{alert.details}</p>
                              <div className="mt-2 text-sm text-muted-foreground">
                                <div>
                                  {alert.connection?.remote_ip && (
                                    <span className="inline-block mr-4">
                                      Source: {alert.connection.remote_ip}:{alert.connection.remote_port || '?'}
                                    </span>
                                  )}
                                  {alert.connection?.local_ip && (
                                    <span className="inline-block mr-4">
                                      Target: {alert.connection.local_ip}:{alert.connection.local_port || '?'}
                                    </span>
                                  )}
                                  {alert.connection?.protocol && (
                                    <span className="inline-block">
                                      Protocol: {alert.connection.protocol}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1">
                                  Detected: {formatTimestamp(alert.timestamp)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                      <p className="text-lg font-medium mb-2">No attacks detected</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        No attack alerts have been detected by the system
                      </p>
                      <Button variant="outline" size="sm" onClick={fetchAlerts}>
                        Check for alerts
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="simulation" className="mt-0">
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Attack simulations should only be used for testing purposes on systems you own or have permission to test.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="attack-type">Attack Type</Label>
                    <Select value={attackType} onValueChange={setAttackType}>
                      <SelectTrigger id="attack-type">
                        <SelectValue placeholder="Select attack type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portscan">Port Scan</SelectItem>
                        <SelectItem value="bruteforce">Brute Force</SelectItem>
                        <SelectItem value="ddos">DDoS Simulation</SelectItem>
                        <SelectItem value="malicious_port">Malicious Port</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {attackDescriptions[attackType as keyof typeof attackDescriptions] || "Select an attack type to simulate"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target-ip">Target IP</Label>
                    <Input
                      id="target-ip"
                      value={targetIp}
                      onChange={(e) => setTargetIp(e.target.value)}
                      placeholder="127.0.0.1"
                    />
                    <p className="text-sm text-muted-foreground">
                      IP address to target with the simulated attack
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="duration">Duration (seconds)</Label>
                      <span className="text-sm text-muted-foreground">{duration[0]}s</span>
                    </div>
                    <Slider
                      id="duration"
                      value={duration}
                      onValueChange={setDuration}
                      max={30}
                      min={1}
                      step={1}
                    />
                    <p className="text-sm text-muted-foreground">
                      How long the attack simulation should run (1-30 seconds)
                    </p>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={simulateAttack}
                    disabled={simulating || !isConnected}
                  >
                    {simulating ? (
                      <>
                        <Timer className="h-4 w-4 mr-2 animate-spin" />
                        Simulating Attack...
                      </>
                    ) : (
                      <>
                        <Swords className="h-4 w-4 mr-2" />
                        Start Attack Simulation
                      </>
                    )}
                  </Button>
                  
                  {simulating && (
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Simulation Progress</span>
                        <span className="text-sm">{Math.round(simulationProgress)}%</span>
                      </div>
                      <Progress value={simulationProgress} />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 