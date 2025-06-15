# Visilog - Getting Started Guide

> **Real-time logging for modern development workflows**  
> Stream your browser console logs directly to your file system with zero configuration.

## 🚀 Quick Start

### Installation

```bash
npm install visilog
# or
yarn add visilog
# or
pnpm add visilog
```

### Basic Setup (30 seconds)

#### 1. **Vite Projects** (Recommended)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { createVitePlugin } from 'visilog/vite';

export default defineConfig({
  plugins: [
    createVitePlugin({
      // Auto-detects environment and configures optimally
      development: true, // Only active in development
    })
  ]
});
```

#### 2. **Webpack Projects**

```typescript
// webpack.config.js
const { createWebpackPlugin } = require('visilog/webpack');

module.exports = {
  plugins: [
    createWebpackPlugin({
      development: process.env.NODE_ENV === 'development'
    })
  ]
};
```

#### 3. **Manual Setup** (Any Project)

```typescript
// main.ts or index.ts
import { createLogger } from 'visilog';

const logger = createLogger({
  namespace: 'my-app',
  autoStart: true
});

// Use it anywhere in your app
logger.info('Application started', { version: '1.0.0' });
```

## 🎯 Core Concepts

### Smart Logger Factory

Visilog's enhanced factory system automatically configures itself based on your environment:

```typescript
import { createLogger, getGlobalLogger, waitForLogger } from 'visilog';

// Creates a logger with intelligent defaults
const logger = createLogger({
  name: 'my-component',
  namespace: 'frontend',
  waitForConnection: true,
  enableAutoRecovery: true
});

// Global logger access (always available)
const global = getGlobalLogger();

// Wait for connection before logging critical data
const readyLogger = await waitForLogger('my-component', 5000);
```

### Environment Detection

Visilog automatically detects your environment and optimizes accordingly:

```typescript
import { EnvironmentDetector } from 'visilog';

const env = EnvironmentDetector.detect();
console.log(EnvironmentDetector.getDescription(env));
// Output: "Development + Browser + Vite + React"
```

**Automatic Optimizations:**
- **Development**: Full logging, WebSocket enabled, debug level
- **Production**: Info+ only, console fallback, optimized performance
- **Testing**: Silent mode or console-only
- **Browser**: Auto-detects localhost WebSocket URL
- **Node.js**: File-based logging with rotation

## 📝 Logging Patterns

### Basic Logging

```typescript
import { createLogger } from 'visilog';

const logger = createLogger({ namespace: 'user-service' });

// Standard levels with structured data
logger.debug('Processing request', { userId: 123, action: 'login' });
logger.info('User authenticated', { userId: 123, method: '2FA' });
logger.warn('Rate limit approaching', { userId: 123, remaining: 5 });
logger.error('Authentication failed', { userId: 123, reason: 'invalid_token' });
```

### Structured Logging with TypeScript

```typescript
interface UserAction {
  userId: number;
  action: string;
  metadata?: Record<string, any>;
}

// Type-safe structured logging
logger.info<UserAction>('User action completed', {
  userId: 123,
  action: 'purchase',
  metadata: { amount: 99.99, currency: 'USD' }
});
```

### Categorized Logging

```typescript
// Create category-specific loggers
const authLogger = logger.category('auth');
const dbLogger = logger.category('database');
const apiLogger = logger.category('api');

authLogger.info('Login attempt', { username: 'john' });
dbLogger.warn('Slow query detected', { duration: 1500, query: 'SELECT...' });
apiLogger.error('External API timeout', { service: 'payment-gateway' });
```

### Contextual Logging

```typescript
// Add persistent context to all logs
const userLogger = logger.withContext({
  userId: 123,
  sessionId: 'abc-123',
  requestId: 'req-456'
});

userLogger.info('Page viewed', { page: '/dashboard' });
// Automatically includes userId, sessionId, requestId in every log
```

### Performance Tracking

```typescript
// Built-in performance timing
const timer = logger.startTimer('data-processing');

// Your code here...
await processLargeDataset();

timer.lap('validation-complete', { recordsProcessed: 1000 });

// More processing...
await saveToDatabase();

timer.end({ totalRecords: 1000, errors: 0 });
// Logs: "⏱️ data-processing completed" with full timing data
```

## 🔧 Configuration

### Validation & Auto-Fix

Visilog validates your configuration and provides intelligent suggestions:

```typescript
import { ConfigValidator } from 'visilog';

const result = ConfigValidator.validate({
  websocketUrl: 'http://localhost:3001', // ❌ Wrong protocol
  maxRetries: '5', // ❌ Wrong type
  minLevel: 10 // ❌ Invalid range
});

console.log(result.errors);
// Helpful error messages with suggestions:
// - "Use WebSocket URL format like 'ws://localhost:3001'"
// - "Expected number, got string. Use 5 instead of '5'"
// - "Value 10 is above maximum 4. Use one of: 0, 1, 2, 3, 4"

// Auto-fixed configuration
const { config } = ConfigValidator.validateAndFix(invalidConfig);
// config.websocketUrl is now 'ws://localhost:3001'
```

### Advanced Configuration

```typescript
const logger = createLogger({
  // Connection settings
  websocketUrl: 'ws://localhost:3001',
  maxRetries: 5,
  retryInterval: 2000,
  connectionTimeout: 5000,
  
  // Logging behavior
  minLevel: 0, // 0=debug, 1=log, 2=info, 3=warn, 4=error
  enableStructuredLogging: true,
  enablePerformanceTracking: true,
  
  // Fallback options
  fallbackMode: 'console', // 'console' | 'silent' | 'custom'
  enableOfflineQueue: true,
  maxQueueSize: 1000,
  
  // Advanced features
  enableAutoRecovery: true,
  enableCompression: false,
  
  // Custom fallback handler
  customFallback: (logMessage) => {
    // Your custom logging logic when WebSocket fails
    console.log(`[FALLBACK] ${logMessage.level}: ${logMessage.message}`);
  }
});
```

## 🌟 Advanced Features

### Global Registry

```typescript
import { registry } from 'visilog';

// Create named loggers
const authLogger = registry.create({ name: 'auth', namespace: 'security' });
const dbLogger = registry.create({ name: 'database', namespace: 'data' });

// Access from anywhere in your app
const auth = registry.get('auth');
const db = registry.get('database');

// List all loggers
console.log(registry.list()); // ['auth', 'database']

// Cleanup
registry.unregister('auth');
registry.clear(); // Remove all loggers
```

### Error Handling & Recovery

```typescript
const logger = createLogger({
  enableAutoRecovery: true,
  onConnectionError: (error) => {
    console.warn('Visilog connection failed, using fallback:', error);
  },
  onReconnect: () => {
    console.log('Visilog reconnected successfully');
  }
});

// Handle connection events
logger.onConnection((status, details) => {
  switch (status) {
    case 'connected':
      console.log('✅ Logger connected');
      break;
    case 'reconnecting':
      console.log(`🔄 Reconnecting... (attempt ${details?.attempt})`);
      break;
    case 'failed':
      console.log('❌ Connection failed:', details?.lastError);
      break;
  }
});
```

### Plugin Integration

#### Vite with Hot Reload

```typescript
// vite.config.ts
import { createVitePlugin } from 'visilog/vite';

export default defineConfig({
  plugins: [
    createVitePlugin({
      development: true,
      vite: {
        enableHMR: true,
        enableDevtools: true
      },
      client: {
        namespace: 'my-app',
        enablePerformanceTracking: true
      },
      server: {
        port: 3001,
        enableHealthCheck: true
      }
    })
  ]
});
```

#### Webpack with Dev Server

```typescript
// webpack.config.js
const { createWebpackPlugin } = require('visilog/webpack');

module.exports = {
  plugins: [
    createWebpackPlugin({
      webpack: {
        enableHotReload: true,
        devServerPort: 3001
      },
      client: {
        fallbackMode: 'console',
        enableOfflineQueue: true
      }
    })
  ]
};
```

## 🎮 Use Cases

### Game Development

```typescript
const gameLogger = createLogger({ 
  namespace: 'game-engine',
  enablePerformanceTracking: true 
});

// Performance-critical logging
const frameTimer = gameLogger.startTimer('frame-render');
renderFrame();
frameTimer.end({ fps: 60, entities: 1000 });

// Game events
gameLogger.category('player').info('Level completed', {
  level: 5,
  score: 12500,
  time: 180000
});
```

### API Development

```typescript
const apiLogger = createLogger({ namespace: 'api-server' });

// Request logging with context
app.use((req, res, next) => {
  const requestLogger = apiLogger.withContext({
    requestId: req.id,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent')
  });
  
  req.logger = requestLogger;
  next();
});

// In your routes
app.get('/users/:id', async (req, res) => {
  const timer = req.logger.startTimer('get-user');
  
  try {
    const user = await getUserById(req.params.id);
    timer.end({ userId: user.id, cached: false });
    res.json(user);
  } catch (error) {
    req.logger.error('Failed to get user', { 
      userId: req.params.id, 
      error: error.message 
    });
    timer.cancel();
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### React Application

```typescript
// hooks/useLogger.ts
import { createLogger } from 'visilog';
import { useEffect, useMemo } from 'react';

export function useLogger(component: string) {
  const logger = useMemo(() => 
    createLogger({ namespace: 'react-app' }).category(component), 
    [component]
  );
  
  useEffect(() => {
    logger.debug(`${component} mounted`);
    return () => logger.debug(`${component} unmounted`);
  }, [logger, component]);
  
  return logger;
}

// components/UserProfile.tsx
function UserProfile({ userId }: { userId: number }) {
  const logger = useLogger('UserProfile');
  
  const handleAction = (action: string) => {
    logger.info('User action', { userId, action, timestamp: Date.now() });
  };
  
  return (
    <div>
      <button onClick={() => handleAction('edit-profile')}>
        Edit Profile
      </button>
    </div>
  );
}
```

## 🔍 Debugging & Monitoring

### Real-time Log Viewing

Logs are automatically saved to `./demo-logs/` with the following structure:

```
demo-logs/
├── sessions.json          # Session index
├── session-abc123.json    # Individual session logs
└── latest.json           # Most recent session
```

### Log Analysis

```typescript
// Access session information
const sessionId = logger.getSessionId();
const status = logger.getStatus(); // 'connected' | 'disconnected' | etc.
const queueSize = logger.getQueueSize(); // Pending messages

// Validate current configuration
const validation = logger.validateConfig();
if (!validation.isValid) {
  console.warn('Configuration issues:', validation.errors);
}
```

## 🚨 Troubleshooting

### Common Issues

**1. WebSocket Connection Failed**
```typescript
// Check if server is running
const logger = createLogger({
  onConnectionError: (error) => {
    console.log('Connection failed:', error.message);
    // Falls back to console automatically
  }
});
```

**2. Logs Not Appearing**
```typescript
// Verify configuration
import { ConfigValidator } from 'visilog';

const result = ConfigValidator.validate(yourConfig);
if (!result.isValid) {
  console.log('Config errors:', result.errors);
  console.log('Suggested fixes:', result.fixedConfig);
}
```

**3. Performance Issues**
```typescript
// Optimize for production
const logger = createLogger({
  minLevel: 2, // Info and above only
  maxQueueSize: 100, // Smaller queue
  flushInterval: 10000, // Less frequent flushing
  enableCompression: true // Reduce bandwidth
});
```

## 🎯 Next Steps

- **[API Reference](./api-reference.md)** - Complete method documentation
- **[Configuration Guide](./configuration.md)** - Detailed configuration options
- **[Examples](../examples/)** - Real-world implementation examples
- **[Migration Guide](./migration.md)** - Upgrading from other logging solutions

---

**Need help?** Check our [GitHub Issues](https://github.com/ineffably/visilog/issues) or start a [Discussion](https://github.com/ineffably/visilog/discussions). 