import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, RefreshCw } from "lucide-react"
import AlertsList from "@/components/alerts/alerts-list"
import AlertSettings from "@/components/alerts/alert-settings"
import AlertHistory from "@/components/alerts/alert-history"

export default function AlertsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">Security alerts and notifications</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-xs py-1 px-3">
            5 unread alerts
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
            <Bell className="h-5 w-5 text-primary" />
            <span>Alert Management</span>
          </CardTitle>
          <CardDescription>View and manage security alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
              <TabsTrigger value="current">Current Alerts</TabsTrigger>
              <TabsTrigger value="history">Alert History</TabsTrigger>
              <TabsTrigger value="settings">Alert Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="current" className="space-y-4">
              <AlertsList />
            </TabsContent>
            <TabsContent value="history" className="space-y-4">
              <AlertHistory />
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <AlertSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
