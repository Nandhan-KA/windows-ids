import { Metadata } from "next"
import ClientLayout from "./client-layout"

export const metadata = {
  title: "Windows IDS - Intrusion Detection System",
  description: "Professional Windows-based Intrusion Detection System",
  generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return <ClientLayout>{children}</ClientLayout>
} 