"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Swords, Play, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import AttackTester from "@/components/debug/attack-tester"
import { sendToMongoDB } from "../../services/mongodb"

interface SimulatedAttackEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  target: string;
  title: string;
  description: string;
  threat_type: string;
  status: string;
}

export default function AttackSimulationPage() {
  const [attackRunning, setAttackRunning] = useState(false)
  const [attackProgress, setAttackProgress] = useState(0)
  const [attackLogs, setAttackLogs] = useState<string[]>([])
  const [attackType, setAttackType] = useState("bruteforce")
  const [targetIP, setTargetIP] = useState("192.168.1.1")
  const [intensity, setIntensity] = useState([50])
  const [attackHistory, setAttackHistory] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Load attack history from localStorage on component mount
  useEffect(() => {
    const storedAttacks = localStorage.getItem('simulatedAttacks');
    if (storedAttacks) {
      try {
        setAttackHistory(JSON.parse(storedAttacks));
      } catch (error) {
        console.error("Error loading attack history:", error);
      }
    }
  }, []);

  // Save attacks to localStorage whenever history changes
  useEffect(() => {
    if (attackHistory.length > 0) {
      localStorage.setItem('simulatedAttacks', JSON.stringify(attackHistory));
    }
  }, [attackHistory]);

  const generateAttackEvent = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    // Generate a more unique ID using timestamp, random string, and random number
    const randomString = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    const uniqueId = `sim-${timestamp}-${randomString}-${randomNum}`;
    
    return {
      id: uniqueId,
      timestamp: new Date().toISOString(),
      type: 'threat',
      severity: severity,
      source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      target: 'System',
      title: `${attackType} Attack Detected`,
      description: getDescriptionForType(attackType),
      threat_type: attackType,
      status: 'active'
    };
  };

  const showAttackNotification = (event: any) => {
    if (!showNotifications) return;
    
    const severityColors = {
      critical: "destructive",
      high: "destructive",
      medium: "default",
      low: "default"
    };
    
    toast({
      title: `${event.threat_type} Attack Detected`,
      description: `${event.severity.toUpperCase()}: ${event.description}`,
      variant: (severityColors[event.severity as keyof typeof severityColors] as any) || "default"
    });
  };

  const viewThreatDetails = () => {
    router.push('/threats');
  };

  const runAttack = () => {
    if (attackRunning) return;

    setAttackRunning(true);
    setAttackProgress(0);
    
    const startTime = new Date().toLocaleTimeString();
    setAttackLogs([`[${startTime}] Starting ${attackType} attack simulation on ${targetIP}...`]);

    const interval = setInterval(() => {
      setAttackProgress((prev) => {
        const newProgress = prev + Math.floor(Math.random() * 5) + 1;

        if (newProgress >= 100) {
          clearInterval(interval);
          setAttackRunning(false);
          
          // Generate between 1-5 security events based on intensity
          const numEvents = Math.max(1, Math.floor((intensity[0] / 100) * 5));
          const newEvents: SimulatedAttackEvent[] = [];
          
          for (let i = 0; i < numEvents; i++) {
            // Determine severity based on intensity and randomness
            let severity: 'low' | 'medium' | 'high' | 'critical';
            const severityRoll = Math.random() * 100;
            
            if (severityRoll < 10) severity = 'critical';
            else if (severityRoll < 30) severity = 'high';
            else if (severityRoll < 70) severity = 'medium';
            else severity = 'low';
            
            const event = generateAttackEvent(severity);
            newEvents.push(event);
            
            // Show notification for this attack
            showAttackNotification(event);
            
            // Dispatch a custom event that our threat metrics component listens for
            const simulatedAttackEvent = new CustomEvent('simulated-attack', { 
              detail: event 
            });
            window.dispatchEvent(simulatedAttackEvent);
            
            // Save to MongoDB
            sendToMongoDB(event)
              .then((success: boolean) => {
                if (success) {
                  console.log(`Attack event ${event.id} saved to MongoDB successfully`);
                  const logTime = new Date().toLocaleTimeString();
                  setAttackLogs(prev => [...prev, `[${logTime}] Attack data saved to MongoDB (${event.id})`]);
                } else {
                  console.error(`Failed to save attack event ${event.id} to MongoDB`);
                }
              })
              .catch((error: Error) => {
                console.error('Error saving to MongoDB:', error);
              });
          }
          
          // Update attack history
          setAttackHistory(prev => [...newEvents, ...prev]);
          
          // Add logs
          setAttackLogs((prevLogs) => [
            ...prevLogs,
            `[${new Date().toLocaleTimeString()}] Attack simulation completed.`,
            `[${new Date().toLocaleTimeString()}] Generated ${numEvents} security events.`,
            `[${new Date().toLocaleTimeString()}] View threats in the Threat Detection panel.`,
          ]);
          
          // Show a summary toast with option to view threats
          toast({
            title: "Attack Simulation Complete",
            description: (
              <div className="flex flex-col gap-2">
                <p>{`Generated ${numEvents} security events`}</p>
                <Button size="sm" variant="outline" onClick={viewThreatDetails}>
                  View Threat Details
                </Button>
              </div>
            )
          });
          
          return 100;
        }

        // Add random logs during the attack
        if (Math.random() > 0.7) {
          const logMessages = [
            `Attempting connection to port ${Math.floor(Math.random() * 1000) + 1}...`,
            `Sending packet ${Math.floor(Math.random() * 100) + 1}...`,
            `Testing vulnerability CVE-2023-${Math.floor(Math.random() * 9000) + 1000}...`,
            `Response received: ${Math.random() > 0.5 ? "Success" : "Failed"}`,
            `Detected firewall rule blocking request`,
            `Bypassing security measure...`,
            `Analyzing system response...`,
          ];

          const randomLog = logMessages[Math.floor(Math.random() * logMessages.length)];
          setAttackLogs((prevLogs) => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${randomLog}`]);
        }

        return newProgress;
      });
    }, 300);

    return () => clearInterval(interval);
  };

  const stopAttack = () => {
    setAttackRunning(false);
    setAttackLogs((prevLogs) => [
      ...prevLogs,
      `[${new Date().toLocaleTimeString()}] Attack simulation stopped manually.`,
    ]);
  };

  const clearAttackHistory = () => {
    setAttackHistory([]);
    localStorage.removeItem('simulatedAttacks');
    setAttackLogs((prevLogs) => [
      ...prevLogs,
      `[${new Date().toLocaleTimeString()}] Attack history cleared.`,
    ]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attack Simulation</h1>
          <p className="text-muted-foreground">Test your system's security with simulated attacks</p>
        </div>
      </div>

      <Alert variant="destructive" className="border-red-600/20 bg-red-600/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Attack simulations are for testing purposes only. Only run simulations on systems you own or have permission
          to test.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              <span>Attack Configuration</span>
            </CardTitle>
            <CardDescription>Configure and run simulated attacks to test your security measures</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="network" className="space-y-4">
              <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="application">Application</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>

              <TabsContent value="network" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attack-type">Attack Type</Label>
                    <Select value={attackType} onValueChange={setAttackType}>
                      <SelectTrigger id="attack-type">
                        <SelectValue placeholder="Select attack type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bruteforce">Brute Force</SelectItem>
                        <SelectItem value="portscan">Port Scan</SelectItem>
                        <SelectItem value="ddos">DDoS Simulation</SelectItem>
                        <SelectItem value="mitm">Man-in-the-Middle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-ip">Target IP</Label>
                    <Input
                      id="target-ip"
                      value={targetIP}
                      onChange={(e) => setTargetIP(e.target.value)}
                      placeholder="192.168.1.1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="intensity">Attack Intensity</Label>
                    <span className="text-sm text-muted-foreground">{intensity[0]}%</span>
                  </div>
                  <Slider id="intensity" value={intensity} onValueChange={setIntensity} max={100} step={1} />
                  <p className="text-xs text-muted-foreground">
                    Higher intensity generates more severe attacks and potentially more events
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="stealth-mode" />
                    <Label htmlFor="stealth-mode">Stealth Mode</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Attempt to evade detection by using slower, more careful techniques
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="log-events" defaultChecked />
                    <Label htmlFor="log-events">Generate Security Events</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Create security events in the system log for analysis</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="show-notifications" 
                      checked={showNotifications}
                      onCheckedChange={setShowNotifications}
                    />
                    <Label htmlFor="show-notifications">Show Attack Notifications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Display toast notifications when attacks are detected
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="application" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="app-attack-type">Attack Type</Label>
                    <Select defaultValue="sqli">
                      <SelectTrigger id="app-attack-type">
                        <SelectValue placeholder="Select attack type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sqli">SQL Injection</SelectItem>
                        <SelectItem value="xss">Cross-Site Scripting</SelectItem>
                        <SelectItem value="csrf">CSRF Attack</SelectItem>
                        <SelectItem value="fileupload">Malicious File Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-url">Target URL</Label>
                    <Input
                      id="target-url"
                      defaultValue="http://localhost:3000/api"
                      placeholder="http://example.com/api"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payload">Attack Payload</Label>
                  <Input id="payload" defaultValue="' OR 1=1 --" placeholder="Enter payload" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="app-intensity">Attack Intensity</Label>
                    <span className="text-sm text-muted-foreground">40%</span>
                  </div>
                  <Slider id="app-intensity" defaultValue={[40]} max={100} step={1} />
                </div>
              </TabsContent>

              <TabsContent value="system" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sys-attack-type">Attack Type</Label>
                    <Select defaultValue="privesc">
                      <SelectTrigger id="sys-attack-type">
                        <SelectValue placeholder="Select attack type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="privesc">Privilege Escalation</SelectItem>
                        <SelectItem value="malware">Malware Simulation</SelectItem>
                        <SelectItem value="rootkit">Rootkit Behavior</SelectItem>
                        <SelectItem value="ransomware">Ransomware Simulation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-process">Target Process</Label>
                    <Input id="target-process" defaultValue="system.exe" placeholder="Enter process name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="persistence" />
                    <Label htmlFor="persistence">Simulate Persistence</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Simulate techniques used by malware to maintain access to systems
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="data-exfil" />
                    <Label htmlFor="data-exfil">Simulate Data Exfiltration</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Simulate attempts to extract sensitive data from the system
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between gap-2">
            <div className="space-x-2">
              <Button variant="outline" onClick={clearAttackHistory}>Clear History</Button>
              <Button variant="outline" onClick={viewThreatDetails}>View Threats</Button>
            </div>
            {attackRunning ? (
              <Button variant="destructive" onClick={stopAttack}>
                Stop Attack
              </Button>
            ) : (
              <Button onClick={runAttack}>
                <Play className="mr-2 h-4 w-4" />
                Run Attack Simulation
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <span>Attack Status</span>
            </CardTitle>
            <CardDescription>Real-time attack simulation status and logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attackRunning ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="font-medium">Attack in progress...</span>
              </div>
            ) : attackProgress > 0 ? (
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-green-500" />
                <span className="font-medium">Attack completed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">No attack running</span>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{attackProgress}%</span>
              </div>
              <Progress value={attackProgress} className="h-2" />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Attack Logs</h3>
              <Card className="bg-muted/50">
                <ScrollArea className="h-[300px]">
                  <CardContent className="p-3 space-y-2 font-mono text-xs">
                    {attackLogs.length > 0 ? (
                      attackLogs.map((log, index) => (
                        <div key={index} className="border-l-2 border-primary pl-2">
                          {log}
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">No logs available. Start an attack to see logs.</div>
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Test Console */}
      <div className="pt-4">
        <h2 className="text-xl font-bold tracking-tight mb-3">Testing Tools</h2>
        <div className="grid grid-cols-1 gap-6">
          <AttackTester />
        </div>
      </div>
    </div>
  )
}
