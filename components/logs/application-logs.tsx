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

// Mock data for application logs
const applicationLogs = [
  {
    id: 1,
    timestamp: "2023-04-11T14:32:00",
    level: "info",
    application: "Windows Defender",
    message: "Scan completed successfully",
    details: "Scanned 123,456 files. No threats found.",
  },
  {
    id: 2,
    timestamp: "2023-04-11T14:30:00",
    level: "info",
    application: "Microsoft Office",
    message: "Application started",
    details: "Microsoft Word started by user Administrator",
  },
  {
    id: 3,
    timestamp: "2023-04-11T14:28:00",
    level: "warning",
    application: "Chrome Browser",
    message: "Certificate error",
    details: "The server certificate for https://example.com is not trusted",
  },
  {
    id: 4,
    timestamp: "2023-04-11T14:25:00",
    level: "info",
    application: "Windows Update",
    message: "Updates available",
    details: "5 updates available for installation",
  },
  {
    id: 5,
    timestamp: "2023-04-11T14:20:00",
    level: "error",
    application: "SQL Server",
    message: "Database connection failed",
    details: "Could not connect to database 'MainDB'. Error: Connection timeout",
  },
  {
    id: 6,
    timestamp: "2023-04-11T14:15:00",
    level: "info",
    application: "IIS",
    message: "Service started",
    details: "World Wide Web Publishing Service started successfully",
  },
  {
    id: 7,
    timestamp: "2023-04-11T14:10:00",
    level: "warning",
    application: "Firefox Browser",
    message: "Add-on compatibility issue",
    details: "Add-on 'Example Extension' may not be compatible with this version of Firefox",
  },
  {
    id: 8,
    timestamp: "2023-04-11T14:05:00",
    level: "info",
    application: "Visual Studio",
    message: "Build succeeded",
    details: "Project 'ExampleProject' built successfully. 0 errors, 2 warnings",
  },
  {
    id: 9,
    timestamp: "2023-04-11T14:00:00",
    level: "error",
    application: "Outlook",
    message: "Failed to send email",
    details: "Could not send email to recipient@example.com. SMTP error: Connection refused",
  },
  {
    id: 10,
    timestamp: "2023-04-11T13:55:00",
    level: "info",
    application: "Windows Firewall",
    message: "Rule added",
    details: "New inbound rule added for application C:\\Program Files\\Example\\example.exe",
  },
  {
    id: 11,
    timestamp: "2023-04-11T13:50:00",
    level: "warning",
    application: "Adobe Reader",
    message: "Update available",
    details: "A new version of Adobe Reader is available (23.001.20143)",
  },
  {
    id: 12,
    timestamp: "2023-04-11T13:45:00",
    level: "info",
    application: "Task Scheduler",
    message: "Task completed",
    details: "Scheduled task 'System Maintenance' completed successfully",
  },
  {
    id: 13,
    timestamp: "2023-04-11T13:40:00",
    level: "error",
    application: "Windows Media Player",
    message: "Failed to play media",
    details: "Could not play file 'C:\\Users\\Administrator\\Music\\example.mp3'. Codec not found",
  },
  {
    id: 14,
    timestamp: "2023-04-11T13:35:00",
    level: "info",
    application: "Print Spooler",
    message: "Print job completed",
    details: "Print job 'Document1.docx' completed successfully",
  },
  {
    id: 15,
    timestamp: "2023-04-11T13:30:00",
    level: "warning",
    application: "Windows Defender",
    message: "Potentially unwanted application detected",
    details: "PUA:Win32/ToolbarApp detected in file C:\\Downloads\\installer.exe",
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

export default function ApplicationLogs() {
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [applicationFilter, setApplicationFilter] = useState("all")
  const [expandedLog, setExpandedLog] = useState<number | null>(null)

  const filteredLogs = applicationLogs.filter(
    (log) =>
      (log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.application.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (levelFilter === "all" || log.level === levelFilter) &&
      (applicationFilter === "all" || log.application === applicationFilter),
  )

  const uniqueApplications = Array.from(new Set(applicationLogs.map((log) => log.application)))

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
            placeholder="Search application logs..."
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
          <Select value={applicationFilter} onValueChange={setApplicationFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Application" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              {uniqueApplications.map((app) => (
                <SelectItem key={app} value={app}>
                  {app}
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
                <TableHead className="w-[150px]">Application</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <>
                  <TableRow key={log.id} className="cursor-pointer" onClick={() => toggleExpand(log.id)}>
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
                    <TableCell>{log.application}</TableCell>
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
                </>
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
