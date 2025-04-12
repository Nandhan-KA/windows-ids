import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, RefreshCw, Download } from "lucide-react"
import SystemLogs from "@/components/logs/system-logs"
import SecurityLogs from "@/components/logs/security-logs"
import ApplicationLogs from "@/components/logs/application-logs"

export default function LogsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground">View and analyze system and security logs</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-xs py-1 px-3">
            Last updated: 2 minutes ago
          </Badge>
          <Button size="sm" variant="outline" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button size="sm" variant="outline" className="gap-1">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Log Management</span>
          </CardTitle>
          <CardDescription>View and analyze system, security, and application logs</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="system" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
              <TabsTrigger value="system">System Logs</TabsTrigger>
              <TabsTrigger value="security">Security Logs</TabsTrigger>
              <TabsTrigger value="application">Application Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="system" className="space-y-4">
              <SystemLogs />
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
              <SecurityLogs />
            </TabsContent>
            <TabsContent value="application" className="space-y-4">
              <ApplicationLogs />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
