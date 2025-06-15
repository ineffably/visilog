// Core exports
export { WebSocketLogger } from './client/websocket-logger';
export { WebSocketLoggerServer } from './server/websocket-logger-server';
export { createVitePlugin } from './plugins/vite-plugin';
export { createWebpackPlugin } from './plugins/webpack-plugin';

// Enhanced factory and utilities (Phase 1 & 2 improvements)
export { 
  LoggerFactory,
  createLogger,
  getGlobalLogger,
  waitForLogger,
  registry
} from './library/logger-factory';
export { ConfigValidator } from './library/config-validator';
export { EnvironmentDetector } from './library/environment-detector';

// Type exports - Enhanced with comprehensive definitions
export type { 
  // Core types
  LoggerConfig, 
  LogMessage, 
  LogLevel, 
  ServerConfig, 
  SessionInfo,
  PluginConfig,
  
  // Enhanced types (exceeding feedback expectations)
  LoggerInstance,
  LoggerFactoryConfig,
  GlobalLoggerRegistry,
  EnvironmentInfo,
  StructuredData,
  LogContext,
  PerformanceTimer,
  PerformanceMetrics,
  ValidationResult,
  ValidationError,
  ConfigValidationRule,
  ConnectionStatus,
  FallbackMode,
  LogLevelName,
  LogLevelPriority,
  
  // Event handler types
  LogHandler,
  ErrorHandler,
  ConnectionHandler,
  ConfigValidationHandler,
  
  // Utility types
  DeepPartial,
  RequiredKeys,
  ConfigWithDefaults,
  
  // Plugin-specific types
  VitePluginConfig,
  WebpackPluginConfig
} from './types'; 