"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { useWebsocket } from "@/hooks/useWebsocket"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

// Define interfaces
interface ChartItem {
  name: string;
  value: number;
  color: string;
}

interface TrendItem {
  date: string;
  malware: number;
  bruteforce: number;
  phishing: number;
  other: number;
}

interface SecurityEvent {
  type: string;
  timestamp: string;
  severity?: string;
  status?: string;
  threat_type?: string;
}

export default function ThreatAnalysis() {
  const [threatsBySeverity, setThreatsBySeverity] = useState<ChartItem[]>([
    { name: "Critical", value: 0, color: "#ef4444" },
    { name: "High", value: 0, color: "#f97316" },
    { name: "Medium", value: 0, color: "#f59e0b" },
    { name: "Low", value: 0, color: "#3b82f6" },
  ])
  
  const [threatsByType, setThreatsByType] = useState<ChartItem[]>([
    { name: "Malware", value: 0, color: "#8b5cf6" },
    { name: "Brute Force", value: 0, color: "#ec4899" },
    { name: "Phishing", value: 0, color: "#06b6d4" },
    { name: "Data Exfiltration", value: 0, color: "#10b981" },
    { name: "Reconnaissance", value: 0, color: "#f97316" },
    { name: "Persistence", value: 0, color: "#6366f1" },
    { name: "Other", value: 0, color: "#94a3b8" },
  ])
  
  const [threatTrends, setThreatTrends] = useState<TrendItem[]>([])
  const [totalThreats, setTotalThreats] = useState(0)
  const [blockedThreats, setBlockedThreats] = useState(0)
  const [activeThreats, setActiveThreats] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  const { 
    isConnected, 
    securityEvents,
    refreshData
  } = useWebsocket();

  // Process security events to update threat metrics
  useEffect(() => {
    if (!securityEvents || !isConnected) return;
    
    // Only consider events from the last 30 days
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    // Filter threats from the last 30 days
    const recentThreats = securityEvents.filter((event: SecurityEvent) => 
      event.type === 'threat' && new Date(event.timestamp) >= last30Days
    );
    
    // Count total threats
    setTotalThreats(recentThreats.length);
    
    // Count blocked vs active threats
    const blocked = recentThreats.filter((event: SecurityEvent) => 
      event.status === 'blocked' || event.status === 'resolved'
    ).length;
    setBlockedThreats(blocked);
    setActiveThreats(recentThreats.length - blocked);
    
    // Count threats by severity
    const severityCounts: Record<string, number> = {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0
    };
    
    recentThreats.forEach((threat: SecurityEvent) => {
      const severity = threat.severity?.toLowerCase() || "medium";
      if (severity in severityCounts) {
        severityCounts[severity]++;
      } else {
        severityCounts["medium"]++;
      }
    });
    
    // Update severity chart data
    setThreatsBySeverity([
      { name: "Critical", value: severityCounts["critical"], color: "#ef4444" },
      { name: "High", value: severityCounts["high"], color: "#f97316" },
      { name: "Medium", value: severityCounts["medium"], color: "#f59e0b" },
      { name: "Low", value: severityCounts["low"], color: "#3b82f6" },
    ]);
    
    // Count threats by type
    const typeCounts: Record<string, number> = {
      "Malware": 0,
      "Brute Force": 0,
      "Phishing": 0,
      "Data Exfiltration": 0,
      "Reconnaissance": 0,
      "Persistence": 0,
      "Other": 0
    };
    
    recentThreats.forEach((threat: SecurityEvent) => {
      const type = threat.threat_type || "Other";
      if (type in typeCounts) {
        typeCounts[type]++;
      } else {
        typeCounts["Other"]++;
      }
    });
    
    // Update type chart data
    setThreatsByType([
      { name: "Malware", value: typeCounts["Malware"], color: "#8b5cf6" },
      { name: "Brute Force", value: typeCounts["Brute Force"], color: "#ec4899" },
      { name: "Phishing", value: typeCounts["Phishing"], color: "#06b6d4" },
      { name: "Data Exfiltration", value: typeCounts["Data Exfiltration"], color: "#10b981" },
      { name: "Reconnaissance", value: typeCounts["Reconnaissance"], color: "#f97316" },
      { name: "Persistence", value: typeCounts["Persistence"], color: "#6366f1" },
      { name: "Other", value: typeCounts["Other"], color: "#94a3b8" },
    ]);
    
    // Generate trend data for last 7 days
    const trends: TrendItem[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Format date as "Apr 11" etc.
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Find threats for this day
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayThreats = recentThreats.filter((threat: SecurityEvent) => {
        const threatDate = new Date(threat.timestamp);
        return threatDate >= dayStart && threatDate <= dayEnd;
      });
      
      // Count by type
      const dayMalware = dayThreats.filter((t: SecurityEvent) => t.threat_type === "Malware").length;
      const dayBruteForce = dayThreats.filter((t: SecurityEvent) => t.threat_type === "Brute Force").length;
      const dayPhishing = dayThreats.filter((t: SecurityEvent) => t.threat_type === "Phishing").length;
      const dayOther = dayThreats.length - dayMalware - dayBruteForce - dayPhishing;
      
      trends.push({
        date: dateStr,
        malware: dayMalware,
        bruteforce: dayBruteForce,
        phishing: dayPhishing,
        other: dayOther
      });
    }
    
    setThreatTrends(trends);
    setIsLoading(false);
  }, [securityEvents, isConnected]);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsLoading(true);
    refreshData();
    // The useEffect will update the data when securityEvents changes
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">Threats by Severity</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={threatsBySeverity.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {threatsBySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">Threats by Type</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={threatsByType.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {threatsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Threat Trends (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={threatTrends}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
                <Bar dataKey="malware" stackId="a" fill="#8b5cf6" name="Malware" />
                <Bar dataKey="bruteforce" stackId="a" fill="#ec4899" name="Brute Force" />
                <Bar dataKey="phishing" stackId="a" fill="#06b6d4" name="Phishing" />
                <Bar dataKey="other" stackId="a" fill="#94a3b8" name="Other" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Total Threats</h3>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {totalThreats}
              </Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Last 30 days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Blocked Threats</h3>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {blockedThreats}
              </Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {totalThreats > 0 ? `${Math.round((blockedThreats / totalThreats) * 100)}% success rate` : 'No threats detected'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Active Threats</h3>
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                {activeThreats}
              </Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Requiring attention</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
