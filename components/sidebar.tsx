"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  BarChart3,
  Shield, 
  AlertTriangle, 
  Network, 
  FileText, 
  Settings, 
  LogIn, 
  Activity, 
  Swords,
  Mail,
  Bell,
  Lock,
  ShieldAlert
} from "lucide-react"

const routes = [
  {
    name: "Dashboard",
    path: "/",
    icon: BarChart3,
  },
  {
    name: "Real-time Monitoring",
    path: "/monitoring",
    icon: Activity,
  },
  {
    name: "Network Traffic",
    path: "/network",
    icon: Network,
  },
  {
    name: "Threat Detection",
    path: "/threats",
    icon: Shield,
  },
  {
    name: "Attack Monitoring",
    path: "/security/attack-monitoring",
    icon: ShieldAlert,
    badge: "New",
  },
  {
    name: "Alerts",
    path: "/alerts",
    icon: AlertTriangle,
  },
  {
    name: "Logs",
    path: "/logs",
    icon: FileText,
  },
  {
    name: "Reporting",
    path: "/reporting",
    icon: Mail,
    badge: "New",
  },
  {
    name: "Firewall",
    path: "/firewall",
    icon: Lock,
  },
  {
    name: "Attack Simulation",
    path: "/attack-simulation",
    icon: Swords,
  },
  {
    name: "Enhanced Attack Tester",
    path: "/debug/attack-tester",
    icon: AlertTriangle,
    badge: "New",
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-background border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-bold text-xl">Windows IDS</h1>
        </div>
      </div>
      <div className="flex-1 py-4 flex flex-col gap-0.5">
        {routes.map((route) => (
          <Link
            key={route.path}
            href={route.path}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm font-medium transition-colors",
              pathname === route.path ? "bg-primary/10 text-primary" : "hover:bg-muted",
            )}
          >
            <route.icon className="h-4 w-4" />
            <span className="flex-1">{route.name}</span>
            {route.badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {route.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
      <div className="p-4 border-t mt-auto">
        <Link
          href="/login"
          className="flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium hover:bg-muted w-full"
        >
          <LogIn className="h-4 w-4" />
          Logout
        </Link>
      </div>
    </div>
  )
}
