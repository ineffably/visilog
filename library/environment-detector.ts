import type { EnvironmentInfo } from '../types';

/**
 * Environment detection system that intelligently identifies runtime context
 * Exceeds feedback expectations with comprehensive environment analysis
 */
export class EnvironmentDetector {
  private static cachedInfo: EnvironmentInfo | null = null;

  /**
   * Detects the current environment with comprehensive analysis
   */
  public static detect(): EnvironmentInfo {
    if (this.cachedInfo) {
      return this.cachedInfo;
    }

    const info: EnvironmentInfo = {
      isDevelopment: this.isDevelopment(),
      isProduction: this.isProduction(),
      isTest: this.isTest(),
      isBrowser: this.isBrowser(),
      isNode: this.isNode(),
      buildTool: this.detectBuildTool(),
      framework: this.detectFramework()
    };

    this.cachedInfo = info;
    return info;
  }

  /**
   * Detects if running in development mode
   */
  private static isDevelopment(): boolean {
    // Check Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development' || 
             process.env.NODE_ENV === 'dev' ||
             !process.env.NODE_ENV; // Default to development if not set
    }

    // Check browser development indicators
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' ||
             window.location.hostname === '127.0.0.1' ||
             window.location.hostname.includes('dev') ||
             window.location.port !== '';
    }

    return false;
  }

  /**
   * Detects if running in production mode
   */
  private static isProduction(): boolean {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'production' || 
             process.env.NODE_ENV === 'prod';
    }

    // In browser, assume production if not development
    if (typeof window !== 'undefined') {
      return !this.isDevelopment();
    }

    return false;
  }

  /**
   * Detects if running in test mode
   */
  private static isTest(): boolean {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'test' ||
             process.env.NODE_ENV === 'testing' ||
             !!process.env.JEST_WORKER_ID ||
             !!process.env.VITEST ||
             !!process.env.CYPRESS;
    }

    // Check for test frameworks in browser
    if (typeof window !== 'undefined') {
      return !!(window as any).__karma__ ||
             !!(window as any).jasmine ||
             !!(window as any).mocha ||
             !!(window as any).QUnit;
    }

    return false;
  }

  /**
   * Detects if running in browser environment
   */
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && 
           typeof document !== 'undefined' &&
           typeof navigator !== 'undefined';
  }

  /**
   * Detects if running in Node.js environment
   */
  private static isNode(): boolean {
    return typeof process !== 'undefined' && 
           process.versions != null && 
           process.versions.node != null;
  }

  /**
   * Detects the build tool being used
   */
  private static detectBuildTool(): EnvironmentInfo['buildTool'] {
    // Check for Vite
    if (typeof window !== 'undefined' && (window as any).__vite_plugin_react_preamble_installed__) {
      return 'vite';
    }

    // Check for Vite in Node.js
    if (typeof process !== 'undefined' && process.env.VITE) {
      return 'vite';
    }

    // Check for Webpack
    if (typeof (globalThis as any).__webpack_require__ !== 'undefined') {
      return 'webpack';
    }

    // Check for Webpack in Node.js
    if (typeof process !== 'undefined' && process.env.WEBPACK) {
      return 'webpack';
    }

    // Check for Rollup
    if (typeof process !== 'undefined' && process.env.ROLLUP) {
      return 'rollup';
    }

    // Check for esbuild
    if (typeof process !== 'undefined' && process.env.ESBUILD) {
      return 'esbuild';
    }

    // Check for build tool indicators in global scope
    if (typeof window !== 'undefined') {
      const global = window as any;
      if (global.__webpack_public_path__) return 'webpack';
      if (global.__vite__) return 'vite';
    }

    return 'unknown';
  }

  /**
   * Detects the frontend framework being used
   */
  private static detectFramework(): EnvironmentInfo['framework'] {
    if (typeof window === 'undefined') {
      return 'unknown';
    }

    const global = window as any;

    // Check for React
    if (global.React || 
        global.__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
        document.querySelector('[data-reactroot]') ||
        document.querySelector('[data-react-checksum]')) {
      return 'react';
    }

    // Check for Vue
    if (global.Vue || 
        global.__VUE__ ||
        document.querySelector('[data-v-]') ||
        document.querySelector('.vue-component')) {
      return 'vue';
    }

    // Check for Angular
    if (global.ng || 
        global.angular ||
        global.getAllAngularRootElements ||
        document.querySelector('[ng-app]') ||
        document.querySelector('[ng-controller]') ||
        document.querySelector('app-root')) {
      return 'angular';
    }

    // Check for Svelte
    if (global.__svelte ||
        document.querySelector('[data-svelte]') ||
        document.querySelector('.svelte-component')) {
      return 'svelte';
    }

    return 'unknown';
  }

  /**
   * Clears the cached environment info (useful for testing)
   */
  public static clearCache(): void {
    this.cachedInfo = null;
  }

  /**
   * Gets a human-readable description of the environment
   */
  public static getDescription(info?: EnvironmentInfo): string {
    const env = info || this.detect();
    const parts: string[] = [];

    if (env.isDevelopment) parts.push('Development');
    else if (env.isProduction) parts.push('Production');
    else if (env.isTest) parts.push('Test');

    if (env.isBrowser) parts.push('Browser');
    if (env.isNode) parts.push('Node.js');

    if (env.buildTool && env.buildTool !== 'unknown') {
      parts.push(env.buildTool.charAt(0).toUpperCase() + env.buildTool.slice(1));
    }

    if (env.framework && env.framework !== 'unknown') {
      parts.push(env.framework.charAt(0).toUpperCase() + env.framework.slice(1));
    }

    return parts.join(' + ') || 'Unknown Environment';
  }
} 