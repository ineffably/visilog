// Test CommonJS imports
console.log('🧪 Testing CommonJS imports...');

try {
  // Test main exports
  const visilog = require('visilog');
  console.log('✅ Main package imported:', Object.keys(visilog));

  // Test client
  const { WebSocketLogger } = require('visilog/client/websocket-logger');
  console.log('✅ WebSocketLogger imported:', typeof WebSocketLogger);

  // Test server
  const { WebSocketLoggerServer } = require('visilog/server/websocket-logger-server');
  console.log('✅ WebSocketLoggerServer imported:', typeof WebSocketLoggerServer);

  // Test enhanced factory
  const { createLogger, getGlobalLogger } = require('visilog');
  console.log('✅ Enhanced factory functions imported:', typeof createLogger, typeof getGlobalLogger);

  // Test types (should be available)
  console.log('✅ Package structure looks good!');

  // Test basic functionality
  const logger = new WebSocketLogger({
    enableWebSocket: false, // Disable WebSocket for testing
    enableConsole: true
  });

  logger.info('🎉 CommonJS test successful!');
  
  console.log('✅ All CommonJS tests passed!');
} catch (error) {
  console.error('❌ CommonJS test failed:', error.message);
  process.exit(1);
} 