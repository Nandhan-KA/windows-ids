"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Send, History, Shield, RefreshCcw, Check, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getNetworkConnections, getSecurityEvents, sendEmailReport } from "@/lib/utils"
import { format } from "date-fns"

export default function ReportingPage() {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [lastReportTime, setLastReportTime] = useState<Date | null>(null)
  const [isAutoReportEnabled, setIsAutoReportEnabled] = useState(true)
  const [reportInterval, setReportInterval] = useState(10) // minutes
  const [recipientEmail, setRecipientEmail] = useState("developer.nandhank@gmail.com")
  const [reportHistory, setReportHistory] = useState<{ date: Date; type: string; status: string }[]>([])
  const { toast } = useToast()

  // Initialize with mock report history
  useEffect(() => {
    setReportHistory([
      { date: new Date(Date.now() - 60 * 60 * 1000), type: "Scheduled", status: "success" },
      { date: new Date(Date.now() - 2 * 60 * 60 * 1000), type: "Manual", status: "success" },
      { date: new Date(Date.now() - 6 * 60 * 60 * 1000), type: "Scheduled", status: "failure" },
    ])
  }, [])

  // Automatic reporting setup
  useEffect(() => {
    if (!isAutoReportEnabled) return
    
    // Set up automatic reporting interval
    const intervalId = setInterval(() => {
      generateAndSendReport("Scheduled")
    }, reportInterval * 60 * 1000) // Convert minutes to milliseconds
    
    return () => clearInterval(intervalId)
  }, [isAutoReportEnabled, reportInterval])

  const generateAndSendReport = async (reportType: string) => {
    if (isGeneratingReport) return
    
    setIsGeneratingReport(true)
    
    try {
      // Show generating toast
      toast({
        title: "Generating report",
        description: "Gathering security data and preparing report...",
      })
      
      // Get data for the report
      const connections = await getNetworkConnections()
      const securityEvents = await getSecurityEvents()
      
      // Generate report content
      const reportDate = new Date()
      const reportContent = `
        WINDOWS IDS SECURITY REPORT
        Generated: ${reportDate.toLocaleString()}
        Type: ${reportType}
        
        ===== NETWORK CONNECTIONS =====
        ${connections.length > 0 
          ? connections.map(conn => `${conn.ip}:${conn.port} (${conn.protocol}) - ${conn.status}`).join('\n')
          : "No active network connections detected"
        }
        
        ===== SECURITY EVENTS =====
        ${securityEvents.length > 0 
          ? securityEvents.map(event => `[${event.timestamp}] ${event.category}: ${event.message} (${event.status})`).join('\n')
          : "No security events recorded"
        }
      `
      
      // Show sending toast
      toast({
        title: "Sending report",
        description: `Sending to ${recipientEmail || "developer.nandhank@gmail.com"}...`,
      })
      
      // Send report via email
      const emailSent = await sendEmailReport(
        recipientEmail || "developer.nandhank@gmail.com",
        `Windows IDS Security Report - ${reportDate.toLocaleString()}`,
        reportContent
      )
      
      if (emailSent) {
        // Update report history
        setReportHistory(prev => [
          { date: new Date(), type: reportType, status: "success" },
          ...prev
        ])
        
        setLastReportTime(new Date())
        
        toast({
          title: "Report sent successfully",
          description: `Security report has been emailed to ${recipientEmail || "developer.nandhank@gmail.com"}`,
        })
      } else {
        throw new Error("Failed to send email")
      }
    } catch (error) {
      console.error("Error generating/sending report:", error)
      
      // Update report history
      setReportHistory(prev => [
        { date: new Date(), type: reportType, status: "failure" },
        ...prev
      ])
      
      toast({
        variant: "destructive",
        title: "Report failed",
        description: "There was an error generating or sending the report. Check console for details.",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleGenerateReport = () => {
    generateAndSendReport("Manual")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Security reports and monitoring data</p>
        </div>
        <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
          {isGeneratingReport ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <span>Report Settings</span>
          </CardTitle>
          <CardDescription>Configure automatic reporting options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-reports">Automatic Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Send security reports automatically via email
                </p>
              </div>
              <Switch
                id="auto-reports"
                checked={isAutoReportEnabled}
                onCheckedChange={setIsAutoReportEnabled}
              />
            </div>

            {isAutoReportEnabled && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="report-email">Report Recipient</Label>
                  <Input
                    id="report-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-interval">Report Interval</Label>
                  <Select
                    value={reportInterval.toString()}
                    onValueChange={(value) => setReportInterval(parseInt(value))}
                  >
                    <SelectTrigger id="report-interval">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Every 10 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="360">Every 6 hours</SelectItem>
                      <SelectItem value="1440">Every day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-muted p-4 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Report Status</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p>
                      {lastReportTime ? (
                        <>Last report sent: {lastReportTime.toLocaleString()}</>
                      ) : (
                        <>No reports sent yet</>
                      )}
                    </p>
                    <p>
                      {isAutoReportEnabled ? (
                        <>Next report will be sent in approximately {reportInterval} minutes</>
                      ) : (
                        <>Automatic reporting is disabled</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <span>Report History</span>
          </CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportHistory.length > 0 ? (
              reportHistory.map((report, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {report.status === "success" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{format(report.date, "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Type: {report.type}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Report
                  </Button>
                </div>
              ))
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 