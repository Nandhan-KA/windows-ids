/**
 * WebSocket Manager
 * 
 * A resilient WebSocket client that handles connections, reconnections,
 * and provides a consistent API for sending and receiving messages.
 */

// Custom types
export type MessageHandler = (data: any) => void;
export type ConnectionHandler = () => void;
export type ErrorHandler = (error: Event) => void;

interface WebSocketManagerOptions {
  url: string;
  pingInterval?: number;  // in milliseconds
  maxReconnectAttempts?: number;
  debug?: boolean;
}

export class WebSocketManager {
  private socket: WebSocket | null = null;
  private url: string;
  private pingIntervalId: number | null = null;
  private reconnectTimeoutId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private pingInterval: number;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectHandlers: Set<ConnectionHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private debug: boolean;
  private connected = false;
  
  constructor(options: WebSocketManagerOptions) {
    this.url = options.url;
    this.pingInterval = options.pingInterval || 30000; // 30 seconds by default
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.debug = options.debug || false;
    
    // Try to connect immediately
    this.connect();
  }
  
  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      this.logDebug('WebSocket already connected or connecting');
      return;
    }
    
    this.logDebug(`Connecting to WebSocket at ${this.url}`);
    
    try {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
    } catch (error) {
      this.logDebug('Error creating WebSocket', error);
      this.reconnect();
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.stopPingInterval();
    this.cancelReconnect();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.connected = false;
  }
  
  /**
   * Send a message to the WebSocket server
   */
  public send(type: string, data: any = {}): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.logDebug('Cannot send message, socket not open');
      return false;
    }
    
    try {
      const message = JSON.stringify({ type, data });
      this.socket.send(message);
      return true;
    } catch (error) {
      this.logDebug('Error sending message', error);
      return false;
    }
  }
  
  /**
   * Add a message handler for a specific message type
   */
  public onMessage(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }
  
  /**
   * Add a connection handler
   */
  public onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.add(handler);
    
    // Call immediately if already connected
    if (this.connected) {
      handler();
    }
    
    // Return unsubscribe function
    return () => {
      this.connectHandlers.delete(handler);
    };
  }
  
  /**
   * Add an error handler
   */
  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.errorHandlers.delete(handler);
    };
  }
  
  /**
   * Check if the WebSocket is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.logDebug('WebSocket connected');
    this.connected = true;
    this.reconnectAttempts = 0;
    
    // Notify all connect handlers
    this.connectHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        this.logDebug('Error in connect handler', error);
      }
    });
    
    // Start ping interval
    this.startPingInterval();
  }
  
  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      const type = message.type;
      
      if (type === 'pong') {
        this.logDebug('Received pong');
        return;
      }
      
      // Call message handlers for this type
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            this.logDebug(`Error in message handler for type ${type}`, error);
          }
        });
      }
      
      // Call message handlers for '*' (all messages)
      const allHandlers = this.messageHandlers.get('*');
      if (allHandlers) {
        allHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            this.logDebug('Error in wildcard message handler', error);
          }
        });
      }
    } catch (error) {
      this.logDebug('Error parsing message', error);
    }
  }
  
  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    this.logDebug('WebSocket error', event);
    
    // Notify all error handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        this.logDebug('Error in error handler', error);
      }
    });
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.logDebug(`WebSocket closed: ${event.code} ${event.reason}`);
    this.connected = false;
    this.stopPingInterval();
    
    // Attempt to reconnect
    this.reconnect();
  }
  
  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    
    this.pingIntervalId = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send('ping');
      }
    }, this.pingInterval);
  }
  
  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingIntervalId !== null) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }
  
  /**
   * Attempt to reconnect with exponential backoff
   */
  private reconnect(): void {
    this.cancelReconnect();
    
    // Check if we've reached max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logDebug(`Max reconnect attempts (${this.maxReconnectAttempts}) reached, giving up`);
      return;
    }
    
    // Calculate backoff time
    const backoff = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    this.logDebug(`Reconnecting in ${backoff}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeoutId = window.setTimeout(() => {
      this.connect();
    }, backoff);
  }
  
  /**
   * Cancel reconnect timeout
   */
  private cancelReconnect(): void {
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }
  
  /**
   * Log debug messages if debug is enabled
   */
  private logDebug(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[WebSocketManager] ${message}`, ...args);
    }
  }
} 