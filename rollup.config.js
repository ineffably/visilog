import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const external = ['ws', 'fs', 'path', 'http', 'url', 'events'];

// Base TypeScript config for both builds
const baseTypeScriptConfig = {
  tsconfig: './tsconfig.json',
  declaration: false,
  declarationMap: false,
  noEmitOnError: false
};

// Create ES module config
const createESMConfig = (input, outputDir, name) => ({
  input,
  external,
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    typescript({
      ...baseTypeScriptConfig,
      compilerOptions: {
        module: 'ESNext',
        target: 'ES2020',
        moduleResolution: 'node'
      }
    })
  ],
  output: {
    file: `dist/${outputDir}/${name}.js`,
    format: 'es',
    sourcemap: true,
    exports: 'named'
  }
});

// Create CommonJS config  
const createCJSConfig = (input, outputDir, name) => ({
  input,
  external,
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    typescript({
      ...baseTypeScriptConfig,
      // Use ESNext for Rollup, then let the output format handle the conversion
      compilerOptions: {
        module: 'ESNext',
        target: 'ES2020',
        moduleResolution: 'node'
      }
    })
  ],
  output: {
    file: `dist/${outputDir}/${name}.cjs`,
    format: 'cjs',
    sourcemap: true,
    exports: 'named'
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

const entries = [
  { input: 'index.ts', outputDir: '.', name: 'index' },
  { input: 'client/websocket-logger.ts', outputDir: 'client', name: 'websocket-logger' },
  { input: 'server/websocket-logger-server.ts', outputDir: 'server', name: 'websocket-logger-server' },
  { input: 'plugins/vite-plugin.ts', outputDir: 'plugins', name: 'vite-plugin' },
  { input: 'plugins/webpack-plugin.ts', outputDir: 'plugins', name: 'webpack-plugin' }
];

export default [
  // ES Module builds
  ...entries.map(entry => createESMConfig(entry.input, entry.outputDir, entry.name)),
  
  // CommonJS builds
  ...entries.map(entry => createCJSConfig(entry.input, entry.outputDir, entry.name)),
  
  // Type declarations
  ...entries.map(entry => createDtsConfig(entry.input, `dist/${entry.outputDir}/${entry.name}.d.ts`))
]; 