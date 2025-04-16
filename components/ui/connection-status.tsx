'use client';

import { useState, useEffect } from 'react';
import { useWebsocket } from '@/hooks/useWebsocket';
import { useWebSocketContext } from '@/providers/websocket-provider';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ConnectionStatus() {
  const { isConnected: apiConnected, refreshData } = useWebsocket();
  const { connected: wsConnected, socket } = useWebSocketContext();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    if (apiConnected) {
      setLastUpdated(new Date());
    }
  }, [apiConnected]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh API data
      refreshData();
      
      // Refresh WebSocket connection if needed
      if (!wsConnected && socket) {
        socket.connect();
      }
      
      // Update timestamp
      setLastUpdated(new Date());
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };
  
  const getStatusText = () => {
    if (apiConnected && wsConnected) {
      return 'All connections active';
    } else if (apiConnected) {
      return 'API connected, WebSocket disconnected';
    } else if (wsConnected) {
      return 'WebSocket connected, API disconnected';
    } else {
      return 'All connections down';
    }
  };
  
  const getStatusClass = () => {
    if (apiConnected && wsConnected) {
      return 'text-green-500 dark:text-green-400';
    } else if (apiConnected || wsConnected) {
      return 'text-yellow-500 dark:text-yellow-400';
    } else {
      return 'text-red-500 dark:text-red-400';
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center cursor-pointer" onClick={handleRefresh}>
            <div className={cn('flex items-center mr-2', getStatusClass())}>
              {apiConnected && wsConnected ? (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-1" />
              )}
              <span className="text-xs hidden md:inline">
                {getStatusText()}
              </span>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0" 
              disabled={isRefreshing}
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
            >
              <RefreshCw className={cn(
                "h-3.5 w-3.5", 
                isRefreshing && "animate-spin"
              )} />
              <span className="sr-only">Refresh connection</span>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-sm">
            <p className="font-semibold mb-1">Connection Status</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span>API:</span>
              <span className={apiConnected ? 'text-green-500' : 'text-red-500'}>
                {apiConnected ? 'Connected' : 'Disconnected'}
              </span>
              <span>WebSocket:</span>
              <span className={wsConnected ? 'text-green-500' : 'text-red-500'}>
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
              {lastUpdated && (
                <>
                  <span>Last updated:</span>
                  <span>{lastUpdated.toLocaleTimeString()}</span>
                </>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 