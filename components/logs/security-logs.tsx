"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ShieldAlert, ShieldCheck, Lock, Unlock, UserCheck, UserX, RefreshCw } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useWebsocket } from "@/hooks/useWebsocket"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Define the security event interface
interface SecurityEvent {
  id: number;
  timestamp: string;
  eventId: number;
  category: string;
  user: string;
  source: string;
  message: string;
  details: string;
  status: string;
}

// Map status to icon
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
      return UserCheck;
    case 'failure':
      return UserX;
    case 'warning':
      return ShieldAlert;
    case 'critical':
      return ShieldAlert;
    case 'error':
      return ShieldAlert;
    case 'info':
      return ShieldCheck;
    default:
      return Lock;
  }
};

const statusColors = {
  success: "bg-green-500/10 text-green-500 border-green-500/20",
  failure: "bg-red-500/10 text-red-500 border-red-500/20",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default function SecurityLogs() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedLog, setExpandedLog] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10;
  
  // Get security events from our WebSocket hook
  const { securityEvents, isConnected, isLoading, refreshData } = useWebsocket();
  
  // Process the events data
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  
  useEffect(() => {
    if (Array.isArray(securityEvents) && securityEvents.length > 0) {
      // Sort events by timestamp (newest first)
      const sortedEvents = [...securityEvents].sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      setEvents(sortedEvents);
    }
  }, [securityEvents]);
  
  // Extract unique categories for the filter
  const uniqueCategories = Array.from(
    new Set(events.map((event) => event.category))
  ).sort();
  
  // Filter the events based on search term and filters
  const filteredEvents = events.filter(
    (event) =>
      (event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.details.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (categoryFilter === "all" || event.category === categoryFilter) &&
      (statusFilter === "all" || event.status.toLowerCase() === statusFilter.toLowerCase())
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
  
  // Toggle expanded view for an event
  const toggleExpand = (id: number) => {
    if (expandedLog === id) {
      setExpandedLog(null)
    } else {
      setExpandedLog(id)
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <Skeleton className="h-10 w-full md:w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="border rounded-md p-4">
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="border p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Show no connection state
  if (!isConnected) {
    return (
      <div className="border rounded-md p-8 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <p className="text-lg font-medium mb-2">Connecting to security monitoring...</p>
        <p className="text-sm text-muted-foreground">Please wait while we establish a connection to the security monitoring service.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search security logs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="failure">Failure</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-2">
            {paginatedEvents.length > 0 ? (
              paginatedEvents.map((event) => {
                const Icon = getStatusIcon(event.status);
                const formattedTime = new Date(event.timestamp).toLocaleString();
                const isExpanded = expandedLog === event.id;
                
                return (
                  <div
                    key={event.id}
                    className={`border p-4 rounded-lg transition-all ${
                      isExpanded ? "bg-muted/50" : ""
                    }`}
                    onClick={() => toggleExpand(event.id)}
                  >
                    <div className="flex items-start justify-between cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-full p-1.5 ${
                            statusColors[event.status as keyof typeof statusColors] || statusColors.info
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{event.message}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.category} • {formattedTime}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          statusColors[event.status as keyof typeof statusColors] || statusColors.info
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 pl-10 border-t pt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium mb-1">User</p>
                            <p className="text-sm text-muted-foreground">{event.user}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Source</p>
                            <p className="text-sm text-muted-foreground">{event.source}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Event ID</p>
                            <p className="text-sm text-muted-foreground">{event.eventId}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Timestamp</p>
                            <p className="text-sm text-muted-foreground">{formattedTime}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-1">Details</p>
                          <p className="text-sm text-muted-foreground">{event.details}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-lg font-medium mb-2">No security events found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your search filters"
                    : "Your system appears to be secure"}
                </p>
                {(searchTerm || categoryFilter !== "all" || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                      setStatusFilter("all");
                    }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(page > 1 ? page - 1 : 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setPage(i + 1)}
                  isActive={page === i + 1}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      <div className="text-sm text-muted-foreground mt-2">
        Showing {paginatedEvents.length} of {filteredEvents.length} events • 
        {events.length > 0 
          ? ` Last event: ${new Date(events[0].timestamp).toLocaleString()}`
          : ' No events recorded'
        }
      </div>
    </div>
  )
}
