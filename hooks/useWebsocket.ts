"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// Fast polling hook for real-time data updates
export function useWebsocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [networkConnections, setNetworkConnections] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any>({
    cpu_percent: 0,
    memory_percent: 0,
    disk_io_percent: 0,
    network_io_mbps: 0
  });
  const [processes, setProcesses] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchErrors, setFetchErrors] = useState<string[]>([]);
  
  // Use refs to track fetch state to avoid race conditions
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveErrorsRef = useRef(0);

  // Track performance metrics
  const performanceRef = useRef({
    totalFetches: 0,
    successfulFetches: 0,
    totalFetchTime: 0,
    minFetchTime: Number.MAX_VALUE,
    maxFetchTime: 0,
    lastPollInterval: 1000 // Default poll interval
  });

  // Function to reset the fetching state with a safety timeout
  const resetFetchingState = useCallback(() => {
    isFetchingRef.current = false;
    
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
  }, []);

  // Function to fetch data via optimized combined endpoint
  const fetchData = useCallback(async () => {
    // Prevent concurrent fetches with safety mechanism
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (isFetchingRef.current) {
      if (timeSinceLastFetch < 5000) { // Reduced safety timeout to 5 seconds
        // Skip logging this to reduce console spam
        return;
      } else {
        console.warn("Force resetting stuck fetch state after 5 seconds");
        resetFetchingState();
      }
    }
    
    // Allow fetches to happen very frequently but not cause overload
    if (timeSinceLastFetch < 100) { // Minimum 100ms between fetches
      return;
    }
    
    // Track fetch start time
    const fetchStartTime = Date.now();
    lastFetchTimeRef.current = fetchStartTime;
    isFetchingRef.current = true;
    
    // Set loading state only for initial load or after errors
    if (!isConnected || fetchErrors.length > 0) {
      setIsLoading(true);
    }
    
    // Set a shorter safety timeout
    fetchTimeoutRef.current = setTimeout(() => {
      if (isFetchingRef.current) {
        console.warn("Fetch operation timed out after 5 seconds, resetting state");
        resetFetchingState();
        setFetchErrors(prev => [...prev, "Fetch timeout"]);
        setIsLoading(false);
        consecutiveErrorsRef.current++;
      }
    }, 5000);
    
    try {
      // Use single combined endpoint for all data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/combined-data`);
      
      // Update performance metrics
      performanceRef.current.totalFetches++;
      
      if (response.ok) {
        const data = await response.json();
        
        // Debug logging to see what data is actually received
        console.log("Received data from combined endpoint:", {
          hasMetrics: !!data.metrics,
          hasConnections: Array.isArray(data.connections) && data.connections.length,
          hasProcesses: Array.isArray(data.processes) && data.processes.length,
          hasEvents: Array.isArray(data.events) && data.events.length
        });
        
        // Reset errors on success
        if (fetchErrors.length > 0) {
          setFetchErrors([]);
        }
        
        // Update all states with a single render batch
        if (data.metrics) {
          setSystemMetrics({
            cpu_percent: data.metrics.cpu_percent ?? 0,
            memory_percent: data.metrics.memory_percent ?? 0,
            disk_io_percent: data.metrics.disk_io_percent ?? 0,
            network_io_mbps: data.metrics.network_io_mbps ?? 0
          });
        }
        
        if (Array.isArray(data.connections)) {
          setNetworkConnections(data.connections);
        }
        
        if (Array.isArray(data.processes)) {
          setProcesses(data.processes);
        } else if (data.processes) {
          // Handle case where processes might not be an array
          console.warn("Processes data is not an array:", typeof data.processes);
          try {
            // Try to convert object to array if needed
            const processList = Object.values(data.processes);
            if (Array.isArray(processList)) {
              setProcesses(processList);
            }
          } catch (e) {
            console.error("Failed to convert processes data:", e);
          }
        }
        
        // Handle security events with multiple possible field names
        if (Array.isArray(data.events)) {
          setSecurityEvents(data.events);
        } else if (Array.isArray(data.security_events)) {
          setSecurityEvents(data.security_events);
        }
        
        // Reset consecutive errors and mark connection as successful
        consecutiveErrorsRef.current = 0;
        setIsConnected(true);
        setLastUpdated(new Date());
        performanceRef.current.successfulFetches++;
      } else {
        console.error("Failed to fetch combined data:", response.status);
        setFetchErrors(["Failed to fetch data"]);
        consecutiveErrorsRef.current++;
      }
      
    } catch (error) {
      console.error("Error in fetch operation:", error);
      setFetchErrors(["Network error"]);
      setIsConnected(false);
      consecutiveErrorsRef.current++;
    } finally {
      // Always reset the fetch state
      resetFetchingState();
      
      // Only update loading state if previously loading
      if (isLoading) {
        setIsLoading(false);
      }
      
      const fetchDuration = Date.now() - fetchStartTime;
      
      // Update performance metrics
      performanceRef.current.totalFetchTime += fetchDuration;
      performanceRef.current.minFetchTime = Math.min(performanceRef.current.minFetchTime, fetchDuration);
      performanceRef.current.maxFetchTime = Math.max(performanceRef.current.maxFetchTime, fetchDuration);
      
      // Calculate optimal polling interval
      let pollInterval: number;
      
      if (consecutiveErrorsRef.current > 3) {
        // Slow down polling on repeated errors (backoff strategy)
        pollInterval = 2000;
      } else if (fetchDuration < 200) {
        // Very fast response - can poll quickly (near real-time)
        pollInterval = 600; // Super responsive for high-performance backends
      } else if (fetchDuration < 500) {
        // Fast response - can poll frequently
        pollInterval = 800;
      } else {
        // Slower response - poll less frequently
        pollInterval = 1000;
      }
      
      // Store the interval for diagnostics
      performanceRef.current.lastPollInterval = pollInterval;
      
      // Log average performance every 20 fetches
      if (performanceRef.current.totalFetches % 20 === 0) {
        const avgTime = performanceRef.current.totalFetchTime / performanceRef.current.totalFetches;
        console.log(
          `Performance stats: Avg=${avgTime.toFixed(0)}ms, Min=${performanceRef.current.minFetchTime}ms, ` +
          `Max=${performanceRef.current.maxFetchTime}ms, Success Rate=${(performanceRef.current.successfulFetches / performanceRef.current.totalFetches * 100).toFixed(1)}%, ` +
          `Poll Interval=${pollInterval}ms`
        );
      }
      
      // Schedule next poll with optimal interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      pollingIntervalRef.current = setTimeout(() => {
        fetchData();
      }, pollInterval);
    }
  }, [isConnected, isLoading, fetchErrors.length, resetFetchingState]);

  // Set up data polling
  useEffect(() => {
    console.log("Setting up high-speed data polling...");
    
    // Reset performance metrics on mount
    performanceRef.current = {
      totalFetches: 0,
      successfulFetches: 0,
      totalFetchTime: 0,
      minFetchTime: Number.MAX_VALUE,
      maxFetchTime: 0,
      lastPollInterval: 1000
    };
    
    // Fetch data immediately on mount
    fetchData();
    
    return () => {
      console.log("Cleaning up data polling");
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchData]);

  return {
    isConnected,
    isLoading,
    lastUpdated,
    fetchErrors,
    networkConnections,
    securityEvents,
    systemMetrics,
    processes,
    refreshData: fetchData,
    pollInterval: performanceRef.current.lastPollInterval // Expose the current poll interval
  };
} 