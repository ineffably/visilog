#!/usr/bin/env node

/**
 * Visilog Server CLI
 * Usage: npx visilog-server [options]
 */

import { visilog } from '../dist/index.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { createServer } from 'net';

const { WebSocketLoggerServer } = visilog;

// Simple port detection for CLI
async function findAvailablePortSafe(startPort = 3001) {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(startPort, (err) => {
      if (err) {
        server.close();
        // Try next port
        findAvailablePortSafe(startPort + 1).then(resolve);
      } else {
        const port = server.address().port;
        server.close(() => {
          resolve(port);
        });
      }
    });
    
    server.on('error', () => {
      findAvailablePortSafe(startPort + 1).then(resolve);
    });
  });
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    port: 3001,
    logsDir: './logs',
    host: '0.0.0.0',
    help: false,
    autoPort: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--port':
      case '-p':
        config.port = parseInt(args[++i]) || 3001;
        config.autoPort = false; // Disable auto port if explicitly set
        break;
      case '--logs-dir':
      case '-d':
        config.logsDir = args[++i] || './logs';
        break;
      case '--host':
      case '-h':
        config.host = args[++i] || '0.0.0.0';
        break;
      case '--help':
        config.help = true;
        break;
      case '--no-auto-port':
        config.autoPort = false;
        break;
      default:
        if (arg.startsWith('--')) {
          console.warn(`⚠️  Unknown option: ${arg}`);
        }
        break;
    }
  }

  return config;
}

// Show help message
function showHelp() {
  console.log(`
🔌 Visilog Server CLI

Usage: npx visilog-server [options]

Options:
  -p, --port <number>      Port to run server on (default: 3001)
  -d, --logs-dir <path>    Directory to save logs (default: ./logs)
  -h, --host <host>        Host to bind to (default: 0.0.0.0)
  --no-auto-port          Disable automatic port detection
  --help                   Show this help message

Examples:
  npx visilog-server                    # Start with defaults
  npx visilog-server -p 3002            # Use specific port
  npx visilog-server -d ./my-logs       # Custom logs directory
  npx visilog-server --no-auto-port     # Fail if port unavailable

The server will automatically find an available port if the default port
is already in use (unless --no-auto-port is specified).
`);
}

// Check for configuration file
function loadConfigFile() {
  const configPaths = [
    '.visilogrc',
    '.visilogrc.json',
    'visilog.config.js',
    'visilog.config.json'
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        if (configPath.endsWith('.js')) {
          // Dynamic import for JS config files
          return import(join(process.cwd(), configPath)).then(module => module.default || module);
        } else {
          // JSON config files
          const fs = require('fs');
          const content = fs.readFileSync(configPath, 'utf-8');
          return JSON.parse(content);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to load config file ${configPath}:`, error.message);
      }
    }
  }
  
  return {};
}

// Main server startup function
async function startServer() {
  let config = {};
  
  try {
    const args = parseArgs();
    
    if (args.help) {
      showHelp();
      process.exit(0);
    }

    // Load configuration file if it exists
    const fileConfig = await loadConfigFile();
    config = { ...fileConfig, ...args }; // CLI args override file config

    console.log('🔌 Starting Visilog Server...\n');

    // Determine the port to use
    let finalPort = config.port;
    if (config.autoPort) {
      try {
        finalPort = await findAvailablePortSafe(config.port);
        if (finalPort !== config.port) {
          console.log(`📡 Port ${config.port} is busy, using port ${finalPort} instead`);
        }
      } catch (error) {
        console.error(`❌ Could not find available port: ${error.message}`);
        process.exit(1);
      }
    }

    // Create and start the server
    const server = new WebSocketLoggerServer({
      port: finalPort,
      host: config.host,
      logsDir: config.logsDir,
      enableIndex: true,
      enableSessionLogs: true
    });

    // Setup graceful shutdown
    const cleanup = async () => {
      console.log('\n🛑 Shutting down Visilog server...');
      try {
        await server.stop();
        console.log('✅ Server stopped gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Start the server
    await server.start();

    console.log(`🎉 Visilog server is running!`);
    console.log(`📡 WebSocket server: ws://${config.host}:${finalPort}`);
    console.log(`📁 Logs directory: ${config.logsDir}`);
    console.log(`🔍 Session index: ${config.logsDir}/index.json`);
    console.log(`\n💡 Integration:`);
    console.log(`   Add to your app: import 'visilog/auto';`);
    console.log(`   Or configure URL: ws://localhost:${finalPort}`);
    console.log(`\n⏹️  Press Ctrl+C to stop the server`);

  } catch (error) {
    console.error(`❌ Failed to start Visilog server:`, error.message);
    
    if (error.message.includes('EADDRINUSE')) {
      console.log(`\n💡 Port ${config.port} is already in use. Try:`);
      console.log(`   npx visilog-server --port 3002`);
      console.log(`   Or use automatic port detection (default behavior)`);
    }
    
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

// Start the server
startServer();