"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useThemeSettings } from "@/hooks/use-theme-settings"

export default function GeneralSettings() {
  const [autoStart, setAutoStart] = useState(true)
  const [minimizeToTray, setMinimizeToTray] = useState(true)
  const [showNotifications, setShowNotifications] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState([30])
  const [language, setLanguage] = useState("en")
  const { theme, setTheme, mounted } = useThemeSettings()
  const { toast } = useToast()
  
  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your general settings have been updated successfully.",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Application Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-start">Start on System Boot</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start the application when Windows starts
                  </p>
                </div>
                <Switch id="auto-start" checked={autoStart} onCheckedChange={setAutoStart} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="minimize-to-tray">Minimize to System Tray</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep the application running in the system tray when minimized
                  </p>
                </div>
                <Switch id="minimize-to-tray" checked={minimizeToTray} onCheckedChange={setMinimizeToTray} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-notifications">Show Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">Display notifications for important events</p>
                </div>
                <Switch id="show-notifications" checked={showNotifications} onCheckedChange={setShowNotifications} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={mounted ? theme : "system"} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="refresh-interval">Data Refresh Interval (seconds)</Label>
                  <span className="text-sm text-muted-foreground">{refreshInterval[0]}s</span>
                </div>
                <Slider
                  id="refresh-interval"
                  value={refreshInterval}
                  onValueChange={setRefreshInterval}
                  min={5}
                  max={60}
                  step={5}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">User Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Administrator Email</Label>
                <Input id="admin-email" type="email" placeholder="admin@example.com" defaultValue="admin@example.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization Name</Label>
                <Input id="organization" placeholder="Your Organization" defaultValue="Acme Corporation" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={saveSettings}>Save Settings</Button>
      </div>
    </div>
  )
}
