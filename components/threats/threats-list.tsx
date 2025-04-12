"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Shield, ShieldAlert, ShieldX, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

// Mock data for threats
const threats = [
  {
    id: 1,
    name: "Suspicious Login Attempt",
    source: "192.168.1.45",
    target: "Admin Account",
    severity: "high",
    status: "active",
    detectedAt: "2023-04-11T14:32:00",
    type: "Brute Force",
    description: "Multiple failed login attempts detected from IP 192.168.1.45 targeting administrator account.",
    icon: AlertTriangle,
  },
  {
    id: 2,
    name: "Malware Detected",
    source: "C:\\Windows\\System32\\suspicious.dll",
    target: "System Files",
    severity: "critical",
    status: "active",
    detectedAt: "2023-04-11T13:15:00",
    type: "Trojan",
    description: "Malicious DLL file detected with known trojan signatures. File has been quarantined.",
    icon: ShieldX,
  },
  {
    id: 3,
    name: "Unusual Network Traffic",
    source: "10.0.0.15",
    target: "45.67.89.123:8080",
    severity: "medium",
    status: "active",
    detectedAt: "2023-04-11T12:45:00",
    type: "Data Exfiltration",
    description: "Unusual outbound traffic pattern detected. Possible data exfiltration attempt.",
    icon: ShieldAlert,
  },
  {
    id: 4,
    name: "Potential Port Scan",
    source: "172.16.0.32",
    target: "Local Network",
    severity: "medium",
    status: "active",
    detectedAt: "2023-04-11T11:20:00",
    type: "Reconnaissance",
    description: "Sequential port scan detected from internal IP address. Possible compromised device.",
    icon: Shield,
  },
  {
    id: 5,
    name: "Registry Modification",
    source: "explorer.exe",
    target: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
    severity: "high",
    status: "active",
    detectedAt: "2023-04-11T10:05:00",
    type: "Persistence",
    description: "Suspicious registry modification detected. Potential persistence mechanism being installed.",
    icon: ShieldAlert,
  },
]

const severityColors = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default function ThreatsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedThreat, setSelectedThreat] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const filteredThreats = threats.filter(
    (threat) =>
      threat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleBlockThreat = (threat: any) => {
    setSelectedThreat(threat)
    setIsDialogOpen(true)
  }

  const confirmBlock = () => {
    toast({
      title: "Threat blocked",
      description: `${selectedThreat.name} has been blocked and quarantined.`,
    })
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search threats..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          Export
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Threat</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Detected</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredThreats.map((threat) => (
              <TableRow key={threat.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <threat.icon
                      className={`h-4 w-4 ${
                        threat.severity === "critical"
                          ? "text-red-500"
                          : threat.severity === "high"
                            ? "text-orange-500"
                            : threat.severity === "medium"
                              ? "text-amber-500"
                              : "text-blue-500"
                      }`}
                    />
                    {threat.name}
                  </div>
                </TableCell>
                <TableCell>{threat.source}</TableCell>
                <TableCell>{threat.target}</TableCell>
                <TableCell>{threat.type}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={severityColors[threat.severity as keyof typeof severityColors]}>
                    {threat.severity}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(threat.detectedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleBlockThreat(threat)}>
                    Block
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Threat</DialogTitle>
            <DialogDescription>
              Are you sure you want to block this threat? This will quarantine the threat and block its source.
            </DialogDescription>
          </DialogHeader>
          {selectedThreat && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">Threat Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Name:</div>
                  <div>{selectedThreat.name}</div>
                  <div className="font-medium">Source:</div>
                  <div>{selectedThreat.source}</div>
                  <div className="font-medium">Type:</div>
                  <div>{selectedThreat.type}</div>
                  <div className="font-medium">Severity:</div>
                  <div>
                    <Badge
                      variant="outline"
                      className={severityColors[selectedThreat.severity as keyof typeof severityColors]}
                    >
                      {selectedThreat.severity}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Actions to be taken:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Quarantine the threat</li>
                  <li>Block the source IP/file</li>
                  <li>Create firewall rule to prevent future access</li>
                  <li>Log the incident for further analysis</li>
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBlock}>
              Block Threat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
