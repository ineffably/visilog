# Visilog Test Suite

This directory contains the complete test suite for Visilog, organized into unit tests and integration tests.

## Test Organization

### Unit Tests (`tests/client/`, `tests/server/`)
Fast, isolated tests that test individual components without external dependencies.

**Run with:**
```bash
npm test              # Unit tests only
npm run test:watch    # Watch mode for unit tests
npm run test:coverage # Unit test coverage report
```

**Coverage:**
- **Client Tests**: WebSocket logger functionality, console override, configuration
- **Server Tests**: WebSocket server, session management, file operations

### Integration Tests (`tests/integration/`)
Tests that verify components work together and validate real-world scenarios.

**Run with:**
```bash
npm run test:integration  # All integration tests
npm run test:examples     # Framework example validation only
```

**Coverage:**
- **Basic Integration**: Client-server communication
- **Simple Integration**: Import/export validation, module structure
- **Framework Examples**: React, Vue, Vanilla JS fixture validation
- **Browser Examples**: Mock browser automation tests

### Complete Test Suite
```bash
npm run test:all     # Run everything (unit + integration)
npm run validate     # Run unit tests + examples + build
npm run test:ci      # CI-optimized unit tests with coverage
```

## Test Structure

```
tests/
├── client/                    # Unit tests for WebSocket client
│   └── websocket-logger.test.ts
├── server/                    # Unit tests for WebSocket server  
│   └── websocket-logger-server.test.ts
├── integration/               # Integration tests
│   ├── basic-integration.test.ts
│   ├── simple-integration.test.ts
│   ├── examples-validation.test.ts
│   ├── browser-examples.test.ts
│   └── framework-examples.test.ts
├── fixtures/                  # Test fixtures and examples
│   ├── react-vite-app/        # Complete React + Vite example
│   ├── vue-vite-app/          # Complete Vue + Vite example  
│   ├── vanilla-js-app/        # Vanilla JavaScript example
│   └── README.md
├── setup.ts                   # Jest test setup
└── README.md                  # This file
```

## Test Fixtures

The `fixtures/` directory contains complete, working examples of Visilog integration:

- **React + Vite**: Full React application with Visilog auto-import
- **Vue + Vite**: Complete Vue.js app with Composition API
- **Vanilla JS**: Pure HTML/JavaScript integration

These fixtures are:
- ✅ Validated by integration tests
- ✅ Buildable and runnable
- ✅ Used for documentation examples
- ✅ Maintained and kept up-to-date

## Running Specific Tests

```bash
# Unit tests only (fast, no external dependencies)
npm test

# Integration tests only (slower, may build examples)
npm run test:integration

# Framework examples validation only
npm run test:examples

# Coverage for unit tests only
npm run test:coverage

# Everything (unit + integration)
npm run test:all

# CI pipeline
npm run test:ci
```

## Test Philosophy

### Unit Tests
- **Fast**: Should complete in under 1 second
- **Isolated**: No external dependencies, network calls, or file system
- **Focused**: Test single units of functionality
- **Reliable**: Should never be flaky

### Integration Tests
- **Realistic**: Test real scenarios and component interactions
- **Comprehensive**: Validate complete workflows
- **Documented**: Serve as executable documentation
- **Stable**: Should work consistently but may be slower

## Development Workflow

1. **During Development**: Use `npm run test:watch` for fast feedback
2. **Before Commit**: Run `npm test` to ensure unit tests pass
3. **Before Push**: Run `npm run validate` to check everything
4. **CI Pipeline**: Uses `npm run test:ci` for coverage + speed

## Adding Tests

### For New Features
1. Add unit tests in appropriate directory (`client/` or `server/`)
2. Add integration tests if the feature involves component interaction
3. Update fixtures if the change affects framework integration

### For Bug Fixes
1. Add a failing test that reproduces the bug
2. Fix the bug
3. Verify the test now passes

### For Framework Examples
1. Create fixture in `tests/fixtures/`
2. Add validation in `tests/integration/examples-validation.test.ts`
3. Ensure example builds and runs correctly

## Test Configuration

Tests are configured in:
- `jest.config.js` - Main Jest configuration
- `tests/setup.ts` - Test environment setup
- `package.json` - Test scripts and dependencies

## Continuous Integration

The CI pipeline runs:
1. Unit tests with coverage (`npm run test:ci`)
2. Integration tests (`npm run test:integration`)
3. Linting (`npm run lint`)
4. Build validation (`npm run build`)

## Troubleshooting

**Tests timing out?**
- Integration tests may take longer due to building examples
- Use shorter timeouts for unit tests: `npm test`

**Fixtures not building?**
- Ensure you're in the main project directory
- Run `npm run build` first to ensure visilog package is available

**Coverage issues?**
- Only unit tests count toward coverage metrics
- Integration tests are excluded from coverage calculations