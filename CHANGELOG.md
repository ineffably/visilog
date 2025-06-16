# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2024-12-16

### Added
- Comprehensive ESLint configuration with ES module support
- Full test suite with 52 passing tests
- Integration tests for Vite and Webpack plugins
- CommonJS compatibility testing
- Jest coverage reporting with JSON summary
- Professional project badges and coverage tracking
- Automated CI/CD workflows for testing and releases
- Session management and cleanup functionality
- WebSocket logger implementation with real-time streaming
- Vite and Webpack plugin integrations
- TypeScript support with full type definitions
- Multi-format exports (CommonJS, ES modules)

### Fixed
- ESLint ES module configuration issues
- Jest configuration ES module compatibility
- Unused variable warnings in codebase
- Test expectations alignment with implementation
- GitHub Actions permission issues for releases
- Repository URL format in package.json
- Release workflow git commit errors
- npm dist-tag handling for prereleases

### Changed
- Converted project from ES modules to CommonJS for better compatibility
- Updated ESLint configuration to handle different file types properly
- Improved CI/CD workflows for better testing and release process
- Enhanced npm release workflow with automatic version conflict resolution
- Updated keywords and SEO for better LLM tool discoverability
- Migrated to smart tagging system for prereleases vs stable releases

### Infrastructure
- Set up automated release workflows
- Added comprehensive test coverage tracking
- Implemented professional development workflow
- Added audit and dependency management scripts
- Configured proper peer dependencies for Vite and Webpack
- Established TypeScript compilation and type checking

## Project Overview

**Visilog** is a WebSocket-based logging solution that enables LLMs to easily read browser console logs by streaming them to the file system. The tool provides seamless integration with popular build tools without requiring MCP (Model Context Protocol).

### Key Features
- **Real-time Log Streaming**: WebSocket-based architecture for live console log transmission
- **Build Tool Integration**: Native plugins for Vite and Webpack
- **LLM-Friendly**: Designed specifically for AI assistant debugging workflows
- **TypeScript Support**: Full type definitions and TypeScript compatibility
- **Zero Configuration**: Works out-of-the-box with sensible defaults
- **Session Management**: Automatic cleanup and session handling
- **Multi-Format Support**: CommonJS and ES module compatibility

### Technical Stack
- **Core**: Node.js, WebSocket (ws library)
- **Build Tools**: Webpack, TypeScript
- **Testing**: Jest with comprehensive coverage
- **Linting**: ESLint with TypeScript support
- **CI/CD**: GitHub Actions with automated testing and releases