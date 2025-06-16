const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { createWebpackPlugin } = require('../../../dist/plugins/webpack-plugin.js')['visilog-webpack-plugin'];

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    createWebpackPlugin({
      startServer: true,
      injectClient: true,
      development: true,
      server: {
        port: 3005,  // Use different port for testing
        logsDir: './test-logs'
      },
      client: {
        websocketUrl: 'ws://localhost:3005'
      }
    })
  ],
  mode: 'development',
  devtool: 'source-map'
};