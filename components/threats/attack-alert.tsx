"use client"

import { useState, useEffect } from 'react'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ShieldAlert } from "lucide-react"
import { useRouter } from 'next/navigation'

export default function AttackAlert() {
  const [isOpen, setIsOpen] = useState(false)
  const [attackDetails, setAttackDetails] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  
  // Only run on client-side
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Listen for simulated attacks
  useEffect(() => {
    if (!isClient) return;
    
    const handleSimulatedAttack = (e: CustomEvent) => {
      const eventData = e.detail;
      
      // Only show alert for high severity events
      if (eventData && (eventData.severity === 'critical' || eventData.severity === 'high')) {
        setAttackDetails(eventData);
        setIsOpen(true);
      }
    };
    
    window.addEventListener('simulated-attack' as any, handleSimulatedAttack as any);
    
    return () => {
      window.removeEventListener('simulated-attack' as any, handleSimulatedAttack as any);
    };
  }, [isClient]);
  
  const viewThreatDetails = () => {
    setIsOpen(false);
    router.push('/threats');
  };
  
  if (!attackDetails) return null;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {attackDetails.severity === 'critical' ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-orange-500" />
            )}
            <AlertDialogTitle>
              {attackDetails.severity === 'critical' ? 'CRITICAL ' : 'HIGH '} 
              Security Alert
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2 text-base">
            <div className="space-y-2">
              <p className="font-semibold text-foreground">
                {attackDetails.title || attackDetails.threat_type}
              </p>
              <p>
                {attackDetails.description}
              </p>
              <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold">Source:</span> {attackDetails.source_ip}
                  </div>
                  <div>
                    <span className="font-semibold">Target:</span> {attackDetails.target}
                  </div>
                  <div>
                    <span className="font-semibold">Type:</span> {attackDetails.threat_type}
                  </div>
                  <div>
                    <span className="font-semibold">Time:</span> {new Date(attackDetails.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <p className="text-red-500 font-semibold">
                {attackDetails.severity === 'critical' 
                  ? 'Immediate action required!'
                  : 'Action recommended'}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Dismiss</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={viewThreatDetails} variant="destructive">
              View Threat Details
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 