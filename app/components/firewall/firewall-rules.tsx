"use client";

import { useState, useEffect } from "react";
import { Card, Table, Button, Switch, Tag, Space, Modal, Input, Select, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";

const { Option } = Select;

interface FirewallRule {
  id: string;
  name: string;
  protocol: "TCP" | "UDP" | "ICMP" | "ANY";
  sourceIP: string;
  destinationIP: string;
  port: number | string;
  action: "ALLOW" | "DENY";
  enabled: boolean;
  priority: number;
}

export default function FirewallRules() {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  
  // Form state
  const [formValues, setFormValues] = useState({
    name: "",
    protocol: "TCP" as "TCP" | "UDP" | "ICMP" | "ANY",
    sourceIP: "",
    destinationIP: "",
    port: "",
    action: "DENY" as "ALLOW" | "DENY"
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      // This would be replaced with your actual API call
      const response = await fetch("/api/firewall/rules");
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        message.error("Failed to fetch firewall rules");
      }
    } catch (error) {
      console.error("Error fetching firewall rules:", error);
      message.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // For demo purposes, populate with sample data
    const sampleRules: FirewallRule[] = [
      {
        id: "1",
        name: "Block Incoming SSH",
        protocol: "TCP",
        sourceIP: "0.0.0.0/0",
        destinationIP: "192.168.1.0/24",
        port: 22,
        action: "DENY",
        enabled: true,
        priority: 1
      },
      {
        id: "2",
        name: "Allow HTTP Traffic",
        protocol: "TCP",
        sourceIP: "0.0.0.0/0",
        destinationIP: "192.168.1.10",
        port: 80,
        action: "ALLOW",
        enabled: true,
        priority: 2
      },
      {
        id: "3",
        name: "Block All UDP",
        protocol: "UDP",
        sourceIP: "10.0.0.0/8",
        destinationIP: "0.0.0.0/0",
        port: "ANY",
        action: "DENY",
        enabled: false,
        priority: 3
      }
    ];
    
    setRules(sampleRules);
    setLoading(false);
    
    // Uncomment this when your API is ready
    // fetchRules();
  }, []);

  const toggleRuleStatus = async (id: string, enabled: boolean) => {
    try {
      // This would be your actual API call
      // await fetch(`/api/firewall/rules/${id}/toggle`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ enabled }),
      // });
      
      // For demo purposes
      setRules(
        rules.map(rule => 
          rule.id === id ? { ...rule, enabled } : rule
        )
      );
      
      message.success(`Rule ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error("Error toggling rule status:", error);
      message.error("Failed to update rule status");
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      // This would be your actual API call
      // await fetch(`/api/firewall/rules/${id}`, {
      //   method: "DELETE"
      // });
      
      // For demo purposes
      setRules(rules.filter(rule => rule.id !== id));
      message.success("Rule deleted successfully");
    } catch (error) {
      console.error("Error deleting rule:", error);
      message.error("Failed to delete rule");
    } finally {
      setLoading(false);
    }
  };

  const editRule = (rule: FirewallRule) => {
    setEditingRule(rule);
    setFormValues({
      name: rule.name,
      protocol: rule.protocol,
      sourceIP: rule.sourceIP,
      destinationIP: rule.destinationIP,
      port: String(rule.port),
      action: rule.action
    });
    setModalVisible(true);
  };

  const addNewRule = () => {
    setEditingRule(null);
    setFormValues({
      name: "",
      protocol: "TCP",
      sourceIP: "",
      destinationIP: "",
      port: "",
      action: "DENY"
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Form validation
    if (!formValues.name) {
      message.error("Rule name is required");
      return;
    }
    if (!formValues.sourceIP) {
      message.error("Source IP is required");
      return;
    }
    if (!formValues.destinationIP) {
      message.error("Destination IP is required");
      return;
    }
    if (!formValues.port) {
      message.error("Port is required");
      return;
    }

    setLoading(true);
    
    try {
      if (editingRule) {
        // Edit existing rule
        // This would be your actual API call
        // await fetch(`/api/firewall/rules/${editingRule.id}`, {
        //   method: "PUT",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(formValues),
        // });
        
        // For demo purposes
        setRules(
          rules.map(rule => 
            rule.id === editingRule.id ? { 
              ...rule, 
              ...formValues,
              port: formValues.port // Convert back to proper type if needed
            } : rule
          )
        );
        message.success("Rule updated successfully");
      } else {
        // Add new rule
        // This would be your actual API call
        // const response = await fetch("/api/firewall/rules", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(formValues),
        // });
        // const data = await response.json();
        
        // For demo purposes
        const newRule: FirewallRule = {
          id: Date.now().toString(),
          ...formValues,
          port: formValues.port, // Convert to number if needed
          enabled: true,
          priority: rules.length + 1
        };
        
        setRules([...rules, newRule]);
        message.success("Rule added successfully");
      }
    } catch (error) {
      console.error("Error saving rule:", error);
      message.error("Failed to save rule");
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormValues({
      ...formValues,
      [field]: value
    });
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Protocol",
      dataIndex: "protocol",
      key: "protocol",
    },
    {
      title: "Source IP",
      dataIndex: "sourceIP",
      key: "sourceIP",
    },
    {
      title: "Destination IP",
      dataIndex: "destinationIP",
      key: "destinationIP",
    },
    {
      title: "Port",
      dataIndex: "port",
      key: "port",
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action: string) => (
        <Tag color={action === "ALLOW" ? "green" : "red"}>
          {action}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      sorter: (a: FirewallRule, b: FirewallRule) => a.priority - b.priority,
    },
    {
      title: "Status",
      dataIndex: "enabled",
      key: "enabled",
      render: (enabled: boolean, record: FirewallRule) => (
        <Switch 
          checked={enabled} 
          onChange={(checked) => toggleRuleStatus(record.id, checked)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: FirewallRule) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => editRule(record)}
            type="text"
          />
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
            type="text"
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Firewall Rules"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchRules}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={addNewRule}
            >
              Add Rule
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={rules} 
          columns={columns} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingRule ? "Edit Firewall Rule" : "Add Firewall Rule"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        confirmLoading={loading}
      >
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "8px" }}>Rule Name *</div>
          <Input 
            placeholder="e.g., Block SSH Traffic"
            value={formValues.name}
            onChange={(e) => handleFormChange("name", e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "8px" }}>Protocol *</div>
          <Select
            placeholder="Select protocol"
            style={{ width: "100%" }}
            value={formValues.protocol}
            onChange={(value) => handleFormChange("protocol", value)}
          >
            <Option value="TCP">TCP</Option>
            <Option value="UDP">UDP</Option>
            <Option value="ICMP">ICMP</Option>
            <Option value="ANY">ANY</Option>
          </Select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "8px" }}>Source IP *</div>
          <Input 
            placeholder="e.g., 192.168.1.0/24 or 0.0.0.0/0 for any"
            value={formValues.sourceIP}
            onChange={(e) => handleFormChange("sourceIP", e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "8px" }}>Destination IP *</div>
          <Input 
            placeholder="e.g., 10.0.0.1 or 0.0.0.0/0 for any"
            value={formValues.destinationIP}
            onChange={(e) => handleFormChange("destinationIP", e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "8px" }}>Port *</div>
          <Input 
            placeholder="e.g., 22, 80-443, or ANY"
            value={formValues.port}
            onChange={(e) => handleFormChange("port", e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "8px" }}>Action *</div>
          <Select
            placeholder="Select action"
            style={{ width: "100%" }}
            value={formValues.action}
            onChange={(value) => handleFormChange("action", value)}
          >
            <Option value="ALLOW">ALLOW</Option>
            <Option value="DENY">DENY</Option>
          </Select>
        </div>
      </Modal>
    </>
  );
} 