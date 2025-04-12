"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"

// Mock data for packet capture
const generatePackets = () => {
  const protocols = ["TCP", "UDP", "HTTP", "HTTPS", "DNS", "ICMP", "ARP"]
  const sourceIPs = ["192.168.1.100", "192.168.1.101", "10.0.0.15", "172.16.0.32"]
  const destIPs = ["8.8.8.8", "192.168.1.1", "104.23.99.12", "172.217.20.174"]

  return Array(50)
    .fill(0)
    .map((_, i) => {
      const protocol = protocols[Math.floor(Math.random() * protocols.length)]
      const sourceIP = sourceIPs[Math.floor(Math.random() * sourceIPs.length)]
      const destIP = destIPs[Math.floor(Math.random() * destIPs.length)]
      const sourcePort = Math.floor(Math.random() * 60000) + 1024
      const destPort =
        protocol === "HTTP"
          ? 80
          : protocol === "HTTPS"
            ? 443
            : protocol === "DNS"
              ? 53
              : Math.floor(Math.random() * 60000) + 1024
      const size = Math.floor(Math.random() * 1500) + 64
      const timestamp = new Date().toLocaleTimeString()

      // Generate flags for TCP packets
      let flags = ""
      if (protocol === "TCP") {
        const possibleFlags = ["SYN", "ACK", "FIN", "RST", "PSH"]
        const numFlags = Math.floor(Math.random() * 3) + 1
        for (let j = 0; j < numFlags; j++) {
          flags += possibleFlags[Math.floor(Math.random() * possibleFlags.length)] + " "
        }
        flags = flags.trim()
      }

      // Determine if packet is suspicious
      const isSuspicious = Math.random() < 0.1

      return {
        id: i + 1,
        timestamp,
        protocol,
        sourceIP,
        sourcePort,
        destIP,
        destPort,
        size,
        flags,
        isSuspicious,
      }
    })
}

export default function PacketAnalysis() {
  const [packets, setPackets] = useState<any[]>([])
  const [captureActive, setCaptureActive] = useState(true)
  const [selectedInterface, setSelectedInterface] = useState("all")

  useEffect(() => {
    setPackets(generatePackets())

    let interval: NodeJS.Timeout

    if (captureActive) {
      interval = setInterval(() => {
        setPackets((prevPackets) => {
          const newPacket = generatePackets()[0]
          return [newPacket, ...prevPackets.slice(0, 99)]
        })
      }, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [captureActive])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={selectedInterface} onValueChange={setSelectedInterface}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select interface" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Interfaces</SelectItem>
              <SelectItem value="eth0">Ethernet (eth0)</SelectItem>
              <SelectItem value="wlan0">Wi-Fi (wlan0)</SelectItem>
              <SelectItem value="lo">Loopback (lo)</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={captureActive ? "destructive" : "default"}
            size="sm"
            onClick={() => setCaptureActive(!captureActive)}
          >
            {captureActive ? "Stop Capture" : "Start Capture"}
          </Button>
        </div>

        <Badge variant="outline">{packets.length} packets captured</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="font-mono text-xs">
              <div className="grid grid-cols-8 gap-2 p-2 border-b bg-muted/50 font-medium">
                <div>Time</div>
                <div>Source</div>
                <div>Destination</div>
                <div>Protocol</div>
                <div>Length</div>
                <div>Flags</div>
                <div>Info</div>
                <div>Status</div>
              </div>

              {packets.map((packet) => (
                <div
                  key={packet.id}
                  className={`grid grid-cols-8 gap-2 p-2 border-b hover:bg-muted/30 ${
                    packet.isSuspicious ? "bg-red-500/5" : ""
                  }`}
                >
                  <div>{packet.timestamp}</div>
                  <div>{`${packet.sourceIP}:${packet.sourcePort}`}</div>
                  <div>{`${packet.destIP}:${packet.destPort}`}</div>
                  <div>{packet.protocol}</div>
                  <div>{packet.size} bytes</div>
                  <div>{packet.flags || "-"}</div>
                  <div>
                    {packet.protocol === "HTTP"
                      ? "GET /index.html"
                      : packet.protocol === "DNS"
                        ? "Query: example.com"
                        : packet.protocol === "ICMP"
                          ? "Echo request"
                          : "-"}
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={
                        packet.isSuspicious
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-green-500/10 text-green-500 border-green-500/20"
                      }
                    >
                      {packet.isSuspicious ? "Suspicious" : "Normal"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Packet Details</h3>
            <p className="text-sm text-muted-foreground">Select a packet to view detailed information</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Packet Payload</h3>
            <p className="text-sm text-muted-foreground">Select a packet to view payload data</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
