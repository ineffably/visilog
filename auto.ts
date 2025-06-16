/**
 * Auto-setup for VisiLog - just import this module in development
 * 
 * Usage:
 * // In your main.js or wherever you want logging
 * import 'visilog/auto';
 * 
 * // That's it! Console logs will automatically be sent to WebSocket server
 */

import { WebSocketLogger } from './client/websocket-logger';
import { EnvironmentDetector } from './library/environment-detector';

// Only activate in development environments
const isDev = EnvironmentDetector.detect().isDevelopment;

if (isDev) {
  // Auto-detect server URL based on current page
  const getServerUrl = (): string => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname;
      const port = process.env.VISILOG_PORT || '3001';
      return `${protocol}//${hostname}:${port}`;
    }
    return 'ws://localhost:3001';
  };

  try {
    const logger = new WebSocketLogger({
      enableWebSocket: true,
      enableConsole: true, // Keep original console behavior
      websocketUrl: getServerUrl(),
      autoConnect: true,
      maxRetries: 3, // Less aggressive in auto mode
      retryInterval: 2000
    });

    // Override console methods to capture logs
    logger.enableConsoleOverride();

    // Make logger available globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).__visilog = logger;
    }

    // Notify that logging is active
    console.info('🔌 VisiLog auto-setup complete - console logs will be captured');

    // Optional: Add keyboard shortcut to toggle logging
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+L to toggle logging
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
          const currentState = logger.getConfig().enableWebSocket;
          logger.updateConfig({ enableWebSocket: !currentState });
          console.info(`🔌 VisiLog ${!currentState ? 'enabled' : 'disabled'}`);
        }
      });
    }

  } catch (error) {
    // Fail silently in auto mode - don't break the application
    console.warn('VisiLog auto-setup failed:', error);
  }
} else {
  // In production, do nothing
  console.debug('VisiLog auto-setup skipped (not in development environment)');
}

export default {};