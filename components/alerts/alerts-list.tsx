"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, AlertTriangle, ShieldAlert, ShieldX, Info, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for alerts
const alerts = [
  {
    id: 1,
    title: "Suspicious Login Attempt",
    description: "Multiple failed login attempts from IP 192.168.1.45",
    time: "10 minutes ago",
    severity: "high",
    status: "unresolved",
    icon: AlertTriangle,
    source: "Authentication Service",
  },
  {
    id: 2,
    title: "Unusual Network Traffic",
    description: "High volume of outbound traffic to unknown IP 45.67.89.123",
    time: "25 minutes ago",
    severity: "medium",
    status: "unresolved",
    icon: ShieldAlert,
    source: "Network Monitor",
  },
  {
    id: 3,
    title: "Potential Port Scan",
    description: "Sequential port scan detected from IP 10.0.0.15",
    time: "1 hour ago",
    severity: "medium",
    status: "investigating",
    icon: ShieldAlert,
    source: "Firewall",
  },
  {
    id: 4,
    title: "Malware Signature Detected",
    description: "Known malware signature found in file system.dll",
    time: "3 hours ago",
    severity: "critical",
    status: "unresolved",
    icon: ShieldX,
    source: "Antivirus",
  },
  {
    id: 5,
    title: "Unauthorized Access Attempt",
    description: "Attempt to access restricted directory /admin/config",
    time: "5 hours ago",
    severity: "high",
    status: "resolved",
    icon: AlertTriangle,
    source: "File System Monitor",
  },
  {
    id: 6,
    title: "System Update Available",
    description: "Security update KB4023057 is available for installation",
    time: "1 day ago",
    severity: "low",
    status: "unresolved",
    icon: Info,
    source: "Update Service",
  },
]

const severityColors = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
}

const statusColors = {
  unresolved: "bg-red-500/10 text-red-500 border-red-500/20",
  investigating: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
}

export default function AlertsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  const filteredAlerts = alerts.filter(
    (alert) =>
      (alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (severityFilter === "all" || alert.severity === severityFilter) &&
      (statusFilter === "all" || alert.status === statusFilter),
  )

  const resolveAlert = (id: number) => {
    toast({
      title: "Alert resolved",
      description: "The alert has been marked as resolved.",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search alerts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card/50">
              <div className="mt-1">
                <alert.icon
                  className={`h-5 w-5 ${
                    alert.severity === "critical"
                      ? "text-red-500"
                      : alert.severity === "high"
                        ? "text-orange-500"
                        : alert.severity === "medium"
                          ? "text-amber-500"
                          : "text-blue-500"
                  }`}
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{alert.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={severityColors[alert.severity as keyof typeof severityColors]}>
                      {alert.severity}
                    </Badge>
                    <Badge variant="outline" className={statusColors[alert.status as keyof typeof statusColors]}>
                      {alert.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <span>{alert.time}</span>
                    <span>•</span>
                    <span>{alert.source}</span>
                  </div>
                  <div className="flex gap-2">
                    {alert.status !== "resolved" && (
                      <Button variant="outline" size="sm" onClick={() => resolveAlert(alert.id)}>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Resolve
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <XCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium">No alerts found</h3>
            <p className="text-sm text-muted-foreground">No alerts match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
