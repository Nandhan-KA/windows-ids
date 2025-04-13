"use client"

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Shield, ShieldAlert, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'

interface AttackResult {
  success: boolean;
  message: string;
}

interface StoredAttack {
  id: string;
  title: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  description: string;
  threat_type: string;
  status: string;
}

export default function EnhancedAttackTester() {
  const [attackType, setAttackType] = useState<string>("Brute Force")
  const [severity, setSeverity] = useState<string>("medium")
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<AttackResult[]>([])
  const [showStoredAttacks, setShowStoredAttacks] = useState(false)
  const [storedAttacks, setStoredAttacks] = useState<StoredAttack[]>([])
  const { toast } = useToast()
  const router = useRouter()

  // Track if we're on the client side
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Function to simulate a single attack
  const simulateAttack = (type = attackType, attackSeverity = severity) => {
    if (!isClient) return false;
    
    try {
      // Create attack event
      const attackEvent = {
        id: `sim-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        timestamp: new Date().toISOString(),
        type: 'threat',
        severity: attackSeverity as 'low' | 'medium' | 'high' | 'critical',
        source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        target: 'System',
        title: `${type} Attack Detected`,
        description: getDescriptionForType(type),
        threat_type: type,
        status: 'active'
      }
      
      // Save to localStorage
      saveAttackToStorage(attackEvent)
      
      // Dispatch custom event
      const simulatedAttackEvent = new CustomEvent('simulated-attack', { detail: attackEvent })
      window.dispatchEvent(simulatedAttackEvent)
      
      // Show toast notification
      toast({
        title: "Attack Simulated",
        description: `${type} (${attackSeverity}) has been triggered.`
      })
      
      // Add result
      setResults(prev => [{
        success: true,
        message: `Successfully simulated ${type} (${attackSeverity}) attack`
      }, ...prev])
      
      return true
    } catch (error) {
      console.error("Error simulating attack:", error)
      
      // Show error toast
      toast({
        title: "Simulation Error",
        description: "Failed to simulate attack. Check console for details.",
        variant: "destructive"
      })
      
      // Add result
      setResults(prev => [{
        success: false,
        message: `Failed to simulate ${type} attack`
      }, ...prev])
      
      return false
    }
  }

  // Run a single attack
  const runSingleAttack = () => {
    setIsRunning(true)
    simulateAttack(attackType, severity)
    setIsRunning(false)
  }

  // Run a sequence of attacks
  const runTestSequence = () => {
    if (!isClient) return;
    
    setIsRunning(true)
    setResults(prev => [{
      success: true,
      message: "Running attack sequence..."
    }, ...prev])
    
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
        simulateAttack(attack.type, attack.severity)
        
        // If this is the last attack, mark test as complete
        if (index === testSequence.length - 1) {
          setTimeout(() => {
            setIsRunning(false)
            setResults(prev => [{
              success: true,
              message: "Attack sequence completed!"
            }, ...prev])
            
            toast({
              title: "Test Sequence Completed",
              description: "All attacks were simulated successfully"
            })
          }, 1000)
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
      
      setResults(prev => [{
        success: true,
        message: "Attack history cleared!"
      }, ...prev])
      
      // Clear stored attacks display
      setStoredAttacks([])
      
      return true
    } catch (error) {
      console.error("Error clearing attack history:", error)
      
      toast({
        title: "Error",
        description: "Failed to clear attack history",
        variant: "destructive"
      })
      
      setResults(prev => [{
        success: false,
        message: "Failed to clear attack history"
      }, ...prev])
      
      return false
    }
  }

  // View threats page
  const viewThreats = () => {
    router.push('/threats')
  }

  // Toggle stored attacks view
  const toggleStoredAttacks = () => {
    const newState = !showStoredAttacks
    setShowStoredAttacks(newState)
    
    if (newState) {
      refreshStoredAttacks()
    }
  }

  // Refresh stored attacks list
  const refreshStoredAttacks = () => {
    try {
      const attacksJson = localStorage.getItem('simulatedAttacks')
      const attacks = attacksJson ? JSON.parse(attacksJson) : []
      setStoredAttacks(attacks)
    } catch (error) {
      console.error("Error loading stored attacks:", error)
      setStoredAttacks([])
    }
  }

  // Save attack to localStorage
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

  // Clear old results automatically
  useEffect(() => {
    if (results.length > 5) {
      const timer = setTimeout(() => {
        setResults(prev => prev.slice(0, 5))
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [results])

  // Refresh stored attacks when toggled
  useEffect(() => {
    if (showStoredAttacks) {
      refreshStoredAttacks()
    }
  }, [showStoredAttacks])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-yellow-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Enhanced Attack Testing Console</CardTitle>
            </div>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              Debug Mode
            </Badge>
          </div>
          <CardDescription>
            Test attack simulation and monitoring functionality with enhanced controls
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {/* Single Attack Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Single Attack</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
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
                    <SelectItem value="Man in the Middle">Man in the Middle</SelectItem>
                    <SelectItem value="Malware">Malware</SelectItem>
                    <SelectItem value="Trojan">Trojan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
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
            
            <div>
              <Button 
                onClick={runSingleAttack} 
                disabled={isRunning}
                className="w-full md:w-auto"
              >
                Run Single Attack
              </Button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-2">Test Sequence</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Runs a sequence of different attacks with varying severities to test detection and response.
            </p>
            
            <Button 
              onClick={runTestSequence} 
              disabled={isRunning}
              className="w-full md:w-auto"
            >
              Run Test Sequence
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-2">Utilities</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={viewThreats}
              >
                View Threats Page
              </Button>
              
              <Button 
                variant="outline" 
                onClick={toggleStoredAttacks}
              >
                {showStoredAttacks ? "Hide Stored Attacks" : "View Stored Attacks"}
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={clearAttackHistory}
              >
                Clear Attack History
              </Button>
            </div>
          </div>
          
          {/* Results Section */}
          {results.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-2">Results</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-md ${
                      result.success 
                        ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}
                  >
                    {result.success ? "✅ " : "❌ "}
                    {result.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Stored Attacks Card */}
      {showStoredAttacks && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stored Attacks</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshStoredAttacks}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {storedAttacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No stored attacks found.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {storedAttacks.map((attack) => (
                  <div 
                    key={attack.id} 
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-medium">{attack.title}</div>
                      <Badge 
                        variant="outline"
                        className={
                          attack.severity === "critical"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : attack.severity === "high"
                            ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                            : attack.severity === "medium"
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }
                      >
                        {attack.severity}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Source: {attack.source_ip} | Time: {new Date(attack.timestamp).toLocaleString()}
                    </div>
                    <div className="text-sm">{attack.description}</div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={
                          attack.status === "active"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : attack.status === "investigating"
                            ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                            : attack.status === "blocked"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                        }
                      >
                        {attack.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 