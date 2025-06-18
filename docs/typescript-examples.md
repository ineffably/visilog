# TypeScript Examples for Visilog

Complete TypeScript integration examples with proper type safety, interfaces, and best practices.

## 🚀 Quick Start with TypeScript

### Basic Setup

```typescript
// types/visilog.d.ts (if needed for better IDE support)
import 'visilog';

declare module 'visilog' {
  interface LogContext {
    userId?: string;
    requestId?: string;
    traceId?: string;
  }
}
```

```typescript
// logger.ts - Central logger configuration
import { visilog } from 'visilog';

const { createLogger } = visilog;

export const logger = createLogger({
  namespace: 'my-app',
  enableStructuredLogging: true,
  enablePerformanceTracking: true,
  autoConnect: true
});

export type AppLogger = typeof logger;
```

### Auto Import with TypeScript

```typescript
// main.ts
import 'visilog/auto';

// Your app code with full type safety
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = {
  id: '123',
  name: 'John Doe', 
  email: 'john@example.com'
};

console.log('User loaded', user); // Automatically captured by visilog
```

## 🏗️ Server-Side TypeScript

### Custom Server with Type Safety

```typescript
// server/logger-server.ts
import { WebSocketLoggerServer, ServerConfig } from 'visilog/server';
import { LogMessage } from 'visilog';

interface CustomServerConfig extends Partial<ServerConfig> {
  enableMetrics?: boolean;
  metricsPort?: number;
}

class CustomLoggerServer {
  private server: WebSocketLoggerServer;
  private config: CustomServerConfig;

  constructor(config: CustomServerConfig = {}) {
    this.config = {
      port: 3001,
      enableChunking: true,
      maxLogFileSize: 50 * 1024, // 50KB
      enableMetrics: false,
      ...config
    };

    this.server = new WebSocketLoggerServer(this.config);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Type-safe event handlers
    this.server.onLog((message: LogMessage) => {
      if (message.level === 'error') {
        this.handleErrorLog(message);
      }
    });

    this.server.onError((error: Error, context?: any) => {
      console.error('Server error:', error.message, context);
    });
  }

  private handleErrorLog(message: LogMessage): void {
    // Custom error handling with full type safety
    if (message.data && typeof message.data === 'object') {
      const errorData = message.data as Record<string, unknown>;
      
      // Send alerts for critical errors
      if (errorData.critical === true) {
        this.sendAlert(message);
      }
    }
  }

  private sendAlert(message: LogMessage): void {
    console.log('🚨 Critical error alert:', {
      level: message.level,
      message: message.message,
      sessionId: message.sessionId,
      timestamp: message.timestamp
    });
  }

  async start(): Promise<void> {
    await this.server.start();
    console.log(`🔌 Custom logger server started on port ${this.config.port}`);
  }

  async stop(): Promise<void> {
    await this.server.stop();
  }
}

// Usage
const server = new CustomLoggerServer({
  port: 3001,
  enableChunking: true,
  enableMetrics: true
});

server.start().catch(console.error);
```

### Express.js with TypeScript

```typescript
// server/app.ts
import express, { Request, Response, NextFunction } from 'express';
import { visilog, LogMessage, LogContext } from 'visilog';

const { createLogger } = visilog;

interface AuthenticatedRequest extends Request {
  userId?: string;
  logger: ReturnType<typeof createLogger>;
}

interface UserActionContext extends LogContext {
  userId: string;
  action: string;
  resource?: string;
}

const app = express();
const appLogger = createLogger({ namespace: 'api-server' });

// Type-safe logging middleware
const loggingMiddleware = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create request-scoped logger with type-safe context
  req.logger = appLogger.withContext({
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent') || 'unknown',
    ip: req.ip
  });

  req.logger.info('Request started', {
    url: req.originalUrl,
    params: req.params,
    query: req.query
  });

  next();
};

// Type-safe user action logging
const logUserAction = (
  req: AuthenticatedRequest,
  action: string,
  resource?: string,
  metadata?: Record<string, unknown>
): void => {
  if (!req.userId) {
    req.logger.warn('User action without userId', { action, resource });
    return;
  }

  const context: UserActionContext = {
    userId: req.userId,
    action,
    resource
  };

  req.logger.info('User action', {
    ...context,
    metadata,
    timestamp: new Date().toISOString()
  });
};

app.use(loggingMiddleware);

// Type-safe route handlers
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

app.post('/users', async (req: AuthenticatedRequest, res: Response) => {
  const timer = req.logger.startTimer('create-user');
  
  try {
    const userData: CreateUserRequest = req.body;
    
    // Validate request
    if (!userData.name || !userData.email) {
      req.logger.warn('Invalid user creation request', { 
        providedFields: Object.keys(userData),
        missingFields: ['name', 'email'].filter(field => !userData[field as keyof CreateUserRequest])
      });
      
      timer.cancel();
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Create user (mock)
    const user: User = {
      id: `user_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      createdAt: new Date()
    };

    logUserAction(req, 'create', 'user', { 
      userId: user.id,
      email: user.email 
    });

    timer.end({ 
      success: true, 
      userId: user.id,
      userEmail: user.email
    });

    res.status(201).json(user);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    req.logger.error('User creation failed', {
      error: errorMessage,
      requestBody: req.body,
      stack: error instanceof Error ? error.stack : undefined
    });

    timer.cancel();
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
```

## 🎮 React + TypeScript

### Custom Hook with Type Safety

```typescript
// hooks/useLogger.ts
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { visilog, LogMessage, PerformanceTimer } from 'visilog';

const { createLogger } = visilog;

interface UseLoggerOptions {
  component: string;
  namespace?: string;
  enablePerformance?: boolean;
  context?: Record<string, unknown>;
}

interface LoggerHook {
  log: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
  debug: (message: string, data?: Record<string, unknown>) => void;
  startTimer: (operation: string) => PerformanceTimer;
  logRender: (props?: Record<string, unknown>) => void;
  logEvent: (event: string, eventData?: Record<string, unknown>) => void;
}

export const useLogger = (options: UseLoggerOptions): LoggerHook => {
  const { component, namespace = 'react-app', enablePerformance = true, context } = options;
  
  const logger = useMemo(() => {
    const baseLogger = createLogger({ 
      namespace,
      enablePerformanceTracking: enablePerformance 
    }).category(component);
    
    return context ? baseLogger.withContext(context) : baseLogger;
  }, [component, namespace, enablePerformance, context]);

  const renderCount = useRef(0);

  useEffect(() => {
    logger.debug(`${component} mounted`);
    
    return () => {
      logger.debug(`${component} unmounted`, {
        totalRenders: renderCount.current
      });
    };
  }, [logger, component]);

  const logRender = useCallback((props?: Record<string, unknown>) => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`${component} rendered`, {
        renderCount: renderCount.current,
        props: props || {}
      });
    }
  }, [logger, component]);

  const logEvent = useCallback((event: string, eventData?: Record<string, unknown>) => {
    logger.info(`${component} event: ${event}`, {
      event,
      component,
      timestamp: Date.now(),
      ...eventData
    });
  }, [logger, component]);

  const startTimer = useCallback((operation: string) => {
    return logger.startTimer(`${component}.${operation}`);
  }, [logger, component]);

  return {
    log: logger.log.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    debug: logger.debug.bind(logger),
    startTimer,
    logRender,
    logEvent
  };
};
```

### React Component Example

```typescript
// components/UserProfile.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useLogger } from '../hooks/useLogger';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserProfileProps {
  userId: string;
  onUserUpdate?: (user: User) => void;
}

interface UserProfileState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUserUpdate }) => {
  const logger = useLogger({ 
    component: 'UserProfile',
    context: { userId }
  });

  const [state, setState] = useState<UserProfileState>({
    user: null,
    loading: true,
    error: null
  });

  // Log every render in development
  logger.logRender({ userId, hasUser: !!state.user });

  const loadUser = useCallback(async () => {
    const timer = logger.startTimer('load-user');
    
    try {
      logger.info('Loading user', { userId });
      
      // Mock API call
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load user: ${response.status}`);
      }
      
      const user: User = await response.json();
      
      setState({
        user,
        loading: false,
        error: null
      });

      timer.end({ 
        success: true, 
        userId: user.id,
        userEmail: user.email
      });

      logger.info('User loaded successfully', { 
        userId: user.id,
        userName: user.name
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState({
        user: null,
        loading: false,
        error: errorMessage
      });

      logger.error('Failed to load user', {
        userId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      timer.cancel();
    }
  }, [userId, logger]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleUpdateClick = useCallback(() => {
    if (!state.user) return;

    logger.logEvent('update-button-clicked', {
      userId: state.user.id,
      userEmail: state.user.email
    });

    // Navigate to edit page or open modal
    console.log('Update user:', state.user.id);
    
    onUserUpdate?.(state.user);
  }, [state.user, logger, onUserUpdate]);

  const handleAvatarError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    logger.warn('Avatar failed to load', {
      userId: state.user?.id,
      avatarUrl: state.user?.avatar,
      error: 'Image load error'
    });
    
    // Set default avatar
    event.currentTarget.src = '/default-avatar.png';
  }, [logger, state.user]);

  if (state.loading) {
    logger.debug('Rendering loading state');
    return <div>Loading user...</div>;
  }

  if (state.error) {
    logger.debug('Rendering error state', { error: state.error });
    return <div>Error: {state.error}</div>;
  }

  if (!state.user) {
    logger.warn('User not found', { userId });
    return <div>User not found</div>;
  }

  return (
    <div className="user-profile">
      <div className="user-avatar">
        <img 
          src={state.user.avatar || '/default-avatar.png'}
          alt={`${state.user.name}'s avatar`}
          onError={handleAvatarError}
        />
      </div>
      
      <div className="user-info">
        <h2>{state.user.name}</h2>
        <p>{state.user.email}</p>
        
        <button onClick={handleUpdateClick}>
          Update Profile
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
```

## 🔧 Advanced Configuration

### Type-Safe Configuration

```typescript
// config/logger.ts
import { visilog, LoggerConfig, ServerConfig } from 'visilog';

const { createLogger, WebSocketLoggerServer } = visilog;

// Environment-specific configuration
interface AppEnvironment {
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  VISILOG_PORT?: string;
  VISILOG_HOST?: string;
}

const env: AppEnvironment = {
  NODE_ENV: (process.env.NODE_ENV as AppEnvironment['NODE_ENV']) || 'development',
  LOG_LEVEL: (process.env.LOG_LEVEL as AppEnvironment['LOG_LEVEL']) || 'info',
  VISILOG_PORT: process.env.VISILOG_PORT,
  VISILOG_HOST: process.env.VISILOG_HOST
};

// Type-safe logger configuration factory
const createLoggerConfig = (namespace: string): LoggerConfig => {
  const baseConfig: LoggerConfig = {
    namespace,
    enableWebSocket: env.NODE_ENV === 'development',
    enableConsole: true,
    autoConnect: true,
    enableStructuredLogging: true,
    enablePerformanceTracking: env.NODE_ENV === 'development',
    maxRetries: 3,
    retryInterval: 2000,
    websocketUrl: `ws://${env.VISILOG_HOST || 'localhost'}:${env.VISILOG_PORT || '3001'}`
  };

  // Set log level based on environment
  const levelMap = { debug: 0, log: 1, info: 2, warn: 3, error: 4 } as const;
  baseConfig.minLevel = levelMap[env.LOG_LEVEL];

  return baseConfig;
};

// Type-safe server configuration
const createServerConfig = (): ServerConfig => ({
  port: parseInt(env.VISILOG_PORT || '3001', 10),
  host: env.VISILOG_HOST || '0.0.0.0',
  logsDir: './logs',
  enableIndex: true,
  enableSessionLogs: true,
  enableChunking: true,
  maxLogFileSize: 50 * 1024, // 50KB
  maxChunksPerSession: 20,
  cleanupThreshold: 75,
  cleanupAmount: 25
});

// Export configured loggers
export const apiLogger = createLogger(createLoggerConfig('api'));
export const dbLogger = createLogger(createLoggerConfig('database'));
export const authLogger = createLogger(createLoggerConfig('auth'));

// Export server configuration
export const serverConfig = createServerConfig();

// Type-safe logger factory
export const createAppLogger = (namespace: string) => 
  createLogger(createLoggerConfig(namespace));
```

### Generic Logging Utilities

```typescript
// utils/logging.ts
import { LogMessage, PerformanceTimer } from 'visilog';

// Type-safe error logging
export interface ErrorLogData {
  error: Error;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export const logError = (
  logger: any, // Use actual logger type from your app
  data: ErrorLogData
): void => {
  logger.error(data.error.message, {
    errorName: data.error.name,
    stack: data.error.stack,
    context: data.context,
    userId: data.userId,
    sessionId: data.sessionId,
    requestId: data.requestId,
    timestamp: new Date().toISOString()
  });
};

// Type-safe performance monitoring
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export const withPerformanceLogging = <T extends any[], R>(
  logger: any,
  operation: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const timer = logger.startTimer(operation);
    
    try {
      const result = await fn(...args);
      
      timer.end({ 
        success: true,
        args: args.length
      });
      
      return result;
    } catch (error) {
      timer.cancel();
      
      logError(logger, {
        error: error instanceof Error ? error : new Error(String(error)),
        context: { operation, args }
      });
      
      throw error;
    }
  };
};

// Type-safe API call logging
export interface ApiCallData {
  method: string;
  url: string;
  status?: number;
  duration?: number;
  requestSize?: number;
  responseSize?: number;
  error?: string;
}

export const logApiCall = (
  logger: any,
  data: ApiCallData
): void => {
  const level = data.status && data.status >= 400 ? 'error' : 'info';
  
  logger[level](`API ${data.method} ${data.url}`, {
    method: data.method,
    url: data.url,
    status: data.status,
    duration: data.duration,
    requestSize: data.requestSize,
    responseSize: data.responseSize,
    error: data.error,
    timestamp: new Date().toISOString()
  });
};
```

## 🧪 Testing with TypeScript

```typescript
// __tests__/logger.test.ts
import { visilog } from 'visilog';
import { createAppLogger } from '../config/logger';

const { createLogger } = visilog;

describe('Logger Integration', () => {
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = createLogger({
      enableWebSocket: false, // Disable for tests
      enableConsole: false
    });
  });

  it('should log structured data with correct types', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    interface TestData {
      userId: string;
      action: string;
      timestamp: number;
    }

    const testData: TestData = {
      userId: 'test-123',
      action: 'login',
      timestamp: Date.now()
    };

    mockLogger.info('User action', testData);

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle performance timing', async () => {
    const timer = mockLogger.startTimer('test-operation');
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    timer.end({ success: true });
    
    // Verify timing was recorded
    expect(timer).toBeDefined();
  });
});
```

## 🏆 Best Practices

### 1. Type-Safe Context
```typescript
interface RequestContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  userAgent: string;
}

const requestLogger = baseLogger.withContext<RequestContext>({
  requestId: 'req_123',
  userId: 'user_456',
  sessionId: 'session_789',
  userAgent: 'Mozilla/5.0...'
});
```

### 2. Enum-Based Log Levels
```typescript
enum LogLevel {
  DEBUG = 0,
  LOG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

const config: LoggerConfig = {
  minLevel: LogLevel.INFO,
  // ... other config
};
```

### 3. Strongly Typed Events
```typescript
interface UserEvent {
  type: 'login' | 'logout' | 'signup' | 'profile_update';
  userId: string;
  metadata?: Record<string, unknown>;
}

const logUserEvent = (event: UserEvent): void => {
  logger.info(`User ${event.type}`, {
    eventType: event.type,
    userId: event.userId,
    metadata: event.metadata,
    timestamp: new Date().toISOString()
  });
};
```

This comprehensive TypeScript documentation provides type-safe examples for all major use cases, ensuring developers can leverage visilog with full TypeScript support and IDE assistance.