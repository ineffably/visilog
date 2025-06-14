export interface LogLevel {
  name: 'log' | 'info' | 'warn' | 'error' | 'debug';
  priority: number;
  color: string;
}

export interface LoggerConfig {
  enableWebSocket: boolean;
  enableConsole: boolean;
  minLevel: number;
  websocketUrl: string;
  maxRetries: number;
  retryInterval: number;
  autoConnect: boolean;
  namespace?: string;
}

export interface LogMessage {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  sessionId: string;
  namespace?: string;
  url?: string;
  userAgent?: string;
  data?: any;
}

export interface SessionInfo {
  id: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  namespace?: string;
}

export interface SessionIndexEntry {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  messageCount: number;
  namespace?: string;
  logFile: string;
  status: 'active' | 'completed';
}

export interface SessionIndex {
  lastUpdated: string;
  totalSessions: number;
  activeSessions: number;
  sessions: SessionIndexEntry[];
}

export interface ServerConfig {
  port: number;
  host?: string;
  maxSessions: number;
  cleanupThreshold: number;
  cleanupAmount: number;
  logsDir: string;
  enableIndex: boolean;
  enableSessionLogs: boolean;
  cleanupInterval: number;
}

export interface PluginConfig {
  server?: Partial<ServerConfig>;
  client?: Partial<LoggerConfig>;
  startServer?: boolean;
  injectClient?: boolean;
  development?: boolean;
}

export interface ServerMessage {
  type: 'session-init' | 'ping' | 'pong' | 'error';
  sessionId?: string;
  message?: string;
  data?: any;
}

export interface ClientMessage {
  type: 'log' | 'ping' | 'pong';
  log?: LogMessage;
  data?: any;
}

export type LogHandler = (message: LogMessage) => void;
export type SessionHandler = (sessionInfo: SessionInfo) => void;
export type ErrorHandler = (error: Error, context?: string) => void; 