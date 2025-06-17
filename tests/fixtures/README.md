# Visilog Framework Examples Test Fixtures

This directory contains complete, working examples of Visilog integration with popular frameworks. These examples are fully tested and validated to ensure they work correctly.

## Available Examples

### React + Vite (`react-vite-app/`)
Complete React application using Vite bundler with Visilog integration.

**Setup:**
```bash
cd tests/fixtures/react-vite-app
npm install
npm run dev  # Start development server
# OR
npm run build  # Build for production
```

**Key Features:**
- Uses `import 'visilog/auto'` for automatic setup
- Complete component with state management
- Test attributes for automation
- Comprehensive console logging examples

### Vue.js + Vite (`vue-vite-app/`)
Complete Vue.js application using Vite bundler with Visilog integration.

**Setup:**
```bash
cd tests/fixtures/vue-vite-app
npm install
npm run dev  # Start development server
# OR  
npm run build  # Build for production
```

**Key Features:**
- Composition API with reactive data
- Auto-import integration
- Vue-specific logging patterns
- Test automation support

### Vanilla JavaScript (`vanilla-js-app/`)
Pure HTML/JavaScript example with Visilog integration.

**Usage:**
Simply open `index.html` in a browser after starting the Visilog server:
```bash
npx visilog-server  # Start server first
# Then open index.html in browser
```

**Key Features:**
- No build step required
- CDN-based Visilog loading  
- Complete DOM manipulation examples
- Event handling and logging

## Testing

All examples are validated by comprehensive integration tests:

```bash
# Run validation tests (no external dependencies)
npm run test:examples

# Test specific example
npm test -- --testPathPattern=examples-validation
```

## Using These Examples

1. **Copy and Modify**: Copy any example as a starting point for your project
2. **Reference Implementation**: Use as a reference for proper Visilog integration
3. **Testing Setup**: Examples include proper test attributes for automation
4. **Documentation**: Each example demonstrates best practices

## Common Patterns

All examples follow these consistent patterns:

### Initialization Logging
```javascript
console.log('🎯 [Framework] app initializing with Visilog', {
  timestamp: new Date().toISOString(),
  framework: 'react|vue|vanilla-js',
  bundler: 'vite' // if applicable
})
```

### Test Automation
All examples include `data-testid` attributes for testing:
- `test-content` - Main test container
- `count` - Counter display
- `increment-btn` - Counter button
- `log-info`, `log-warn`, `log-error`, `log-debug` - Logging buttons
- `logs-display` - Log output area

### Logging Patterns
Each example demonstrates:
- Component lifecycle logging
- User interaction logging
- Error handling with stack traces
- Complex object logging
- Different log levels (info, warn, error, debug)

## Server Integration

All examples work with the Visilog CLI server:

```bash
# Start server (in separate terminal)
npx visilog-server

# Or with custom options
npx visilog-server --port 3002 --logs-dir ./debug-logs
```

## Validation

These examples are automatically validated to ensure:
- ✅ Correct package.json dependencies
- ✅ Proper build configuration
- ✅ Valid HTML structure
- ✅ Correct Visilog imports
- ✅ Consistent logging patterns
- ✅ Test automation attributes
- ✅ Cross-framework consistency

## Contributing

When adding new framework examples:

1. Follow the existing directory structure
2. Include complete package.json with dependencies
3. Add proper test attributes (`data-testid`)
4. Include comprehensive logging examples
5. Update this README
6. Add validation tests in `../integration/examples-validation.test.ts`