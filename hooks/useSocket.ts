"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// Socket.IO connection
let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [networkConnections, setNetworkConnections] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any>({
    cpu_percent: 0,
    memory_percent: 0,
    disk_io_percent: 0,
    network_io_mbps: 0
  });
  const [processes, setProcesses] = useState<any[]>([]);

  useEffect(() => {
    // Create socket if it doesn't exist
    if (!socket) {
      console.log("Creating new socket connection");
      socket = io("http://localhost:5000", {
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 30000,
        transports: ['polling', 'websocket'],
        forceNew: true,
        autoConnect: false
      });
    }

    // Set up event handlers
    const onConnect = () => {
      console.log("Socket connected successfully");
      setIsConnected(true);
      
      // Request initial data on connection
      socket?.emit('getInitialData');
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    };

    const onNetworkConnections = (data: any[]) => {
      console.log("Received network connections:", data);
      if (Array.isArray(data)) {
        setNetworkConnections(data);
      }
    };

    const onSecurityEvents = (data: any[]) => {
      console.log("Received security events:", data);
      if (Array.isArray(data)) {
        setSecurityEvents(data);
      }
    };
    
    const onSystemMetrics = (data: any) => {
      console.log("Received system metrics:", data);
      if (data && typeof data === 'object') {
        setSystemMetrics(data);
      }
    };
    
    const onProcesses = (data: any[]) => {
      console.log("Received processes:", data);
      if (Array.isArray(data)) {
        setProcesses(data);
      }
    };

    // Register event handlers
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("network-connections", onNetworkConnections);
    socket.on("security-events", onSecurityEvents);
    socket.on("system-metrics", onSystemMetrics);
    socket.on("processes", onProcesses);

    // Connect if not already connected
    if (!socket.connected) {
      console.log("Attempting to connect socket...");
      socket.connect();
    }

    // Fallback to fetch data if socket is not working
    const fetchBackupData = async () => {
      try {
        // Fetch metrics
        const metricsResponse = await fetch('http://localhost:5000/api/system/metrics');
        if (metricsResponse.ok) {
          const metrics = await metricsResponse.json();
          setSystemMetrics(metrics);
        }
        
        // Fetch processes
        const processesResponse = await fetch('http://localhost:5000/api/processes');
        if (processesResponse.ok) {
          const processes = await processesResponse.json();
          setProcesses(processes);
        }
        
        // Fetch connections
        const connectionsResponse = await fetch('http://localhost:5000/api/network/connections');
        if (connectionsResponse.ok) {
          const connections = await connectionsResponse.json();
          setNetworkConnections(connections);
        }
        
        // Fetch events
        const eventsResponse = await fetch('http://localhost:5000/api/security/events');
        if (eventsResponse.ok) {
          const events = await eventsResponse.json();
          setSecurityEvents(events);
        }
      } catch (error) {
        console.error("Error fetching backup data:", error);
      }
    };
    
    // If not connected after 3 seconds, try HTTP fallback
    const fallbackTimer = setTimeout(() => {
      if (!isConnected) {
        console.log("Socket not connected, using HTTP fallback");
        fetchBackupData();
      }
    }, 3000);

    // Clean up
    return () => {
      clearTimeout(fallbackTimer);
      
      if (socket) {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);
        socket.off("network-connections", onNetworkConnections);
        socket.off("security-events", onSecurityEvents);
        socket.off("system-metrics", onSystemMetrics);
        socket.off("processes", onProcesses);
      }
    };
  }, [isConnected]);

  return {
    isConnected,
    networkConnections,
    securityEvents,
    systemMetrics,
    processes
  };
} 