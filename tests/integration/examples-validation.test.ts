/**
 * Framework Examples Validation Tests
 * 
 * Validates that our framework examples are structurally correct and would work
 * when actually deployed. These tests don't require browser automation.
 */

import { describe, test, expect } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';

const FIXTURES_DIR = path.join(__dirname, '../fixtures');

describe('Framework Examples Validation', () => {
  describe('React + Vite Example', () => {
    const reactDir = path.join(FIXTURES_DIR, 'react-vite-app');

    test('should have valid package.json with correct dependencies', async () => {
      const packagePath = path.join(reactDir, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(packageContent);

      expect(pkg.name).toBe('visilog-react-test-fixture');
      expect(pkg.type).toBe('module');
      expect(pkg.dependencies.react).toBeDefined();
      expect(pkg.dependencies['react-dom']).toBeDefined();
      expect(pkg.devDependencies.visilog).toBe('file:../../..');
      expect(pkg.devDependencies['@vitejs/plugin-react']).toBeDefined();
      expect(pkg.devDependencies.vite).toBeDefined();
    });

    test('should have valid vite config', async () => {
      const configPath = path.join(reactDir, 'vite.config.js');
      const configContent = await fs.readFile(configPath, 'utf-8');

      expect(configContent).toContain("import { defineConfig } from 'vite'");
      expect(configContent).toContain("import react from '@vitejs/plugin-react'");
      expect(configContent).toContain('plugins: [react()]');
      expect(configContent).toContain('port: 5173');
    });

    test('should have valid HTML template', async () => {
      const htmlPath = path.join(reactDir, 'index.html');
      const htmlContent = await fs.readFile(htmlPath, 'utf-8');

      expect(htmlContent).toContain('<!doctype html>');
      expect(htmlContent).toContain('<div id="root">');
      expect(htmlContent).toContain('src="/src/main.jsx"');
      expect(htmlContent).toContain('Visilog React Test');
    });

    test('should have main.jsx with visilog auto-import', async () => {
      const mainPath = path.join(reactDir, 'src/main.jsx');
      const mainContent = await fs.readFile(mainPath, 'utf-8');

      expect(mainContent).toContain("import 'visilog/auto'");
      expect(mainContent).toContain("import React from 'react'");
      expect(mainContent).toContain("import ReactDOM from 'react-dom/client'");
      expect(mainContent).toContain('console.log');
      expect(mainContent).toContain('React test app initializing with Visilog');
      expect(mainContent).toContain('framework: \'react\'');
    });

    test('should have App.jsx with proper test structure', async () => {
      const appPath = path.join(reactDir, 'src/App.jsx');
      const appContent = await fs.readFile(appPath, 'utf-8');

      // Check for test attributes
      expect(appContent).toContain('data-testid="test-content"');
      expect(appContent).toContain('data-testid="count"');
      expect(appContent).toContain('data-testid="increment-btn"');
      expect(appContent).toContain('data-testid="log-info"');

      // Check for logging functionality
      expect(appContent).toContain('console.log');
      expect(appContent).toContain('console.warn');
      expect(appContent).toContain('console.error');
      expect(appContent).toContain('console.debug');

      // Check for React hooks
      expect(appContent).toContain('useState');
      expect(appContent).toContain('useEffect');
    });
  });

  describe('Vue + Vite Example', () => {
    const vueDir = path.join(FIXTURES_DIR, 'vue-vite-app');

    test('should have valid package.json with correct dependencies', async () => {
      const packagePath = path.join(vueDir, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(packageContent);

      expect(pkg.name).toBe('visilog-vue-test-fixture');
      expect(pkg.type).toBe('module');
      expect(pkg.dependencies.vue).toBeDefined();
      expect(pkg.devDependencies.visilog).toBe('file:../../..');
      expect(pkg.devDependencies['@vitejs/plugin-vue']).toBeDefined();
      expect(pkg.devDependencies.vite).toBeDefined();
    });

    test('should have valid vite config', async () => {
      const configPath = path.join(vueDir, 'vite.config.js');
      const configContent = await fs.readFile(configPath, 'utf-8');

      expect(configContent).toContain("import { defineConfig } from 'vite'");
      expect(configContent).toContain("import vue from '@vitejs/plugin-vue'");
      expect(configContent).toContain('plugins: [vue()]');
      expect(configContent).toContain('port: 5174');
    });

    test('should have main.js with visilog auto-import', async () => {
      const mainPath = path.join(vueDir, 'src/main.js');
      const mainContent = await fs.readFile(mainPath, 'utf-8');

      expect(mainContent).toContain("import 'visilog/auto'");
      expect(mainContent).toContain("import { createApp } from 'vue'");
      expect(mainContent).toContain("import App from './App.vue'");
      expect(mainContent).toContain('console.log');
      expect(mainContent).toContain('Vue test app initializing with Visilog');
      expect(mainContent).toContain('framework: \'vue\'');
    });

    test('should have App.vue with proper structure', async () => {
      const appPath = path.join(vueDir, 'src/App.vue');
      const appContent = await fs.readFile(appPath, 'utf-8');

      // Check for template section
      expect(appContent).toContain('<template>');
      expect(appContent).toContain('data-testid="test-content"');
      expect(appContent).toContain('data-testid="count"');
      expect(appContent).toContain('data-testid="increment-btn"');

      // Check for script section with composition API
      expect(appContent).toContain('<script>');
      expect(appContent).toContain("import { ref, onMounted } from 'vue'");
      expect(appContent).toContain('console.log');
      expect(appContent).toContain('console.warn');
      expect(appContent).toContain('console.error');
      expect(appContent).toContain('console.debug');
    });
  });

  describe('Vanilla JavaScript Example', () => {
    const vanillaFile = path.join(FIXTURES_DIR, 'vanilla-js-app/index.html');

    test('should have valid HTML structure', async () => {
      const htmlContent = await fs.readFile(vanillaFile, 'utf-8');

      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<html lang="en">');
      expect(htmlContent).toContain('Visilog Vanilla JS Test App');
    });

    test('should have test automation attributes', async () => {
      const htmlContent = await fs.readFile(vanillaFile, 'utf-8');

      const requiredTestIds = [
        'test-content',
        'count',
        'increment-btn',
        'log-info',
        'log-warn', 
        'log-error',
        'log-debug',
        'logs-display'
      ];

      requiredTestIds.forEach(testId => {
        expect(htmlContent).toContain(`data-testid="${testId}"`);
      });
    });

    test('should have proper JavaScript functions', async () => {
      const htmlContent = await fs.readFile(vanillaFile, 'utf-8');

      // Check for required functions
      expect(htmlContent).toContain('function addTestLog(type)');
      expect(htmlContent).toContain('function incrementCount()');
      expect(htmlContent).toContain('function updateLogsDisplay()');

      // Check for console logging
      expect(htmlContent).toContain('console.log(');
      expect(htmlContent).toContain('console.warn(');
      expect(htmlContent).toContain('console.error(');
      expect(htmlContent).toContain('console.debug(');

      // Check for VisiLog integration
      expect(htmlContent).toContain('window.VisiLog');
      expect(htmlContent).toContain('VisiLog.connect');
    });

    test('should have event listeners and DOM manipulation', async () => {
      const htmlContent = await fs.readFile(vanillaFile, 'utf-8');

      expect(htmlContent).toContain("addEventListener('load'");
      expect(htmlContent).toContain("addEventListener('beforeunload'");
      expect(htmlContent).toContain('getElementById');
      expect(htmlContent).toContain('textContent');
    });
  });

  describe('Cross-Framework Consistency', () => {
    test('all examples should log initialization with consistent format', async () => {
      const examples = [
        { 
          name: 'React', 
          file: path.join(FIXTURES_DIR, 'react-vite-app/src/main.jsx'),
          framework: 'react'
        },
        { 
          name: 'Vue', 
          file: path.join(FIXTURES_DIR, 'vue-vite-app/src/main.js'),
          framework: 'vue'
        },
        { 
          name: 'Vanilla', 
          file: path.join(FIXTURES_DIR, 'vanilla-js-app/index.html'),
          framework: 'vanilla-js'
        }
      ];

      for (const example of examples) {
        const content = await fs.readFile(example.file, 'utf-8');
        
        expect(content).toContain('initializing with Visilog');
        expect(content).toContain('timestamp:');
        expect(content).toContain(`framework: '${example.framework}'`);
      }
    });

    test('all examples should have consistent test patterns', async () => {
      const examples = [
        path.join(FIXTURES_DIR, 'react-vite-app/src/App.jsx'),
        path.join(FIXTURES_DIR, 'vue-vite-app/src/App.vue'),
        path.join(FIXTURES_DIR, 'vanilla-js-app/index.html')
      ];

      for (const exampleFile of examples) {
        const content = await fs.readFile(exampleFile, 'utf-8');
        
        // Common test attributes
        expect(content).toContain('data-testid="count"');
        expect(content).toContain('data-testid="increment-btn"');
        expect(content).toContain('data-testid="log-info"');
        
        // Common logging patterns
        expect(content).toContain('console.log');
        expect(content).toContain('console.warn');
        expect(content).toContain('console.error');
      }
    });

    test('should use visilog auto-import consistently', async () => {
      const moduleExamples = [
        path.join(FIXTURES_DIR, 'react-vite-app/src/main.jsx'),
        path.join(FIXTURES_DIR, 'vue-vite-app/src/main.js')
      ];

      for (const exampleFile of moduleExamples) {
        const content = await fs.readFile(exampleFile, 'utf-8');
        expect(content).toContain("import 'visilog/auto'");
      }
    });
  });

  describe('Build Configuration Validation', () => {
    test('React and Vue should have proper Vite configuration', async () => {
      const configs = [
        path.join(FIXTURES_DIR, 'react-vite-app/vite.config.js'),
        path.join(FIXTURES_DIR, 'vue-vite-app/vite.config.js')
      ];

      for (const configFile of configs) {
        const content = await fs.readFile(configFile, 'utf-8');
        
        expect(content).toContain("import { defineConfig } from 'vite'");
        expect(content).toContain('plugins:');
        expect(content).toContain('server:');
        expect(content).toContain('port:');
      }
    });

    test('package.json files should have consistent structure', async () => {
      const packages = [
        path.join(FIXTURES_DIR, 'react-vite-app/package.json'),
        path.join(FIXTURES_DIR, 'vue-vite-app/package.json')
      ];

      for (const packageFile of packages) {
        const content = await fs.readFile(packageFile, 'utf-8');
        const pkg = JSON.parse(content);
        
        expect(pkg.private).toBe(true);
        expect(pkg.type).toBe('module');
        expect(pkg.scripts.dev).toBe('vite');
        expect(pkg.scripts.build).toBe('vite build');
        expect(pkg.devDependencies.visilog).toBe('file:../../..');
        expect(pkg.devDependencies.vite).toBeDefined();
      }
    });
  });

  describe('File Structure Validation', () => {
    test('all fixture directories should exist and have required files', async () => {
      const fixtures = [
        'react-vite-app',
        'vue-vite-app', 
        'vanilla-js-app'
      ];

      for (const fixture of fixtures) {
        const fixtureDir = path.join(FIXTURES_DIR, fixture);
        const dirExists = await fs.access(fixtureDir).then(() => true).catch(() => false);
        expect(dirExists).toBe(true);
      }
    });

    test('React fixture should have complete file structure', async () => {
      const reactDir = path.join(FIXTURES_DIR, 'react-vite-app');
      const requiredFiles = [
        'package.json',
        'vite.config.js',
        'index.html',
        'src/main.jsx',
        'src/App.jsx'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(reactDir, file);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });

    test('Vue fixture should have complete file structure', async () => {
      const vueDir = path.join(FIXTURES_DIR, 'vue-vite-app');
      const requiredFiles = [
        'package.json',
        'vite.config.js',
        'index.html',
        'src/main.js',
        'src/App.vue'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(vueDir, file);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });
  });
});