"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Mail, Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { PDFGenerator } from '@/lib/pdf-generator'
import { useWebsocket } from '@/hooks/useWebsocket'

const ReportGenerator = () => {
  const [email, setEmail] = useState('')
  const [timeRange, setTimeRange] = useState('24h')
  const [reportType, setReportType] = useState('full')
  const [sendToMobile, setSendToMobile] = useState(true)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  
  // Get data from websocket
  const { 
    securityEvents,
    networkConnections,
    systemMetrics
  } = useWebsocket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get events from local storage to ensure we have simulation data
      let allEvents = [...(securityEvents || [])];
      
      try {
        const storedAttacks = localStorage.getItem('simulatedAttacks');
        if (storedAttacks) {
          const simulatedEvents = JSON.parse(storedAttacks);
          allEvents = [...allEvents, ...simulatedEvents];
        }
      } catch (error) {
        console.error('Error loading simulated attacks:', error);
      }
      
      // Filter events by time range
      let timeRangeMs: number;
      switch (timeRange) {
        case '7d': timeRangeMs = 7 * 24 * 60 * 60 * 1000; break;
        case '30d': timeRangeMs = 30 * 24 * 60 * 60 * 1000; break;
        default: timeRangeMs = 24 * 60 * 60 * 1000; // 24h
      }
      
      const cutoffDate = new Date(Date.now() - timeRangeMs);
      const filteredEvents = allEvents.filter(event => new Date(event.timestamp) > cutoffDate);
      
      // Generate descriptive report title
      const reportTitle = `Windows IDS Security Report - ${timeRange === '24h' ? 'Last 24 Hours' : 
                            timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}`;
      
      // Generate PDF
      try {
        const pdfGenerator = new PDFGenerator();
        const reportBlob = pdfGenerator.generateReport({
          title: reportTitle,
          timeRange: timeRange === '24h' ? '24 Hours' : timeRange === '7d' ? '7 Days' : '30 Days',
          reportType,
          userEmail: email,
          events: filteredEvents,
          metrics: systemMetrics,
          connections: networkConnections
        });
        
        // Create download link
        const url = URL.createObjectURL(reportBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `security_report_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        
        toast({
          title: "Report Generated",
          description: `Security report has been generated and downloaded.`,
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate PDF report');
      }
      
      // If send by email is enabled, use the API to send the report
      if (email) {
        const generateResponse = await fetch('/api/generate-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            type: reportType,
            timeRange,
          }),
        });

        const generateData = await generateResponse.json();

        if (!generateResponse.ok) {
          throw new Error(generateData.error || 'Failed to generate report');
        }
        
        toast({
          title: "Report Sent",
          description: `The report has also been sent to ${email}.`,
        });
      }

      setLoading(false);
      setOpen(false);
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate report: ${error.message || 'Unknown error'}`,
      });
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          <span>Generate Report</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Security Report</DialogTitle>
          <DialogDescription>
            Create a comprehensive security report with system status, alerts, network information, and attack data. Download as PDF or send via email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to download report without sending email
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Time Range</Label>
            <RadioGroup defaultValue="24h" value={timeRange} onValueChange={setTimeRange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="24h" id="r1" />
                <Label htmlFor="r1">Last 24 hours</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="7d" id="r2" />
                <Label htmlFor="r2">Last 7 days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30d" id="r3" />
                <Label htmlFor="r3">Last 30 days</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>Report Type</Label>
            <RadioGroup defaultValue="full" value={reportType} onValueChange={setReportType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="t1" />
                <Label htmlFor="t1">Full Report</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alerts" id="t2" />
                <Label htmlFor="t2">Threats Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="network" id="t3" />
                <Label htmlFor="t3">Network Activity</Label>
              </div>
            </RadioGroup>
          </div>
          
          {email && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sendToMobile" 
                checked={sendToMobile} 
                onCheckedChange={(checked) => setSendToMobile(!!checked)} 
              />
              <Label htmlFor="sendToMobile">Also send to Mobile App</Label>
            </div>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ReportGenerator 