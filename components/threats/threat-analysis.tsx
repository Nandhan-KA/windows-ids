"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { Badge } from "@/components/ui/badge"

// Mock data for threat analysis
const threatsBySeverity = [
  { name: "Critical", value: 5, color: "#ef4444" },
  { name: "High", value: 12, color: "#f97316" },
  { name: "Medium", value: 18, color: "#f59e0b" },
  { name: "Low", value: 25, color: "#3b82f6" },
]

const threatsByType = [
  { name: "Malware", value: 15, color: "#8b5cf6" },
  { name: "Brute Force", value: 8, color: "#ec4899" },
  { name: "Phishing", value: 12, color: "#06b6d4" },
  { name: "Data Exfiltration", value: 5, color: "#10b981" },
  { name: "Reconnaissance", value: 10, color: "#f97316" },
  { name: "Persistence", value: 7, color: "#6366f1" },
  { name: "Other", value: 3, color: "#94a3b8" },
]

const threatTrends = [
  { date: "Apr 5", malware: 2, bruteforce: 1, phishing: 3, other: 1 },
  { date: "Apr 6", malware: 1, bruteforce: 2, phishing: 2, other: 0 },
  { date: "Apr 7", malware: 3, bruteforce: 1, phishing: 1, other: 2 },
  { date: "Apr 8", malware: 4, bruteforce: 0, phishing: 2, other: 1 },
  { date: "Apr 9", malware: 2, bruteforce: 3, phishing: 4, other: 0 },
  { date: "Apr 10", malware: 1, bruteforce: 2, phishing: 3, other: 2 },
  { date: "Apr 11", malware: 3, bruteforce: 1, phishing: 2, other: 1 },
]

export default function ThreatAnalysis() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">Threats by Severity</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={threatsBySeverity}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {threatsBySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">Threats by Type</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={threatsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {threatsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Threat Trends (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={threatTrends}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
                <Bar dataKey="malware" stackId="a" fill="#8b5cf6" name="Malware" />
                <Bar dataKey="bruteforce" stackId="a" fill="#ec4899" name="Brute Force" />
                <Bar dataKey="phishing" stackId="a" fill="#06b6d4" name="Phishing" />
                <Bar dataKey="other" stackId="a" fill="#94a3b8" name="Other" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Total Threats</h3>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                60
              </Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Last 30 days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Blocked Threats</h3>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                52
              </Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">86.7% success rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Active Threats</h3>
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                8
              </Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Requiring attention</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
