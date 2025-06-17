# Simple Integration Guide

This guide shows the **simplest ways** to integrate VisiLog into your web application, avoiding the complexity of build tool plugins.

## 🚀 Quick Start Options

### Option 1: Auto-Import (Recommended)

The easiest way - just add one import to your app during development:

```javascript
// In your main.js, index.js, or app entry point
import 'visilog/auto';

// That's it! Console logs will automatically be captured in development
console.log('This will be sent to VisiLog server');
console.error('Errors too!');
```

**Features:**
- ✅ Only activates in development environments
- ✅ Auto-detects server URL
- ✅ Fails gracefully if server unavailable  
- ✅ Adds Ctrl+Shift+L shortcut to toggle logging
- ✅ Zero configuration needed

### Option 2: Script Tag Integration

For projects without build tools or quick prototyping:

```html
<!-- Add to your HTML during development -->
<script src="https://unpkg.com/visilog/dist/browser.js"></script>
<script>
  // Auto-connects if in development environment
  if (VisiLog.isDevEnvironment()) {
    VisiLog.connect('ws://localhost:3001');
    console.log('VisiLog connected!');
  }
</script>
```

### Option 3: Server Middleware (Node.js)

Automatically inject VisiLog into all HTML responses:

```javascript
// Express.js
import { createDevMiddleware } from 'visilog/middleware';

app.use(createDevMiddleware({
  port: 3001,
  injectScript: true  // Auto-injects client script
}));

// Koa.js
import { koa } from 'visilog/middleware';
app.use(koa({ port: 3001, injectScript: true }));

// Fastify
import { fastify } from 'visilog/middleware';
fastify.register(fastify({ port: 3001, injectScript: true }));
```

### Option 4: Manual Setup

For full control:

```javascript
// Only load in development
if (process.env.NODE_ENV === 'development') {
  import('visilog/client').then(({ WebSocketLogger }) => {
    const logger = new WebSocketLogger({
      websocketUrl: 'ws://localhost:3001',
      autoConnect: true
    });
    
    logger.overrideConsole();
    console.log('Manual VisiLog setup complete');
  });
}
```

## 🔧 Server Setup

**Option 1: CLI Server (Recommended)**

The simplest way - no code needed:

```bash
# Start with defaults (port 3001, ./logs directory)
npx visilog-server

# Or with custom options
npx visilog-server --port 3002 --logs-dir ./debug-logs
```

**Option 2: Manual Server Script**

For custom control, create a script:

```javascript
// dev-logger.js
import { visilog } from 'visilog';
const { WebSocketLoggerServer } = visilog;

const server = new WebSocketLoggerServer({
  port: 3001,
  logsDir: './logs'
});

server.start().then(() => {
  console.log('🔌 VisiLog server running on port 3001');
});
```

Run it: `node dev-logger.js`

## 📦 Package.json Scripts

Add these to your package.json for easy development:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:app\" \"npx visilog-server\"",
    "dev:app": "your-normal-dev-command",
    "dev:logs": "npx visilog-server --logs-dir ./debug-logs",
    "clean:logs": "rm -rf logs"
  },
  "devDependencies": {
    "concurrently": "^7.0.0",
    "visilog": "latest"
  }
}
```

## 🌐 Framework Examples

### React
```javascript
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Add this line for development logging
import 'visilog/auto';

ReactDOM.render(<App />, document.getElementById('root'));
```

### Vue.js
```javascript
// src/main.js
import { createApp } from 'vue';
import App from './App.vue';

// Add this line for development logging
import 'visilog/auto';

createApp(App).mount('#app');
```

### Angular
```typescript
// src/main.ts
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Add this line for development logging
import 'visilog/auto';

platformBrowserDynamic().bootstrapModule(AppModule);
```

### Next.js
```javascript
// pages/_app.js
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Auto-import in client side only
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      import('visilog/auto');
    }
  }, []);

  return <Component {...pageProps} />;
}
```

## 🔍 Environment Detection

VisiLog automatically detects development environments using:

- `NODE_ENV === 'development'`
- `process.env.NODE_ENV === 'development'`  
- `window.location.hostname` includes 'localhost', '127.0.0.1', or '0.0.0.0'
- Development server ports (3000, 4000, 5000, 8080, etc.)

## ⚙️ Configuration

All methods support configuration:

```javascript
import 'visilog/auto'; // Uses defaults

// Or configure via environment variables:
// VISILOG_PORT=3002
// VISILOG_HOST=192.168.1.100
```

For manual setup:
```javascript
const logger = new WebSocketLogger({
  websocketUrl: 'ws://localhost:3001',
  enableConsole: true,     // Keep original console behavior
  enableWebSocket: true,   // Send to WebSocket server
  maxRetries: 3,
  retryInterval: 2000
});
```

## 🚨 Error Handling

All simple integration methods fail gracefully:

- ❌ Server unavailable → Logs only to console
- ❌ Network error → Retries with backoff
- ❌ Import fails → Application continues normally
- ❌ WebSocket error → Falls back to console only

## 🎯 Why Simple Integration?

**Build tool plugins are complex:**
- 🔴 Webpack plugin: Hooks into compilation, HTML injection issues
- 🔴 Vite plugin: Transform chains, SSR complications  
- 🔴 Framework-specific: Different for each build system

**Simple integration is better:**
- ✅ Works with any build system
- ✅ No build tool configuration needed
- ✅ Easy to enable/disable
- ✅ Zero impact on production builds
- ✅ Simple to debug and understand

## 📋 Troubleshooting

**Logs not appearing?**
1. Check server is running: `curl http://localhost:3001`
2. Check browser DevTools for WebSocket connection
3. Verify you're in development environment
4. Try manual setup for debugging

**Server won't start?**
1. Check port 3001 isn't in use: `lsof -i :3001`
2. Try different port: `VISILOG_PORT=3002`
3. Check firewall settings

**Integration not working?**
1. Verify the import path: `import 'visilog/auto'`
2. Check console for VisiLog messages
3. Try the manual setup method instead

## 🔄 Migration from Build Plugins

If you're using the complex webpack/vite plugins:

```diff
// Before (complex)
- import { createVitePlugin } from 'visilog';
- plugins: [createVitePlugin({ port: 3001 })]

// After (simple)
+ import 'visilog/auto';
```

Much simpler!