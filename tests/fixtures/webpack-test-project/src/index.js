console.log('🚀 Webpack app starting...');

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('test-logging').addEventListener('click', () => {
    console.log('Test log message from Webpack app');
    console.info('Test info message', { timestamp: Date.now() });
    console.warn('Test warning message');
    console.error('Test error message');
  });

  // Test that the logger was injected
  if (window.__websocketLogger) {
    console.log('✅ WebSocket Logger successfully injected by Webpack plugin');
  } else {
    console.warn('❌ WebSocket Logger not found - plugin may not be working');
  }
});