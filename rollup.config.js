const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const { default: dts } = require('rollup-plugin-dts');

const external = ['ws', 'fs', 'path', 'http', 'url', 'events'];

const createConfig = (input, outputDir, name) => ({
  input,
  external,
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false,
      compilerOptions: {
        module: 'ESNext'
      }
    })
  ],
  output: {
    file: `dist/${outputDir}/${name}.js`,
    format: 'cjs',
    sourcemap: true,
    exports: 'auto'
  }
});

const createDtsConfig = (input, outputFile) => ({
  input,
  external,
  plugins: [dts()],
  output: {
    file: outputFile,
    format: 'es'
  }
});

module.exports = [
  // Main entry point
  createConfig('index.ts', '.', 'index'),
  
  // Client
  createConfig('client/websocket-logger.ts', 'client', 'websocket-logger'),
  
  // Server
  createConfig('server/websocket-logger-server.ts', 'server', 'websocket-logger-server'),
  
  // Plugins
  createConfig('plugins/vite-plugin.ts', 'plugins', 'vite-plugin'),
  createConfig('plugins/webpack-plugin.ts', 'plugins', 'webpack-plugin'),
  
  // Type declarations
  createDtsConfig('index.ts', 'dist/index.d.ts'),
  createDtsConfig('client/websocket-logger.ts', 'dist/client/websocket-logger.d.ts'),
  createDtsConfig('server/websocket-logger-server.ts', 'dist/server/websocket-logger-server.d.ts'),
  createDtsConfig('plugins/vite-plugin.ts', 'dist/plugins/vite-plugin.d.ts'),
  createDtsConfig('plugins/webpack-plugin.ts', 'dist/plugins/webpack-plugin.d.ts')
]; 