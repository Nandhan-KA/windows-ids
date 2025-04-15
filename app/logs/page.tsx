"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Database, RefreshCw, Server, ShieldAlert, XCircle } from "lucide-react"
import { getAttacksFromMongoDB, getUSBDevicesFromMongoDB, getIDSEventsFromMongoDB, sendToMongoDB } from "../services/mongodb"

interface LogEntry {
  timestamp: string;
  message: string;
  status: 'success' | 'error' | 'info';
  type: 'mongodb' | 'system' | 'attack';
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [attackCount, setAttackCount] = useState<number>(0)
  const [usbCount, setUsbCount] = useState<number>(0)
  const [idsCount, setIdsCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get tab from URL or default to 'all'
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<string>(tabParam || 'all')
  
  // Function to change the tab and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/logs?tab=${value}`)
  }

  // Function to add a log entry
  const addLog = (message: string, status: 'success' | 'error' | 'info', type: 'mongodb' | 'system' | 'attack') => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      message,
      status,
      type
    }
    setLogs(prev => [newLog, ...prev])
  }

  // Check MongoDB connection and fetch data
  const checkMongoDBStatus = async () => {
    setIsLoading(true)
    setConnectionStatus('checking')
    addLog('Checking MongoDB connection...', 'info', 'system')

    try {
      // Fetch data from MongoDB to verify connection
      const attacks = await getAttacksFromMongoDB()
      const usbDevices = await getUSBDevicesFromMongoDB()
      const idsEvents = await getIDSEventsFromMongoDB()

      // Update counts
      setAttackCount(attacks.length)
      setUsbCount(usbDevices.length)
      setIdsCount(idsEvents.length)

      // Update connection status
      setConnectionStatus('connected')
      addLog('MongoDB connection successful', 'success', 'mongodb')
      
      // Add logs about the data
      addLog(`Found ${attacks.length} attacks in MongoDB`, 'info', 'mongodb')
      addLog(`Found ${usbDevices.length} USB devices in MongoDB`, 'info', 'mongodb')
      addLog(`Found ${idsEvents.length} IDS events in MongoDB`, 'info', 'mongodb')
    } catch (error) {
      console.error('Error checking MongoDB status:', error)
      setConnectionStatus('disconnected')
      addLog('Failed to connect to MongoDB', 'error', 'mongodb')
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize: Check MongoDB status on component mount and handle URL params
  useEffect(() => {
    checkMongoDBStatus()
    
    // Update active tab from URL if needed
    if (tabParam) {
      setActiveTab(tabParam)
    }
    
    // Setup event listener for MongoDB operations
    const handleMongoDBOperation = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail && detail.operation) {
        addLog(detail.message || 'MongoDB operation performed', detail.success ? 'success' : 'error', 'mongodb')
        // Refresh data if needed
        if (detail.success && detail.refresh) {
          checkMongoDBStatus()
        }
      }
    }
    
    // Listen for custom MongoDB operation events
    window.addEventListener('mongodb-operation', handleMongoDBOperation)
    
    // Add event listener for simulated attacks to log them
    const handleAttackEvent = (event: Event) => {
      const attackData = (event as CustomEvent).detail
      if (attackData) {
        addLog(`New ${attackData.threat_type || 'unknown'} attack detected (${attackData.severity || 'unknown'} severity)`, 'info', 'attack')
        // Refresh MongoDB data after a short delay to allow for save operation
        setTimeout(() => checkMongoDBStatus(), 1000)
      }
    }
    
    window.addEventListener('simulated-attack', handleAttackEvent)
    
    return () => {
      window.removeEventListener('mongodb-operation', handleMongoDBOperation)
      window.removeEventListener('simulated-attack', handleAttackEvent)
    }
  }, [])

  // Add this function within the component
  const sendTestDataToMongoDB = async () => {
    setIsLoading(true);
    addLog('Sending test data to MongoDB...', 'info', 'system');

    try {
      // Create test data
      const testData = {
        id: `test-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'test',
        severity: 'info',
        source_ip: '127.0.0.1',
        target: 'MongoDB',
        title: 'MongoDB Test Entry',
        description: 'This is a test entry to verify MongoDB connection',
        status: 'active'
      };

      // Send to MongoDB
      const success = await sendToMongoDB(testData);

      if (success) {
        addLog('Test data sent successfully to MongoDB', 'success', 'mongodb');
        setConnectionStatus('connected');
        // Refresh data counts
        setTimeout(() => checkMongoDBStatus(), 1000);
      } else {
        addLog('Failed to send test data to MongoDB', 'error', 'mongodb');
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error sending test data:', error);
      addLog(`Error sending test data: ${error}`, 'error', 'mongodb');
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground">Monitor system events and MongoDB data storage</p>
        </div>
        
        <Button onClick={checkMongoDBStatus} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">MongoDB Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {connectionStatus === 'connected' && (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
              {connectionStatus === 'disconnected' && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
              {connectionStatus === 'checking' && (
                <Badge variant="outline">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Checking...
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Stored Data</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 text-sm">
              <div>
                <p className="text-muted-foreground">Attacks</p>
                <p className="text-2xl font-bold">{attackCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">USB Devices</p>
                <p className="text-2xl font-bold">{usbCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">IDS Events</p>
                <p className="text-2xl font-bold">{idsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="text-muted-foreground">Last checked</p>
              <p className="font-bold">{new Date().toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Test MongoDB</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={sendTestDataToMongoDB} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending Test...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Send Test Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Logs</TabsTrigger>
          <TabsTrigger value="mongodb">MongoDB</TabsTrigger>
          <TabsTrigger value="attacks">Attacks</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                View all system events and MongoDB operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                <div className="space-y-2 pr-4">
                  {logs.length > 0 ? logs.map((log, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <div className="pt-0.5">
                        {log.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {log.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {log.status === 'info' && <AlertCircle className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.type === 'mongodb' && 'MongoDB'}
                            {log.type === 'system' && 'System'}
                            {log.type === 'attack' && 'Attack'}
                          </Badge>
                        </div>
                        <p>{log.message}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No logs available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" onClick={() => setLogs([])}>
                Clear Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="mongodb" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>MongoDB Logs</CardTitle>
                  <CardDescription>
                    View all MongoDB operations and data storage events
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={checkMongoDBStatus} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                <div className="space-y-2 pr-4">
                  {logs.filter(log => log.type === 'mongodb').length > 0 ? 
                    logs.filter(log => log.type === 'mongodb').map((log, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <div className="pt-0.5">
                        {log.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {log.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {log.status === 'info' && <AlertCircle className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p>{log.message}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No MongoDB logs available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attacks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Attack Logs</CardTitle>
              <CardDescription>
                View all detected attack events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                <div className="space-y-2 pr-4">
                  {logs.filter(log => log.type === 'attack').length > 0 ? 
                    logs.filter(log => log.type === 'attack').map((log, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <div className="pt-0.5">
                        <ShieldAlert className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p>{log.message}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No attack logs available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                View general system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                <div className="space-y-2 pr-4">
                  {logs.filter(log => log.type === 'system').length > 0 ? 
                    logs.filter(log => log.type === 'system').map((log, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <div className="pt-0.5">
                        {log.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {log.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {log.status === 'info' && <AlertCircle className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p>{log.message}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No system logs available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
