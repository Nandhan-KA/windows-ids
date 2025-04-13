"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UsbIcon, AlertCircle, ShieldAlert, X, Usb, File, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'

export default function USBAlertPopup() {
  const [showPopup, setShowPopup] = useState(false)
  const [usbAlert, setUsbAlert] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()
  
  useEffect(() => {
    // Listen for USB alerts
    const handleUsbAlert = (event: any) => {
      const alertData = event.detail
      
      // Check if this is a USB-related alert
      if (alertData && (alertData.threat_type === 'USB-Device' || alertData.threat_type === 'USB-Scan')) {
        console.log('USB alert received:', alertData)
        setUsbAlert(alertData)
        setShowPopup(true)
      }
    }
    
    // Add event listener
    window.addEventListener('simulated-attack', handleUsbAlert)
    
    // Cleanup
    return () => {
      window.removeEventListener('simulated-attack', handleUsbAlert)
    }
  }, [])
  
  // Handle close popup
  const handleClose = () => {
    setShowPopup(false)
  }
  
  // View threats page
  const viewThreats = () => {
    router.push('/threats')
    setShowPopup(false)
  }
  
  // Handle block device
  const blockDevice = () => {
    // In a real system, this would trigger a blocking action
    toast({
      title: "USB Device Blocked",
      description: "Access to this USB device has been restricted",
      variant: "default",
    })
    
    // Update the status in localStorage
    try {
      const existingAttacksJson = localStorage.getItem('simulatedAttacks')
      if (existingAttacksJson) {
        const existingAttacks = JSON.parse(existingAttacksJson)
        const updatedAttacks = existingAttacks.map((attack: any) => {
          if (attack.id === usbAlert.id) {
            return { ...attack, status: 'blocked' }
          }
          return attack
        })
        localStorage.setItem('simulatedAttacks', JSON.stringify(updatedAttacks))
      }
    } catch (error) {
      console.error('Error updating attack status:', error)
    }
    
    setShowPopup(false)
  }
  
  if (!showPopup || !usbAlert) return null
  
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className={usbAlert.threat_type === 'USB-Device' ? 
          "bg-yellow-500/10 border-b" : 
          "bg-red-500/10 border-b"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {usbAlert.threat_type === 'USB-Device' ? (
                <UsbIcon className="h-5 w-5 text-yellow-500" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-red-500" />
              )}
              <CardTitle>
                {usbAlert.threat_type === 'USB-Device' ? 'USB Device Detected' : 'USB Scan Completed'}
              </CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {usbAlert.title}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p>{usbAlert.description}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              Source: {usbAlert.source_ip}
            </Badge>
            
            <Badge 
              variant="outline"
              className={
                usbAlert.severity === "critical"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : usbAlert.severity === "high"
                  ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                  : usbAlert.severity === "medium"
                  ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  : "bg-blue-500/10 text-blue-500 border-blue-500/20"
              }
            >
              {usbAlert.severity}
            </Badge>
          </div>
          
          {/* Extra details for scan results */}
          {usbAlert.threat_type === 'USB-Scan' && usbAlert.scan_results && (
            <div className="border rounded-md p-3 bg-gray-100/50 dark:bg-gray-800/50 mt-2">
              <div className="font-medium mb-1">Scan Results</div>
              <div className="text-sm text-muted-foreground">
                Total files: {usbAlert.scan_results.total_files}
              </div>
              <div className="text-sm text-muted-foreground">
                Suspicious files: {usbAlert.scan_results.suspicious_files}
              </div>
              
              {usbAlert.scan_results.suspicious_files > 0 && usbAlert.scan_results.suspicious_file_list && (
                <div className="mt-2">
                  <div className="text-sm font-medium">Suspicious files:</div>
                  <div className="max-h-32 overflow-y-auto text-sm">
                    <ul className="pl-4 list-disc">
                      {usbAlert.scan_results.suspicious_file_list.slice(0, 5).map((file: any, index: number) => (
                        <li key={index} className="text-xs">
                          {file.name} ({file.extension})
                        </li>
                      ))}
                      {usbAlert.scan_results.suspicious_file_list.length > 5 && (
                        <li className="text-xs text-muted-foreground">
                          ... and {usbAlert.scan_results.suspicious_file_list.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between gap-2 border-t pt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={viewThreats}
            className="flex items-center gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            View Threats
          </Button>
          
          <Button 
            size="sm"
            onClick={blockDevice}
            variant={usbAlert.threat_type === 'USB-Scan' && usbAlert.scan_results?.suspicious_files > 0 
              ? "destructive" 
              : "default"}
            className="flex items-center gap-1"
          >
            {usbAlert.threat_type === 'USB-Scan' && usbAlert.scan_results?.suspicious_files > 0 ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5" />
                Block Device
              </>
            ) : (
              <>
                <Usb className="h-3.5 w-3.5" />
                {usbAlert.threat_type === 'USB-Device' ? 'Block Device' : 'Acknowledge'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 