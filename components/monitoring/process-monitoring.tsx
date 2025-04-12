"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useWebsocket } from "@/hooks/useWebsocket"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ProcessMonitoring() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const { isConnected, processes } = useWebsocket()

  // Use effect to check data and set loading state
  useEffect(() => {
    // If we've received process data, stop loading
    if (Array.isArray(processes) && processes.length > 0) {
      setLoading(false);
    }
    
    // Set a timeout to avoid indefinite loading
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [processes, loading]);

  // Filter processes based on search term
  const filteredProcesses = Array.isArray(processes) 
    ? processes.filter(process => 
        process && process.name && process.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Display loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search processes..."
              className="pl-8"
              disabled
            />
          </div>
          <Button variant="outline" size="sm" disabled>
            End Process
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PID</TableHead>
                <TableHead>Process Name</TableHead>
                <TableHead>CPU %</TableHead>
                <TableHead>Memory (MB)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Display connection error state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md bg-muted/30">
        <p className="text-muted-foreground">Connecting to backend...</p>
      </div>
    );
  }

  // Display empty state if no processes
  if (!Array.isArray(processes) || processes.length === 0) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search processes..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" disabled>
            End Process
          </Button>
        </div>
        
        <div className="flex items-center justify-center h-64 border rounded-md bg-muted/30">
          <p className="text-muted-foreground">No process data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search processes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          End Process
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PID</TableHead>
              <TableHead>Process Name</TableHead>
              <TableHead>CPU %</TableHead>
              <TableHead>Memory (MB)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProcesses.length > 0 ? (
              filteredProcesses.map((process) => (
                <TableRow key={process.pid}>
                  <TableCell>{process.pid}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {process.status === "Suspicious" && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {process.name}
                  </TableCell>
                  <TableCell>{process.cpu?.toFixed(1) || '0.0'}%</TableCell>
                  <TableCell>{process.memory?.toFixed(1) || '0.0'} MB</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        process.status === "Suspicious"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-green-500/10 text-green-500 border-green-500/20"
                      }
                    >
                      {process.status || "Running"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No processes found matching '{searchTerm}'
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
