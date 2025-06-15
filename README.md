# Visilog

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue" alt="TypeScript Ready">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/npm/v/visilog" alt="npm version">
  <a href="https://github.com/ineffably/visilog/actions/workflows/ci.yml">
    <img src="https://github.com/ineffably/visilog/actions/workflows/ci.yml/badge.svg" alt="CI Status">
  </a>
  <img src="https://raw.githubusercontent.com/ineffably/visilog/main/badges/coverage.svg" alt="Test Coverage">
  <img src="https://img.shields.io/badge/No%20MCP-Required-brightgreen" alt="No MCP Required">
</div>

<p align="center">
  <b>Stream your browser console logs directly to files so your LLM can read them</b><br>
  <sub>Works with Vite and Webpack. No MCP setup required - just tell your LLM to read the log files like any other browser logs.</sub>
</p>

## Why This Tool?

When working with LLMs on web development, you constantly need to share browser console logs for debugging help. Instead of copying and pasting console output, Visilog automatically streams all your browser logs to files that your LLM can read directly. No complex setup, no MCP protocol - just simple file-based logging that works with any LLM.

## Features

- 🤖 **LLM-ready** - Your LLM can read the log files directly, no copying/pasting needed
- 📁 **File-based** - Saves all console logs to simple files your LLM can access
- 🔌 **Plugin support** - Drop-in plugins for Vite and Webpack
- 📱 **Session tracking** - Separate log files per browser session
- ⚡ **Zero config** - Add one line to your config, that's it
- 🚫 **No MCP** - No complex protocols or setup required
- 🔄 **Real-time** - Logs stream instantly as they happen

## Quick Start

### Installation

```bash
npm install visilog
```

### Vite Plugin (Recommended)

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { createVitePlugin } from 'visilog/vite'

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

That's it! Your browser logs are now automatically saved to files. Just tell your LLM to read the `./logs/` folder.

### Tell Your LLM

```
"Please read the browser console logs in the ./logs/ directory and help me debug this issue"
```

Your LLM can now see all your browser console output without you copying and pasting anything!

### Webpack Plugin

```ts
// webpack.config.js
const { createWebpackPlugin } = require('visilog/webpack')

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

### Manual Setup

If you're not using Vite or Webpack, you can set up the logger manually:

```ts
// Server (Node.js) - saves logs to files
import { WebSocketLoggerServer } from 'visilog/server'

const server = new WebSocketLoggerServer({
  logsDir: './logs'  // Your logs will be saved here
})

await server.start()
```

```ts
// Client (Browser) - captures console logs
import { WebSocketLogger } from 'visilog/client'

const logger = new WebSocketLogger()
logger.enableConsoleOverride() // Automatically capture all console.* calls

// Now all your console.log, console.error, etc. are saved to files your LLM can read!
```

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

### 🚀 Complete E-commerce Application Example

Here's a comprehensive example showing how to use the WebSocket logger in a real application:

```ts
// vite.config.ts - Setup (Zero Configuration)
import { defineConfig } from 'vite'
import { createVitePlugin } from 'visilog/vite'

export default defineConfig({
  plugins: [
    createVitePlugin() // That's it! All console logs now saved to ./logs/
  ]
})
```

```tsx
// ShoppingApp.tsx - React Component with Full Logging
import React, { useState, useEffect } from 'react'

export function ShoppingApp() {
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🚀 Shopping app initializing', { 
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent 
    }) // ✅ Logged to file

    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      console.log('🔍 Loading user session') // ✅ Logged to file
      
      const userData = await fetchUserSession()
      setUser(userData)
      
      console.log('✅ User session loaded', { 
        userId: userData.id,
        userRole: userData.role 
      }) // ✅ Logged to file

      const cartData = await fetchUserCart(userData.id)
      setCart(cartData)
      
      console.info('🛒 Cart loaded', { 
        itemCount: cartData.length,
        cartTotal: calculateTotal(cartData) 
      }) // ✅ Logged to file as INFO level

    } catch (error) {
      console.error('❌ App initialization failed', { 
        error: error.message,
        stack: error.stack,
        url: window.location.href 
      }) // ✅ Complete error logged to file
    } finally {
      setLoading(false)
      console.log('🏁 App initialization complete') // ✅ Logged to file
    }
  }

  const addToCart = async (product) => {
    console.log('🛒 Adding item to cart', { 
      productId: product.id,
      productName: product.name,
      price: product.price,
      currentCartSize: cart.length 
    }) // ✅ Logged to file

try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 })
      })

      if (!response.ok) {
        console.warn('⚠️ Add to cart response not OK', { 
          status: response.status,
          productId: product.id 
        }) // ✅ Logged to file
      }

      const updatedCart = await response.json()
      setCart(updatedCart.items)
      
      console.log('✅ Item added to cart successfully', { 
        productId: product.id,
        newCartSize: updatedCart.items.length,
        newTotal: updatedCart.total 
      }) // ✅ Logged to file

    } catch (error) {
      console.error('💥 Failed to add item to cart', { 
        error: error.message,
        productId: product.id,
        stack: error.stack 
      }) // ✅ Error logged to file
    }
  }

  const checkout = async () => {
    console.log('💳 Starting checkout process', { 
      itemCount: cart.length,
      total: calculateTotal(cart),
      items: cart.map(item => ({ id: item.id, quantity: item.quantity })) 
    }) // ✅ Logged to file

    try {
      const order = await processPayment(cart)
      
      console.log('✅ Checkout successful!', { 
        orderId: order.id,
        total: order.total,
        paymentMethod: order.paymentMethod 
      }) // ✅ Logged to file
      
      setCart([])
      return order
      
} catch (error) {
      console.error('❌ Checkout failed', { 
        error: error.message,
        cartItems: cart,
        total: calculateTotal(cart),
        userId: user?.id 
      }) // ✅ Complete error context logged
      throw error
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Shopping App</h1>
      {/* Your component JSX */}
      <button onClick={() => addToCart(selectedProduct)}>
        Add to Cart
      </button>
      <button onClick={checkout}>
        Checkout ({cart.length} items)
      </button>
    </div>
  )
}
```

**Every console statement above is automatically captured and saved to structured JSON log files that your LLM can read!**

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

## Manual API (Advanced Usage)

If you need more control, you can use the logger programmatically:

### Client API

```ts
import { WebSocketLogger } from 'visilog/client'

const logger = new WebSocketLogger()

// Start capturing console logs
logger.enableConsoleOverride()

// Manual logging
logger.log('Custom message')
logger.error('Something went wrong')

// Stop and cleanup
logger.destroy()
```

### Server API

```ts
import { WebSocketLoggerServer } from 'visilog/server'

const server = new WebSocketLoggerServer({
  logsDir: './logs'
})

await server.start()
// ... logs are being saved to files
await server.stop()
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

```ts
// next.config.js
const { createWebpackPlugin } = require('visilog/webpack')

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

**Logs not appearing?**
- Make sure your dev server is running
- Check that the `logs` directory was created
- Look for any console errors

**Want to exclude certain logs?**
- Use `minLevel: 1` in configuration to skip debug messages
- Use `minLevel: 3` to only capture errors

**Need help?**
- Tell your LLM to read the log files directly from `./logs/`
- Include your configuration for better assistance

## License

MIT License - Perfect for use with any LLM or AI assistant! 🤖

---

**Stop copying and pasting console output - let your LLM read your browser logs directly from files!** ✨ 