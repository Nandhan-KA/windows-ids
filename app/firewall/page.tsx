import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, RefreshCw } from "lucide-react"
import FirewallRules from "@/components/firewall/firewall-rules"
import BlockedIPs from "@/components/firewall/blocked-ips"
import FirewallLogs from "@/components/firewall/firewall-logs"

export default function FirewallPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Firewall</h1>
          <p className="text-muted-foreground">Manage firewall rules and blocked connections</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-xs py-1 px-3 bg-green-500/10 text-green-500 border-green-500/20">
            Firewall Active
          </Badge>
          <Button size="sm" variant="outline" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Firewall Management</span>
          </CardTitle>
          <CardDescription>Configure firewall rules and manage blocked connections</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rules" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
              <TabsTrigger value="rules">Firewall Rules</TabsTrigger>
              <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
              <TabsTrigger value="logs">Firewall Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="rules" className="space-y-4">
              <FirewallRules />
            </TabsContent>
            <TabsContent value="blocked" className="space-y-4">
              <BlockedIPs />
            </TabsContent>
            <TabsContent value="logs" className="space-y-4">
              <FirewallLogs />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
