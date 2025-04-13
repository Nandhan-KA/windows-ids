"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Shield, ShieldAlert, ShieldX, AlertTriangle, GanttChart, Lock, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

// More comprehensive icon mapping for threat types
const threatIcons = {
  "Brute Force": AlertTriangle,
  "Trojan": ShieldX,
  "Data Exfiltration": ShieldAlert,
  "Malware": ShieldX,
  "Port Scan": AlertTriangle,
  "Phishing": ShieldAlert,
  "DDoS": AlertTriangle,
  "Man in the Middle": AlertTriangle,
  "Ransomware": Lock,
  "SQL Injection": ExternalLink,
  "XSS": ExternalLink,
  "Default": Shield
}

// Define a proper type for our threat objects
interface Threat {
  id: string;
  name: string;
  source: string;
  target: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'investigating' | 'blocked' | 'resolved';
  detectedAt: string;
  type: string;
  description: string;
  icon: any;
  simulated: boolean;
  affectedSystems?: string[];
  techniques?: string[];
  mitigationSteps?: string[];
  processPath?: string;
  networkTraffic?: number;
}

export default function ThreatsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [detailView, setDetailView] = useState<'overview' | 'analysis' | 'mitigation'>('overview')
  const [threats, setThreats] = useState<Threat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
    setIsLoading(true);
    
    // Simulate a loading delay for a more professional feel
    const timer = setTimeout(() => {
      loadAllThreats();
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Load all threats from localStorage
  const loadAllThreats = () => {
    try {
      const storedAttacks = localStorage.getItem('simulatedAttacks');
      if (storedAttacks) {
        const simulatedAttacks = JSON.parse(storedAttacks);
        
        // Format the simulated threats with more details
        const formattedSimulatedThreats = simulatedAttacks.map((event: any, index: number) => {
          const ThreatIcon = threatIcons[event.threat_type as keyof typeof threatIcons] || threatIcons.Default;
          
          // Generate random affected systems for more realism
          const systems = ['Firewall', 'Authentication Service', 'Web Server', 'Database', 'API Gateway', 'File Server', 'Mail Server'];
          const randomSystems = Array.from({length: Math.floor(Math.random() * 3) + 1}, () => 
            systems[Math.floor(Math.random() * systems.length)]);
            
          // Generate attack techniques based on threat type
          const techniques = [];
          if (event.threat_type === 'Brute Force') {
            techniques.push('Dictionary Attack', 'Password Spraying');
          } else if (event.threat_type === 'Port Scan') {
            techniques.push('TCP SYN Scan', 'UDP Scan');
          } else if (event.threat_type === 'DDoS') {
            techniques.push('SYN Flood', 'UDP Flood', 'HTTP Flood');
          } else if (event.threat_type === 'Man in the Middle') {
            techniques.push('ARP Spoofing', 'SSL Stripping');
          } else {
            techniques.push('Unknown Technique');
          }
          
          // Generate mitigation steps based on severity and type
          const mitigationSteps = [];
          if (event.severity === 'critical' || event.severity === 'high') {
            mitigationSteps.push('Isolate affected systems');
            mitigationSteps.push('Block source IP at firewall');
          }
          
          if (event.threat_type === 'Brute Force') {
            mitigationSteps.push('Enable account lockout policy');
            mitigationSteps.push('Implement multi-factor authentication');
          } else if (event.threat_type === 'DDoS') {
            mitigationSteps.push('Enable traffic rate limiting');
            mitigationSteps.push('Divert traffic through cleaning centers');
          }
          
          return {
            id: event.id || `sim-${index}`,
            name: event.title || `${event.threat_type || "Unknown"} Threat Detected`,
            source: event.source_ip || event.source || "Unknown Source",
            target: event.target || "System",
            severity: event.severity || "medium",
            status: event.status || "active",
            detectedAt: event.timestamp || new Date().toISOString(),
            type: event.threat_type || "Unknown",
            description: event.description || "No additional details available.",
            icon: ThreatIcon,
            simulated: true,
            affectedSystems: randomSystems,
            techniques: techniques,
            mitigationSteps: mitigationSteps,
            processPath: event.threat_type === 'Malware' ? '/system32/suspicious_process.exe' : undefined,
            networkTraffic: event.threat_type === 'DDoS' ? Math.floor(Math.random() * 500) + 100 : undefined
          };
        });
        
        setThreats(formattedSimulatedThreats);
      }
    } catch (error) {
      console.error("Error loading simulated attacks:", error);
    }
  };

  // Subscribe to custom event for simulation updates
  useEffect(() => {
    if (!isClient) return;
    
    const handleSimulatedAttack = (e: CustomEvent) => {
      const eventData = e.detail;
      
      if (!eventData) return;
      
      // Format the event with enhanced details
      const ThreatIcon = threatIcons[eventData.threat_type as keyof typeof threatIcons] || threatIcons.Default;
      
      // Generate affected systems
      const systems = ['Firewall', 'Authentication Service', 'Web Server', 'Database', 'API Gateway', 'File Server', 'Mail Server'];
      const randomSystems = Array.from({length: Math.floor(Math.random() * 3) + 1}, () => 
        systems[Math.floor(Math.random() * systems.length)]);
        
      // Generate attack techniques
      const techniques = [];
      if (eventData.threat_type === 'Brute Force') {
        techniques.push('Dictionary Attack', 'Password Spraying');
      } else if (eventData.threat_type === 'Port Scan') {
        techniques.push('TCP SYN Scan', 'UDP Scan');
      } else if (eventData.threat_type === 'DDoS') {
        techniques.push('SYN Flood', 'UDP Flood', 'HTTP Flood');
      } else if (eventData.threat_type === 'Man in the Middle') {
        techniques.push('ARP Spoofing', 'SSL Stripping');
      } else {
        techniques.push('Unknown Technique');
      }
      
      // Generate mitigation steps
      const mitigationSteps = [];
      if (eventData.severity === 'critical' || eventData.severity === 'high') {
        mitigationSteps.push('Isolate affected systems');
        mitigationSteps.push('Block source IP at firewall');
      }
      
      if (eventData.threat_type === 'Brute Force') {
        mitigationSteps.push('Enable account lockout policy');
        mitigationSteps.push('Implement multi-factor authentication');
      } else if (eventData.threat_type === 'DDoS') {
        mitigationSteps.push('Enable traffic rate limiting');
        mitigationSteps.push('Divert traffic through cleaning centers');
      }
      
      const newThreat: Threat = {
        id: eventData.id || `sim-${Date.now()}`,
        name: eventData.title || `${eventData.threat_type || "Unknown"} Threat Detected`,
        source: eventData.source_ip || eventData.source || "Unknown Source",
        target: eventData.target || "System",
        severity: eventData.severity || "medium",
        status: eventData.status || "active",
        detectedAt: eventData.timestamp || new Date().toISOString(),
        type: eventData.threat_type || "Unknown",
        description: eventData.description || "No additional details available.",
        icon: ThreatIcon,
        simulated: true,
        affectedSystems: randomSystems,
        techniques: techniques,
        mitigationSteps: mitigationSteps,
        processPath: eventData.threat_type === 'Malware' ? '/system32/suspicious_process.exe' : undefined,
        networkTraffic: eventData.threat_type === 'DDoS' ? Math.floor(Math.random() * 500) + 100 : undefined
      };
      
      // Add new threat to list
      setThreats(prev => [newThreat, ...prev]);
      
      // Show toast notification
      toast({
        title: "New Threat Detected",
        description: `${newThreat.name} from ${newThreat.source}`,
        variant: newThreat.severity === "critical" ? "destructive" : undefined
      });
    };

    window.addEventListener('simulated-attack' as any, handleSimulatedAttack as any);
    
    return () => {
      window.removeEventListener('simulated-attack' as any, handleSimulatedAttack as any);
    };
  }, [isClient, toast]);

  const filteredThreats = threats.filter(
    (threat) =>
      threat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  
  // Sort threats by detection time (newest first) and then by severity
  const sortedThreats = [...filteredThreats].sort((a, b) => {
    // First sort by detection time (newest first)
    const timeA = new Date(a.detectedAt).getTime();
    const timeB = new Date(b.detectedAt).getTime();
    
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    
    // Then by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const severityA = severityOrder[a.severity as keyof typeof severityOrder] || 4;
    const severityB = severityOrder[b.severity as keyof typeof severityOrder] || 4;
    
    return severityA - severityB;
  });

  const handleBlockThreat = (threat: Threat) => {
    setSelectedThreat(threat);
    setDetailView('overview');
    setIsDialogOpen(true);
  };
  
  const handleViewDetails = (threat: Threat) => {
    setSelectedThreat(threat);
    setDetailView('overview');
    setIsDialogOpen(true);
  };

  const confirmBlock = () => {
    if (!selectedThreat) return;
    
    // Update the status of the threat in the threats array
    setThreats(prevThreats => 
      prevThreats.map(threat => 
        threat.id === selectedThreat.id 
          ? { ...threat, status: 'blocked' } 
          : threat
      )
    );
    
    // Update in localStorage
    try {
      const storedAttacks = localStorage.getItem('simulatedAttacks');
      if (storedAttacks) {
        const attackList = JSON.parse(storedAttacks);
        const updatedAttacks = attackList.map((attack: any) => 
          attack.id === selectedThreat.id 
            ? { ...attack, status: 'blocked' } 
            : attack
        );
        localStorage.setItem('simulatedAttacks', JSON.stringify(updatedAttacks));
      }
    } catch (error) {
      console.error("Error updating simulated attack:", error);
    }
    
    toast({
      title: "Threat blocked",
      description: `${selectedThreat.name} has been blocked and quarantined.`,
    });
    setIsDialogOpen(false);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setIsLoading(true);
    
    // Simulate API call latency
    setTimeout(() => {
      loadAllThreats();
      setIsLoading(false);
      
      toast({
        title: "Refreshed",
        description: "Threat data has been updated."
      });
    }, 800);
  };

  // Get recommended action based on threat type and severity
  const getRecommendedAction = (threat: Threat) => {
    if (threat.status === 'blocked') {
      return "Blocked - No action needed";
    }
    
    if (threat.severity === 'critical') {
      return "Immediate isolation required";
    } else if (threat.severity === 'high') {
      if (threat.type === 'Brute Force') {
        return "Block source IP and reset credentials";
      } else if (threat.type === 'Malware' || threat.type === 'Trojan') {
        return "Quarantine and scan system";
      } else if (threat.type === 'DDoS') {
        return "Enable traffic filtering";
      }
      return "Block and investigate";
    } else if (threat.severity === 'medium') {
      if (threat.type === 'Port Scan') {
        return "Monitor and block if persistent";
      }
      return "Monitor and investigate";
    }
    
    return "Monitor activity";
  };
  
  // Get confidence level for detection
  const getConfidenceLevel = (threat: Threat) => {
    if (threat.techniques && threat.techniques.length > 1) {
      return "High";
    } else if (threat.techniques && threat.techniques.length === 1) {
      return "Medium";
    }
    return "Low";
  };
  
  // Calculate risk score (0-100)
  const calculateRiskScore = (threat: Threat) => {
    const severityScore = { critical: 40, high: 30, medium: 20, low: 10 };
    const baseScore = severityScore[threat.severity] || 10;
    
    // Add points for affected systems
    const systemScore = (threat.affectedSystems?.length || 0) * 10;
    
    // Add points for technique sophistication
    const techniqueScore = (threat.techniques?.length || 0) * 5;
    
    // Reduce score if blocked
    const statusMultiplier = threat.status === 'blocked' ? 0.2 : 
                            threat.status === 'investigating' ? 0.7 : 1.0;
    
    return Math.min(100, Math.floor((baseScore + systemScore + techniqueScore) * statusMultiplier));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="border-4 border-t-primary border-opacity-20 border-t-opacity-80 rounded-full w-12 h-12 animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading threat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search threats..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={handleRefresh} className="gap-2">
          <svg className="h-4 w-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Refresh
        </Button>
      </div>

      {sortedThreats.length === 0 ? (
        <div className="text-center py-10">
          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-lg font-medium">No threats found</p>
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? "Try adjusting your search query"
              : "No active threats have been detected"}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Threat</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Detected</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedThreats.map((threat) => {
              const IconComponent = threat.icon;
              const riskScore = calculateRiskScore(threat);
              
              return (
                <TableRow key={threat.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(threat)}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-primary" />
                    <span>
                      {threat.name}
                      {threat.simulated && (
                        <Badge variant="outline" className="ml-2 text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                          Simulated
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>{threat.source}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        threat.severity === "critical"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : threat.severity === "high"
                          ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                          : threat.severity === "medium"
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      }
                    >
                      {threat.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                riskScore > 75 ? "bg-red-500" : 
                                riskScore > 50 ? "bg-orange-500" : 
                                riskScore > 25 ? "bg-yellow-500" : "bg-green-500"
                              }`} 
                              style={{ width: `${riskScore}%` }}>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Risk Score: {riskScore}/100</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {new Date(threat.detectedAt).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        threat.status === "active"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : threat.status === "investigating"
                          ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                          : threat.status === "blocked"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                      }
                    >
                      {threat.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(threat);
                        }}
                      >
                        Details
                      </Button>
                      {threat.status !== 'blocked' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBlockThreat(threat);
                          }}
                        >
                          Block
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {selectedThreat && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedThreat.icon && <selectedThreat.icon className="h-5 w-5 text-primary" />}
                <span>
                  {selectedThreat.name}
                  {selectedThreat.simulated && (
                    <Badge variant="outline" className="ml-2 text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Simulated
                    </Badge>
                  )}
                </span>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-4 pt-2">
                <Badge
                  variant="outline"
                  className={
                    selectedThreat.severity === "critical"
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : selectedThreat.severity === "high"
                      ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                      : selectedThreat.severity === "medium"
                      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }
                >
                  {selectedThreat.severity.toUpperCase()} Severity
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    selectedThreat.status === "active"
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : selectedThreat.status === "investigating"
                      ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                      : selectedThreat.status === "blocked"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                  }
                >
                  {selectedThreat.status.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Detected: {new Date(selectedThreat.detectedAt).toLocaleString()}
                </span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="border-b mb-4">
              <div className="flex space-x-4">
                <button
                  className={`pb-2 pt-1 text-sm font-medium ${detailView === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                  onClick={() => setDetailView('overview')}
                >
                  Overview
                </button>
                <button
                  className={`pb-2 pt-1 text-sm font-medium ${detailView === 'analysis' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                  onClick={() => setDetailView('analysis')}
                >
                  Analysis
                </button>
                <button
                  className={`pb-2 pt-1 text-sm font-medium ${detailView === 'mitigation' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                  onClick={() => setDetailView('mitigation')}
                >
                  Mitigation
                </button>
              </div>
            </div>
            
            {detailView === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Threat Type</h4>
                    <p className="text-sm">{selectedThreat.type}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Source</h4>
                    <p className="text-sm">{selectedThreat.source}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Target</h4>
                    <p className="text-sm">{selectedThreat.target}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Risk Score</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            calculateRiskScore(selectedThreat) > 75 ? "bg-red-500" : 
                            calculateRiskScore(selectedThreat) > 50 ? "bg-orange-500" : 
                            calculateRiskScore(selectedThreat) > 25 ? "bg-yellow-500" : "bg-green-500"
                          }`} 
                          style={{ width: `${calculateRiskScore(selectedThreat)}%` }}>
                        </div>
                      </div>
                      <span className="text-sm">{calculateRiskScore(selectedThreat)}/100</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm">{selectedThreat.description}</p>
                </div>
                
                {selectedThreat.affectedSystems && selectedThreat.affectedSystems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Affected Systems</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedThreat.affectedSystems.map((system, index) => (
                        <Badge key={index} variant="outline">{system}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedThreat.processPath && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Process Path</h4>
                    <code className="text-xs bg-muted p-1 rounded">{selectedThreat.processPath}</code>
                  </div>
                )}
                
                {selectedThreat.networkTraffic && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Network Traffic</h4>
                    <p className="text-sm">{selectedThreat.networkTraffic} Mbps</p>
                  </div>
                )}
              </div>
            )}
            
            {detailView === 'analysis' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Detection Confidence</h4>
                  <Badge variant="outline" className={
                    getConfidenceLevel(selectedThreat) === "High" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    getConfidenceLevel(selectedThreat) === "Medium" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                    "bg-red-500/10 text-red-500 border-red-500/20"
                  }>
                    {getConfidenceLevel(selectedThreat)}
                  </Badge>
                </div>
                
                {selectedThreat.techniques && selectedThreat.techniques.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Attack Techniques</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedThreat.techniques.map((technique, index) => (
                        <li key={index} className="text-sm">{technique}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Timeline</h4>
                  <div className="border-l-2 border-muted pl-4 py-2 space-y-4">
                    <div>
                      <div className="flex items-center">
                        <div className="absolute -ml-6 h-3 w-3 rounded-full bg-primary"></div>
                        <p className="text-xs text-muted-foreground">{new Date(selectedThreat.detectedAt).toLocaleString()}</p>
                      </div>
                      <p className="text-sm">Initial detection</p>
                    </div>
                    
                    {selectedThreat.status !== 'active' && (
                      <div>
                        <div className="flex items-center">
                          <div className="absolute -ml-6 h-3 w-3 rounded-full bg-primary"></div>
                          <p className="text-xs text-muted-foreground">{new Date(new Date(selectedThreat.detectedAt).getTime() + 120000).toLocaleString()}</p>
                        </div>
                        <p className="text-sm">Status changed to {selectedThreat.status}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {detailView === 'mitigation' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Recommended Action</h4>
                  <p className="text-sm font-medium">{getRecommendedAction(selectedThreat)}</p>
                </div>
                
                {selectedThreat.mitigationSteps && selectedThreat.mitigationSteps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Mitigation Steps</h4>
                    <ul className="list-decimal list-inside space-y-1">
                      {selectedThreat.mitigationSteps.map((step, index) => (
                        <li key={index} className="text-sm">{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">MITRE ATT&CK Framework</h4>
                  <p className="text-xs text-muted-foreground mb-2">Relevant tactics and techniques</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {selectedThreat.type === 'Brute Force' && (
                      <>
                        <div className="bg-muted p-2 rounded">
                          <p className="text-xs font-medium">Initial Access (TA0001)</p>
                          <p className="text-xs text-muted-foreground">Valid Accounts (T1078)</p>
                        </div>
                        <div className="bg-muted p-2 rounded">
                          <p className="text-xs font-medium">Credential Access (TA0006)</p>
                          <p className="text-xs text-muted-foreground">Brute Force (T1110)</p>
                        </div>
                      </>
                    )}
                    
                    {selectedThreat.type === 'Port Scan' && (
                      <>
                        <div className="bg-muted p-2 rounded">
                          <p className="text-xs font-medium">Discovery (TA0007)</p>
                          <p className="text-xs text-muted-foreground">Network Service Scanning (T1046)</p>
                        </div>
                      </>
                    )}
                    
                    {selectedThreat.type === 'DDoS' && (
                      <>
                        <div className="bg-muted p-2 rounded">
                          <p className="text-xs font-medium">Impact (TA0040)</p>
                          <p className="text-xs text-muted-foreground">Network Denial of Service (T1498)</p>
                        </div>
                      </>
                    )}
                    
                    {selectedThreat.type === 'Man in the Middle' && (
                      <>
                        <div className="bg-muted p-2 rounded">
                          <p className="text-xs font-medium">Collection (TA0009)</p>
                          <p className="text-xs text-muted-foreground">Man in the Middle (T1557)</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="gap-2">
              {selectedThreat.status !== 'blocked' ? (
                <>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                  <Button variant="destructive" onClick={confirmBlock}>
                    Block Threat
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
