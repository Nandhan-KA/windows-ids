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

const ReportGenerator = () => {
  const [email, setEmail] = useState('')
  const [timeRange, setTimeRange] = useState('24h')
  const [reportType, setReportType] = useState('full')
  const [sendToMobile, setSendToMobile] = useState(true)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate the report
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
      })

      const generateData = await generateResponse.json()

      if (!generateResponse.ok) {
        throw new Error(generateData.error || 'Failed to generate report')
      }

      const reportId = generateData.report.id
      const reportTitle = generateData.report.title

      toast({
        title: "Report Generated",
        description: `Security report "${reportTitle}" has been generated.`,
      })

      // If send to mobile is checked, no need to do anything extra as the
      // mobile app will fetch reports from the API

      setLoading(false)
      setOpen(false)
    } catch (error: any) {
      console.error('Error generating report:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate report: ${error.message || 'Unknown error'}`,
      })
      setLoading(false)
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
            Create a comprehensive security report with system status, alerts, network information, and reinforcement learning data. Send to email or mobile app.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
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
                <Label htmlFor="t2">Alerts Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="network" id="t3" />
                <Label htmlFor="t3">Network Activity</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sendToMobile" 
              checked={sendToMobile} 
              onCheckedChange={(checked) => setSendToMobile(!!checked)} 
            />
            <Label htmlFor="sendToMobile">Send to Mobile App</Label>
          </div>
          
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