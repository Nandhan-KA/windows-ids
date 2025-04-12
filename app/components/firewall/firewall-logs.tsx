"use client";

import { useState, useEffect } from "react";
import { Card, Table, Tag, Space, Button, Input } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";

interface FirewallLog {
  id: string;
  timestamp: string;
  sourceIP: string;
  destinationIP: string;
  port: number | string;
  protocol: string;
  action: "ALLOWED" | "BLOCKED";
  rule?: string;
  reason?: string;
}

export default function FirewallLogs() {
  const [logs, setLogs] = useState<FirewallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "all",
    searchText: "",
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // This would be replaced with your actual API call
      // You would include filters in your API request
      // const queryParams = new URLSearchParams();
      // if (filters.action !== 'all') queryParams.append('action', filters.action);
      // if (filters.searchText) queryParams.append('search', filters.searchText);
      
      // const response = await fetch(`/api/firewall/logs?${queryParams.toString()}`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setLogs(data);
      // } else {
      //   message.error("Failed to fetch firewall logs");
      // }
      
      // For demo purposes, just simulate a delay and use sample data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const sampleLogs = generateSampleLogs(50);
      let filteredLogs = [...sampleLogs];
      
      if (filters.action !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }
      
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.sourceIP.toLowerCase().includes(searchLower) || 
          log.destinationIP.toLowerCase().includes(searchLower) ||
          (log.rule && log.rule.toLowerCase().includes(searchLower)) ||
          (log.reason && log.reason.toLowerCase().includes(searchLower))
        );
      }
      
      setLogs(filteredLogs);
    } catch (error) {
      console.error("Error fetching firewall logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleLogs = (count: number): FirewallLog[] => {
    const protocols = ["TCP", "UDP", "ICMP"];
    const ips = [
      "192.168.1.100", "10.0.0.5", "172.16.0.10", "8.8.8.8", "1.1.1.1",
      "192.168.1.1", "10.0.0.1", "203.0.113.1", "198.51.100.1", "192.0.2.1"
    ];
    const ports = [22, 80, 443, 3389, 21, 25, 53, "ANY"];
    const rules = [
      "Block Incoming SSH", "Allow HTTP Traffic", "Block All UDP", 
      "Allow Internal Traffic", "Block Known Bad IPs"
    ];
    const reasons = [
      "Matched firewall rule", "Suspicious activity", "Port scanning detected", 
      "Brute force attempt", "Known malicious IP"
    ];
    
    const logs: FirewallLog[] = [];
    
    for (let i = 0; i < count; i++) {
      const isBlocked = Math.random() > 0.6; // 40% allowed, 60% blocked
      const now = new Date();
      const timestamp = new Date(now.getTime() - Math.random() * 86400000 * 7); // Random time within last week
      
      logs.push({
        id: (i + 1).toString(),
        timestamp: timestamp.toISOString(),
        sourceIP: ips[Math.floor(Math.random() * ips.length)],
        destinationIP: ips[Math.floor(Math.random() * ips.length)],
        port: ports[Math.floor(Math.random() * ports.length)],
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        action: isBlocked ? "BLOCKED" : "ALLOWED",
        rule: isBlocked ? rules[Math.floor(Math.random() * rules.length)] : undefined,
        reason: isBlocked ? reasons[Math.floor(Math.random() * reasons.length)] : undefined
      });
    }
    
    // Sort newest first
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleFilterChange = (filterName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const columns = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      sorter: (a: FirewallLog, b: FirewallLog) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      defaultSortOrder: "descend" as const,
      width: 180,
    },
    {
      title: "Source IP",
      dataIndex: "sourceIP",
      key: "sourceIP",
      width: 140,
    },
    {
      title: "Destination IP",
      dataIndex: "destinationIP",
      key: "destinationIP",
      width: 140,
    },
    {
      title: "Port",
      dataIndex: "port",
      key: "port",
      width: 80,
    },
    {
      title: "Protocol",
      dataIndex: "protocol",
      key: "protocol",
      width: 100,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action: string) => (
        <Tag color={action === "ALLOWED" ? "green" : "red"}>
          {action}
        </Tag>
      ),
      width: 100,
      filters: [
        { text: "Allowed", value: "ALLOWED" },
        { text: "Blocked", value: "BLOCKED" },
      ],
      onFilter: (value: string, record: FirewallLog) => record.action === value,
    },
    {
      title: "Rule",
      dataIndex: "rule",
      key: "rule",
      ellipsis: true,
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
  ];

  return (
    <Card title="Firewall Logs">
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space wrap>
          <select
            style={{ padding: "5px", borderRadius: "4px", borderColor: "#d9d9d9", width: "150px" }}
            defaultValue="all"
            onChange={(e) => handleFilterChange("action", e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="ALLOWED">Allowed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
          
          <Input
            placeholder="Search logs"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            onChange={(e) => handleFilterChange("searchText", e.target.value)}
            allowClear
          />
          
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => fetchLogs()}
          >
            Refresh
          </Button>
        </Space>
        
        <Table 
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 15,
            showSizeChanger: true
          }}
          scroll={{ x: 1200 }}
        />
      </Space>
    </Card>
  );
} 