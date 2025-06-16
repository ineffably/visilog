import { promises as fs } from 'fs';
import path from 'path';

const SIMPLE_TEST_TIMEOUT = 10000;

describe('Simple Integration Methods', () => {
  beforeAll(async () => {
    // Ensure our build exists
    try {
      await fs.access(path.join(__dirname, '../../dist/auto.js'));
      await fs.access(path.join(__dirname, '../../dist/browser.js'));
      await fs.access(path.join(__dirname, '../../dist/middleware.js'));
    } catch {
      throw new Error('Build artifacts not found. Run npm run build first.');
    }
  }, SIMPLE_TEST_TIMEOUT);

  it('should have auto-setup module available', async () => {
    const autoPath = path.join(__dirname, '../../dist/auto.js');
    const autoExists = await fs.access(autoPath).then(() => true, () => false);
    expect(autoExists).toBe(true);

    // Check that it exports something
    const autoContent = await fs.readFile(autoPath, 'utf-8');
    expect(autoContent).toContain('VisiLog');
    expect(autoContent.length).toBeGreaterThan(100);
  }, SIMPLE_TEST_TIMEOUT);

  it('should have browser bundle available', async () => {
    const browserPath = path.join(__dirname, '../../dist/browser.js');
    const browserExists = await fs.access(browserPath).then(() => true, () => false);
    expect(browserExists).toBe(true);

    // Check that it's a UMD bundle
    const browserContent = await fs.readFile(browserPath, 'utf-8');
    expect(browserContent).toContain('VisiLog');
    expect(browserContent).toContain('exports'); // Should have exports for UMD
    expect(browserContent.length).toBeGreaterThan(1000); // Should be substantial
  }, SIMPLE_TEST_TIMEOUT);

  it('should have middleware module available', async () => {
    const middlewarePath = path.join(__dirname, '../../dist/middleware.js');
    const middlewareExists = await fs.access(middlewarePath).then(() => true, () => false);
    expect(middlewareExists).toBe(true);

    // Check basic content
    const middlewareContent = await fs.readFile(middlewarePath, 'utf-8');
    expect(middlewareContent).toContain('createDevMiddleware');
    expect(middlewareContent.length).toBeGreaterThan(100);
  }, SIMPLE_TEST_TIMEOUT);

  it('should be able to import auto module without errors', async () => {
    const autoPath = path.join(__dirname, '../../dist/auto.js');
    
    // This should not throw
    expect(() => {
      require(autoPath);
    }).not.toThrow();
  }, SIMPLE_TEST_TIMEOUT);

  it('should be able to import middleware without errors', async () => {
    const middlewarePath = path.join(__dirname, '../../dist/middleware.js');
    
    // This should not throw
    expect(() => {
      const middleware = require(middlewarePath)['visilog-middleware'];
      expect(typeof middleware.createDevMiddleware).toBe('function');
      expect(typeof middleware.express).toBe('function');
    }).not.toThrow();
  }, SIMPLE_TEST_TIMEOUT);

  it('should create working middleware function', async () => {
    const middlewarePath = path.join(__dirname, '../../dist/middleware.js');
    const { createDevMiddleware } = require(middlewarePath)['visilog-middleware'];
    
    const middleware = createDevMiddleware({
      enabled: false, // Don't actually start server in test
      injectScript: true
    });
    
    expect(typeof middleware).toBe('function');
    expect(middleware.length).toBe(3); // (req, res, next)
  }, SIMPLE_TEST_TIMEOUT);

  it('should have correct package.json exports', async () => {
    const packagePath = path.join(__dirname, '../../package.json');
    const packageContent = await fs.readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    expect(packageJson.exports).toBeDefined();
    expect(packageJson.exports['.']).toBeDefined();
    expect(packageJson.exports['./auto']).toBeDefined();
    expect(packageJson.exports['./browser']).toBeDefined();
    expect(packageJson.exports['./middleware']).toBeDefined();
    expect(packageJson.exports['./client']).toBeDefined();
    expect(packageJson.exports['./server']).toBeDefined();
  }, SIMPLE_TEST_TIMEOUT);

  it('should have documentation example', async () => {
    const examplePath = path.join(__dirname, '../../examples/simple-integration.js');
    const exampleExists = await fs.access(examplePath).then(() => true, () => false);
    expect(exampleExists).toBe(true);

    const exampleContent = await fs.readFile(examplePath, 'utf-8');
    expect(exampleContent).toContain('visilog/auto');
    expect(exampleContent).toContain('createDevMiddleware');
    expect(exampleContent).toContain('Script tag');
  }, SIMPLE_TEST_TIMEOUT);
});