"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Info, AlertTriangle, XCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import React from "react"

// Mock data for system logs
const systemLogs = [
  {
    id: 1,
    timestamp: "2023-04-11T14:32:00",
    level: "info",
    source: "System",
    message: "System startup completed successfully",
    details: "Boot time: 15.3 seconds",
  },
  {
    id: 2,
    timestamp: "2023-04-11T14:30:00",
    level: "info",
    source: "Service Manager",
    message: "All services started successfully",
    details: "23 services running",
  },
  {
    id: 3,
    timestamp: "2023-04-11T14:28:00",
    level: "warning",
    source: "Disk Manager",
    message: "Disk C: is running low on space",
    details: "Available space: 5.2 GB (4.8%)",
  },
  {
    id: 4,
    timestamp: "2023-04-11T14:25:00",
    level: "info",
    source: "Windows Update",
    message: "Checking for updates",
    details: "Last update check: 2023-04-10T10:15:00",
  },
  {
    id: 5,
    timestamp: "2023-04-11T14:20:00",
    level: "error",
    source: "Hardware Monitor",
    message: "CPU temperature exceeds threshold",
    details: "Current temperature: 85°C, Threshold: 80°C",
  },
  {
    id: 6,
    timestamp: "2023-04-11T14:15:00",
    level: "info",
    source: "Network Manager",
    message: "Network interface eth0 connected",
    details: "IP: 192.168.1.100, Gateway: 192.168.1.1",
  },
  {
    id: 7,
    timestamp: "2023-04-11T14:10:00",
    level: "warning",
    source: "Memory Manager",
    message: "High memory usage detected",
    details: "Memory usage: 85%, Available: 1.2 GB",
  },
  {
    id: 8,
    timestamp: "2023-04-11T14:05:00",
    level: "info",
    source: "Process Manager",
    message: "Process explorer.exe started",
    details: "PID: 1234, User: Administrator",
  },
  {
    id: 9,
    timestamp: "2023-04-11T14:00:00",
    level: "error",
    source: "Device Manager",
    message: "Failed to initialize device USB\\VID_1234&PID_5678",
    details: "Error code: 0x8007001F",
  },
  {
    id: 10,
    timestamp: "2023-04-11T13:55:00",
    level: "info",
    source: "User Manager",
    message: "User Administrator logged in",
    details: "Login method: Password",
  },
  {
    id: 11,
    timestamp: "2023-04-11T13:50:00",
    level: "warning",
    source: "Power Manager",
    message: "System running on battery power",
    details: "Battery level: 45%, Estimated time remaining: 1:30",
  },
  {
    id: 12,
    timestamp: "2023-04-11T13:45:00",
    level: "info",
    source: "Time Service",
    message: "System time synchronized with time.windows.com",
    details: "Offset: +0.5s",
  },
  {
    id: 13,
    timestamp: "2023-04-11T13:40:00",
    level: "error",
    source: "File System",
    message: "Failed to access file C:\\Windows\\System32\\config\\system",
    details: "Access denied. Error code: 0x80070005",
  },
  {
    id: 14,
    timestamp: "2023-04-11T13:35:00",
    level: "info",
    source: "Firewall",
    message: "Firewall rules updated",
    details: "Added 2 new rules, Modified 1 rule",
  },
  {
    id: 15,
    timestamp: "2023-04-11T13:30:00",
    level: "warning",
    source: "Driver Manager",
    message: "Driver for device PCI\\VEN_8086&DEV_1234 is outdated",
    details: "Current version: 10.0.19041.1, Latest version: 10.0.19041.2",
  },
]

const levelColors = {
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
}

const levelIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
}

export default function SystemLogs() {
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [expandedLog, setExpandedLog] = useState<number | null>(null)

  const filteredLogs = systemLogs.filter(
    (log) =>
      (log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (levelFilter === "all" || log.level === levelFilter) &&
      (sourceFilter === "all" || log.source === sourceFilter),
  )

  const uniqueSources = Array.from(new Set(systemLogs.map((log) => log.source)))

  const toggleExpand = (id: number) => {
    if (expandedLog === id) {
      setExpandedLog(null)
    } else {
      setExpandedLog(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search logs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {uniqueSources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[100px]">Level</TableHead>
                <TableHead className="w-[150px]">Source</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow className="cursor-pointer" onClick={() => toggleExpand(log.id)}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const Icon = levelIcons[log.level as keyof typeof levelIcons]
                          return (
                            <Icon
                              className={`h-4 w-4 ${
                                log.level === "error"
                                  ? "text-red-500"
                                  : log.level === "warning"
                                    ? "text-amber-500"
                                    : "text-blue-500"
                              }`}
                            />
                          )
                        })()}
                        <Badge variant="outline" className={levelColors[log.level as keyof typeof levelColors]}>
                          {log.level}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{log.source}</TableCell>
                    <TableCell>{log.message}</TableCell>
                  </TableRow>
                  {expandedLog === log.id && (
                    <TableRow>
                      <TableCell colSpan={4} className="bg-muted/30">
                        <div className="p-2">
                          <div className="font-medium">Details:</div>
                          <div className="text-sm text-muted-foreground">{log.details}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
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
