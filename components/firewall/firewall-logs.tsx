"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCcw, FileX, ShieldOff, ArrowDownUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface FirewallLog {
  id: string;
  timestamp: string;
  action: 'block' | 'allow' | 'drop';
  source_ip: string;
  destination_ip: string;
  protocol: string;
  port: number;
  rule: string;
}

export default function FirewallLogs() {
  const [logs, setLogs] = useState<FirewallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Simulated data - in a real scenario, this would be a fetch from your API
      const response = await new Promise<FirewallLog[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: "fw-1",
              timestamp: new Date().toISOString(),
              action: "block",
              source_ip: "192.168.1.123",
              destination_ip: "10.0.0.15",
              protocol: "TCP",
              port: 22,
              rule: "Block SSH"
            },
            {
              id: "fw-2",
              timestamp: new Date(Date.now() - 1800000).toISOString(),
              action: "allow",
              source_ip: "10.0.0.45",
              destination_ip: "172.16.254.1",
              protocol: "UDP",
              port: 53,
              rule: "Allow DNS"
            },
            {
              id: "fw-3",
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              action: "drop",
              source_ip: "172.16.254.1",
              destination_ip: "192.168.1.1",
              protocol: "TCP",
              port: 80,
              rule: "Default policy"
            },
            {
              id: "fw-4",
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              action: "block",
              source_ip: "203.0.113.42",
              destination_ip: "192.168.1.5",
              protocol: "TCP",
              port: 3389,
              rule: "Block RDP"
            }
          ]);
        }, 500);
      });
      
      setLogs(response);
    } catch (error) {
      console.error("Failed to fetch firewall logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'block':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <ShieldOff className="h-3 w-3" /> Block
        </Badge>;
      case 'allow':
        return <Badge variant="outline" className="text-green-500 flex items-center gap-1">
          <ArrowDownUp className="h-3 w-3" /> Allow
        </Badge>;
      case 'drop':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <FileX className="h-3 w-3" /> Drop
        </Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Firewall Logs</CardTitle>
          <CardDescription>Recent firewall activity</CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchLogs}
          disabled={isLoading}
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No firewall logs found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Protocol/Port</TableHead>
                <TableHead>Rule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell className="font-mono text-xs">{log.source_ip}</TableCell>
                  <TableCell className="font-mono text-xs">{log.destination_ip}</TableCell>
                  <TableCell>{log.protocol}/{log.port}</TableCell>
                  <TableCell className="max-w-[150px] truncate" title={log.rule}>{log.rule}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
} 