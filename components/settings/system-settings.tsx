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

export default function SystemSettings() {
  const [enableLogging, setEnableLogging] = useState(true)
  const [enableRemoteAccess, setEnableRemoteAccess] = useState(false)
  const [enableAutoUpdate, setEnableAutoUpdate] = useState(true)
  const [logRetention, setLogRetention] = useState("30")
  const [cpuUsageLimit, setCpuUsageLimit] = useState([30])
  const { toast } = useToast()

  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your system settings have been updated successfully.",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">System Behavior</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-logging">Enable System Logging</Label>
                  <p className="text-sm text-muted-foreground">Record detailed system logs for analysis</p>
                </div>
                <Switch id="enable-logging" checked={enableLogging} onCheckedChange={setEnableLogging} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-remote-access">Enable Remote Access</Label>
                  <p className="text-sm text-muted-foreground">Allow remote management of the system</p>
                </div>
                <Switch
                  id="enable-remote-access"
                  checked={enableRemoteAccess}
                  onCheckedChange={setEnableRemoteAccess}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-auto-update">Enable Automatic Updates</Label>
                  <p className="text-sm text-muted-foreground">Automatically download and install updates</p>
                </div>
                <Switch id="enable-auto-update" checked={enableAutoUpdate} onCheckedChange={setEnableAutoUpdate} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Resource Management</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cpu-usage-limit">CPU Usage Limit</Label>
                  <span className="text-sm text-muted-foreground">{cpuUsageLimit[0]}%</span>
                </div>
                <Slider
                  id="cpu-usage-limit"
                  value={cpuUsageLimit}
                  onValueChange={setCpuUsageLimit}
                  min={10}
                  max={90}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum CPU usage for background scanning and monitoring
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scan-priority">Scan Process Priority</Label>
                <Select defaultValue="normal">
                  <SelectTrigger id="scan-priority">
                    <SelectValue placeholder="Select process priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="belownormal">Below Normal</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="abovenormal">Above Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Data Management</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="log-retention">Log Retention Period (days)</Label>
                <Select value={logRetention} onValueChange={setLogRetention}>
                  <SelectTrigger id="log-retention">
                    <SelectValue placeholder="Select retention period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">365 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-location">Backup Location</Label>
                <Input
                  id="backup-location"
                  placeholder="C:\Backups"
                  defaultValue="C:\Program Files\Windows IDS\Backups"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-schedule">Backup Schedule</Label>
                <Select defaultValue="weekly">
                  <SelectTrigger id="backup-schedule">
                    <SelectValue placeholder="Select backup schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="manual">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
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
