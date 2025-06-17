export type LogLevelName = 'debug' | 'log' | 'info' | 'warn' | 'error';
export type LogLevelPriority = 0 | 1 | 2 | 3 | 4;
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
export type FallbackMode = 'console' | 'silent' | 'custom';

export interface LogLevel {
  name: LogLevelName;
  priority: LogLevelPriority;
  color: string;
}

export interface StructuredData {
  [key: string]: unknown;
}

export interface LogContext {
  userId?: string | number;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

export interface PerformanceMetrics {
  duration?: number;
  memoryUsage?: number;
  timestamp: number;
  operation?: string;
}

export interface LogMessage<T extends StructuredData = StructuredData> {
  level: LogLevelName;
  message: string;
  timestamp: string;
  sessionId: string;
  namespace?: string;
  url?: string;
  userAgent?: string;
  data?: T;
  context?: LogContext;
  performance?: PerformanceMetrics;
  category?: string;
  tags?: string[];
}

export interface LoggerConfig {
  enableWebSocket: boolean;
  enableConsole: boolean;
  minLevel: LogLevelPriority;
  websocketUrl: string;
  maxRetries: number;
  retryInterval: number;
  autoConnect: boolean;
  namespace?: string;
  fallbackMode?: FallbackMode;
  enableStructuredLogging?: boolean;
  enablePerformanceTracking?: boolean;
  maxQueueSize?: number;
  flushInterval?: number;
  enableOfflineQueue?: boolean;
  enableCompression?: boolean;
}

export interface ConfigValidationRule {
  field: keyof LoggerConfig;
  type: 'string' | 'number' | 'boolean' | 'url' | 'positive-number';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: unknown[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  fixedConfig?: Partial<LoggerConfig>;
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
  enableCompression?: boolean;
  enableCors?: boolean;
  corsOrigins?: string[];
  enableRateLimit?: boolean;
  rateLimitWindow?: number;
  rateLimitMax?: number;
  enableHealthCheck?: boolean;
  healthCheckPath?: string;
}

export interface PluginConfig {
  server?: Partial<ServerConfig>;
  client?: Partial<LoggerConfig>;
  startServer?: boolean;
  injectClient?: boolean;
  development?: boolean;
  autoDetectEnvironment?: boolean;
  enableHotReload?: boolean;
  enableSourceMaps?: boolean;
}

export interface SessionInfo {
  id: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  namespace?: string;
  context?: LogContext;
  performance?: {
    totalDuration: number;
    averageMessageSize: number;
    peakMemoryUsage?: number;
  };
}

export interface SessionIndexEntry {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  messageCount: number;
  namespace?: string;
  logFile: string;
  status: 'active' | 'completed' | 'error';
  context?: LogContext;
}

export interface SessionIndex {
  lastUpdated: string;
  totalSessions: number;
  activeSessions: number;
  sessions: SessionIndexEntry[];
  performance?: {
    averageSessionDuration: number;
    totalMessages: number;
    averageMessagesPerSession: number;
  };
}

export interface ServerMessage {
  type: 'session-init' | 'ping' | 'pong' | 'error' | 'config-update' | 'health-check';
  sessionId?: string;
  message?: string;
  data?: unknown;
  timestamp?: string;
  serverVersion?: string;
}

export interface ClientMessage {
  type: 'log' | 'ping' | 'pong' | 'health-check' | 'config-request';
  log?: LogMessage;
  data?: unknown;
  timestamp?: string;
  clientVersion?: string;
}

export type LogHandler<T extends StructuredData = StructuredData> = (message: LogMessage<T>) => void;
export type SessionHandler = (sessionInfo: SessionInfo) => void;
export type ErrorHandler = (error: Error, context?: ErrorContext) => void;
export type ConnectionHandler = (status: ConnectionStatus, details?: ConnectionDetails) => void;
export type ConfigValidationHandler = (result: ValidationResult) => void;

export interface ErrorContext {
  operation?: string;
  component?: string;
  sessionId?: string;
  timestamp: string;
  retryAttempt?: number;
  additionalData?: unknown;
}

export interface ConnectionDetails {
  url?: string;
  attempt?: number;
  maxAttempts?: number;
  nextRetryIn?: number;
  lastError?: string;
}

export interface LoggerFactoryConfig extends Partial<LoggerConfig> {
  name?: string;
  autoStart?: boolean;
  waitForConnection?: boolean;
  connectionTimeout?: number;
  enableAutoRecovery?: boolean;
  customFallback?: (message: LogMessage) => void;
}

export interface LoggerInstance {
  log<T extends StructuredData = StructuredData>(message: string, data?: T): void;
  info<T extends StructuredData = StructuredData>(message: string, data?: T): void;
  warn<T extends StructuredData = StructuredData>(message: string, data?: T): void;
  error<T extends StructuredData = StructuredData>(message: string, data?: T): void;
  debug<T extends StructuredData = StructuredData>(message: string, data?: T): void;
  
  category(name: string): LoggerInstance;
  withContext(context: LogContext): LoggerInstance;
  startTimer(operation: string): PerformanceTimer;
  
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  getStatus(): ConnectionStatus;
  
  onLog<T extends StructuredData = StructuredData>(handler: LogHandler<T>): () => void;
  onError(handler: ErrorHandler): () => void;
  onConnection(handler: ConnectionHandler): () => void;
  
  updateConfig(config: Partial<LoggerConfig>): void;
  validateConfig(): ValidationResult;
  
  destroy(): void;
}

export interface PerformanceTimer {
  end(data?: StructuredData): void;
  lap(label: string, data?: StructuredData): void;
  cancel(): void;
}

export interface GlobalLoggerRegistry {
  get(name?: string): LoggerInstance | null;
  create(config: LoggerFactoryConfig): LoggerInstance;
  register(name: string, logger: LoggerInstance): void;
  unregister(name: string): void;
  list(): string[];
  clear(): void;
}

export interface EnvironmentInfo {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  isBrowser: boolean;
  isNode: boolean;
  buildTool?: 'vite' | 'webpack' | 'rollup' | 'esbuild' | 'unknown';
  framework?: 'react' | 'vue' | 'angular' | 'svelte' | 'unknown';
}

export interface VitePluginConfig extends PluginConfig {
  vite?: {
    enableHMR?: boolean;
    hmrPort?: number;
    enableDevtools?: boolean;
  };
}

export interface WebpackPluginConfig extends PluginConfig {
  webpack?: {
    enableHotReload?: boolean;
    enableDevServer?: boolean;
    devServerPort?: number;
  };
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type ConfigWithDefaults = RequiredKeys<LoggerConfig, 'enableWebSocket' | 'enableConsole' | 'minLevel' | 'websocketUrl' | 'maxRetries' | 'retryInterval' | 'autoConnect'>; 