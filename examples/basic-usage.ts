// Example: Basic usage of the WebSocket Logger

// ========================================
// Server Setup (Node.js)
// ========================================
import { WebSocketLoggerServer } from '../server/websocket-logger-server'
import type { SessionInfo, LogMessage } from '../types'

async function startLoggingServer() {
  const server = new WebSocketLoggerServer({
    port: 3001,
    host: '0.0.0.0',
    logsDir: './logs',
    maxSessions: 50,
    cleanupThreshold: 75,
    cleanupAmount: 25,
    enableIndex: true,
    enableSessionLogs: true
  })

  // Listen for new sessions
  server.onSession((sessionInfo: SessionInfo) => {
    console.log(`🆕 New session: ${sessionInfo.id}`)
  })

  // Listen for log messages
  server.onLog((logMessage: LogMessage) => {
    if (logMessage.level === 'error') {
      console.log(`🚨 Error logged: ${logMessage.message}`)
      // Could send alerts, save to database, etc.
    }
  })

  // Listen for errors
  server.onError((error: Error, context?: string) => {
    console.error(`❌ Server error in ${context}:`, error)
  })

  // Setup graceful shutdown
  server.setupGracefulShutdown()

  // Start the server
  await server.start()
  console.log('🔌 WebSocket logger server is running!')

  return server
}

// ========================================
// Client Setup (Browser)
// ========================================
import { WebSocketLogger } from '../client/websocket-logger'

function setupClientLogger() {
  const logger = new WebSocketLogger({
    websocketUrl: 'ws://localhost:3001',
    enableWebSocket: true,
    enableConsole: true,
    minLevel: 0, // Log all levels
    maxRetries: 5,
    retryInterval: 2000,
    autoConnect: true,
    namespace: 'my-app'
  })

  // Enable console override to capture all console.* calls
  logger.enableConsoleOverride()

  // Listen for log events
  logger.onLog((logMessage: LogMessage) => {
    // Custom handling of log messages
    if (logMessage.level === 'error') {
      // Could show user notification, etc.
    }
  })

  // Listen for connection errors
  logger.onError((error: Error, context?: string) => {
    console.warn(`Logger error in ${context}:`, error)
  })

  // Make logger available globally for debugging
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    (globalThis as any).window.__logger = logger
  }

  return logger
}

// ========================================
// Usage Examples
// ========================================

function demonstrateLogging() {
  // All these will be captured automatically by the console override
  console.log('Basic log message')
  console.info('Information message')
  console.warn('Warning message')
  console.error('Error message')
  console.debug('Debug message')

  // Structured logging with data
  console.log('User interaction', {
    userId: 123,
    action: 'click',
    element: 'submit-button',
    timestamp: new Date().toISOString()
  })

  // Complex object logging
  const complexData = {
    config: { theme: 'dark', language: 'en' },
    metrics: { loadTime: 1500, memoryUsage: 45.2 },
    user: { id: 123, role: 'admin' }
  }
  console.log('Application state', complexData)
}

// ========================================
// Direct Logger Usage
// ========================================

function demonstrateDirectLogging(logger: WebSocketLogger) {
  // Direct logging methods (bypass console)
  logger.log('Direct log message')
  logger.info('Direct info message') 
  logger.warn('Direct warning message')
  logger.error('Direct error message')
  logger.debug('Direct debug message')

  // With structured data
  logger.info('User login', {
    userId: 456,
    loginMethod: 'oauth',
    timestamp: new Date().toISOString()
  })
}

// ========================================
// Configuration Updates
// ========================================

function demonstrateConfigUpdates(logger: WebSocketLogger) {
  // Change log level dynamically
  logger.setMinLevel('warn') // Only log warn and error

  // Toggle WebSocket logging
  logger.enableWebSocketLogging(false) // Console only
  logger.enableWebSocketLogging(true)  // Re-enable WebSocket

  // Toggle console output
  logger.enableConsoleLogging(false) // Silent mode
  logger.enableConsoleLogging(true)  // Re-enable console

  // Update full configuration
  logger.updateConfig({
    minLevel: 2, // info and above
    retryInterval: 5000,
    namespace: 'updated-app'
  })
}

// ========================================
// Connection Management
// ========================================

function demonstrateConnectionManagement(logger: WebSocketLogger) {
  // Check connection status
  console.log('Connection status:', logger.getConnectionStatus())
  console.log('Is connected:', logger.isConnected())
  console.log('Queue size:', logger.getQueueSize())
  console.log('Session ID:', logger.getSessionId())

  // Manual connection control
  logger.disconnect()
  setTimeout(() => {
    logger.connect()
  }, 2000)
}

// ========================================
// Server Management
// ========================================

async function demonstrateServerManagement(server: WebSocketLoggerServer) {
  // Get server statistics
  const stats = server.getStats()
  console.log('Server stats:', stats)

  // Get active sessions
  const sessions = server.getSessions()
  console.log('Active sessions:', sessions)

  // Get specific session
  if (sessions.length > 0) {
    const session = server.getSession(sessions[0].id)
    console.log('Session details:', session)
  }

  // Update server configuration
  server.updateConfig({
    maxSessions: 100,
    cleanupThreshold: 150
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...')
    await server.stop()
    process.exit(0)
  })
}

// ========================================
// Complete Example
// ========================================

async function runCompleteExample() {
  try {
    // Start server
    const server = await startLoggingServer()
    
    // Setup client (in browser context)
    const logger = setupClientLogger()
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Demonstrate features
    demonstrateLogging()
    demonstrateDirectLogging(logger)
    demonstrateConfigUpdates(logger)
    demonstrateConnectionManagement(logger)
    await demonstrateServerManagement(server)
    
  } catch (error) {
    console.error('Example failed:', error)
  }
}

// Export for use in other examples
export {
  startLoggingServer,
  setupClientLogger,
  demonstrateLogging,
  demonstrateDirectLogging,
  runCompleteExample
} 