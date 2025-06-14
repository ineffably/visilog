import { WebSocketLoggerServer } from '../server/websocket-logger-server';
import type { PluginConfig } from '../types';

// Define minimal webpack types to avoid dependency
interface Compiler {
  hooks: {
    environment: { tap: (name: string, fn: () => void) => void };
    beforeCompile: { tapAsync: (name: string, fn: (compilation: any, callback: () => void) => void) => void };
    compilation: { tap: (name: string, fn: (compilation: any) => void) => void };
    normalModuleFactory: { tap: (name: string, fn: (nmf: any) => void) => void };
    afterEnvironment: { tap: (name: string, fn: () => void) => void };
    done: { tapAsync: (name: string, fn: (stats: any, callback: () => void) => void) => void };
    shutdown: { tapAsync: (name: string, fn: (callback: () => void) => void) => void };
  };
  options: {
    mode?: string;
    devServer?: any;
  };
}

interface WebpackPluginInstance {
  apply(compiler: Compiler): void;
}

export class WebSocketLoggerWebpackPlugin implements WebpackPluginInstance {
  private loggerServer: WebSocketLoggerServer | null = null;
  private config: PluginConfig;
  private isDevelopment = true;

  constructor(config: PluginConfig = {}) {
    this.config = {
      startServer: true,
      injectClient: true,
      development: true,
      server: {
        port: 3001,
        host: '0.0.0.0',
        logsDir: 'logs',
        ...config.server
      },
      client: {
        enableWebSocket: true,
        enableConsole: true,
        minLevel: 0,
        websocketUrl: `ws://localhost:${config.server?.port || 3001}`,
        maxRetries: 5,
        retryInterval: 2000,
        autoConnect: true,
        ...config.client
      },
      ...config
    };
  }

  apply(compiler: Compiler): void {
    const pluginName = 'WebSocketLoggerWebpackPlugin';

    // Determine if we're in development mode
    compiler.hooks.environment.tap(pluginName, () => {
      this.isDevelopment = compiler.options.mode === 'development' && (this.config.development ?? true);
    });

    // Start server when compilation begins
    compiler.hooks.beforeCompile.tapAsync(pluginName, async (compilation, callback) => {
      if (this.isDevelopment && this.config.startServer && !this.loggerServer) {
        try {
          this.loggerServer = new WebSocketLoggerServer(this.config.server);
          await this.loggerServer.start();
          console.log(`🔌 Webpack WebSocket Logger Plugin: Server started on port ${this.config.server!.port}`);
        } catch (error) {
          console.error('❌ Failed to start WebSocket logger server:', error);
        }
      }
      callback();
    });

    // Inject client code if enabled
    if (this.config.injectClient) {
      compiler.hooks.compilation.tap(pluginName, (compilation) => {
        if (!this.isDevelopment) return;

        // Hook into HTML webpack plugin if available
        const HtmlWebpackPlugin = this.getHtmlWebpackPlugin();
        if (HtmlWebpackPlugin) {
          HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
            pluginName,
            (data, callback) => {
              data.html = this.injectClientScript(data.html);
              callback(null, data);
            }
          );
        }
      });

      // Add virtual module resolution
      compiler.hooks.normalModuleFactory.tap(pluginName, (nmf) => {
        nmf.hooks.resolve.tapAsync(pluginName, (result, callback) => {
          if (result.request === '@websocket-logger/client') {
            result.request = this.getClientModulePath();
          }
          callback(null, result);
        });
      });
    }

    // Handle dev server
    if (compiler.options.devServer) {
      compiler.hooks.afterEnvironment.tap(pluginName, () => {
        const devServer = compiler.options.devServer;
        
        // Add setup middleware to inject client
        if (!devServer.setupMiddlewares) {
          devServer.setupMiddlewares = [];
        }
        
        if (Array.isArray(devServer.setupMiddlewares)) {
          devServer.setupMiddlewares.push((middlewares, devServer) => {
            // Add route for client script
            devServer.app?.get('/__websocket-logger-client.js', (req, res) => {
              res.setHeader('Content-Type', 'application/javascript');
              res.send(this.generateClientScript());
            });
            return middlewares;
          });
        }
      });
    }

    // Cleanup on done
    compiler.hooks.done.tapAsync(pluginName, async (stats, callback) => {
      if (this.loggerServer && !this.isDevelopment) {
        console.log('🔌 Webpack WebSocket Logger Plugin: Shutting down logger server...');
        await this.loggerServer.stop();
        this.loggerServer = null;
      }
      callback();
    });

    // Cleanup on shutdown
    compiler.hooks.shutdown.tapAsync(pluginName, async (callback) => {
      if (this.loggerServer) {
        await this.loggerServer.stop();
        this.loggerServer = null;
      }
      callback();
    });
  }

  private injectClientScript(html: string): string {
    const clientScript = `
<script>
  ${this.generateClientScript()}
</script>`;

    // Insert before closing head tag or at the beginning of body
    if (html.includes('</head>')) {
      return html.replace('</head>', `${clientScript}\n</head>`);
    } else if (html.includes('<body>')) {
      return html.replace('<body>', `<body>\n${clientScript}`);
    } else {
      return clientScript + html;
    }
  }

  private generateClientScript(): string {
    return `
(function() {
  // Check if WebSocket is available
  if (typeof WebSocket === 'undefined') {
    console.warn('WebSocket not available, skipping logger initialization');
    return;
  }

  // Simple WebSocket logger implementation
  class SimpleWebSocketLogger {
    constructor(config) {
      this.config = Object.assign({
        enableWebSocket: true,
        enableConsole: true,
        minLevel: 0,
        websocketUrl: 'ws://localhost:3001',
        maxRetries: 5,
        retryInterval: 2000
      }, config);
      
      this.ws = null;
      this.sessionId = null;
      this.messageQueue = [];
      this.reconnectAttempts = 0;
      this.originalConsole = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        debug: console.debug.bind(console)
      };
      
      this.init();
    }
    
    init() {
      if (this.config.enableWebSocket) {
        this.connect();
      }
      this.overrideConsole();
    }
    
    connect() {
      try {
        this.ws = new WebSocket(this.config.websocketUrl);
        
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.processQueue();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'session-init') {
              this.sessionId = data.sessionId;
            }
          } catch {
            console.error('Failed to parse server message:', 'Parse error');
          }
        };
        
        this.ws.onclose = () => {
          this.scheduleReconnect();
        };
        
        this.ws.onerror = () => {
          this.scheduleReconnect();
        };
      } catch (connectError) {
        console.error('Failed to connect to logging server:', connectError);
      }
    }
    
    scheduleReconnect() {
      if (this.reconnectAttempts >= this.config.maxRetries) {
        this.config.enableWebSocket = false;
        return;
      }
      
      const delay = this.config.retryInterval * Math.pow(2, this.reconnectAttempts);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
    
    processQueue() {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.sendMessage(message);
      }
    }
    
    sendMessage(logMessage) {
      if (!this.config.enableWebSocket) return;
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'log', log: logMessage }));
        } catch (error) {
          this.messageQueue.push(logMessage);
        }
      } else {
        this.messageQueue.push(logMessage);
        if (this.messageQueue.length > 1000) {
          this.messageQueue.shift();
        }
      }
    }
    
    overrideConsole() {
      const levels = ['log', 'info', 'warn', 'error', 'debug'];
      
      levels.forEach(level => {
        console[level] = (...args) => {
          if (this.config.enableConsole) {
            this.originalConsole[level](...args);
          }
          
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          
          const logMessage = {
            level: level,
            message: message,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId || 'unknown',
            url: window.location.href,
            userAgent: navigator.userAgent,
            data: args.filter(arg => typeof arg === 'object' && arg !== null)
          };
          
          this.sendMessage(logMessage);
        };
      });
    }
  }
  
  // Initialize logger
  const logger = new SimpleWebSocketLogger(${JSON.stringify(this.config.client)});
  
  // Make available globally
  window.__websocketLogger = logger;
  
  console.log('🔌 WebSocket Logger initialized and ready');
})();
`;
  }

  private getClientModulePath(): string {
    // This would typically resolve to the actual client module
    // For now, return a placeholder
    return require.resolve('../client/websocket-logger');
  }

  private getHtmlWebpackPlugin(): any {
    try {
      return require('html-webpack-plugin');
    } catch {
      return null;
    }
  }
}

// Factory function for easier usage
export function createWebpackPlugin(config: PluginConfig = {}): WebSocketLoggerWebpackPlugin {
  return new WebSocketLoggerWebpackPlugin(config);
}

// Default export
export default WebSocketLoggerWebpackPlugin; 