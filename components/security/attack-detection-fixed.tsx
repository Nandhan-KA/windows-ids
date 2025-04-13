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
import { ShieldAlert, ShieldCheck, Shield, Play, AlertTriangle, Timer, Swords, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

// Define interfaces for attack alerts and signatures
interface AttackAlert {
  id: string;
  timestamp: string;
  signature: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  connection: {
    remote_ip: string;
    remote_port?: string;
    local_ip?: string;
    local_port?: string;
    protocol?: string;
  };
  details: string;
  status: 'active' | 'blocked' | 'quarantined' | 'resolved';
  actions?: string[];
}

interface AttackSignature {
  id: string;
  name: string;
  description: string;
  severity: string;
  enabled: boolean;
  created: string;
}

export default function AttackDetectionFixed() {
  const [attackAlerts, setAttackAlerts] = useState<AttackAlert[]>([])
  const [attackSignatures, setAttackSignatures] = useState<AttackSignature[]>([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [attackType, setAttackType] = useState("portscan")
  const [targetIp, setTargetIp] = useState("192.168.1.100")
  const [duration, setDuration] = useState([10])
  const [selectedAlert, setSelectedAlert] = useState<AttackAlert | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState("")
  const { toast } = useToast()

  // Define severity colors
  const severityColors = {
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    critical: "bg-red-700/10 text-red-700 border-red-700/20"
  }

  // Define status colors
  const statusColors = {
    active: "bg-red-500/10 text-red-500 border-red-500/20",
    blocked: "bg-green-500/10 text-green-500 border-green-500/20",
    quarantined: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    resolved: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  }

  // Define attack type descriptions
  const attackDescriptions = {
    portscan: "Simulates scanning multiple ports on a target to find open services.",
    bruteforce: "Simulates login attempts with multiple passwords on authentication services.",
    ddos: "Simulates a distributed denial of service attack with multiple source IPs.",
    malicious_port: "Simulates connections to known malicious ports used by malware."
  }

  // Load mock signatures data
  const loadMockSignatures = () => {
    return [
      {
        id: "sig-001",
        name: "SQL Injection Attempt",
        description: "Detection of SQL injection attempts in HTTP requests",
        severity: "high",
        enabled: true,
        created: new Date().toISOString()
      },
      {
        id: "sig-002",
        name: "Port Scan Detection",
        description: "Detects sequential scanning of multiple ports",
        severity: "medium",
        enabled: true,
        created: new Date().toISOString()
      },
      {
        id: "sig-003",
        name: "Brute Force Authentication",
        description: "Detection of multiple failed login attempts",
        severity: "high",
        enabled: true,
        created: new Date().toISOString()
      },
      {
        id: "sig-004",
        name: "DDoS Traffic Pattern",
        description: "Unusual traffic volume consistent with DDoS attack",
        severity: "critical",
        enabled: true,
        created: new Date().toISOString()
      },
      {
        id: "sig-005",
        name: "Malware Communication",
        description: "Connection to known malware command and control servers",
        severity: "critical",
        enabled: true,
        created: new Date().toISOString()
      },
      {
        id: "sig-006",
        name: "Suspicious Process Execution",
        description: "Execution of processes with suspicious behavior patterns",
        severity: "high",
        enabled: true,
        created: new Date().toISOString()
      },
      {
        id: "sig-007",
        name: "Suspicious Registry Changes",
        description: "Modifications to system registry with malicious patterns",
        severity: "medium",
        enabled: true,
        created: new Date().toISOString()
      }
    ];
  }

  // Convert localStorage attacks to alert format
  const convertSimulatedAttacksToAlerts = () => {
    try {
      const attacksJson = localStorage.getItem('simulatedAttacks');
      if (!attacksJson) return [];

      const attacks = JSON.parse(attacksJson);
      return attacks.map((attack: any, index: number) => ({
        id: attack.id || `alert-${index}`,
        timestamp: attack.timestamp || new Date().toISOString(),
        signature: `${attack.threat_type || "Unknown"} Attack`,
        description: attack.description || "No description available",
        severity: attack.severity || "medium",
        connection: {
          remote_ip: attack.source_ip || "Unknown",
          remote_port: "???",
          local_ip: "192.168.1.100",
          local_port: "???",
          protocol: "TCP"
        },
        details: attack.description || "No additional details available",
        status: attack.status || "active",
        actions: [
          attack.status === 'active' ? 'block' : '',
          attack.status === 'active' ? 'quarantine' : '',
          attack.status === 'active' ? 'investigate' : '',
          attack.status !== 'resolved' ? 'resolve' : ''
        ].filter(Boolean)
      }));
    } catch (error) {
      console.error('Error converting simulated attacks:', error);
      return [];
    }
  }

  // Fetch attack alerts from localStorage
  const fetchAlerts = () => {
    try {
      const alerts = convertSimulatedAttacksToAlerts();
      setAttackAlerts(alerts);
    } catch (error) {
      console.error('Error fetching attack alerts:', error);
    }
  }

  // Fetch attack signatures 
  const fetchSignatures = () => {
    try {
      const signatures = loadMockSignatures();
      setAttackSignatures(signatures);
    } catch (error) {
      console.error('Error fetching attack signatures:', error);
    }
  }

  // Load initial data
  useEffect(() => {
    setLoading(true);
    
    // Simulate API loading delay for a more realistic experience
    setTimeout(() => {
      fetchAlerts();
      fetchSignatures();
      setLoading(false);
    }, 1000);
    
    // Listen for simulated attacks
    const handleSimulatedAttack = (e: any) => {
      if (e.detail) {
        fetchAlerts(); // Refresh alerts when a new attack is simulated
      }
    };
    
    window.addEventListener('simulated-attack', handleSimulatedAttack);
    
    return () => {
      window.removeEventListener('simulated-attack', handleSimulatedAttack);
    };
  }, []);

  // Simulate an attack
  const simulateAttack = () => {
    if (simulating) return;
    
    setSimulating(true);
    setSimulationProgress(0);
    
    // Start progress animation
    const startTime = Date.now();
    const simulationDuration = duration[0] * 1000;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / simulationDuration) * 100);
      setSimulationProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setSimulating(false);
        
        // Create a simulated attack and add it to localStorage
        const attackEvent = {
          id: `sim-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          timestamp: new Date().toISOString(),
          type: 'threat',
          severity: attackType === 'ddos' ? 'high' : 
                   attackType === 'bruteforce' ? 'medium' : 
                   attackType === 'malicious_port' ? 'critical' : 'low',
          source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          target: targetIp,
          title: `${getAttackTypeDisplayName(attackType)} Attack Detected`,
          description: attackDescriptions[attackType as keyof typeof attackDescriptions],
          threat_type: getAttackTypeDisplayName(attackType),
          status: 'active'
        };
        
        // Save to localStorage
        saveAttackToStorage(attackEvent);
        
        // Dispatch custom event
        const simulatedAttackEvent = new CustomEvent('simulated-attack', { detail: attackEvent });
        window.dispatchEvent(simulatedAttackEvent);
        
        // Refresh alerts
        fetchAlerts();
        
        // Show toast
        toast({
          title: "Attack Simulated",
          description: `${getAttackTypeDisplayName(attackType)} attack simulation completed`
        });
      }
    }, 100);
  };

  // Save attack to localStorage
  function saveAttackToStorage(attack: any): void {
    try {
      // Get existing attacks
      const existingAttacksJson = localStorage.getItem('simulatedAttacks');
      const existingAttacks = existingAttacksJson ? JSON.parse(existingAttacksJson) : [];
      
      // Add new attack
      existingAttacks.unshift(attack);
      
      // Save back to localStorage
      localStorage.setItem('simulatedAttacks', JSON.stringify(existingAttacks));
    } catch (error) {
      console.error('Error saving attack to localStorage:', error);
      throw error;
    }
  }

  // Get display name for attack type
  function getAttackTypeDisplayName(type: string): string {
    switch (type) {
      case 'portscan': return 'Port Scan';
      case 'bruteforce': return 'Brute Force';
      case 'ddos': return 'DDoS';
      case 'malicious_port': return 'Malware';
      default: return type;
    }
  }

  // Handle alert action
  const handleAlertAction = (alert: AttackAlert, action: string) => {
    setSelectedAlert(alert);
    setActionMessage(`Are you sure you want to ${action} this alert?`);
    setShowActionDialog(true);
  };

  // Confirm alert action
  const confirmAlertAction = async () => {
    if (!selectedAlert) return;
    
    setActionLoading(true);
    
    // Determine the new status based on action
    let newStatus = selectedAlert.status;
    if (selectedAlert.actions?.includes('block') && selectedAlert.status === 'active') {
      newStatus = 'blocked';
    } else if (selectedAlert.actions?.includes('quarantine') && selectedAlert.status === 'active') {
      newStatus = 'quarantined';
    } else if (selectedAlert.actions?.includes('resolve') && selectedAlert.status !== 'resolved') {
      newStatus = 'resolved';
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Update the attack in localStorage
      const attacksJson = localStorage.getItem('simulatedAttacks');
      if (attacksJson) {
        const attacks = JSON.parse(attacksJson);
        const updatedAttacks = attacks.map((attack: any) => {
          if (attack.id === selectedAlert.id) {
            return { ...attack, status: newStatus };
          }
          return attack;
        });
        
        localStorage.setItem('simulatedAttacks', JSON.stringify(updatedAttacks));
        
        // Update the UI
        setAttackAlerts(alerts => alerts.map(alert => {
          if (alert.id === selectedAlert.id) {
            return { ...alert, status: newStatus };
          }
          return alert;
        }));
        
        toast({
          title: "Action Successful",
          description: `Alert has been ${newStatus}`
        });
      }
    } catch (error) {
      console.error('Error updating attack:', error);
      toast({
        title: "Action Failed",
        description: "Failed to update the alert status",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
      setShowActionDialog(false);
    }
  };

  // Format severity level for display
  const formatSeverity = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attack Detection</h1>
          <p className="text-muted-foreground">Monitor and detect attack patterns in real-time</p>
        </div>
        <Button variant="outline" onClick={() => {
          fetchAlerts();
          fetchSignatures();
          toast({
            title: "Data Refreshed",
            description: "Attack monitoring data has been updated"
          });
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
                  {attackSignatures.map((signature) => (
                    <div key={signature.id} className="border rounded-lg p-3">
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
                <ScrollArea className="h-[450px] pr-4">
                  {attackAlerts.length > 0 ? (
                    <div className="space-y-3">
                      {attackAlerts.map((alert) => (
                        <div key={alert.id} className="border rounded-lg p-3">
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
                                <Badge variant="outline" className={
                                  statusColors[alert.status as keyof typeof statusColors] || statusColors.active
                                }>
                                  {alert.status.toUpperCase()}
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
                              
                              {/* Action buttons */}
                              {alert.actions && alert.actions.length > 0 && (
                                <div className="mt-3 space-x-2">
                                  {alert.actions.includes('block') && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleAlertAction(alert, 'block')}
                                    >
                                      Block
                                    </Button>
                                  )}
                                  {alert.actions.includes('quarantine') && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleAlertAction(alert, 'quarantine')}
                                    >
                                      Quarantine
                                    </Button>
                                  )}
                                  {alert.actions.includes('resolve') && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleAlertAction(alert, 'resolve')}
                                    >
                                      Resolve
                                    </Button>
                                  )}
                                </div>
                              )}
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
                      placeholder="192.168.1.100"
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
                    disabled={simulating}
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
      
      {/* Action confirmation dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>{actionMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActionDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmAlertAction} 
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 