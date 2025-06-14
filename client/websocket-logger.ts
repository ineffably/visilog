import type { 
  LoggerConfig, 
  LogMessage, 
  LogLevel, 
  ServerMessage, 
  ClientMessage,
  LogHandler,
  ErrorHandler 
} from '../types';

export class WebSocketLogger {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private messageQueue: LogMessage[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private logHandlers: LogHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];

  private config: LoggerConfig = {
    enableWebSocket: true,
    enableConsole: true,
    minLevel: 0, // 0=debug, 1=log, 2=info, 3=warn, 4=error
    websocketUrl: 'ws://localhost:3001',
    maxRetries: 5,
    retryInterval: 2000,
    autoConnect: true,
    namespace: undefined
  };

  private levels: LogLevel[] = [
    { name: 'debug', priority: 0, color: '#888888' },
    { name: 'log', priority: 1, color: '#000000' },
    { name: 'info', priority: 2, color: '#0066cc' },
    { name: 'warn', priority: 3, color: '#ff9900' },
    { name: 'error', priority: 4, color: '#cc0000' }
  ];

  // Store original console methods
  private originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console)
  };

  private consoleOverridden = false;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...this.config, ...config };
    
    if (this.config.autoConnect) {
      this.init();
    }
  }

  public init(): void {
    if (this.config.enableWebSocket) {
      this.connectWebSocket();
    }
    
    this.log('🔌 WebSocketLogger initialized', { 
      config: this.sanitizeConfig(this.config),
      url: this.getUrl(),
      userAgent: this.getUserAgent()
    });
  }

  public enableConsoleOverride(): void {
    if (this.consoleOverridden) return;
    
    // Override console methods
    console.log = (...args: any[]) => {
      this.handleLog('log', args);
    };

    console.info = (...args: any[]) => {
      this.handleLog('info', args);
    };

    console.warn = (...args: any[]) => {
      this.handleLog('warn', args);
    };

    console.error = (...args: any[]) => {
      this.handleLog('error', args);
    };

    console.debug = (...args: any[]) => {
      this.handleLog('debug', args);
    };

    this.consoleOverridden = true;
  }

  public disableConsoleOverride(): void {
    if (!this.consoleOverridden) return;

    // Restore original console methods
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;

    this.consoleOverridden = false;
  }

  private connectWebSocket(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.config.websocketUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.originalConsole.log('🔌 Connected to logging server');
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Process queued messages
        this.processMessageQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: ServerMessage = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (error) {
          this.handleError(error as Error, 'Failed to parse server message');
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.stopHeartbeat();
        this.originalConsole.warn('🔌 Disconnected from logging server');
        this.scheduleReconnect();
      };

      this.ws.onerror = (_error) => {
        this.isConnecting = false;
        this.stopHeartbeat();
        this.handleError(new Error('WebSocket connection error'), 'WebSocket error');
        this.scheduleReconnect();
      };

    } catch (error) {
      this.isConnecting = false;
      this.handleError(error as Error, 'Failed to connect to logging server');
      this.scheduleReconnect();
    }
  }

  private handleServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'session-init':
        this.sessionId = message.sessionId || null;
        this.originalConsole.log(`📱 Session initialized: ${this.sessionId}`);
        break;
      case 'ping':
        this.sendMessage({ type: 'pong' });
        break;
      case 'error':
        this.handleError(new Error(message.message || 'Server error'), 'Server error');
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxRetries) {
      this.originalConsole.warn(`🔌 Max reconnection attempts (${this.config.maxRetries}) reached. Switching to console-only mode.`);
      this.config.enableWebSocket = false;
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.config.retryInterval * Math.pow(2, this.reconnectAttempts); // Exponential backoff
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.originalConsole.log(`🔌 Reconnection attempt ${this.reconnectAttempts}/${this.config.maxRetries}`);
      this.connectWebSocket();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping' });
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendLogMessage(message);
      }
    }
  }

  private sendMessage(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        this.handleError(error as Error, 'Failed to send message');
      }
    }
  }

  private sendLogMessage(logMessage: LogMessage): void {
    if (!this.config.enableWebSocket) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.sendMessage({ type: 'log', log: logMessage });
      } catch (error) {
        this.handleError(error as Error, 'Failed to send log message');
        this.messageQueue.push(logMessage); // Re-queue the message
      }
    } else {
      // Queue message for later
      this.messageQueue.push(logMessage);
      
      // Limit queue size to prevent memory issues
      if (this.messageQueue.length > 1000) {
        this.messageQueue.shift(); // Remove oldest message
      }
    }
  }

  private createLogMessage(level: LogLevel['name'], message: string, data?: any): LogMessage {
    const logMessage: LogMessage = {
      level,
      message,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId || 'unknown',
      url: this.getUrl(),
      userAgent: this.getUserAgent(),
      data
    };

    if (this.config.namespace) {
      logMessage.namespace = this.config.namespace;
    }

    return logMessage;
  }

  private handleLog(level: LogLevel['name'], args: any[]): void {
    const levelInfo = this.levels.find(l => l.name === level);
    if (!levelInfo) return;

    // Check if this level should be logged
    if (levelInfo.priority < this.config.minLevel) {
      return;
    }

    // Format message
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    // Extract data objects for structured logging
    const dataObjects = args.filter(arg => typeof arg === 'object' && arg !== null);
    const data = dataObjects.length > 0 ? dataObjects : undefined;

    // Call original console method if enabled
    if (this.config.enableConsole) {
      this.originalConsole[level](...args);
    }

    // Create and send log message
    const logMessage = this.createLogMessage(level, message, data);
    
    // Notify handlers
    this.logHandlers.forEach(handler => {
      try {
        handler(logMessage);
      } catch (error) {
        this.handleError(error as Error, 'Log handler error');
      }
    });

    // Send to remote logger
    this.sendLogMessage(logMessage);
  }

  private handleError(error: Error, context?: string): void {
    this.originalConsole.error(`❌ WebSocketLogger Error${context ? ` (${context})` : ''}:`, error);
    
    this.errorHandlers.forEach(handler => {
      try {
        handler(error, context);
      } catch (handlerError) {
        this.originalConsole.error('❌ Error handler failed:', handlerError);
      }
    });
  }

  private getUrl(): string {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.href;
    }
    return 'unknown';
  }

  private getUserAgent(): string {
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      return navigator.userAgent;
    }
    return 'unknown';
  }

  private sanitizeConfig(config: LoggerConfig): Partial<LoggerConfig> {
    // Return config without sensitive data for logging
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { websocketUrl, ...sanitized } = config;
    return { ...sanitized, websocketUrl: '***' };
  }

  // Public logging methods
  public log(message: string, data?: any): void {
    this.handleLog('log', [message, data].filter(Boolean));
  }

  public info(message: string, data?: any): void {
    this.handleLog('info', [message, data].filter(Boolean));
  }

  public warn(message: string, data?: any): void {
    this.handleLog('warn', [message, data].filter(Boolean));
  }

  public error(message: string, data?: any): void {
    this.handleLog('error', [message, data].filter(Boolean));
  }

  public debug(message: string, data?: any): void {
    this.handleLog('debug', [message, data].filter(Boolean));
  }

  // Configuration methods
  public setMinLevel(level: LogLevel['name']): void {
    const levelInfo = this.levels.find(l => l.name === level);
    if (levelInfo) {
      this.config.minLevel = levelInfo.priority;
      this.log(`🔧 Log level set to: ${level}`);
    }
  }

  public enableWebSocketLogging(enable: boolean): void {
    this.config.enableWebSocket = enable;
    if (enable && !this.ws) {
      this.connectWebSocket();
    } else if (!enable && this.ws) {
      this.disconnect();
    }
    this.log(`🔧 WebSocket logging ${enable ? 'enabled' : 'disabled'}`);
  }

  public enableConsoleLogging(enable: boolean): void {
    this.config.enableConsole = enable;
    this.log(`🔧 Console logging ${enable ? 'enabled' : 'disabled'}`);
  }

  public updateConfig(config: Partial<LoggerConfig>): void {
    const oldUrl = this.config.websocketUrl;
    this.config = { ...this.config, ...config };
    
    // Reconnect if URL changed and we're connected
    if (config.websocketUrl && config.websocketUrl !== oldUrl && this.ws) {
      this.disconnect();
      this.connectWebSocket();
    }
  }

  // Event handlers
  public onLog(handler: LogHandler): () => void {
    this.logHandlers.push(handler);
    return () => {
      const index = this.logHandlers.indexOf(handler);
      if (index > -1) {
        this.logHandlers.splice(index, 1);
      }
    };
  }

  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  // Utility methods
  public getSessionId(): string | null {
    return this.sessionId;
  }

  public getQueueSize(): number {
    return this.messageQueue.length;
  }

  public getConnectionStatus(): string {
    if (!this.config.enableWebSocket) return 'disabled';
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Connection management
  public connect(): void {
    if (!this.config.enableWebSocket) {
      this.config.enableWebSocket = true;
    }
    this.connectWebSocket();
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.sessionId = null;
    this.reconnectAttempts = 0;
  }

  // Cleanup
  public destroy(): void {
    this.disconnect();
    this.disableConsoleOverride();
    this.logHandlers = [];
    this.errorHandlers = [];
    this.messageQueue = [];
  }
} 