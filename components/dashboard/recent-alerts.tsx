"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWebsocket } from "@/hooks/useWebsocket"
import { Bell, Eye, Filter, RefreshCcw, Shield, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export default function RecentAlerts() {
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewAlertBadge, setShowNewAlertBadge] = useState(false);

  const { securityEvents, refreshData } = useWebsocket()

  // Monitor for new alerts
  useEffect(() => {
    if (securityEvents && securityEvents.length > 0) {
      // Show "New" badge for 5 seconds when new alerts come in
      setShowNewAlertBadge(true);
      const timer = setTimeout(() => {
        setShowNewAlertBadge(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [securityEvents]);

  const handleRefresh = () => {
    setIsLoading(true);
    refreshData();
    setTimeout(() => setIsLoading(false), 800);
  };

  const toggleAlertSelection = (index: number) => {
    setSelectedAlert(selectedAlert === index ? null : index);
  };

  const toggleFilter = (status: string) => {
    setFilterStatus(filterStatus === status ? null : status);
  };

  const getFilteredAlerts = () => {
    if (!securityEvents || securityEvents.length === 0) return [];
    
    if (filterStatus) {
      return securityEvents.filter(
        event => event.severity?.toLowerCase() === filterStatus.toLowerCase()
      );
    }
    
    return securityEvents;
  };

  const getAlertIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const filteredAlerts = getFilteredAlerts();

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-primary" />
            Recent Alerts
          </CardTitle>
          {showNewAlertBadge && (
            <Badge variant="destructive" className="animate-pulse">New</Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 transition-transform duration-200 hover:scale-105"
            onClick={() => toggleFilter('critical')}
            data-state={filterStatus === 'critical' ? 'selected' : 'unselected'}
          >
            <AlertCircle className={cn(
              "h-4 w-4", 
              filterStatus === 'critical' 
                ? "text-red-500" 
                : "text-muted-foreground"
            )} />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 transition-transform duration-200 hover:scale-105"
            onClick={() => toggleFilter('warning')}
            data-state={filterStatus === 'warning' ? 'selected' : 'unselected'}
          >
            <AlertTriangle className={cn(
              "h-4 w-4", 
              filterStatus === 'warning' 
                ? "text-amber-500" 
                : "text-muted-foreground"
            )} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 transition-transform duration-200 hover:scale-105"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-auto pr-1">
          {filteredAlerts.length > 0 ? (
            <>
              {filteredAlerts.map((alert, i) => (
                <div 
                  key={i}
                  className={cn(
                    "border rounded-lg p-3 transition-all duration-200 cursor-pointer relative overflow-hidden",
                    selectedAlert === i 
                      ? "border-primary/50 ring-1 ring-primary/20 transform scale-[1.02]" 
                      : "hover:border-primary/30",
                    alert.severity?.toLowerCase() === 'critical' 
                      ? "bg-red-500/5 border-red-500/20" 
                      : alert.severity?.toLowerCase() === 'warning'
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-blue-500/5 border-blue-500/20"
                  )}
                  onClick={() => toggleAlertSelection(i)}
                >
                  {/* Animated left border indicator */}
                  <div 
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      alert.severity?.toLowerCase() === 'critical' 
                        ? "bg-red-500" 
                        : alert.severity?.toLowerCase() === 'warning'
                          ? "bg-amber-500"
                          : "bg-blue-500"
                    )}
                  />
                  
                  <div className="pl-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getAlertIcon(alert.severity || 'info')}
                        <h4 className="font-medium">{alert.title || alert.type || 'Security Alert'}</h4>
                      </div>
                      <Badge 
                        variant={
                          alert.severity?.toLowerCase() === 'critical' 
                            ? "destructive" 
                            : alert.severity?.toLowerCase() === 'warning'
                              ? "outline" 
                              : "secondary"
                        }
                        className={cn(
                          "transition-all",
                          alert.severity?.toLowerCase() === 'critical' && "animate-pulse"
                        )}
                      >
                        {alert.severity || 'Info'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-1">
                      {alert.message || alert.description || 'No details available'}
                    </p>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>
                        {alert.timestamp 
                          ? new Date(alert.timestamp).toLocaleString() 
                          : new Date().toLocaleString()
                        }
                      </span>
                      
                      {selectedAlert === i && (
                        <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-right-5 duration-300">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <Eye className="h-3 w-3" />
                            Details
                          </Button>
                          <Button size="sm" variant="default" className="h-7 text-xs gap-1">
                            <Shield className="h-3 w-3" />
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-lg">
              <Shield className="h-10 w-10 mb-4 text-muted-foreground/30" />
              <p className="mb-2">No alerts{filterStatus ? ` with ${filterStatus} severity` : ''}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={() => {setFilterStatus(null); handleRefresh();}}
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Show all alerts
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
