"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Shield, ShieldAlert, ShieldCheck, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { useWebsocket } from "@/hooks/useWebsocket"
import { Skeleton } from "@/components/ui/skeleton"

// Network connection interface
interface NetworkConnection {
  pid?: number;
  process?: string;
  protocol?: string;
  local_ip?: string;
  local_port?: number;
  remote_ip?: string;
  remote_port?: number;
  status?: string;
  local?: string; // Format: "IP:port"
  remote?: string; // Format: "IP:port"
  timestamp?: string;
  ip?: string; // Legacy support for older format
  port?: string | number; // Legacy support for older format
}

export default function ConnectionsList() {
  const { networkConnections, isLoading, isConnected, refreshData } = useWebsocket();
  const [searchTerm, setSearchTerm] = useState("");
  const [formattedConnections, setFormattedConnections] = useState<any[]>([]);
  
  // Process connections from the WebSocket hook
  useEffect(() => {
    if (!networkConnections || !Array.isArray(networkConnections)) {
      setFormattedConnections([]);
      return;
    }
    
    // Format connections to a standard format
    const formatted = networkConnections.map((conn, index) => {
      // Extract local and remote address parts
      let localIP = '';
      let localPort = 0;
      let remoteIP = '';
      let remotePort = 0;
      
      // Handle different connection formats
      if (conn.local_ip && conn.local_port) {
        // New format with separate fields
        localIP = conn.local_ip;
        localPort = conn.local_port;
      } else if (conn.local) {
        // Format with combined "IP:port" string
        const localParts = conn.local.split(':');
        if (localParts.length >= 2) {
          localIP = localParts[0];
          localPort = parseInt(localParts[1], 10);
        }
      }
      
      if (conn.remote_ip && conn.remote_port) {
        remoteIP = conn.remote_ip;
        remotePort = conn.remote_port;
      } else if (conn.remote) {
        const remoteParts = conn.remote.split(':');
        if (remoteParts.length >= 2) {
          remoteIP = remoteParts[0];
          remotePort = parseInt(remoteParts[1], 10);
        }
      } else if (conn.ip) {
        // Legacy format
        remoteIP = conn.ip;
        if (conn.port) {
          remotePort = typeof conn.port === 'string' ? parseInt(conn.port, 10) : conn.port;
        }
      }
      
      // Handle different status naming conventions
      let status = conn.status || 'Unknown';
      if (status === 'ESTABLISHED' || status === 'Established') {
        status = 'Established';
      } else if (status === 'LISTEN' || status === 'Listening') {
        status = 'Listening';
      } else if (status === 'CLOSE_WAIT' || status === 'CLOSING' || status === 'Closed') {
        status = 'Closed';
      } else if (status === 'Suspicious' || status === 'SUSPICIOUS') {
        status = 'Suspicious';
      }
      
      return {
        id: index,
        protocol: conn.protocol || 'Unknown',
        localIP,
        localPort,
        remoteIP,
        remotePort,
        status,
        process: conn.process || '',
        pid: conn.pid || 0,
        timestamp: conn.timestamp
      };
    });
    
    setFormattedConnections(formatted);
  }, [networkConnections]);

  // Apply search filter
  const filteredConnections = formattedConnections.filter(conn => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (conn.remoteIP && conn.remoteIP.includes(searchTerm)) ||
      (conn.localIP && conn.localIP.includes(searchTerm)) ||
      (conn.protocol && conn.protocol.toLowerCase().includes(searchLower)) ||
      (conn.process && conn.process.toLowerCase().includes(searchLower)) ||
      (conn.pid && conn.pid.toString().includes(searchTerm))
    );
  });

  // Show loading state
  if (isLoading || !isConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocol</TableHead>
                <TableHead>Local Address</TableHead>
                <TableHead>Remote Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Process</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            placeholder="Search connections..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" size="sm">
          Block IP
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocol</TableHead>
              <TableHead>Local Address</TableHead>
              <TableHead>Remote Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Process (PID)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConnections.length > 0 ? (
              filteredConnections.map((conn) => (
                <TableRow key={conn.id}>
                  <TableCell>{conn.protocol}</TableCell>
                  <TableCell>{`${conn.localIP}:${conn.localPort}`}</TableCell>
                  <TableCell>{`${conn.remoteIP}:${conn.remotePort}`}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {conn.status === "Suspicious" ? (
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                      ) : conn.status === "Established" ? (
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge
                        variant="outline"
                        className={
                          conn.status === "Suspicious"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : conn.status === "Established"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }
                      >
                        {conn.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{conn.process} {conn.pid ? `(${conn.pid})` : ''}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No network connections found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Showing {filteredConnections.length} of {formattedConnections.length} connections
      </div>
    </div>
  )
}
