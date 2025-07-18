import * as fs from 'fs';
import * as path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
// import { createHash } from 'crypto';
import type { 
  LogMessage, 
  SessionInfo, 
  ServerConfig, 
  ServerMessage, 
  ClientMessage,
  SessionIndex,
  SessionIndexEntry,
  SessionHandler,
  LogHandler,
  ErrorHandler
} from '../types';

interface Session extends SessionInfo {
  ws: WebSocket;
  logFile: string;
}

export class WebSocketLoggerServer {
  private wss: WebSocketServer | null = null;
  private sessions: Map<string, Session> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  private sessionHandlers: SessionHandler[] = [];
  private logHandlers: LogHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];

  private config: ServerConfig = {
    port: 3001,
    host: '0.0.0.0',
    maxSessions: 50,
    cleanupThreshold: 75,
    cleanupAmount: 25,
    logsDir: path.join(process.cwd(), 'logs'),
    enableIndex: true,
    enableSessionLogs: true,
    cleanupInterval: 30 * 60 * 1000 // 30 minutes
  };

  private indexFile: string;

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = { ...this.config, ...config };
    this.indexFile = path.join(this.config.logsDir, 'index.json');
  }

  public async start(): Promise<void> {
    if (this.wss) {
      throw new Error('Server is already running');
    }

    try {
      // Create logs directory structure
      this.ensureDirectories();
      
      // Initialize WebSocket server
      this.wss = new WebSocketServer({ 
        port: this.config.port,
        host: this.config.host
      });
      
      this.setupWebSocketHandlers();
      this.startCleanupTimer();
      
      console.log(`🔌 WebSocket logging server started on ${this.config.host}:${this.config.port}`);
      console.log(`📁 Logs directory: ${this.config.logsDir}`);
      
      if (this.config.enableIndex) {
        this.initializeIndex();
      }
    } catch (error) {
      this.handleError(error as Error, 'Failed to start server');
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.wss) {
      return;
    }

    console.log('🛑 Shutting down logging server...');

    // Stop cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Close all connections
    this.sessions.forEach((session, sessionId) => {
      this.handleSessionClose(sessionId);
    });

    // Close server
    return new Promise((resolve, reject) => {
      this.wss!.close((error) => {
        if (error) {
          this.handleError(error, 'Error stopping server');
          reject(error);
        } else {
          this.wss = null;
          console.log('✅ Logging server stopped');
          resolve();
        }
      });
    });
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.config.logsDir)) {
      fs.mkdirSync(this.config.logsDir, { recursive: true });
    }
    
    if (this.config.enableSessionLogs) {
      const sessionsDir = path.join(this.config.logsDir, 'sessions');
      if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
      }
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws, request) => {
      const sessionId = this.generateSessionId();
      const sessionLogFile = this.config.enableSessionLogs 
        ? path.join(this.config.logsDir, 'sessions', `session-${sessionId}.log`)
        : '';
      
      const sessionInfo: SessionInfo = {
        id: sessionId,
        startTime: new Date(),
        lastActivity: new Date(),
        messageCount: 0
      };

      const session: Session = {
        ...sessionInfo,
        ws,
        logFile: sessionLogFile
      };
      
      this.sessions.set(sessionId, session);
      
      // Log session start
      const userAgent = request.headers['user-agent'] || 'unknown';
      const remoteAddress = request.socket.remoteAddress || 'unknown';
      const startMessage = `[SESSION-START] ${sessionId} - ${remoteAddress} - ${userAgent}`;
      
      if (this.config.enableIndex) {
        this.updateIndex();
      }
      
      if (this.config.enableSessionLogs && sessionLogFile) {
        this.logToFile(sessionLogFile, startMessage);
      }
      
      console.log(`📱 New session: ${sessionId} (${this.sessions.size} active)`);
      
      // Notify handlers
      this.sessionHandlers.forEach(handler => {
        try {
          handler(sessionInfo);
        } catch (error) {
          this.handleError(error as Error, 'Session handler error');
        }
      });
      
      // Send session ID to client
      this.sendMessage(ws, {
        type: 'session-init',
        sessionId: sessionId
      });
      
      ws.on('message', (data) => {
        try {
          const clientMessage: ClientMessage = JSON.parse(data.toString());
          this.handleClientMessage(sessionId, clientMessage);
        } catch (error) {
          this.handleError(error as Error, 'Failed to parse client message');
        }
      });
      
      ws.on('close', () => {
        this.handleSessionClose(sessionId);
      });
      
      ws.on('error', (error) => {
        this.handleError(error, `WebSocket error for session ${sessionId}`);
        this.handleSessionClose(sessionId);
      });
      
      // Check if cleanup is needed
      this.checkAndCleanupOldSessions();
    });

    this.wss.on('error', (error) => {
      this.handleError(error, 'WebSocket server error');
    });
  }

  private handleClientMessage(sessionId: string, message: ClientMessage): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    switch (message.type) {
      case 'log':
        if (message.log) {
          this.handleLogMessage(sessionId, message.log);
        }
        break;
      case 'ping':
        this.sendMessage(session.ws, { type: 'pong' });
        break;
      case 'pong':
        // Heartbeat received
        session.lastActivity = new Date();
        break;
    }
  }

  private sendMessage(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        this.handleError(error as Error, 'Failed to send message to client');
      }
    }
  }

  private generateSessionId(): string {
    // Generate a simple 8-character hash
    return Math.random().toString(36).substring(2, 10);
  }

  private handleLogMessage(sessionId: string, logMessage: LogMessage): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    session.lastActivity = new Date();
    session.messageCount++;
    
    // Format log entry
    const timestamp = new Date().toISOString();
    const formattedMessage = this.formatLogMessage(logMessage, timestamp);
    
    // Write to session log
    if (this.config.enableSessionLogs && session.logFile) {
      this.logToFile(session.logFile, formattedMessage);
    }
    
    // Update session index
    if (this.config.enableIndex) {
      this.updateIndex();
    }
    
    // Console output for immediate debugging
    const shortSessionId = sessionId.slice(-6);
    const namespacePrefix = logMessage.namespace ? `[${logMessage.namespace}] ` : '';
    const consoleMessage = `[${shortSessionId}] ${namespacePrefix}${logMessage.level.toUpperCase()}: ${logMessage.message}`;
    
    switch (logMessage.level) {
      case 'error':
        console.error(`🔴 ${consoleMessage}`);
        break;
      case 'warn':
        console.warn(`🟡 ${consoleMessage}`);
        break;
      case 'info':
        console.info(`ℹ️ ${consoleMessage}`);
        break;
      case 'debug':
        console.debug(`🔍 ${consoleMessage}`);
        break;
      case 'log':
      default:
        console.log(`📝 ${consoleMessage}`);
    }

    // Notify handlers
    this.logHandlers.forEach(handler => {
      try {
        handler(logMessage);
      } catch (error) {
        this.handleError(error as Error, 'Log handler error');
      }
    });
  }

  private formatLogMessage(logMessage: LogMessage, timestamp: string): string {
    // Create a structured log entry in JSON format
    const logEntry = {
      timestamp,
      level: logMessage.level,
      message: logMessage.message,
      sessionId: logMessage.sessionId,
      url: logMessage.url,
      ...(logMessage.namespace && { namespace: logMessage.namespace }),
      ...(logMessage.data && { data: logMessage.data })
    };

    try {
      return JSON.stringify(logEntry);
    } catch (error) {
      // Fallback if JSON serialization fails
      const fallbackEntry = {
        timestamp,
        level: logMessage.level,
        message: logMessage.message,
        sessionId: logMessage.sessionId,
        url: logMessage.url,
        error: 'Failed to serialize log data',
        originalError: error instanceof Error ? error.message : String(error)
      };
      return JSON.stringify(fallbackEntry);
    }
  }

  private logToFile(filePath: string, message: string): void {
    try {
      const logEntry = `${message}\n`;
      fs.appendFileSync(filePath, logEntry);
    } catch (error) {
      this.handleError(error as Error, `Failed to write to log file: ${filePath}`);
    }
  }

  private initializeIndex(): void {
    if (!this.config.enableIndex) return;
    
    const index: SessionIndex = {
      lastUpdated: new Date().toISOString(),
      totalSessions: 0,
      activeSessions: 0,
      sessions: []
    };
    
    this.writeIndex(index);
  }

  private writeIndex(index: SessionIndex): void {
    try {
      fs.writeFileSync(this.indexFile, JSON.stringify(index, null, 2));
    } catch (error) {
      this.handleError(error as Error, `Failed to write index file: ${this.indexFile}`);
    }
  }

  private readIndex(): SessionIndex {
    try {
      if (fs.existsSync(this.indexFile)) {
        const data = fs.readFileSync(this.indexFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      this.handleError(error as Error, `Failed to read index file: ${this.indexFile}`);
    }
    
    // Return default index if file doesn't exist or there's an error
    return {
      lastUpdated: new Date().toISOString(),
      totalSessions: 0,
      activeSessions: 0,
      sessions: []
    };
  }

  private updateIndex(): void {
    if (!this.config.enableIndex) return;
    
    const index = this.readIndex();
    const activeSessions = Array.from(this.sessions.values());
    
    // Update active sessions
    index.activeSessions = activeSessions.length;
    index.lastUpdated = new Date().toISOString();
    
    // Update session entries for active sessions
    activeSessions.forEach(session => {
      const existingEntry = index.sessions.find(entry => entry.id === session.id);
      if (existingEntry) {
        existingEntry.messageCount = session.messageCount;
        existingEntry.status = 'active';
      } else {
        const newEntry: SessionIndexEntry = {
          id: session.id,
          startTime: session.startTime.toISOString(),
          messageCount: session.messageCount,
          namespace: session.namespace,
          logFile: path.relative(this.config.logsDir, session.logFile),
          status: 'active'
        };
        index.sessions.push(newEntry);
        index.totalSessions = Math.max(index.totalSessions, index.sessions.length);
      }
    });
    
    this.writeIndex(index);
  }

  private updateSessionInIndex(sessionId: string, status: 'completed', endTime?: Date, duration?: number): void {
    if (!this.config.enableIndex) return;
    
    const index = this.readIndex();
    const sessionEntry = index.sessions.find(entry => entry.id === sessionId);
    
    if (sessionEntry) {
      sessionEntry.status = status;
      if (endTime) {
        sessionEntry.endTime = endTime.toISOString();
      }
      if (duration) {
        sessionEntry.duration = duration;
      }
      
      // Update active sessions count
      index.activeSessions = Array.from(this.sessions.values()).length;
      index.lastUpdated = new Date().toISOString();
      
      this.writeIndex(index);
    }
  }

  private handleSessionClose(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const duration = Date.now() - session.startTime.getTime();
    const endMessage = `[SESSION-END] ${sessionId} - Duration: ${Math.round(duration / 1000)}s - Messages: ${session.messageCount}`;
    
    if (this.config.enableIndex) {
      this.updateSessionInIndex(sessionId, 'completed', new Date(), Math.round(duration / 1000));
    }
    
    if (this.config.enableSessionLogs && session.logFile) {
      this.logToFile(session.logFile, endMessage);
    }
    
    console.log(`👋 Session ended: ${sessionId} (${session.messageCount} messages, ${Math.round(duration / 1000)}s)`);
    
    this.sessions.delete(sessionId);
  }

  private checkAndCleanupOldSessions(): void {
    if (!this.config.enableSessionLogs) return;

    const sessionsDir = path.join(this.config.logsDir, 'sessions');
    
    try {
      const files = fs.readdirSync(sessionsDir).filter(f => f.startsWith('session-') && f.endsWith('.log'));
      
      if (files.length >= this.config.cleanupThreshold) {
        console.log(`🧹 Session cleanup triggered: ${files.length} files found (threshold: ${this.config.cleanupThreshold})`);
        this.cleanupOldSessionFiles(files);
      }
    } catch (error) {
      this.handleError(error as Error, 'Failed to check session files');
    }
  }

  private cleanupOldSessionFiles(files: string[]): void {
    const sessionsDir = path.join(this.config.logsDir, 'sessions');
    
    try {
      // Get file stats and sort by creation time
      const fileInfos = files
        .map(file => {
          const filePath = path.join(sessionsDir, file);
          const stats = fs.statSync(filePath);
          return { file, path: filePath, mtime: stats.mtime };
        })
        .sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
      
      // Delete oldest files
      const filesToDelete = fileInfos.slice(0, this.config.cleanupAmount);
      const remainingFiles = fileInfos.length - filesToDelete.length;
      
      filesToDelete.forEach(fileInfo => {
        try {
          fs.unlinkSync(fileInfo.path);
          console.log(`🗑️ Deleted old session log: ${fileInfo.file}`);
        } catch (error) {
          this.handleError(error as Error, `Failed to delete ${fileInfo.file}`);
        }
      });
      
      console.log(`✅ Cleanup complete: ${filesToDelete.length} files deleted, ${remainingFiles} remaining`);
    } catch (error) {
      this.handleError(error as Error, 'Cleanup process failed');
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      console.log(`🔍 Periodic cleanup check: ${this.sessions.size} active sessions`);
      this.checkAndCleanupOldSessions();
    }, this.config.cleanupInterval);
  }

  private handleError(error: Error, context?: string): void {
    console.error(`❌ WebSocketLoggerServer Error${context ? ` (${context})` : ''}:`, error);
    
    this.errorHandlers.forEach(handler => {
      try {
        const errorContext = context ? {
          operation: context,
          component: 'WebSocketLoggerServer',
          timestamp: new Date().toISOString()
        } : undefined;
        handler(error, errorContext);
      } catch (handlerError) {
        console.error('❌ Error handler failed:', handlerError);
      }
    });
  }

  // Event handlers
  public onSession(handler: SessionHandler): () => void {
    this.sessionHandlers.push(handler);
    return () => {
      const index = this.sessionHandlers.indexOf(handler);
      if (index > -1) {
        this.sessionHandlers.splice(index, 1);
      }
    };
  }

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
  public getStats() {
    return {
      activeSessions: this.sessions.size,
      logsDirectory: this.config.logsDir,
      indexFile: this.indexFile,
      maxSessions: this.config.maxSessions,
      cleanupThreshold: this.config.cleanupThreshold,
      config: this.config,
      isRunning: this.wss !== null
    };
  }

  public getSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      messageCount: session.messageCount,
      namespace: session.namespace
    }));
  }

  public getSession(sessionId: string): SessionInfo | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      messageCount: session.messageCount,
      namespace: session.namespace
    };
  }

  public updateConfig(config: Partial<ServerConfig>): void {
    this.config = { ...this.config, ...config };
    this.indexFile = path.join(this.config.logsDir, 'index.json');
    
    // Restart cleanup timer if interval changed
    if (config.cleanupInterval !== undefined) {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }
      this.startCleanupTimer();
    }
  }

  public isRunning(): boolean {
    return this.wss !== null;
  }

  // Graceful shutdown handling
  public setupGracefulShutdown(): void {
    const shutdown = async () => {
      console.log('\n🛑 Received shutdown signal...');
      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
} 