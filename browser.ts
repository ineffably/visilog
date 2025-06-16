/**
 * Browser bundle for VisiLog - can be used via script tag
 * 
 * Usage:
 * <script src="https://unpkg.com/visilog/dist/browser.js"></script>
 * <script>
 *   VisiLog.connect('ws://localhost:3001');
 * </script>
 */

import { WebSocketLogger } from './client/websocket-logger';
import { EnvironmentDetector } from './library/environment-detector';

interface BrowserVisiLog {
  connect(url?: string, config?: any): WebSocketLogger;
  isDevEnvironment(): boolean;
  version: string;
}

const createBrowserVisiLog = (): BrowserVisiLog => {

  return {
    connect(url = 'ws://localhost:3001', config = {}) {
      const logger = new WebSocketLogger({
        enableWebSocket: true,
        enableConsole: true,
        websocketUrl: url,
        autoConnect: true,
        maxRetries: 3,
        retryInterval: 2000,
        ...config
      });

      // Override console methods
      logger.enableConsoleOverride();

      // Store globally for access
      (window as any).__visilog = logger;

      console.info(`🔌 VisiLog connected to ${url}`);
      return logger;
    },

    isDevEnvironment() {
      return EnvironmentDetector.detect().isDevelopment;
    },

    version: process.env.npm_package_version || '0.0.0'
  };
};

// Auto-setup if in development environment
if (EnvironmentDetector.detect().isDevelopment) {
  console.info('🔌 VisiLog auto-detection enabled. Call VisiLog.connect() to start logging.');
}

// Export for module usage
export default createBrowserVisiLog();

// Make available globally for script tag usage
if (typeof window !== 'undefined') {
  (window as any).VisiLog = createBrowserVisiLog();
}