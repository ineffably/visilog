import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { WebSocketLoggerServer } from '../../server/websocket-logger-server';

const WEBPACK_FIXTURE_PATH = path.join(__dirname, '../fixtures/webpack-test-project');
const TEST_TIMEOUT = 30000;

describe('Webpack Plugin Integration', () => {
  let webpackProcess: ChildProcess | null = null;
  let loggerServer: WebSocketLoggerServer | null = null;

  beforeAll(async () => {
    // Ensure our build exists
    try {
      await fs.access(path.join(__dirname, '../../dist/plugins/webpack-plugin.js'));
    } catch {
      throw new Error('Build artifacts not found. Run npm run build first.');
    }
  }, TEST_TIMEOUT);

  afterEach(async () => {
    // Clean up processes
    if (webpackProcess) {
      webpackProcess.kill('SIGTERM');
      webpackProcess = null;
    }
    
    if (loggerServer) {
      await loggerServer.stop();
      loggerServer = null;
    }

    // Clean up test logs and build artifacts
    try {
      await fs.rm(path.join(WEBPACK_FIXTURE_PATH, 'test-logs'), { recursive: true, force: true });
      await fs.rm(path.join(WEBPACK_FIXTURE_PATH, 'dist'), { recursive: true, force: true });
      await fs.rm(path.join(WEBPACK_FIXTURE_PATH, 'node_modules'), { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should install dependencies and build successfully', async () => {
    // Install dependencies
    const npmInstall = await runCommand('npm', ['install'], WEBPACK_FIXTURE_PATH);
    expect(npmInstall.success).toBe(true);

    // Test build
    const buildResult = await runCommand('npm', ['run', 'build'], WEBPACK_FIXTURE_PATH);
    expect(buildResult.success).toBe(true);
    
    // Check that dist directory was created
    const distExists = await fs.access(path.join(WEBPACK_FIXTURE_PATH, 'dist')).then(() => true, () => false);
    expect(distExists).toBe(true);

    // Check that HTML file contains our script injection
    const indexHtml = await fs.readFile(path.join(WEBPACK_FIXTURE_PATH, 'dist/index.html'), 'utf-8');
    expect(indexHtml).toMatch(/SimpleWebSocketLogger|websocketLogger|WebSocket.*Logger/i);
  }, TEST_TIMEOUT);

  it('should build in development mode with plugin', async () => {
    // Install dependencies first
    await runCommand('npm', ['install'], WEBPACK_FIXTURE_PATH);

    // Run development build
    const devBuild = await runCommand('npm', ['run', 'dev'], WEBPACK_FIXTURE_PATH);
    expect(devBuild.success).toBe(true);
    
    // Check that dist directory was created
    const distExists = await fs.access(path.join(WEBPACK_FIXTURE_PATH, 'dist')).then(() => true, () => false);
    expect(distExists).toBe(true);

    // Check bundle.js was created
    const bundleExists = await fs.access(path.join(WEBPACK_FIXTURE_PATH, 'dist/bundle.js')).then(() => true, () => false);
    expect(bundleExists).toBe(true);
  }, TEST_TIMEOUT);

  it('should inject logger script into HTML output', async () => {
    // Install dependencies
    await runCommand('npm', ['install'], WEBPACK_FIXTURE_PATH);

    // Build the project
    const buildResult = await runCommand('npm', ['run', 'build'], WEBPACK_FIXTURE_PATH);
    expect(buildResult.success).toBe(true);

    // Read the generated HTML file
    const indexHtml = await fs.readFile(path.join(WEBPACK_FIXTURE_PATH, 'dist/index.html'), 'utf-8');
    
    // Check that our logger script was injected
    expect(indexHtml).toMatch(/<script>/);
    expect(indexHtml).toMatch(/SimpleWebSocketLogger|websocketLogger/);
    expect(indexHtml).toMatch(/ws:\/\/localhost:3005/); // Our test WebSocket URL
  }, TEST_TIMEOUT);

  it('should create log files when logger server is active', async () => {
    // Install dependencies
    await runCommand('npm', ['install'], WEBPACK_FIXTURE_PATH);

    // Start our own logger server to test connectivity
    loggerServer = new WebSocketLoggerServer({
      port: 3005,
      logsDir: path.join(WEBPACK_FIXTURE_PATH, 'test-logs'),
      enableSessionLogs: true,
      enableIndex: true
    });

    await loggerServer.start();
    
    // Build the project (should connect to our server)
    const buildResult = await runCommand('npm', ['run', 'build'], WEBPACK_FIXTURE_PATH);
    expect(buildResult.success).toBe(true);

    // Check if logs directory was created
    const logsExist = await fs.access(path.join(WEBPACK_FIXTURE_PATH, 'test-logs')).then(() => true, () => false);
    expect(logsExist).toBe(true);
  }, TEST_TIMEOUT);

  it('should handle webpack configuration correctly', async () => {
    // Install dependencies
    await runCommand('npm', ['install'], WEBPACK_FIXTURE_PATH);

    // Check that webpack config is valid by running build
    const buildResult = await runCommand('npm', ['run', 'build'], WEBPACK_FIXTURE_PATH);
    
    // Should succeed without webpack configuration errors
    expect(buildResult.success).toBe(true);
    expect(buildResult.stderr).not.toMatch(/Configuration.*error|Invalid.*configuration/i);
  }, TEST_TIMEOUT);
});

// Helper functions (same as vite test)
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