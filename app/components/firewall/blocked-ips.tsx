"use client";

import { useState, useEffect } from "react";
import { Card, Table, Button, Input, message, Space, Tag } from "antd";
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";

interface BlockedIP {
  id: string;
  ip: string;
  reason: string;
  blockedAt: string;
  source: string;
}

export default function BlockedIPs() {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIP, setNewIP] = useState("");
  const [reason, setReason] = useState("");

  const fetchBlockedIPs = async () => {
    setLoading(true);
    try {
      // This would be replaced with your actual API call
      const response = await fetch("/api/firewall/blocked-ips");
      if (response.ok) {
        const data = await response.json();
        setBlockedIPs(data);
      } else {
        message.error("Failed to fetch blocked IPs");
      }
    } catch (error) {
      console.error("Error fetching blocked IPs:", error);
      message.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // For demo purposes, populate with sample data
    const sampleData: BlockedIP[] = [
      {
        id: "1",
        ip: "192.168.1.100",
        reason: "Suspicious login attempts",
        blockedAt: new Date().toISOString(),
        source: "manual"
      },
      {
        id: "2",
        ip: "10.0.0.5",
        reason: "Port scanning detected",
        blockedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        source: "automatic"
      },
      {
        id: "3",
        ip: "172.16.0.10",
        reason: "Brute force attack",
        blockedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        source: "IDS"
      }
    ];
    
    setBlockedIPs(sampleData);
    setLoading(false);
    
    // Uncomment this when your API is ready
    // fetchBlockedIPs();
  }, []);

  const handleBlockIP = async () => {
    if (!newIP) {
      message.warning("Please enter an IP address");
      return;
    }
    
    // Simple IP validation
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newIP)) {
      message.error("Invalid IP address format");
      return;
    }

    setLoading(true);
    try {
      // This would be your actual API call
      // const response = await fetch("/api/firewall/block-ip", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ ip: newIP, reason }),
      // });
      
      // For demo purposes
      const newBlockedIP: BlockedIP = {
        id: Date.now().toString(),
        ip: newIP,
        reason: reason || "Manually blocked",
        blockedAt: new Date().toISOString(),
        source: "manual"
      };
      
      setBlockedIPs([...blockedIPs, newBlockedIP]);
      setNewIP("");
      setReason("");
      message.success(`IP ${newIP} has been blocked`);
    } catch (error) {
      console.error("Error blocking IP:", error);
      message.error("Failed to block IP address");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIP = async (id: string, ip: string) => {
    setLoading(true);
    try {
      // This would be your actual API call
      // const response = await fetch(`/api/firewall/unblock-ip/${id}`, {
      //   method: "DELETE"
      // });
      
      // For demo purposes
      setBlockedIPs(blockedIPs.filter(item => item.id !== id));
      message.success(`IP ${ip} has been unblocked`);
    } catch (error) {
      console.error("Error unblocking IP:", error);
      message.error("Failed to unblock IP address");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source: string) => {
        let color = "blue";
        if (source === "automatic") color = "green";
        if (source === "IDS") color = "orange";
        return <Tag color={color}>{source.toUpperCase()}</Tag>;
      }
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
    },
    {
      title: "Blocked At",
      dataIndex: "blockedAt",
      key: "blockedAt",
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: BlockedIP) => (
        <Button 
          danger 
          type="text" 
          icon={<DeleteOutlined />}
          onClick={() => {
            if (window.confirm(`Are you sure you want to unblock IP ${record.ip}?`)) {
              handleUnblockIP(record.id, record.ip);
            }
          }}
        >
          Unblock
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Blocked IP Addresses"
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchBlockedIPs}
        >
          Refresh
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <div style={{ display: "flex", marginBottom: "16px" }}>
          <Input 
            placeholder="Enter IP address to block (e.g., 192.168.1.1)" 
            value={newIP}
            onChange={(e) => setNewIP(e.target.value)}
            style={{ marginRight: "8px" }}
          />
          <Input 
            placeholder="Reason for blocking (optional)" 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ marginRight: "8px" }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleBlockIP}
          >
            Block IP
          </Button>
        </div>
        
        <Table 
          dataSource={blockedIPs} 
          columns={columns} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Space>
    </Card>
  );
} 