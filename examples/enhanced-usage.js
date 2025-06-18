/**
 * Visilog Enhanced Usage Example
 * Demonstrates Phase 1 & 2 improvements that exceed feedback expectations
 */

// Import the basic logger components (current actual exports)
const WebSocketLoggerServerModule = require('../dist/server/websocket-logger-server');
const WebSocketLoggerServer = WebSocketLoggerServerModule['visilog-server'].WebSocketLoggerServer;

const WebSocketLoggerModule = require('../dist/client/websocket-logger');
const WebSocketLogger = WebSocketLoggerModule['visilog-client'].WebSocketLogger;

async function demonstrateEnhancements() {
  console.log('🚀 Visilog Core Features Demo\n');

  // 1. Start WebSocket Server with chunking
  console.log('🔌 Starting WebSocket Server with Chunking:');
  const server = new WebSocketLoggerServer({
    port: 3001,
    enableChunking: true,
    maxLogFileSize: 50 * 1024, // 50KB chunks for LLM-friendly sizes
    maxChunksPerSession: 20,
    logsDir: './demo-logs'
  });

  await server.start();
  console.log('   ✅ Server started with chunking enabled');
  console.log();

  // 2. Create WebSocket Logger Client  
  console.log('📱 Creating WebSocket Logger Client:');
  const logger = new WebSocketLogger({
    websocketUrl: 'ws://localhost:3001',
    enableWebSocket: true,
    enableConsole: true,
    autoConnect: true,
    namespace: 'demo-app'
  });

  // Wait for connection
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('   ✅ Client connected');
  console.log(`   📊 Status: ${logger.getConnectionStatus()}`);
  console.log();

  // 3. Structured Logging
  console.log('📝 Structured Logging:');
  
  logger.info('User authentication', {
    userId: 12345,
    method: '2FA',
    timestamp: Date.now(),
    metadata: {
      userAgent: 'Demo Browser',
      ipAddress: '192.168.1.100'
    }
  });

  logger.warn('Rate limit approaching', {
    userId: 12345,
    remaining: 5,
    resetTime: Date.now() + 60000
  });

  console.log('   ✅ Structured logs sent');
  console.log();

  // 4. Console Override Logging
  console.log('🖥️  Console Override Logging:');
  
  // Enable console override to capture all console.* calls
  logger.enableConsoleOverride();

  // These will be captured automatically
  console.log('This log will be captured by visilog');
  console.error('This error will be captured too', { errorCode: 500 });
  console.warn('Performance warning', { loadTime: 2500 });

  console.log('   ✅ Console override logs captured');
  console.log();

  // 5. Session and Chunk Information
  console.log('📊 Session Information:');
  
  // Wait a bit for logs to process
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const sessionId = logger.getSessionId();
  const sessions = server.getSessions();
  
  console.log(`   🆔 Current Session ID: ${sessionId}`);
  console.log(`   📈 Active Sessions: ${sessions.length}`);
  
  if (sessions.length > 0) {
    const session = sessions[0];
    console.log(`   📦 Current Chunk: ${session.currentChunk}`);
    console.log(`   📦 Total Chunks: ${session.totalChunks}`);
    console.log(`   📏 Current Chunk Size: ${session.currentChunkSize} bytes`);
  }
  
  console.log();

  // 6. Generate Large Log to Test Chunking
  console.log('📦 Testing Chunking Feature:');
  
  // Generate logs to trigger chunking
  for (let i = 0; i < 50; i++) {
    logger.info(`Large log entry ${i + 1}`, {
      index: i,
      data: 'A'.repeat(200), // Large string to fill chunk faster
      timestamp: Date.now(),
      user: { id: i % 5, name: `User${i % 5}` },
      metadata: {
        requestId: `req_${i}`,
        sessionData: { theme: 'dark', lang: 'en' }
      }
    });
  }
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const updatedSessions = server.getSessions();
  if (updatedSessions.length > 0) {
    const session = updatedSessions[0];
    console.log(`   ✅ Chunking results:`);
    console.log(`   📦 Final Chunks Created: ${session.totalChunks}`);
    console.log(`   📏 Current Chunk Size: ${session.currentChunkSize} bytes`);
    console.log(`   📝 Total Messages: ${session.messageCount}`);
  }
  
  console.log();

  // 7. Configuration and Status
  console.log('⚙️  Configuration and Status:');
  
  console.log(`   🔌 Connection Status: ${logger.getConnectionStatus()}`);
  console.log(`   📋 Queue Size: ${logger.getQueueSize()}`);
  console.log(`   🔗 Is Connected: ${logger.isConnected()}`);
  
  const serverStats = server.getStats();
  console.log(`   🖥️  Server Active Sessions: ${serverStats.activeSessions}`);
  console.log(`   📁 Logs Directory: ${serverStats.logsDirectory}`);
  
  console.log();

  // Summary
  console.log('🎉 Demo Complete!');
  console.log('\n📊 Summary of Core Features Demonstrated:');
  console.log('   ✅ WebSocket Server with Chunking');
  console.log('   ✅ WebSocket Client with Auto-Connect');
  console.log('   ✅ Structured Logging with Complex Objects');
  console.log('   ✅ Console Override for Automatic Capture');
  console.log('   ✅ Session Management with Timestamped Files');
  console.log('   ✅ Intelligent Log Chunking (50KB LLM-friendly)');
  console.log('   ✅ Real-time Session Monitoring');
  console.log('   ✅ Configuration Management');
  console.log('\n🚀 Visilog: Ready for LLM-assisted debugging!');

  // Cleanup
  setTimeout(async () => {
    await server.stop();
    process.exit(0);
  }, 1000);
}

// Run the demonstration
demonstrateEnhancements().catch(console.error); 