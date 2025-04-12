"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Shield, ShieldAlert, Lock, Bell, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { checkAdminPrivileges, requestAdminPrivileges, sendWindowsNotification } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminSettings() {
  const [hasAdminPrivileges, setHasAdminPrivileges] = useState(false)
  const [isCheckingPrivileges, setIsCheckingPrivileges] = useState(false)
  const [enabledFeatures, setEnabledFeatures] = useState({
    realTimeMonitoring: true,
    windowsNotifications: true,
    automaticReporting: true,
  })
  const [reportEmail, setReportEmail] = useState("developer.nandhank@gmail.com")
  const [reportFrequency, setReportFrequency] = useState("10min")
  const { toast } = useToast()

  useEffect(() => {
    const checkPrivileges = async () => {
      setIsCheckingPrivileges(true)
      const hasPrivileges = await checkAdminPrivileges()
      setHasAdminPrivileges(hasPrivileges)
      setIsCheckingPrivileges(false)
    }
    
    checkPrivileges()
  }, [])

  const handleRequestPrivileges = async () => {
    setIsCheckingPrivileges(true)
    const granted = await requestAdminPrivileges()
    
    if (granted) {
      setHasAdminPrivileges(true)
      toast({
        title: "Admin privileges granted",
        description: "You now have administrator privileges for the Windows IDS.",
      })
      sendWindowsNotification("Windows IDS", "Admin privileges have been granted")
    } else {
      toast({
        variant: "destructive",
        title: "Admin privileges denied",
        description: "Unable to obtain administrator privileges. Some features may be limited.",
      })
    }
    
    setIsCheckingPrivileges(false)
  }

  const handleFeatureToggle = (feature: keyof typeof enabledFeatures) => {
    setEnabledFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }))
  }

  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your admin settings have been updated successfully.",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Administrator Privileges</h3>
            <div className="p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hasAdminPrivileges ? (
                  <Shield className="h-6 w-6 text-green-500" />
                ) : (
                  <ShieldAlert className="h-6 w-6 text-amber-500" />
                )}
                <div>
                  <p className="font-medium">
                    {hasAdminPrivileges
                      ? "Administrator privileges are active"
                      : "Administrator privileges required"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasAdminPrivileges
                      ? "Full access to system monitoring and protection features"
                      : "Limited access to system features. Request admin privileges for full functionality."}
                  </p>
                </div>
              </div>
              
              {!hasAdminPrivileges && (
                <Button 
                  onClick={handleRequestPrivileges}
                  disabled={isCheckingPrivileges}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {isCheckingPrivileges ? "Requesting..." : "Request Admin Privileges"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Advanced Features</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="real-time-monitoring">Real-Time Network Monitoring</Label>
                  <p className="text-sm text-muted-foreground">
                    Continuously monitor network traffic and system events in real-time
                  </p>
                </div>
                <Switch 
                  id="real-time-monitoring" 
                  checked={enabledFeatures.realTimeMonitoring} 
                  onCheckedChange={() => handleFeatureToggle('realTimeMonitoring')} 
                  disabled={!hasAdminPrivileges}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="windows-notifications">Windows Security Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show Windows notifications for security alerts and events
                  </p>
                </div>
                <Switch 
                  id="windows-notifications" 
                  checked={enabledFeatures.windowsNotifications}
                  onCheckedChange={() => handleFeatureToggle('windowsNotifications')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="automatic-reporting">Automatic Email Reporting</Label>
                  <p className="text-sm text-muted-foreground">
                    Send regular security reports via ZohoMail
                  </p>
                </div>
                <Switch 
                  id="automatic-reporting" 
                  checked={enabledFeatures.automaticReporting}
                  onCheckedChange={() => handleFeatureToggle('automaticReporting')}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {enabledFeatures.automaticReporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email Reporting Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-email">Report Email</Label>
                  <Input
                    id="report-email"
                    type="email"
                    placeholder="your@email.com"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Email address to receive security reports</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-frequency">Report Frequency</Label>
                  <Select value={reportFrequency} onValueChange={setReportFrequency}>
                    <SelectTrigger id="report-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10min">Every 10 minutes</SelectItem>
                      <SelectItem value="30min">Every 30 minutes</SelectItem>
                      <SelectItem value="1hour">Hourly</SelectItem>
                      <SelectItem value="6hours">Every 6 hours</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={saveSettings}>
                  Save Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 