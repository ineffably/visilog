# Visilog

<div align="center">
  <img src="https://img.shields.io/badge/Status-Beta-yellow" alt="Beta Status">
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue" alt="TypeScript Ready">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <a href="https://github.com/ineffably/visilog/actions/workflows/ci.yml">
    <img src="https://github.com/ineffably/visilog/actions/workflows/ci.yml/badge.svg" alt="CI Status">
  </a>
  <img src="https://raw.githubusercontent.com/ineffably/visilog/main/badges/coverage.svg" alt="Test Coverage">
  <img src="https://img.shields.io/badge/No%20MCP-Required-brightgreen" alt="No MCP Required">
</div>

<p align="center">
  <b>Stream your browser console logs directly to files so your LLM can read them</b><br>
  <sub>Works with Vite and Webpack. No MCP setup required - just tell your LLM to read the log files like any other browser logs.</sub><br>
  <strong>⚠️ Currently in Beta - API may change before stable release</strong>
</p>

## Why This Tool?

When working with **LLMs and AI assistants** on web development, you constantly need to share **browser console logs** for debugging help. Instead of copying and pasting console output, Visilog automatically **streams all your browser logs to files** that your LLM can read directly. 

**Perfect for:**
- 🤖 **AI-assisted debugging** - Let your LLM see exactly what's happening in the browser
- 🔍 **Log visibility** - Stream console logs in real-time to your file system  
- 🚫 **No MCP required** - Simple file-based approach, no complex protocols
- ⚡ **Developer experience** - Zero-config setup with Vite and Webpack plugins

## Features

- 🤖 **LLM-ready** - AI assistants can read browser logs directly from files
- 📁 **File-based logging** - Console streaming to your file system, no databases needed
- 🔌 **Vite & Webpack plugins** - Drop-in integration for modern development tools
- 📱 **Session tracking** - Organized browser log files per session with metadata
- ⚡ **Zero configuration** - One-line setup, works out of the box
- 🚫 **No MCP protocol** - Simple file approach, no Model Context Protocol complexity
- 🔄 **Real-time streaming** - WebSocket-based console log streaming
- 🎯 **Developer experience** - Built for modern TypeScript development workflows

## Quick Start

### Installation

```bash
npm install visilog
```

### Vite Plugin (Recommended)

```ts
// vite.config.ts
import { defineConfig } from 'vite'

// For ES modules (Vite 6.x with type: "module")
const vitePluginModule = await import('visilog/vite');
const { createVitePlugin } = vitePluginModule;

export default defineConfig({
  plugins: [
    createVitePlugin({
      // Optional: customize where logs are saved
      server: {
        logsDir: 'logs'  // Default: saves to ./logs/ folder
      }
    })
  ]
})
```

**Note**: For Vite 6.x compatibility, import the plugin using dynamic import as shown above.

That's it! Your browser logs are now automatically saved to files. Just tell your LLM to read the `./logs/` folder.

### Tell Your LLM

```
"Please read the browser console logs in the ./logs/ directory and help me debug this issue"
```

Your LLM can now see all your browser console output without you copying and pasting anything!

### Webpack Plugin

```js
// webpack.config.js
const { createWebpackPlugin } = require('visilog/webpack')['visilog-webpack-plugin'];

module.exports = {
  plugins: [
    createWebpackPlugin({
      server: {
        logsDir: 'logs'  // Where to save log files
      }
    })
  ]
}
```

**Note**: Due to the CommonJS module structure, import the plugin as shown above.

### Manual Setup

If you're not using Vite or Webpack, you can set up the logger manually:

```js
// Server (Node.js) - saves logs to files
const { visilog } = require('visilog');
const { WebSocketLoggerServer } = visilog;

const server = new WebSocketLoggerServer({
  logsDir: './logs'  // Your logs will be saved here
});

await server.start();
```

```js
// Client (Browser) - captures console logs
const { visilog } = require('visilog');
const { WebSocketLogger } = visilog;

const logger = new WebSocketLogger();
logger.enableConsoleOverride(); // Automatically capture all console.* calls

// Now all your console.log, console.error, etc. are saved to files your LLM can read!
```

**Note**: Visilog now uses CommonJS modules. Import using the structure shown above.

## How Your LLM Reads the Logs

Once the logger is running, all browser logs are automatically saved to the `logs` directory:

```
logs/
├── index.json                    # Index of all sessions and their log files
└── sessions/                     # Individual browser session logs
    ├── session-123456789.log
    └── session-987654321.log
```

The `index.json` file provides a quick overview of all sessions:

```json
{
  "lastUpdated": "2024-01-15T10:30:15.123Z",
  "totalSessions": 5,
  "activeSessions": 1,
  "sessions": [
    {
      "id": "session-123456789",
      "startTime": "2024-01-15T10:25:00.000Z",
      "endTime": "2024-01-15T10:28:30.000Z", 
      "duration": 210,
      "messageCount": 25,
      "logFile": "sessions/session-123456789.log",
      "status": "completed"
    }
  ]
}
```

Just tell your LLM to read these files - no copying and pasting needed! Each log entry is a complete JSON object containing:
- **timestamp**: ISO timestamp of when the log occurred
- **level**: Log level (debug, log, info, warn, error)
- **message**: The actual log message
- **sessionId**: Unique browser session identifier
- **url**: Current page URL when log occurred

- **data**: Any structured data objects passed to the log
- **namespace**: Optional namespace if configured

Example log entries:
```json
{"timestamp":"2024-01-15T10:30:15.123Z","level":"error","message":"❌ Failed to fetch data","sessionId":"a1b2c3d4","url":"http://localhost:3000","data":{"status":404,"endpoint":"/api/users"}}
{"timestamp":"2024-01-15T10:30:16.456Z","level":"info","message":"✅ User loaded successfully","sessionId":"a1b2c3d4","url":"http://localhost:3000","data":{"userId":123,"role":"admin"}}
```

## Configuration

Most of the time, the default settings work perfectly. But here are the main options you might want to customize:

### Basic Plugin Configuration

```ts
// vite.config.ts or webpack.config.js
createVitePlugin({
  server: {
    logsDir: 'my-logs',           // Where to save log files (default: 'logs')
    port: 3001,                   // WebSocket server port (default: 3001)
  },
  client: {
    minLevel: 1,                  // 0=debug, 1=info, 2=warn, 3=error (default: 0)
    namespace: 'my-app'           // Add a prefix to your logs (optional)
  }
})
```

### Advanced Configuration

```ts
interface ServerConfig {
  logsDir: string               // Directory for log files (default: 'logs')
  port: number                  // WebSocket server port (default: 3001)
  maxSessions: number           // Max concurrent sessions (default: 50)
  enableIndex: boolean          // Enable index.json file (default: true)
  enableSessionLogs: boolean    // Enable per-session logs (default: true)
}

interface ClientConfig {
  minLevel: number             // Minimum log level 0-4 (default: 0)
  namespace?: string           // Optional namespace for logs
  enableConsole: boolean       // Keep console output (default: true)
}
```

## Client Usage Example

### 🚀 Real-World API Client Example

Here's a concise example showing automatic console log capture in a typical data fetching scenario:

```js
// vite.config.js - Zero Configuration Setup
import { defineConfig } from 'vite';
const viteModule = await import('visilog/vite');
const { createVitePlugin } = viteModule;

export default defineConfig({
  plugins: [
    createVitePlugin() // All console logs now saved to ./logs/
  ]
});
```

```js
// api-client.js - Automatic Console Log Capture
class ApiClient {
  async fetchUserData(userId) {
    console.log('🔍 Fetching user data', { userId, timestamp: Date.now() });
    // ✅ Automatically logged to file
    
    try {
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        console.warn('⚠️ API response not OK', { 
          status: response.status, 
          userId 
        }); // ✅ Warning logged to file
      }
      
      const userData = await response.json();
      
      console.info('✅ User data loaded', {
        userId: userData.id,
        role: userData.role,
        lastLogin: userData.lastLogin
      }); // ✅ Success with structured data logged
      
      return userData;
      
    } catch (error) {
      console.error('❌ Failed to fetch user data', {
        userId,
        error: error.message,
        stack: error.stack,
        url: window.location.href
      }); // ✅ Complete error context logged to file
      
      throw error;
    }
  }
  
  async savePreferences(userId, preferences) {
    console.log('💾 Saving user preferences', { userId, preferences });
    // ✅ Logged with full context
    
    const result = await this.post(`/api/users/${userId}/preferences`, preferences);
    
    console.log('✅ Preferences saved', { userId, changedFields: Object.keys(preferences) });
    // ✅ Operation result logged
    
    return result;
  }
}

// Your existing code - no changes needed!
const client = new ApiClient();
await client.fetchUserData(123); // All logs automatically saved to files
```

**Every console statement is automatically captured and saved to structured JSON log files that your LLM can read - no code changes required!**

### Working with Multiple Projects

You can use namespaces to separate logs from different parts of your application:

```ts
// vite.config.ts
createVitePlugin({
  client: {
    namespace: 'auth-module'  // Prefix all logs with [auth-module]
  }
})

// Your logs will look like:
// [2024-01-15T10:30:15.123Z] [auth-module] [INFO] Login successful
```

## Log File Structure

```
logs/
├── index.json                    # Session index with metadata
└── sessions/                     # Individual session logs
    ├── session-1702387815123-a1b2c3.log
    ├── session-1702387816456-d4e5f6.log
    └── ...
```

### Log Format

Each log entry is saved as a structured JSON object on a single line:

```json
{"timestamp":"2024-01-15T10:30:15.123Z","level":"log","message":"🚀 Shopping app initializing","sessionId":"a1b2c3d4","url":"http://localhost:3000","data":{"version":"1.0.0","environment":"development"}}
{"timestamp":"2024-01-15T10:30:16.456Z","level":"info","message":"🛒 Cart loaded","sessionId":"a1b2c3d4","url":"http://localhost:3000","data":{"itemCount":3,"cartTotal":99.99}}
{"timestamp":"2024-01-15T10:30:17.789Z","level":"error","message":"❌ Checkout failed","sessionId":"a1b2c3d4","url":"http://localhost:3000","data":{"error":"Payment declined","cartItems":[{"id":1,"quantity":2}],"total":99.99,"userId":123}}
```

## Enhanced Features

Visilog includes advanced features for professional development workflows:

### Smart Logger Factory

```js
const { visilog } = require('visilog');
const { createLogger, registry, ConfigValidator } = visilog;

// Create logger with intelligent auto-configuration
const logger = createLogger({
  name: 'my-app',
  namespace: 'frontend',
  autoStart: true,
  enableAutoRecovery: true,
  fallbackMode: 'console'
});

// Structured logging with context
logger.info('User logged in', {
  userId: 12345,
  timestamp: Date.now(),
  metadata: { userAgent: navigator.userAgent }
});
```

### Configuration Validation & Auto-Fix

```js
const invalidConfig = {
  websocketUrl: 'http://localhost:3001', // Wrong protocol
  maxRetries: '5', // Wrong type
  enableWebSocket: 'yes' // Wrong type
};

const { config: fixedConfig, validation } = ConfigValidator.validateAndFix(invalidConfig);
// Automatically converts to: ws://localhost:3001, 5, true
```

### Environment Detection

```js
const { EnvironmentDetector } = visilog;

const env = EnvironmentDetector.detect();
console.log(env); // { isDevelopment: true, isBrowser: true, buildTool: 'vite' }
```

### Performance Tracking

```js
const timer = logger.startTimer('data-processing');

// Some work...
timer.lap('validation-complete', { recordsProcessed: 1000 });

// More work...
timer.end({ totalRecords: 1000, errors: 0 });
```

### Global Registry

```js
// Create named loggers for different modules
registry.create({ name: 'user-service', namespace: 'backend' });
registry.create({ name: 'analytics', namespace: 'tracking' });

// Access from anywhere in your app
const userLogger = registry.get('user-service');
userLogger.info('Service started', { port: 3000 });
```

## Testing & Integration

### Basic Usage Test

```js
// examples/enhanced-usage.js - Run this to test your setup
const { visilog } = require('visilog');
const { createLogger } = visilog;

const logger = createLogger({
  name: 'test-app',
  autoStart: true,
  fallbackMode: 'console'
});

logger.info('Test message', { timestamp: Date.now() });
console.log('✅ Visilog is working!');
```

### Integration Tests

Visilog includes comprehensive integration tests:

```bash
# Test core functionality
npm test

# Test basic integrations
npm run test:integration

# Test plugin integrations (Vite/Webpack)
npm run test:integration:plugins
```

### Compatibility Testing

Run the example to verify your setup:

```bash
node examples/enhanced-usage.js
```

This demonstrates all enhanced features including environment detection, configuration validation, structured logging, and performance tracking.

## Manual API (Advanced Usage)

If you need more control, you can use the logger programmatically:

### Client API

```js
const { visilog } = require('visilog');
const { WebSocketLogger } = visilog;

const logger = new WebSocketLogger();

// Start capturing console logs
logger.enableConsoleOverride();

// Manual logging
logger.log('Custom message');
logger.error('Something went wrong');

// Stop and cleanup
logger.destroy();
```

### Server API

```js
const { visilog } = require('visilog');
const { WebSocketLoggerServer } = visilog;

const server = new WebSocketLoggerServer({
  logsDir: './logs'
});

await server.start();
// ... logs are being saved to files
await server.stop();
```

## Framework Examples

### React + Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createVitePlugin } from 'visilog/vite'

export default defineConfig({
  plugins: [
    react(),
    createVitePlugin() // That's it! Logs saved to ./logs/
  ]
})
```

### Next.js

```js
// next.config.js
const { createWebpackPlugin } = require('visilog/webpack')['visilog-webpack-plugin'];

module.exports = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.plugins.push(createWebpackPlugin())
    }
    return config
  }
}
```

### Vue + Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createVitePlugin } from 'visilog/vite'

export default defineConfig({
  plugins: [
    vue(),
    createVitePlugin()
  ]
})
```

## Common LLM Prompts

- **"Read the logs in ./logs/ and help me debug this error"**
- **"Look at the latest session log and explain what's happening"**
- **"Check the logs for any performance issues"**
- **"Analyze the error logs and suggest fixes"**
- **"Review the console output from my last test run"**

## Troubleshooting

### Common Issues

**Logs not appearing?**
- Make sure your dev server is running
- Check that the `logs` directory was created
- Look for any console errors

**Import/Export Errors?**
- Visilog now uses CommonJS modules. Use `const { visilog } = require('visilog')` instead of `import`
- For Webpack plugin: `require('visilog/webpack')['visilog-webpack-plugin']`
- For Vite plugin: Use dynamic import as shown in examples

**Plugin not working?**
- Check you're using the correct import syntax for your build tool
- Verify the plugin is added to the plugins array in your config
- Look for webpack/vite console errors during build

**Vite 6.x compatibility issues?**
- Use dynamic import for the Vite plugin: `const module = await import('visilog/vite')`
- Make sure your package.json has `"type": "module"` for ES modules

**Want to exclude certain logs?**
- Use `minLevel: 1` in configuration to skip debug messages
- Use `minLevel: 3` to only capture errors

### Getting Help

**Need help?**
- Tell your LLM to read the log files directly from `./logs/`
- Include your configuration for better assistance
- Run `node examples/enhanced-usage.js` to test basic functionality
- Check the integration tests: `npm run test:integration`

## Quick Reference

### Installation & Basic Setup
```bash
npm install visilog
```

### CommonJS Import Pattern
```js
const { visilog } = require('visilog');
const { createLogger, WebSocketLogger, WebSocketLoggerServer } = visilog;
```

### Plugin Imports
```js
// Webpack
const { createWebpackPlugin } = require('visilog/webpack')['visilog-webpack-plugin'];

// Vite (with dynamic import)
const viteModule = await import('visilog/vite');
const { createVitePlugin } = viteModule;
```

### Testing Your Setup
```bash
node examples/enhanced-usage.js  # Test all features
npm run test:integration        # Test integrations
```

### LLM Commands
- `"Read the logs in ./logs/ and help debug this error"`
- `"Check the latest session log for issues"`
- `"Analyze the console output and suggest fixes"`

### File Structure
```
logs/
├── index.json                 # Session metadata
└── sessions/                  # Per-session logs
    └── session-*.log          # JSON log entries
```

---

## License

MIT License - Perfect for use with any LLM or AI assistant! 🤖

---

**Stop copying and pasting console output - let your LLM read your browser logs directly from files!** ✨

---

## 🔍 **Search Terms**

*Looking for: browser log streaming, LLM debugging tools, console log visibility, AI assistant integration, Vite logging plugin, Webpack console streaming, file-based logging, no MCP logging, real-time browser logs, TypeScript logging tools, developer experience tools, CommonJS logging* 