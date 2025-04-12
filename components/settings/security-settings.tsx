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

export default function SecuritySettings() {
  const [autoBlock, setAutoBlock] = useState(true)
  const [enableFirewall, setEnableFirewall] = useState(true)
  const [enableIDS, setEnableIDS] = useState(true)
  const [enableHIPS, setEnableHIPS] = useState(true)
  const [scanSchedule, setScanSchedule] = useState("daily")
  const [sensitivityLevel, setSensitivityLevel] = useState([70])
  const { toast } = useToast()

  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your security settings have been updated successfully.",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Protection Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-firewall">Enable Firewall Protection</Label>
                  <p className="text-sm text-muted-foreground">
                    Monitor and control incoming and outgoing network traffic
                  </p>
                </div>
                <Switch id="enable-firewall" checked={enableFirewall} onCheckedChange={setEnableFirewall} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-ids">Enable Intrusion Detection</Label>
                  <p className="text-sm text-muted-foreground">Detect and alert on suspicious network activity</p>
                </div>
                <Switch id="enable-ids" checked={enableIDS} onCheckedChange={setEnableIDS} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-hips">Enable Host Intrusion Prevention</Label>
                  <p className="text-sm text-muted-foreground">Monitor and protect system files and registry</p>
                </div>
                <Switch id="enable-hips" checked={enableHIPS} onCheckedChange={setEnableHIPS} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-block">Automatically Block Threats</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically block detected threats without user confirmation
                  </p>
                </div>
                <Switch id="auto-block" checked={autoBlock} onCheckedChange={setAutoBlock} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Scan Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scan-schedule">Scan Schedule</Label>
                <Select value={scanSchedule} onValueChange={setScanSchedule}>
                  <SelectTrigger id="scan-schedule">
                    <SelectValue placeholder="Select scan schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="manual">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sensitivity-level">Detection Sensitivity</Label>
                  <span className="text-sm text-muted-foreground">{sensitivityLevel[0]}%</span>
                </div>
                <Slider
                  id="sensitivity-level"
                  value={sensitivityLevel}
                  onValueChange={setSensitivityLevel}
                  min={0}
                  max={100}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">Higher sensitivity may result in more false positives</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excluded-paths">Excluded Paths</Label>
                <Input
                  id="excluded-paths"
                  placeholder="C:\Example\Path, D:\Another\Path"
                  defaultValue="C:\Windows\Temp, C:\Users\Administrator\Downloads\Trusted"
                />
                <p className="text-xs text-muted-foreground">Comma-separated list of paths to exclude from scanning</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Firewall Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firewall-mode">Firewall Mode</Label>
                <Select defaultValue="normal">
                  <SelectTrigger id="firewall-mode">
                    <SelectValue placeholder="Select firewall mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="strict">Strict</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trusted-ips">Trusted IP Addresses</Label>
                <Input
                  id="trusted-ips"
                  placeholder="192.168.1.1, 10.0.0.1"
                  defaultValue="192.168.1.1, 192.168.1.100-192.168.1.200"
                />
                <p className="text-xs text-muted-foreground">Comma-separated list of trusted IP addresses or ranges</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blocked-ips">Blocked IP Addresses</Label>
                <Input id="blocked-ips" placeholder="1.2.3.4, 5.6.7.8" defaultValue="45.67.89.123, 98.76.54.32" />
                <p className="text-xs text-muted-foreground">Comma-separated list of blocked IP addresses or ranges</p>
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
