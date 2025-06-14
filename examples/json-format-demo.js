#!/usr/bin/env node

// Demo script to show the new JSON log format
const fs = require('fs');
const path = require('path');

function demonstrateJsonFormat() {
  console.log('🚀 JSON Log Format Demo\n');

  // Create some sample log entries to show the JSON format
  const sampleLogs = [
    {
      timestamp: new Date().toISOString(),
      level: 'log',
      message: '🚀 Application started',
      sessionId: 'a1b2c3d4',
      url: 'http://localhost:3000',
      data: { 
        version: '1.0.0',
        environment: 'development' 
      }
    },
    {
      timestamp: new Date(Date.now() + 1000).toISOString(),
      level: 'info',
      message: '🔍 User profile loaded',
      sessionId: 'a1b2c3d4',
      url: 'http://localhost:3000/profile',
      data: { 
        userId: 123,
        username: 'john_doe',
        role: 'admin' 
      }
    },
    {
      timestamp: new Date(Date.now() + 2000).toISOString(),
      level: 'warn',
      message: '⚠️ API rate limit approaching',
      sessionId: 'a1b2c3d4',
      url: 'http://localhost:3000/api',
      data: { 
        remainingRequests: 5,
        resetTime: '2024-01-15T11:00:00Z' 
      }
    },
    {
      timestamp: new Date(Date.now() + 3000).toISOString(),
      level: 'error',
      message: '❌ Payment processing failed',
      sessionId: 'a1b2c3d4',
      url: 'http://localhost:3000/checkout',
      data: { 
        error: 'Card declined',
        amount: 99.99,
        cardLast4: '1234',
        orderId: 'order-456' 
      }
    },
    {
      timestamp: new Date(Date.now() + 4000).toISOString(),
      level: 'debug',
      message: '🔍 Debug information',
      sessionId: 'a1b2c3d4',
      url: 'http://localhost:3000',
      namespace: 'auth-module',
      data: { 
        tokenExpiry: '2024-01-15T12:00:00Z',
        permissions: ['read', 'write'],
        debugFlag: true 
      }
    }
  ];

  // Write sample logs to demonstrate format
  const demoLogFile = path.join('./demo-logs', 'json-format-example.log');
  
  // Ensure directory exists
  if (!fs.existsSync('./demo-logs')) {
    fs.mkdirSync('./demo-logs', { recursive: true });
  }

  console.log('📄 Creating sample JSON log file...\n');
  
  const logContent = sampleLogs.map(log => JSON.stringify(log)).join('\n') + '\n';
  fs.writeFileSync(demoLogFile, logContent);

  console.log('✅ Sample log file created: ./demo-logs/json-format-example.log\n');
  
  console.log('📋 Here\'s what each log level looks like in JSON format:\n');
  console.log('─'.repeat(100));
  
  sampleLogs.forEach((log, index) => {
    console.log(`\n${index + 1}. ${log.level.toUpperCase()} Level:`);
    console.log(`   Message: ${log.message}`);
    console.log(`   JSON: ${JSON.stringify(log, null, 2)}`);
  });
  
  console.log('\n' + '─'.repeat(100));
  console.log('\n🎯 Benefits of JSON format:');
  console.log('   ✅ Easy to parse programmatically');
  console.log('   ✅ Structured data is preserved exactly');
  console.log('   ✅ LLMs can easily understand the format');
  console.log('   ✅ Each log entry is self-contained');
  console.log('   ✅ Consistent schema across all log levels');
  console.log('   ✅ console.info vs console.log are clearly distinguished');
  
  console.log('\n📖 To view the actual log file:');
  console.log(`   cat ${demoLogFile}`);
  
  console.log('\n🔍 Notice how console.info and console.log are different:');
  console.log('   • console.log() → "level": "log"');
  console.log('   • console.info() → "level": "info"');
  console.log('   • console.warn() → "level": "warn"');
  console.log('   • console.error() → "level": "error"');
  console.log('   • console.debug() → "level": "debug"');
  
  console.log('\n🏁 Demo complete!');
}

// Run the demo
demonstrateJsonFormat(); 