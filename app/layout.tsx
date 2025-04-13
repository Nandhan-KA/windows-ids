import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Sidebar from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import AttackAlertWrapper from "@/components/threats/attack-alert-wrapper"

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
  return (
    <html lang="en" suppressHydrationWarning>
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
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'