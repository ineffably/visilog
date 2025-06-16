import { defineConfig } from 'vite';

// Import the vite plugin
const vitePluginModule = await import('../../../dist/plugins/vite-plugin.js');
const { createVitePlugin } = vitePluginModule['visilog-vite-plugin'];

export default defineConfig({
  plugins: [
    createVitePlugin({
      startServer: true,
      injectClient: true,
      development: true,
      server: {
        port: 3004,  // Use different port for testing
        logsDir: './test-logs'
      },
      client: {
        websocketUrl: 'ws://localhost:3004'
      }
    })
  ],
  build: {
    outDir: 'dist',
    minify: false  // Easier to test
  }
});