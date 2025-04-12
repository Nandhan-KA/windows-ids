import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Settings, Save, Shield } from "lucide-react"
import GeneralSettings from "@/components/settings/general-settings"
import SecuritySettings from "@/components/settings/security-settings"
import NotificationSettings from "@/components/settings/notification-settings"
import SystemSettings from "@/components/settings/system-settings"
import AdminSettings from "@/components/settings/admin-settings"

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure system and application settings</p>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <span>System Configuration</span>
          </CardTitle>
          <CardDescription>Manage system settings and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full md:w-[750px]">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="admin" className="bg-amber-500/10 text-amber-600 data-[state=active]:text-amber-700">
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4">
              <GeneralSettings />
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
              <SecuritySettings />
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <NotificationSettings />
            </TabsContent>
            <TabsContent value="system" className="space-y-4">
              <SystemSettings />
            </TabsContent>
            <TabsContent value="admin" className="space-y-4">
              <AdminSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
