"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Play, Trash, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'

// Declare the window interface to include our custom function
declare global {
  interface Window {
    handleSimulateAttackApi: any;
  }
}

// Define save attack function outside the component to use in the effect
function saveAttackToStorage(attack: any): void {
  try {
    // Get existing attacks
    const existingAttacksJson = localStorage.getItem('simulatedAttacks')
    const existingAttacks = existingAttacksJson ? JSON.parse(existingAttacksJson) : []
    
    // Add new attack
    existingAttacks.unshift(attack)
    
    // Save back to localStorage
    localStorage.setItem('simulatedAttacks', JSON.stringify(existingAttacks))
  } catch (error) {
    console.error('Error saving attack to localStorage:', error)
    throw error
  }
}

// Add new effect to handle API route for simulating attacks
useEffect(() => {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  // Create a function to handle API requests
  const handleSimulateAttackApi = async (event: any) => {
    try {
      const attackData = JSON.parse(event.data);
      console.log('Attack data received from API:', attackData);
      
      if (attackData && attackData.attack) {
        // Extract attack data
        const attack = attackData.attack;
        saveAttackToStorage(attack);
        
        // Dispatch custom event
        const simulatedAttackEvent = new CustomEvent('simulated-attack', { 
          detail: attack 
        });
        window.dispatchEvent(simulatedAttackEvent);
        
        // Return success status
        return { success: true };
      }
    } catch (error) {
      console.error('Error handling API simulate attack:', error);
      return { success: false, error: String(error) };
    }
  };
  
  // Expose function to window for API access
  window.handleSimulateAttackApi = handleSimulateAttackApi;
  
  // Create event source for server-sent events
  const eventSource = new EventSource('/api/debug/simulate-attack-stream');
  eventSource.onmessage = (event) => {
    handleSimulateAttackApi(event);
  };
  
  return () => {
    eventSource.close();
  };
}, []);

export default function AttackTester() {
  const [attackType, setAttackType] = useState<string>("Brute Force")
  const [severity, setSeverity] = useState<string>("medium")
  const [isRunning, setIsRunning] = useState(false)
  const [testMode, setTestMode] = useState<'single' | 'sequence'>('single')
  const [testResults, setTestResults] = useState<Array<{test: string, passed: boolean, message?: string}>>([])
  const { toast } = useToast()
  const router = useRouter()

  // Track if we're on the client side
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Run a single attack simulation
  const runSingleAttack = () => {
    if (!isClient) return
    
    setIsRunning(true)
    setTestResults([])
    
    try {
      // Create attack event
      const attackEvent = {
        id: `sim-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        timestamp: new Date().toISOString(),
        type: 'threat',
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        target: 'System',
        title: `${attackType} Attack Detected`,
        description: getDescriptionForType(attackType),
        threat_type: attackType,
        status: 'active'
      }
      
      // Save to localStorage
      saveAttackToStorage(attackEvent)
      
      // Dispatch custom event
      const simulatedAttackEvent = new CustomEvent('simulated-attack', { detail: attackEvent })
      window.dispatchEvent(simulatedAttackEvent)
      
      toast({
        title: "Attack Simulated",
        description: `${attackType} (${severity}) has been triggered.`
      })
      
      setTimeout(() => {
        setTestResults([
          { test: "Event dispatched", passed: true },
          { test: "localStorage updated", passed: true }
        ])
        setIsRunning(false)
      }, 500)
    } catch (error) {
      console.error("Error simulating attack:", error)
      toast({
        title: "Simulation Error",
        description: "Failed to simulate attack. Check console for details.",
        variant: "destructive"
      })
      setIsRunning(false)
    }
  }

  // Run a sequence of attacks
  const runTestSequence = () => {
    if (!isClient) return
    
    setIsRunning(true)
    setTestResults([])
    
    // Define a test sequence with various attacks and severities
    const testSequence = [
      { type: 'Brute Force', severity: 'medium', delay: 1000 },
      { type: 'Port Scan', severity: 'low', delay: 2000 },
      { type: 'DDoS', severity: 'high', delay: 3000 },
      { type: 'Malware', severity: 'critical', delay: 4000 },
      { type: 'Man in the Middle', severity: 'high', delay: 5000 }
    ]
    
    toast({
      title: "Test Sequence Started",
      description: "Running 5 different attack simulations..."
    })
    
    // Execute the sequence
    testSequence.forEach((attack, index) => {
      setTimeout(() => {
        try {
          // Create attack event
          const attackEvent = {
            id: `sim-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            timestamp: new Date().toISOString(),
            type: 'threat',
            severity: attack.severity as 'low' | 'medium' | 'high' | 'critical',
            source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            target: 'System',
            title: `${attack.type} Attack Detected`,
            description: getDescriptionForType(attack.type),
            threat_type: attack.type,
            status: 'active'
          }
          
          // Save to localStorage
          saveAttackToStorage(attackEvent)
          
          // Dispatch custom event
          const simulatedAttackEvent = new CustomEvent('simulated-attack', { detail: attackEvent })
          window.dispatchEvent(simulatedAttackEvent)
          
          setTestResults(prev => [...prev, { 
            test: `${attack.type} (${attack.severity})`, 
            passed: true 
          }])
          
          // If this is the last attack, mark test as complete
          if (index === testSequence.length - 1) {
            setTimeout(() => {
              setIsRunning(false)
              
              toast({
                title: "Test Sequence Completed",
                description: "All attacks were simulated successfully"
              })
            }, 1000)
          }
        } catch (error) {
          console.error(`Error simulating ${attack.type}:`, error)
          setTestResults(prev => [...prev, { 
            test: `${attack.type} (${attack.severity})`, 
            passed: false,
            message: "Failed to simulate"
          }])
          
          if (index === testSequence.length - 1) {
            setIsRunning(false)
          }
        }
      }, attack.delay)
    })
  }

  // Clear attack history from localStorage
  const clearAttackHistory = () => {
    try {
      localStorage.removeItem('simulatedAttacks')
      toast({
        title: "Attack History Cleared",
        description: "All simulated attacks have been removed"
      })
      setTestResults([
        { test: "Clear attack history", passed: true }
      ])
    } catch (error) {
      console.error("Error clearing attack history:", error)
      toast({
        title: "Error",
        description: "Failed to clear attack history",
        variant: "destructive"
      })
    }
  }

  // View threats page
  const viewThreats = () => {
    router.push('/threats')
  }

  // Save attack to localStorage - reuse the function defined above
  const componentSaveAttackToStorage = saveAttackToStorage;

  // Get description for attack type
  function getDescriptionForType(type: string): string {
    switch (type) {
      case 'Brute Force':
        return 'Multiple failed login attempts detected from single source'
      case 'Port Scan':
        return 'Systematic scan of multiple ports detected'
      case 'DDoS':
        return 'Unusual traffic pattern consistent with distributed denial of service'
      case 'Man in the Middle':
        return 'Abnormal network routing detected, possible man-in-the-middle attack'
      case 'Malware':
        return 'Suspicious process behavior consistent with malware activity detected'
      case 'Trojan':
        return 'Suspicious outbound connection from trusted application detected'
      default:
        return 'Suspicious activity detected'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-yellow-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <CardTitle>Attack Testing Console</CardTitle>
          </div>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Debug Mode
          </Badge>
        </div>
        <CardDescription>
          Test attack simulation and monitoring functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="test-mode">Test Mode</Label>
            <Select
              value={testMode}
              onValueChange={(value) => setTestMode(value as 'single' | 'sequence')}
              disabled={isRunning}
            >
              <SelectTrigger id="test-mode">
                <SelectValue placeholder="Select test mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Attack</SelectItem>
                <SelectItem value="sequence">Attack Sequence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {testMode === 'single' && (
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="attack-type">Attack Type</Label>
              <Select
                value={attackType}
                onValueChange={setAttackType}
                disabled={isRunning}
              >
                <SelectTrigger id="attack-type">
                  <SelectValue placeholder="Select attack type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brute Force">Brute Force</SelectItem>
                  <SelectItem value="Port Scan">Port Scan</SelectItem>
                  <SelectItem value="DDoS">DDoS</SelectItem>
                  <SelectItem value="Malware">Malware</SelectItem>
                  <SelectItem value="Trojan">Trojan</SelectItem>
                  <SelectItem value="Man in the Middle">Man in the Middle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={severity}
                onValueChange={setSeverity}
                disabled={isRunning}
              >
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {testResults.length > 0 && (
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Test Results</h4>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center text-sm">
                  {result.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span>{result.test}</span>
                  {result.message && <span className="ml-2 text-muted-foreground">({result.message})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2 border-t p-4">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearAttackHistory}
            disabled={isRunning}
          >
            <Trash className="h-4 w-4 mr-2" />
            Clear History
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={viewThreats}
          >
            View Threats
          </Button>
        </div>
        
        <Button 
          size="sm"
          onClick={testMode === 'single' ? runSingleAttack : runTestSequence}
          disabled={isRunning}
        >
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? 'Running...' : testMode === 'single' ? 'Run Attack' : 'Run Sequence'}
        </Button>
      </CardFooter>
    </Card>
  )
} 