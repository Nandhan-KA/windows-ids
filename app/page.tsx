import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowUpRight, FileText, Mail, Shield, ShieldAlert, ShieldCheck, Swords } from "lucide-react"
import Link from "next/link"
import SystemOverview from "@/components/dashboard/system-overview"
import RecentAlerts from "@/components/dashboard/recent-alerts"
import ThreatMap from "@/components/dashboard/threat-map"
import NetworkActivity from "@/components/dashboard/network-activity"
import ReportGenerator from "@/components/dashboard/report-generator"

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">System overview and security status</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-xs py-1 px-3">
            Last scan: 2 minutes ago
          </Badge>
          <Button size="sm">Run Full Scan</Button>
          <ReportGenerator />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">Protected</p>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">In the last 24 hours</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/threats">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Network Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">1.2K</p>
                  <p className="text-xs text-muted-foreground">Connections monitored</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/network">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert variant="destructive" className="border-red-600/20 bg-red-600/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Critical Alert</AlertTitle>
        <AlertDescription>
          Suspicious login attempt detected from IP 192.168.1.45 (3 failed attempts)
          <Button variant="link" className="h-auto p-0 ml-2" asChild>
            <Link href="/alerts">View details</Link>
          </Button>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
          <TabsTrigger value="network">Network Activity</TabsTrigger>
          <TabsTrigger value="threats">Threat Map</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <SystemOverview />
        </TabsContent>
        <TabsContent value="alerts" className="space-y-4">
          <RecentAlerts />
        </TabsContent>
        <TabsContent value="network" className="space-y-4">
          <NetworkActivity />
        </TabsContent>
        <TabsContent value="threats" className="space-y-4">
          <ThreatMap />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common security tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Run Scan</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>View Alerts</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" asChild>
              <Link href="/attack-simulation">
                <Swords className="h-5 w-5" />
                <span>Attack Simulation</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Generate Report</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Resource utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>CPU Usage</span>
                <span className="font-medium">32%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "32%" }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Memory Usage</span>
                <span className="font-medium">64%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "64%" }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Disk Usage</span>
                <span className="font-medium">47%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "47%" }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
