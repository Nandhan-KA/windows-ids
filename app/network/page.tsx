import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Network, RefreshCw } from "lucide-react"
import NetworkTraffic from "@/components/network/network-traffic"
import ConnectionsList from "@/components/network/connections-list"
import PacketAnalysis from "@/components/network/packet-analysis"

export default function NetworkPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Traffic</h1>
          <p className="text-muted-foreground">Monitor and analyze network connections</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-xs py-1 px-3">
            Monitoring: All Interfaces
          </Badge>
          <Button size="sm" variant="outline" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <span>Network Analysis</span>
          </CardTitle>
          <CardDescription>Real-time monitoring of network traffic and connections</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="traffic" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
              <TabsTrigger value="traffic">Traffic</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="packets">Packet Analysis</TabsTrigger>
            </TabsList>
            <TabsContent value="traffic" className="space-y-4">
              <NetworkTraffic />
            </TabsContent>
            <TabsContent value="connections" className="space-y-4">
              <ConnectionsList />
            </TabsContent>
            <TabsContent value="packets" className="space-y-4">
              <PacketAnalysis />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
