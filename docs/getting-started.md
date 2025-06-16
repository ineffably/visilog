# Visilog - Getting Started Guide

> **⚠️ Currently in Beta - API may change before stable release**
>
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

```js
// vite.config.js
import { defineConfig } from 'vite';

// For Vite 6.x compatibility with ESM
const vitePluginModule = await import('visilog/vite');
const { createVitePlugin } = vitePluginModule;

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

```js
// webpack.config.js
const { createWebpackPlugin } = require('visilog/webpack')['visilog-webpack-plugin'];

module.exports = {
  plugins: [
    createWebpackPlugin({
      development: process.env.NODE_ENV === 'development'
    })
  ]
};
```

#### 3. **Manual Setup** (Any Project)

```js
// main.js or index.js
const { visilog } = require('visilog');
const { createLogger } = visilog;

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

```js
const { visilog } = require('visilog');
const { createLogger, getGlobalLogger, waitForLogger } = visilog;

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

```js
const { visilog } = require('visilog');
const { EnvironmentDetector } = visilog;

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

```js
const { visilog } = require('visilog');
const { createLogger } = visilog;

const logger = createLogger({ namespace: 'user-service' });

// Standard levels with structured data
logger.debug('Processing request', { userId: 123, action: 'login' });
logger.info('User authenticated', { userId: 123, method: '2FA' });
logger.warn('Rate limit approaching', { userId: 123, remaining: 5 });
logger.error('Authentication failed', { userId: 123, reason: 'invalid_token' });
```

### Categorized Logging

```js
// Create category-specific loggers
const authLogger = logger.category('auth');
const dbLogger = logger.category('database');
const apiLogger = logger.category('api');

authLogger.info('Login attempt', { username: 'john' });
dbLogger.warn('Slow query detected', { duration: 1500, query: 'SELECT...' });
apiLogger.error('External API timeout', { service: 'payment-gateway' });
```

### Contextual Logging

```js
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

```js
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

```js
const { visilog } = require('visilog');
const { ConfigValidator } = visilog;

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

```js
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

```js
const { visilog } = require('visilog');
const { registry } = visilog;

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

```js
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

## 🎮 Real-World Examples

### React Application

```js
// hooks/useLogger.js
const { visilog } = require('visilog');
const { createLogger } = visilog;
const { useEffect, useMemo } = require('react');

function useLogger(component) {
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

// components/UserProfile.js
function UserProfile({ userId }) {
  const logger = useLogger('UserProfile');
  
  const handleAction = (action) => {
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

### API Development

```js
const express = require('express');
const { visilog } = require('visilog');
const { createLogger } = visilog;

const app = express();
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

## 🔍 Testing Your Setup

### Quick Test

```bash
# Run the comprehensive example
node examples/enhanced-usage.js

# Expected output: Demo of all features working
```

### Integration Tests

```bash
# Test core functionality
npm test

# Test basic integrations
npm run test:integration

# Test plugin integrations (Vite/Webpack)
npm run test:integration:plugins
```

## 🔍 Debugging & Monitoring

### Real-time Log Viewing

Logs are automatically saved to `./logs/` with the following structure:

```
logs/
├── index.json            # Session index with metadata
└── sessions/             # Individual session logs
    ├── session-abc123.log
    └── session-def456.log
```

### Log Analysis

```js
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

**1. Import/Export Errors**
```js
// ❌ Wrong (ESM syntax)
import { createLogger } from 'visilog';

// ✅ Correct (CommonJS syntax)  
const { visilog } = require('visilog');
const { createLogger } = visilog;
```

**2. Plugin Import Issues**
```js
// ❌ Wrong
const { createWebpackPlugin } = require('visilog/webpack');

// ✅ Correct
const { createWebpackPlugin } = require('visilog/webpack')['visilog-webpack-plugin'];
```

**3. WebSocket Connection Failed**
```js
// Check if server is running
const logger = createLogger({
  onConnectionError: (error) => {
    console.log('Connection failed:', error.message);
    // Falls back to console automatically
  }
});
```

**4. Logs Not Appearing**
```js
// Verify configuration
const { visilog } = require('visilog');
const { ConfigValidator } = visilog;

const result = ConfigValidator.validate(yourConfig);
if (!result.isValid) {
  console.log('Config errors:', result.errors);
  console.log('Suggested fixes:', result.fixedConfig);
}
```

## 🎯 Next Steps

- **[README](../README.md)** - Complete overview and examples
- **[Examples](../examples/)** - Real-world implementation examples
- **[Integration Tests](../tests/integration/)** - See working setups

---

**Need help?** Check our [GitHub Issues](https://github.com/ineffably/visilog/issues) or tell your LLM to read the logs in `./logs/` for debugging assistance!