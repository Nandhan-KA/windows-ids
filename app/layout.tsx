import { Metadata } from "next"
import ClientLayout from "./client-layout"
import { metadata } from "./metadata"

export { metadata }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}