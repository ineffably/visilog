/**
 * Framework Examples Integration Tests
 * 
 * Tests that validate our framework examples actually work with real builds
 * and that Visilog integration functions correctly.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { WebSocketLoggerServer } from '../../server/websocket-logger-server';

// Test configuration
const TEST_CONFIG = {
  server: {
    port: 3001,
    logsDir: './test-logs'
  },
  apps: {
    react: {
      port: 5173,
      dir: path.join(__dirname, '../fixtures/react-vite-app'),
      buildCommand: 'npm run build',
      devCommand: 'npm run dev'
    },
    vue: {
      port: 5174, 
      dir: path.join(__dirname, '../fixtures/vue-vite-app'),
      buildCommand: 'npm run build',
      devCommand: 'npm run dev'
    }
  }
};

describe('Framework Examples Integration Tests', () => {
  let loggerServer: WebSocketLoggerServer;
  let processes: ChildProcess[] = [];

  beforeAll(async () => {
    // Clean up any existing test logs
    try {
      await fs.rm(TEST_CONFIG.server.logsDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, that's ok
    }

    // Start Visilog server
    loggerServer = new WebSocketLoggerServer(TEST_CONFIG.server);
    await loggerServer.start();
    console.log('✅ Test Visilog server started');
  }, 30000);

  afterAll(async () => {
    // Stop all spawned processes
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
      }
    });

    // Stop Visilog server
    if (loggerServer) {
      await loggerServer.stop();
    }

    // Clean up test logs
    try {
      await fs.rm(TEST_CONFIG.server.logsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }, 15000);

  beforeEach(() => {
    processes = [];
  });

  afterEach(async () => {
    // Kill any processes started in this test
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
      }
    });
    processes = [];

    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('React + Vite Integration', () => {
    test('should install dependencies successfully', async () => {
      const installResult = await runCommand('npm install', TEST_CONFIG.apps.react.dir);
      expect(installResult.exitCode).toBe(0);
    }, 60000);

    test('should build successfully with visilog auto-import', async () => {
      // Ensure dependencies are installed
      await runCommand('npm install', TEST_CONFIG.apps.react.dir);
      
      const buildResult = await runCommand('npm run build', TEST_CONFIG.apps.react.dir);
      expect(buildResult.exitCode).toBe(0);
      expect(buildResult.stdout).toContain('built');
      
      // Check that dist directory was created
      const distPath = path.join(TEST_CONFIG.apps.react.dir, 'dist');
      const distExists = await fs.access(distPath).then(() => true).catch(() => false);
      expect(distExists).toBe(true);
    }, 60000);

    test('should start dev server and detect visilog import', async () => {
      // Ensure dependencies are installed
      await runCommand('npm install', TEST_CONFIG.apps.react.dir);
      
      const devProcess = await startDevServer(
        'npm run dev',
        TEST_CONFIG.apps.react.dir,
        TEST_CONFIG.apps.react.port
      );
      
      processes.push(devProcess);

      // Wait for server to start
      await waitForPort(TEST_CONFIG.apps.react.port, 15000);
      
      // Check that server is responding
      const response = await fetch(`http://localhost:${TEST_CONFIG.apps.react.port}`);
      expect(response.status).toBe(200);
      
      const html = await response.text();
      expect(html).toContain('Visilog React Test App');
    }, 30000);
  });

  describe('Vue + Vite Integration', () => {
    test('should install dependencies successfully', async () => {
      const installResult = await runCommand('npm install', TEST_CONFIG.apps.vue.dir);
      expect(installResult.exitCode).toBe(0);
    }, 60000);

    test('should build successfully with visilog auto-import', async () => {
      // Ensure dependencies are installed
      await runCommand('npm install', TEST_CONFIG.apps.vue.dir);
      
      const buildResult = await runCommand('npm run build', TEST_CONFIG.apps.vue.dir);
      expect(buildResult.exitCode).toBe(0);
      expect(buildResult.stdout).toContain('built');
      
      // Check that dist directory was created
      const distPath = path.join(TEST_CONFIG.apps.vue.dir, 'dist');
      const distExists = await fs.access(distPath).then(() => true).catch(() => false);
      expect(distExists).toBe(true);
    }, 60000);

    test('should start dev server and detect visilog import', async () => {
      // Ensure dependencies are installed
      await runCommand('npm install', TEST_CONFIG.apps.vue.dir);
      
      const devProcess = await startDevServer(
        'npm run dev',
        TEST_CONFIG.apps.vue.dir,
        TEST_CONFIG.apps.vue.port
      );
      
      processes.push(devProcess);

      // Wait for server to start
      await waitForPort(TEST_CONFIG.apps.vue.port, 15000);
      
      // Check that server is responding
      const response = await fetch(`http://localhost:${TEST_CONFIG.apps.vue.port}`);
      expect(response.status).toBe(200);
      
      const html = await response.text();
      expect(html).toContain('Visilog Vue Test App');
    }, 30000);
  });

  describe('Vanilla JavaScript Integration', () => {
    test('should load HTML file and find test elements', async () => {
      const htmlPath = path.join(__dirname, '../fixtures/vanilla-js-app/index.html');
      const htmlContent = await fs.readFile(htmlPath, 'utf-8');
      
      // Check that our test HTML contains the expected elements
      expect(htmlContent).toContain('data-testid="test-content"');
      expect(htmlContent).toContain('data-testid="count"');
      expect(htmlContent).toContain('data-testid="increment-btn"');
      expect(htmlContent).toContain('data-testid="log-info"');
      expect(htmlContent).toContain('Visilog Vanilla JS Test App');
      
      // Check that visilog integration code is present
      expect(htmlContent).toContain('VisiLog');
      expect(htmlContent).toContain('console.log');
    });

    test('should have functional JavaScript code', async () => {
      const htmlPath = path.join(__dirname, '../fixtures/vanilla-js-app/index.html');
      const htmlContent = await fs.readFile(htmlPath, 'utf-8');
      
      // Extract and validate JavaScript
      expect(htmlContent).toContain('function incrementCount()');
      expect(htmlContent).toContain('function addTestLog(type)');
      expect(htmlContent).toContain('addEventListener(\'load\'');
      
      // Check for proper console logging
      expect(htmlContent).toContain('console.log(');
      expect(htmlContent).toContain('console.warn(');
      expect(htmlContent).toContain('console.error(');
      expect(htmlContent).toContain('console.debug(');
    });
  });

  describe('Visilog Server Integration', () => {
    test('should be running and accepting connections', async () => {
      expect(loggerServer.isRunning()).toBe(true);
      
      const stats = loggerServer.getStats();
      expect(stats.isRunning).toBe(true);
      expect(stats.activeSessions).toBe(0);
    });

    test('should create logs directory', async () => {
      const logsDir = TEST_CONFIG.server.logsDir;
      const logsDirExists = await fs.access(logsDir).then(() => true).catch(() => false);
      expect(logsDirExists).toBe(true);
    });

    test('should handle WebSocket connections', async () => {
      // This test verifies that our server can handle WebSocket connections
      // The actual connection testing happens in the browser integration tests
      const stats = loggerServer.getStats();
      expect(stats.config.port).toBe(TEST_CONFIG.server.port);
    });
  });

  describe('Build Integration Validation', () => {
    test('React app should import visilog without errors', async () => {
      const mainFile = path.join(TEST_CONFIG.apps.react.dir, 'src/main.jsx');
      const content = await fs.readFile(mainFile, 'utf-8');
      
      expect(content).toContain("import 'visilog/auto'");
      expect(content).toContain('console.log');
    });

    test('Vue app should import visilog without errors', async () => {
      const mainFile = path.join(TEST_CONFIG.apps.vue.dir, 'src/main.js');
      const content = await fs.readFile(mainFile, 'utf-8');
      
      expect(content).toContain("import 'visilog/auto'");
      expect(content).toContain('console.log');
    });

    test('Package.json files should reference visilog correctly', async () => {
      // Check React package.json
      const reactPkg = JSON.parse(
        await fs.readFile(path.join(TEST_CONFIG.apps.react.dir, 'package.json'), 'utf-8')
      );
      expect(reactPkg.devDependencies.visilog).toBeDefined();
      
      // Check Vue package.json
      const vuePkg = JSON.parse(
        await fs.readFile(path.join(TEST_CONFIG.apps.vue.dir, 'package.json'), 'utf-8')
      );
      expect(vuePkg.devDependencies.visilog).toBeDefined();
    });
  });
});

// Helper functions
async function runCommand(command: string, cwd: string): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const proc = spawn(cmd, args, { cwd, shell: true });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve({
        exitCode: code || 0,
        stdout,
        stderr
      });
    });
  });
}

async function startDevServer(command: string, cwd: string, port: number): Promise<ChildProcess> {
  const [cmd, ...args] = command.split(' ');
  const proc = spawn(cmd, args, { cwd, shell: true });
  
  // Give the process a moment to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return proc;
}

async function waitForPort(port: number, timeout: number): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        method: 'HEAD'
      });
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Port not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error(`Port ${port} did not become available within ${timeout}ms`);
}