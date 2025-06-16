const path = require('path');

const baseConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    'ws': 'commonjs ws',
    'fs': 'commonjs fs',
    'path': 'commonjs path',
    'http': 'commonjs http',
    'url': 'commonjs url',
    'events': 'commonjs events',
    'html-webpack-plugin': 'commonjs html-webpack-plugin'
  },
};

const configs = [
  // Main entry point
  {
    ...baseConfig,
    entry: './index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
      library: 'visilog',
      libraryTarget: 'commonjs2',
    },
  },
  // Client entry
  {
    ...baseConfig,
    entry: './client/websocket-logger.ts',
    output: {
      path: path.resolve(__dirname, 'dist/client'),
      filename: 'websocket-logger.js',
      library: 'visilog-client',
      libraryTarget: 'commonjs2',
    },
  },
  // Server entry
  {
    ...baseConfig,
    entry: './server/websocket-logger-server.ts',
    output: {
      path: path.resolve(__dirname, 'dist/server'),
      filename: 'websocket-logger-server.js',
      library: 'visilog-server',
      libraryTarget: 'commonjs2',
    },
  },
  // Vite plugin entry
  {
    ...baseConfig,
    entry: './plugins/vite-plugin.ts',
    output: {
      path: path.resolve(__dirname, 'dist/plugins'),
      filename: 'vite-plugin.js',
      library: 'visilog-vite-plugin',
      libraryTarget: 'commonjs2',
    },
  },
  // Webpack plugin entry
  {
    ...baseConfig,
    entry: './plugins/webpack-plugin.ts',
    output: {
      path: path.resolve(__dirname, 'dist/plugins'),
      filename: 'webpack-plugin.js',
      library: 'visilog-webpack-plugin',
      libraryTarget: 'commonjs2',
    },
  },
];

module.exports = configs;