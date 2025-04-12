"use client"

import { useState } from "react"
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data for firewall rules
const firewallRules = [
  {
    id: 1,
    name: "Allow HTTP",
    direction: "inbound",
    action: "allow",
    protocol: "TCP",
    port: "80",
    source: "Any",
    destination: "Any",
    enabled: true,
  },
  {
    id: 2,
    name: "Allow HTTPS",
    direction: "inbound",
    action: "allow",
    protocol: "TCP",
    port: "443",
    source: "Any",
    destination: "Any",
    enabled: true,
  },
  {
    id: 3,
    name: "Block Telnet",
    direction: "inbound",
    action: "block",
    protocol: "TCP",
    port: "23",
    source: "Any",
    destination: "Any",
    enabled: true,
  },
  {
    id: 4,
    name: "Allow SSH",
    direction: "inbound",
    action: "allow",
    protocol: "TCP",
    port: "22",
    source: "192.168.1.0/24",
    destination: "Any",
    enabled: true,
  },
  {
    id: 5,
    name: "Block FTP",
    direction: "inbound",
    action: "block",
    protocol: "TCP",
    port: "21",
    source: "Any",
    destination: "Any",
    enabled: true,
  },
  {
    id: 6,
    name: "Allow DNS",
    direction: "outbound",
    action: "allow",
    protocol: "UDP",
    port: "53",
    source: "Any",
    destination: "Any",
    enabled: true,
  },
  {
    id: 7,
    name: "Allow DHCP",
    direction: "outbound",
    action: "allow",
    protocol: "UDP",
    port: "67-68",
    source: "Any",
    destination: "Any",
    enabled: true,
  },
  {
    id: 8,
    name: "Block Suspicious IP",
    direction: "both",
    action: "block",
    protocol: "Any",
    port: "Any",
    source: "45.67.89.123",
    destination: "Any",
    enabled: true,
  },
  {
    id: 9,
    name: "Allow RDP",
    direction: "inbound",
    action: "allow",
    protocol: "TCP",
    port: "3389",
    source: "192.168.1.0/24",
    destination: "Any",
    enabled: false,
  },
  {
    id: 10,
    name: "Block Outbound IRC",
    direction: "outbound",
    action: "block",
    protocol: "TCP",
    port: "6667",
    source: "Any",
    destination: "Any",
    enabled: true,
  },
]

export default function FirewallRules() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentRule, setCurrentRule] = useState<any>(null)
  const { toast } = useToast()

  const filteredRules = firewallRules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.port.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.destination.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddRule = () => {
    setIsEditMode(false)
    setCurrentRule({
      name: "",
      direction: "inbound",
      action: "allow",
      protocol: "TCP",
      port: "",
      source: "Any",
      destination: "Any",
      enabled: true,
    })
    setIsDialogOpen(true)
  }

  const handleEditRule = (rule: any) => {
    setIsEditMode(true)
    setCurrentRule(rule)
    setIsDialogOpen(true)
  }

  const handleDeleteRule = (id: number) => {
    toast({
      title: "Rule deleted",
      description: "The firewall rule has been deleted successfully.",
    })
  }

  const handleToggleRule = (id: number, enabled: boolean) => {
    toast({
      title: enabled ? "Rule enabled" : "Rule disabled",
      description: `The firewall rule has been ${enabled ? "enabled" : "disabled"} successfully.`,
    })
  }

  const handleSaveRule = () => {
    toast({
      title: isEditMode ? "Rule updated" : "Rule added",
      description: `The firewall rule has been ${isEditMode ? "updated" : "added"} successfully.`,
    })
    setIsDialogOpen(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Firewall Rules</CardTitle>
        <CardDescription>Manage system firewall rules and policies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search rules..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleAddRule}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        rule.direction === "inbound"
                          ? "bg-blue-500/10 text-blue-500"
                          : rule.direction === "outbound"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-purple-500/10 text-purple-500"
                      }
                    >
                      {rule.direction}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={rule.action === "allow" ? "outline" : "destructive"}
                      className={rule.action === "allow" ? "bg-green-500/10 text-green-500" : ""}
                    >
                      {rule.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{rule.protocol}</TableCell>
                  <TableCell>{rule.port}</TableCell>
                  <TableCell className="max-w-[120px] truncate" title={rule.source}>
                    {rule.source}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate" title={rule.destination}>
                    {rule.destination}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                        title={rule.enabled ? "Disable rule" : "Enable rule"}
                      >
                        {rule.enabled ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditRule(rule)}
                        title="Edit rule"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                        title="Delete rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
