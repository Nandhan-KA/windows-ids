"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCcw, Shield, ShieldAlert, ShieldCheck, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface BlockedIP {
  ip: string;
  reason: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  source: string;
}

export default function BlockedIPs() {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchBlockedIPs = async () => {
    setIsLoading(true);
    try {
      // Simulated data - in a real scenario, this would be a fetch from your API
      const response = await new Promise<BlockedIP[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              ip: "192.168.1.123",
              reason: "Multiple failed login attempts",
              timestamp: new Date().toISOString(),
              severity: "high",
              source: "Authentication"
            },
            {
              ip: "10.0.0.45",
              reason: "Port scanning detected",
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              severity: "medium",
              source: "Network Scanner"
            },
            {
              ip: "172.16.254.1",
              reason: "Suspicious outbound connections",
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              severity: "low",
              source: "Traffic Analysis"
            }
          ]);
        }, 500);
      });
      
      setBlockedIPs(response);
    } catch (error) {
      console.error("Failed to fetch blocked IPs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch blocked IPs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedIPs();
  }, []);

  const handleUnblock = (ip: string) => {
    // Would typically call an API to unblock the IP
    setBlockedIPs(blockedIPs.filter(item => item.ip !== ip));
    toast({
      title: "IP Unblocked",
      description: `${ip} has been removed from the blocklist`,
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Shield className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-amber-500">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-green-500">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Blocked IPs</CardTitle>
          <CardDescription>Currently blocked IP addresses</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={fetchBlockedIPs}
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
          </div>
        ) : blockedIPs.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No blocked IPs found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>When</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blockedIPs.map((item) => (
                <TableRow key={item.ip}>
                  <TableCell className="font-medium">{item.ip}</TableCell>
                  <TableCell className="max-w-[180px] truncate" title={item.reason}>
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(item.severity)}
                      <span>{item.reason}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getSeverityBadge(item.severity)}</TableCell>
                  <TableCell>
                    {new Date(item.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleUnblock(item.ip)}
                      title="Unblock IP"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
} 