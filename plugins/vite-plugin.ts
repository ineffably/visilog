import type { Plugin, ViteDevServer } from 'vite';
import { WebSocketLoggerServer } from '../server/websocket-logger-server';
import type { PluginConfig } from '../types';

interface ViteWebSocketLoggerPlugin extends Plugin {
  configureServer?: (server: ViteDevServer) => void | Promise<void>;
}

export function createVitePlugin(config: PluginConfig = {}): ViteWebSocketLoggerPlugin {
  let loggerServer: WebSocketLoggerServer | null = null;
  let isDevelopment = true;

  const {
    startServer = true,
    injectClient = true,
    development = true,
    server: serverConfig = {},
    client: clientConfig = {}
  } = config;

  const defaultServerConfig = {
    port: 3001,
    host: '0.0.0.0',
    logsDir: 'logs',
    ...serverConfig
  };

  const defaultClientConfig = {
    enableWebSocket: true,
    enableConsole: true,
    minLevel: 0,
    websocketUrl: `ws://localhost:${defaultServerConfig.port}`,
    maxRetries: 5,
    retryInterval: 2000,
    autoConnect: true,
    ...clientConfig
  };

  return {
    name: 'websocket-logger',
    
    configResolved(resolvedConfig) {
      isDevelopment = resolvedConfig.command === 'serve' && development;
    },

    async configureServer(server: ViteDevServer) {
      if (!isDevelopment || !startServer) return;

      try {
        // Start WebSocket logger server
        loggerServer = new WebSocketLoggerServer(defaultServerConfig);
        await loggerServer.start();
        
        // Setup graceful shutdown
        loggerServer.setupGracefulShutdown();

        console.log(`🔌 Vite WebSocket Logger Plugin: Server started on port ${defaultServerConfig.port}`);
        
        // Close server when Vite dev server closes
        server.httpServer?.on('close', async () => {
          if (loggerServer) {
            await loggerServer.stop();
            loggerServer = null;
          }
        });

      } catch (error) {
        console.error('❌ Failed to start WebSocket logger server:', error);
      }
    },

    transformIndexHtml: {
      enforce: 'pre',
      transform(html, _context) {
        if (!isDevelopment || !injectClient) return html;

        // Inject client-side logger initialization script
        const clientScript = `
<script type="module">
  import { WebSocketLogger } from '/@websocket-logger/client';
  
  // Initialize logger with configuration
  const logger = new WebSocketLogger(${JSON.stringify(defaultClientConfig)});
  
  // Enable console override to capture all console.log calls
  logger.enableConsoleOverride();
  
  // Make logger available globally for debugging
  window.__websocketLogger = logger;
  
  // Log that the logger is ready
  console.log('🔌 WebSocket Logger initialized and ready');
</script>`;

        // Insert before closing head tag
        return html.replace('</head>', `${clientScript}\n</head>`);
      }
    },

    resolveId(id) {
      if (id === '/@websocket-logger/client') {
        return id;
      }
    },

    load(id) {
      if (id === '/@websocket-logger/client') {
        // Return the client-side logger code as a virtual module
        return `
import { WebSocketLogger } from '@websocket-logger/client/websocket-logger';
export { WebSocketLogger };
export default WebSocketLogger;
`;
      }
    },

    handleHotUpdate(ctx) {
      // Don't trigger HMR for logger-related files unless necessary
      if (ctx.file.includes('websocket-logger')) {
        return [];
      }
    },

    buildStart() {
      if (isDevelopment && startServer && !loggerServer) {
        console.log('🔌 Vite WebSocket Logger Plugin: Preparing to start logging server...');
      }
    },

    buildEnd() {
      if (loggerServer) {
        console.log('🔌 Vite WebSocket Logger Plugin: Build completed with logging active');
      }
    },

    closeBundle: {
      sequential: true,
      async handler() {
        if (loggerServer) {
          console.log('🔌 Vite WebSocket Logger Plugin: Shutting down logger server...');
          await loggerServer.stop();
          loggerServer = null;
        }
      }
    }
  };
}

// Alternative export for ES modules
export default createVitePlugin;

// Utility function to create client initialization code
export function createClientInitCode(config: any = {}) {
  return `
import { WebSocketLogger } from '@websocket-logger/client/websocket-logger';

const logger = new WebSocketLogger(${JSON.stringify(config)});
logger.enableConsoleOverride();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.__websocketLogger = logger;
}

export default logger;
`;
}

// Utility function to check if logger server is running
export async function checkLoggerServer(port: number = 3001): Promise<boolean> {
  try {
    const ws = new WebSocket(`ws://localhost:${port}`);
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 1000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    });
  } catch {
    return false;
  }
} 