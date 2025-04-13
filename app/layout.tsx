"use client"

import type React from "react"
import type { Metadata } from "next"
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
import { sendToMongoDB } from "../services/mongodb"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Windows IDS - Intrusion Detection System",
  description: "Professional Windows-based Intrusion Detection System",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { toast } = useToast()

  // Listen for USB alerts and other attack events
  useEffect(() => {
    // Setup event source to listen for attack alerts from the server
    const eventSource = new EventSource('/api/debug/simulate-attack-stream')
    
    // Handle messages from server-sent events
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.attack) {
          // Save attack to localStorage
          const existingAttacksJson = localStorage.getItem('simulatedAttacks')
          const existingAttacks = existingAttacksJson ? JSON.parse(existingAttacksJson) : []
          existingAttacks.unshift(data.attack)
          localStorage.setItem('simulatedAttacks', JSON.stringify(existingAttacks))
          
          // Save to MongoDB
          sendToMongoDB(data.attack)
            .then((success: boolean) => {
              if (success) {
                console.log('Attack data saved to MongoDB successfully')
              } else {
                console.error('Failed to save attack data to MongoDB')
              }
            })
            .catch((error: Error) => {
              console.error('Error saving to MongoDB:', error)
            })
          
          // Dispatch event for components to handle
          const simulatedAttackEvent = new CustomEvent('simulated-attack', { 
            detail: data.attack
          })
          window.dispatchEvent(simulatedAttackEvent)
          
          // Show toast notification
          const severity = data.attack.severity || 'medium'
          const title = data.attack.title || 'Security Alert'
          const threatType = data.attack.threat_type || 'Unknown'
          
          // Show different toast styles for USB alerts
          if (threatType === 'USB-Device' || threatType === 'USB-Scan') {
            toast({
              title: title,
              description: data.attack.description,
              variant: severity === 'critical' ? 'destructive' : 
                       severity === 'high' ? 'destructive' : 'default',
              duration: 5000,
            })
          }
        }
      } catch (error) {
        console.error('Error processing server event:', error)
      }
    }
    
    // Handle errors
    eventSource.onerror = () => {
      console.error('EventSource failed, reconnecting...')
      eventSource.close()
      
      // Try to reconnect after a delay
      setTimeout(() => {
        new EventSource('/api/debug/simulate-attack-stream')
      }, 5000)
    }
    
    // Add event listener for direct simulated attacks (from components)
    const handleSimulatedAttack = (event: Event) => {
      const attackData = (event as CustomEvent).detail
      
      // Save to MongoDB
      if (attackData) {
        sendToMongoDB(attackData)
          .then((success: boolean) => {
            if (success) {
              console.log('Direct attack data saved to MongoDB successfully')
            } else {
              console.error('Failed to save direct attack data to MongoDB')
            }
          })
          .catch((error: Error) => {
            console.error('Error saving direct attack to MongoDB:', error)
          })
      }
    }
    
    // Add listener for the custom event
    window.addEventListener('simulated-attack', handleSimulatedAttack)
    
    // Cleanup on unmount
    return () => {
      eventSource.close()
      window.removeEventListener('simulated-attack', handleSimulatedAttack)
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


import './globals.css'