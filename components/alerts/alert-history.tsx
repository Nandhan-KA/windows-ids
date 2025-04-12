"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, AlertTriangle, ShieldAlert, ShieldX, Info, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Mock data for alert history
const alertHistory = [
  {
    id: 1,
    title: "Suspicious Login Attempt",
    severity: "high",
    status: "resolved",
    source: "Authentication Service",
    createdAt: "2023-04-11T14:32:00",
    resolvedAt: "2023-04-11T14:45:00",
    icon: AlertTriangle,
  },
  {
    id: 2,
    title: "Unusual Network Traffic",
    severity: "medium",
    status: "resolved",
    source: "Network Monitor",
    createdAt: "2023-04-11T13:15:00",
    resolvedAt: "2023-04-11T13:30:00",
    icon: ShieldAlert,
  },
  {
    id: 3,
    title: "Potential Port Scan",
    severity: "medium",
    status: "false positive",
    source: "Firewall",
    createdAt: "2023-04-11T12:45:00",
    resolvedAt: "2023-04-11T13:00:00",
    icon: ShieldAlert,
  },
  {
    id: 4,
    title: "Malware Signature Detected",
    severity: "critical",
    status: "resolved",
    source: "Antivirus",
    createdAt: "2023-04-11T11:20:00",
    resolvedAt: "2023-04-11T11:45:00",
    icon: ShieldX,
  },
  {
    id: 5,
    title: "Unauthorized Access Attempt",
    severity: "high",
    status: "resolved",
    source: "File System Monitor",
    createdAt: "2023-04-11T10:05:00",
    resolvedAt: "2023-04-11T10:20:00",
    icon: AlertTriangle,
  },
  {
    id: 6,
    title: "System Update Available",
    severity: "low",
    status: "resolved",
    source: "Update Service",
    createdAt: "2023-04-10T09:30:00",
    resolvedAt: "2023-04-10T10:00:00",
    icon: Info,
  },
  {
    id: 7,
    title: "Failed Login Attempt",
    severity: "medium",
    status: "resolved",
    source: "Authentication Service",
    createdAt: "2023-04-10T08:15:00",
    resolvedAt: "2023-04-10T08:30:00",
    icon: AlertTriangle,
  },
  {
    id: 8,
    title: "Suspicious File Detected",
    severity: "high",
    status: "false positive",
    source: "Antivirus",
    createdAt: "2023-04-10T07:45:00",
    resolvedAt: "2023-04-10T08:00:00",
    icon: ShieldX,
  },
  {
    id: 9,
    title: "Firewall Rule Violation",
    severity: "medium",
    status: "resolved",
    source: "Firewall",
    createdAt: "2023-04-09T16:30:00",
    resolvedAt: "2023-04-09T16:45:00",
    icon: ShieldAlert,
  },
  {
    id: 10,
    title: "Registry Modification",
    severity: "high",
    status: "resolved",
    source: "System Monitor",
    createdAt: "2023-04-09T15:00:00",
    resolvedAt: "2023-04-09T15:15:00",
    icon: AlertTriangle,
  },
]

const severityColors = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
}

const statusColors = {
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  "false positive": "bg-blue-500/10 text-blue-500 border-blue-500/20",
}

export default function AlertHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  const filteredAlerts = alertHistory.filter(
    (alert) =>
      (alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.source.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (severityFilter === "all" || alert.severity === severityFilter) &&
      (statusFilter === "all" || alert.status === statusFilter) &&
      (dateFilter === "all" || filterByDate(alert.createdAt, dateFilter)),
  )

  function filterByDate(dateString: string, filter: string) {
    const date = new Date(dateString)
    const now = new Date()

    switch (filter) {
      case "today":
        return date.toDateString() === now.toDateString()
      case "yesterday":
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        return date.toDateString() === yesterday.toDateString()
      case "week":
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        return date >= weekAgo
      case "month":
        const monthAgo = new Date(now)
        monthAgo.setMonth(now.getMonth() - 1)
        return date >= monthAgo
      default:
        return true
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search alert history..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
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
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="false positive">False Positive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alert</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Resolved</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <alert.icon
                      className={`h-4 w-4 ${
                        alert.severity === "critical"
                          ? "text-red-500"
                          : alert.severity === "high"
                            ? "text-orange-500"
                            : alert.severity === "medium"
                              ? "text-amber-500"
                              : "text-blue-500"
                      }`}
                    />
                    {alert.title}
                  </div>
                </TableCell>
                <TableCell>{alert.source}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={severityColors[alert.severity as keyof typeof severityColors]}>
                    {alert.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[alert.status as keyof typeof statusColors]}>
                    {alert.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(alert.createdAt).toLocaleString()}</TableCell>
                <TableCell>{new Date(alert.resolvedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
