// Simple integration examples

// Option 1: Conditional import for dev only
if (process.env.NODE_ENV === 'development') {
  import('visilog/client').then(({ WebSocketLogger }) => {
    const logger = new WebSocketLogger({
      autoConnect: true,
      websocketUrl: 'ws://localhost:3001'
    });
    
    // Automatically override console in dev
    logger.enableConsoleOverride();
    
    console.log('🔌 VisiLog connected for development');
  });
}

// Option 2: Manual dev import
// In your main.js/index.js during development:
// import 'visilog/auto'; // Automatically sets up everything

// Option 3: Script tag approach (no bundler needed)
/*
<!-- Add to your HTML during development -->
<script src="https://unpkg.com/visilog/dist/browser.js"></script>
<script>
  if (window.VisiLog) {
    window.VisiLog.connect('ws://localhost:3001');
  }
</script>
*/

// Option 4: Dev server middleware (Express/Fastify/etc)
/*
// In your dev server setup:
import { createDevMiddleware } from 'visilog/middleware';

app.use(createDevMiddleware({
  port: 3001,
  injectScript: true // Automatically injects client script
}));
*/

module.exports = {};