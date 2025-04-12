"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

export default function AlertSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [desktopNotifications, setDesktopNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [emailAddress, setEmailAddress] = useState("admin@example.com")
  const [phoneNumber, setPhoneNumber] = useState("+1 (555) 123-4567")
  const { toast } = useToast()

  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your alert settings have been updated successfully.",
    })
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notification Settings</TabsTrigger>
          <TabsTrigger value="thresholds">Alert Thresholds</TabsTrigger>
          <TabsTrigger value="rules">Custom Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  {emailNotifications && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="email-address">Email Address</Label>
                      <Input
                        id="email-address"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts via push notifications</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts via desktop notifications</p>
                    </div>
                    <Switch
                      id="desktop-notifications"
                      checked={desktopNotifications}
                      onCheckedChange={setDesktopNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                    </div>
                    <Switch id="sms-notifications" checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                  </div>

                  {smsNotifications && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="phone-number">Phone Number</Label>
                      <Input
                        id="phone-number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="critical-alerts">Critical Alerts</Label>
                      <Select defaultValue="all">
                        <SelectTrigger id="critical-alerts">
                          <SelectValue placeholder="Select notification method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Methods</SelectItem>
                          <SelectItem value="email">Email Only</SelectItem>
                          <SelectItem value="push">Push Only</SelectItem>
                          <SelectItem value="sms">SMS Only</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="high-alerts">High Alerts</Label>
                      <Select defaultValue="all">
                        <SelectTrigger id="high-alerts">
                          <SelectValue placeholder="Select notification method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Methods</SelectItem>
                          <SelectItem value="email">Email Only</SelectItem>
                          <SelectItem value="push">Push Only</SelectItem>
                          <SelectItem value="sms">SMS Only</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medium-alerts">Medium Alerts</Label>
                      <Select defaultValue="email">
                        <SelectTrigger id="medium-alerts">
                          <SelectValue placeholder="Select notification method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Methods</SelectItem>
                          <SelectItem value="email">Email Only</SelectItem>
                          <SelectItem value="push">Push Only</SelectItem>
                          <SelectItem value="sms">SMS Only</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="low-alerts">Low Alerts</Label>
                      <Select defaultValue="none">
                        <SelectTrigger id="low-alerts">
                          <SelectValue placeholder="Select notification method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Methods</SelectItem>
                          <SelectItem value="email">Email Only</SelectItem>
                          <SelectItem value="push">Push Only</SelectItem>
                          <SelectItem value="sms">SMS Only</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alert Thresholds</h3>
                <p className="text-sm text-muted-foreground">
                  Configure when alerts should be triggered based on system metrics
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpu-threshold">CPU Usage Threshold (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input id="cpu-threshold" type="number" defaultValue="90" min="0" max="100" />
                      <Select defaultValue="high">
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memory-threshold">Memory Usage Threshold (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input id="memory-threshold" type="number" defaultValue="85" min="0" max="100" />
                      <Select defaultValue="high">
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disk-threshold">Disk Usage Threshold (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input id="disk-threshold" type="number" defaultValue="90" min="0" max="100" />
                      <Select defaultValue="medium">
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="network-threshold">Network Traffic Threshold (MB/s)</Label>
                    <div className="flex items-center gap-2">
                      <Input id="network-threshold" type="number" defaultValue="100" min="0" />
                      <Select defaultValue="medium">
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-attempts">Failed Login Attempts Threshold</Label>
                    <div className="flex items-center gap-2">
                      <Input id="login-attempts" type="number" defaultValue="5" min="0" />
                      <Select defaultValue="high">
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Custom Alert Rules</h3>
                <p className="text-sm text-muted-foreground">Create custom rules for specific alert conditions</p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rule 1: Suspicious Process Detection</Label>
                    <div className="p-4 border rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Alert when unknown processes access system directories</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="text-xs text-muted-foreground">Severity: High</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rule 2: Unusual Network Connections</Label>
                    <div className="p-4 border rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Alert when connections to known malicious IPs are detected</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="text-xs text-muted-foreground">Severity: Critical</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rule 3: Registry Modifications</Label>
                    <div className="p-4 border rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Alert when critical registry keys are modified</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="text-xs text-muted-foreground">Severity: High</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rule 4: After-Hours Activity</Label>
                    <div className="p-4 border rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Alert when system activity is detected outside business hours</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="text-xs text-muted-foreground">Severity: Medium</div>
                    </div>
                  </div>

                  <Button variant="outline">Add New Rule</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={saveSettings}>Save Settings</Button>
      </div>
    </div>
  )
}
