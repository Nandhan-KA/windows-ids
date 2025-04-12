import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShieldAlert, RefreshCw } from "lucide-react"
import ThreatsList from "@/components/threats/threats-list"
import ThreatAnalysis from "@/components/threats/threat-analysis"
import VulnerabilityScanner from "@/components/threats/vulnerability-scanner"

export default function ThreatsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Threat Detection</h1>
          <p className="text-muted-foreground">Identify and analyze security threats</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-xs py-1 px-3">
            Last scan: 15 minutes ago
          </Badge>
          <Button size="sm" variant="outline" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Scan Now</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <span>Threat Management</span>
          </CardTitle>
          <CardDescription>Detect, analyze and mitigate security threats</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
              <TabsTrigger value="active">Active Threats</TabsTrigger>
              <TabsTrigger value="analysis">Threat Analysis</TabsTrigger>
              <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-4">
              <ThreatsList />
            </TabsContent>
            <TabsContent value="analysis" className="space-y-4">
              <ThreatAnalysis />
            </TabsContent>
            <TabsContent value="vulnerabilities" className="space-y-4">
              <VulnerabilityScanner />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
