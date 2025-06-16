import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { WebSocketLoggerServer } from '../../server/websocket-logger-server';

const VITE_FIXTURE_PATH = path.join(__dirname, '../fixtures/vite-test-project');
const TEST_TIMEOUT = 30000;

describe('Vite Plugin Integration', () => {
  let viteProcess: ChildProcess | null = null;
  let loggerServer: WebSocketLoggerServer | null = null;

  beforeAll(async () => {
    // Ensure our build exists
    try {
      await fs.access(path.join(__dirname, '../../dist/plugins/vite-plugin.js'));
    } catch {
      throw new Error('Build artifacts not found. Run npm run build first.');
    }
  }, TEST_TIMEOUT);

  afterEach(async () => {
    // Clean up processes
    if (viteProcess) {
      viteProcess.kill('SIGTERM');
      viteProcess = null;
    }
    
    if (loggerServer) {
      await loggerServer.stop();
      loggerServer = null;
    }

    // Clean up test logs
    try {
      await fs.rm(path.join(VITE_FIXTURE_PATH, 'test-logs'), { recursive: true, force: true });
      await fs.rm(path.join(VITE_FIXTURE_PATH, 'dist'), { recursive: true, force: true });
      await fs.rm(path.join(VITE_FIXTURE_PATH, 'node_modules'), { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should install dependencies and build successfully', async () => {
    // Install dependencies
    const npmInstall = await runCommand('npm', ['install'], VITE_FIXTURE_PATH);
    expect(npmInstall.success).toBe(true);

    // Install html-webpack-plugin for the webpack plugin compatibility
    const installHtml = await runCommand('npm', ['install', 'html-webpack-plugin@^5.6.0', '--save-dev'], VITE_FIXTURE_PATH);
    expect(installHtml.success).toBe(true);

    // Test build
    const buildResult = await runCommand('npm', ['run', 'build'], VITE_FIXTURE_PATH);
    expect(buildResult.success).toBe(true);
    
    // Check that dist directory was created
    const distExists = await fs.access(path.join(VITE_FIXTURE_PATH, 'dist')).then(() => true, () => false);
    expect(distExists).toBe(true);

    // Check that HTML file contains our script injection
    const indexHtml = await fs.readFile(path.join(VITE_FIXTURE_PATH, 'dist/index.html'), 'utf-8');
    expect(indexHtml).toMatch(/websocketLogger|WebSocket.*Logger/i);
  }, TEST_TIMEOUT);

  it('should start development server with plugin', async () => {
    // Install dependencies first
    await runCommand('npm', ['install'], VITE_FIXTURE_PATH);
    await runCommand('npm', ['install', 'html-webpack-plugin@^5.6.0', '--save-dev'], VITE_FIXTURE_PATH);

    // Start the development server
    const devServer = await startDevServer('npm', ['run', 'dev'], VITE_FIXTURE_PATH);
    expect(devServer.success).toBe(true);
    
    if (devServer.process) {
      viteProcess = devServer.process;
      
      // Wait a bit for server to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // The process should still be running
      expect(viteProcess.killed).toBe(false);
    }
  }, TEST_TIMEOUT);

  it('should create log files when logger server is active', async () => {
    // Install dependencies
    await runCommand('npm', ['install'], VITE_FIXTURE_PATH);
    await runCommand('npm', ['install', 'html-webpack-plugin@^5.6.0', '--save-dev'], VITE_FIXTURE_PATH);

    // Start our own logger server to test connectivity
    loggerServer = new WebSocketLoggerServer({
      port: 3004,
      logsDir: path.join(VITE_FIXTURE_PATH, 'test-logs'),
      enableSessionLogs: true,
      enableIndex: true
    });

    await loggerServer.start();
    
    // Build the project (should connect to our server)
    const buildResult = await runCommand('npm', ['run', 'build'], VITE_FIXTURE_PATH);
    expect(buildResult.success).toBe(true);

    // Check if logs directory was created
    const logsExist = await fs.access(path.join(VITE_FIXTURE_PATH, 'test-logs')).then(() => true, () => false);
    expect(logsExist).toBe(true);
  }, TEST_TIMEOUT);
});

// Helper functions
async function runCommand(command: string, args: string[], cwd: string): Promise<{ success: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { 
      cwd, 
      stdio: 'pipe',
      shell: true 
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout,
        stderr
      });
    });

    // Timeout after 25 seconds
    setTimeout(() => {
      child.kill('SIGTERM');
      resolve({
        success: false,
        stdout,
        stderr: stderr + '\nCommand timed out'
      });
    }, 25000);
  });
}

async function startDevServer(command: string, args: string[], cwd: string): Promise<{ success: boolean; process?: ChildProcess }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { 
      cwd, 
      stdio: 'pipe',
      shell: true 
    });
    
    let hasStarted = false;
    
    child.stdout?.on('data', (data) => {
      const output = data.toString();
      // Look for Vite dev server startup messages
      if (output.includes('Local:') || output.includes('localhost') || output.includes('ready in')) {
        if (!hasStarted) {
          hasStarted = true;
          resolve({ success: true, process: child });
        }
      }
    });
    
    child.stderr?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('EADDRINUSE') || output.includes('Error:')) {
        if (!hasStarted) {
          hasStarted = true;
          resolve({ success: false });
        }
      }
    });
    
    child.on('close', (code) => {
      if (!hasStarted) {
        resolve({ success: code === 0 });
      }
    });

    // Timeout after 10 seconds for dev server start
    setTimeout(() => {
      if (!hasStarted) {
        child.kill('SIGTERM');
        resolve({ success: false });
      }
    }, 10000);
  });
}