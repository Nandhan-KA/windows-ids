"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Sidebar from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import AttackAlertWrapper from "@/components/threats/attack-alert-wrapper"
import { useEffect } from 'react'
import { useToast } from "@/components/ui/use-toast"
import USBAlertPopup from "@/components/threats/usb-alert-popup"
// Update import path for sendToMongoDB
import { sendToMongoDB, keepMongoDBAlive } from "./services/mongodb"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { toast } = useToast()

  // Listen for USB alerts and other attack events
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Start the MongoDB keepalive service
      const mongoDBInterval = keepMongoDBAlive();
      
      let eventSource: EventSource | null = null;
      let reconnectAttempt = 0;
      const maxReconnectAttempts = 5;
      
      function setupEventSource() {
        // Close existing connection if any
        if (eventSource) {
          eventSource.close();
        }
        
        try {
          // Setup event source to listen for attack alerts from the server
          eventSource = new EventSource('/api/debug/simulate-attack-stream');
          
          // Handle messages from server-sent events
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.attack) {
                // Reset reconnect counter on successful message
                reconnectAttempt = 0;
                
                // Save attack to localStorage
                const existingAttacksJson = localStorage.getItem('simulatedAttacks');
                const existingAttacks = existingAttacksJson ? JSON.parse(existingAttacksJson) : [];
                existingAttacks.unshift(data.attack);
                localStorage.setItem('simulatedAttacks', JSON.stringify(existingAttacks));
                
                // Save to MongoDB
                sendToMongoDB(data.attack)
                  .then((success: boolean) => {
                    if (success) {
                      console.log('Attack data saved to MongoDB successfully');
                    } else {
                      console.error('Failed to save attack data to MongoDB');
                    }
                  })
                  .catch((error: Error) => {
                    console.error('Error saving to MongoDB:', error);
                  });
                
                // Dispatch event for components to handle
                const simulatedAttackEvent = new CustomEvent('simulated-attack', { 
                  detail: data.attack
                });
                window.dispatchEvent(simulatedAttackEvent);
                
                // Show toast notification
                const severity = data.attack.severity || 'medium';
                const title = data.attack.title || 'Security Alert';
                const threatType = data.attack.threat_type || 'Unknown';
                
                // Show different toast styles for USB alerts
                if (threatType === 'USB-Device' || threatType === 'USB-Scan') {
                  toast({
                    title: title,
                    description: data.attack.description,
                    variant: severity === 'critical' ? 'destructive' : 
                             severity === 'high' ? 'destructive' : 'default',
                    duration: 5000,
                  });
                }
              }
            } catch (error) {
              console.error('Error processing server event:', error);
            }
          };
          
          // When connection opens successfully
          eventSource.onopen = () => {
            console.log('EventSource connection established');
            // Reset reconnect counter on successful connection
            reconnectAttempt = 0;
          };
          
          // Handle errors with exponential backoff
          eventSource.onerror = (error) => {
            console.error('EventSource failed, attempting to reconnect...', error);
            
            // Close the current connection
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
            
            // Increment reconnect attempt counter
            reconnectAttempt++;
            
            // Calculate backoff time: 1s, 2s, 4s, 8s, 16s...
            const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempt - 1), 30000);
            
            if (reconnectAttempt <= maxReconnectAttempts) {
              console.log(`Reconnect attempt ${reconnectAttempt}/${maxReconnectAttempts} in ${backoffTime}ms`);
              
              // Try to reconnect after backoff delay
              setTimeout(() => {
                setupEventSource();
              }, backoffTime);
            } else {
              console.error(`Maximum reconnect attempts (${maxReconnectAttempts}) reached. Giving up.`);
              toast({
                title: "Connection Error",
                description: "Could not connect to event stream. Some real-time alerts may not be displayed.",
                variant: "destructive",
                duration: 10000,
              });
            }
          };
        } catch (error) {
          console.error('Error setting up EventSource:', error);
        }
      }
      
      // Initial setup
      setupEventSource();
      
      // Add event listener for direct simulated attacks (from components)
      const handleSimulatedAttack = (event: Event) => {
        const attackData = (event as CustomEvent).detail;
        
        // Save to MongoDB
        if (attackData) {
          // Ensure all required fields for MongoDB are present
          const completeAttackData = {
            ...attackData,
            id: attackData.id || `attack-${Date.now()}`,
            title: attackData.title || `${attackData.type || 'Unknown'} Attack`,
            timestamp: attackData.timestamp || new Date().toISOString(),
            severity: attackData.severity || 'medium',
            threat_type: attackData.threat_type || attackData.type || 'Attack',
            source: attackData.source || window.location.hostname
          };
          
          console.log('Sending attack data to MongoDB:', completeAttackData);
          
          sendToMongoDB(completeAttackData)
            .then((success: boolean) => {
              if (success) {
                console.log('Direct attack data saved to MongoDB successfully');
                toast({
                  title: "Attack data saved",
                  description: "Attack simulation data was successfully saved to MongoDB",
                  variant: "default"
                });
              } else {
                console.error('Failed to save direct attack data to MongoDB');
                toast({
                  title: "Error saving attack data",
                  description: "Could not save attack simulation data to MongoDB. Check console for details.",
                  variant: "destructive"
                });
              }
            })
            .catch((error: Error) => {
              console.error('Error saving direct attack to MongoDB:', error);
              toast({
                title: "Error saving attack data",
                description: `MongoDB error: ${error.message}`,
                variant: "destructive"
              });
            });
        }
      };
      
      // Add listener for the custom event
      window.addEventListener('simulated-attack', handleSimulatedAttack);
      
      // Cleanup on unmount
      return () => {
        if (eventSource) {
          eventSource.close();
        }
        window.removeEventListener('simulated-attack', handleSimulatedAttack);
        if (mongoDBInterval) clearInterval(mongoDBInterval);
      };
    }
  }, [toast])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="h-14 border-b flex items-center justify-end px-6">
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
          </div>
          <Toaster />
          <AttackAlertWrapper />
          <USBAlertPopup />
        </ThemeProvider>
      </body>
    </html>
  )
} 