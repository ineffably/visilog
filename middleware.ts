/**
 * Simple middleware for Node.js servers to auto-inject VisiLog
 * 
 * Usage:
 * import { createDevMiddleware } from 'visilog/middleware';
 * 
 * app.use(createDevMiddleware({
 *   port: 3001,
 *   injectScript: true
 * }));
 */

import { Request, Response, NextFunction } from 'express';
import { WebSocketLoggerServer } from './server/websocket-logger-server';

interface MiddlewareConfig {
  port?: number;
  host?: string;
  injectScript?: boolean;
  logsDir?: string;
  enabled?: boolean;
}

export function createDevMiddleware(config: MiddlewareConfig = {}) {
  const {
    port = 3001,
    host = '0.0.0.0',
    injectScript = true,
    logsDir = 'logs',
    enabled = process.env.NODE_ENV === 'development'
  } = config;

  let server: WebSocketLoggerServer | null = null;

  // Start WebSocket server
  if (enabled) {
    server = new WebSocketLoggerServer({
      port,
      host,
      logsDir
    });

    server.start().then(() => {
      console.log(`🔌 VisiLog middleware: WebSocket server started on ${host}:${port}`);
    }).catch((error) => {
      console.error('❌ VisiLog middleware: Failed to start server:', error);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => server?.stop());
    process.on('SIGINT', () => server?.stop());
  }

  // Return middleware function
  return (req: Request, res: Response, next: NextFunction) => {
    if (!enabled || !injectScript) {
      return next();
    }

    // Only inject into HTML responses
    const originalSend = res.send;
    res.send = function(body: any) {
      if (typeof body === 'string' && body.includes('<html')) {
        const clientScript = `
<script>
  // VisiLog auto-injected client
  (function() {
    if (typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/visilog/dist/browser.js';
    script.onload = function() {
      if (window.VisiLog && window.VisiLog.isDevEnvironment()) {
        window.VisiLog.connect('ws://' + window.location.hostname + ':${port}');
      }
    };
    document.head.appendChild(script);
  })();
</script>`;

        // Inject before closing head tag
        if (body.includes('</head>')) {
          body = body.replace('</head>', clientScript + '\n</head>');
        } else if (body.includes('<head>')) {
          body = body.replace('<head>', '<head>\n' + clientScript);
        }
      }
      
      return originalSend.call(this, body);
    };

    next();
  };
}

// Named exports for different server types
export const express = createDevMiddleware;
export const koa = (config: MiddlewareConfig = {}) => {
  const middleware = createDevMiddleware(config);
  
  return (ctx: any, next: any) => {
    return new Promise((resolve, reject) => {
      middleware(ctx.request, ctx.response, (error: any) => {
        if (error) reject(error);
        else resolve(next());
      });
    });
  };
};

export const fastify = (config: MiddlewareConfig = {}) => {
  const middleware = createDevMiddleware(config);
  
  return (request: any, reply: any, done: any) => {
    middleware(request, reply, done);
  };
};