import { createApp } from 'vue'
import App from './App.vue'

// Test visilog auto-import
import 'visilog/auto'

// Log initialization
console.log('🎯 Vue test app initializing with Visilog', {
  timestamp: new Date().toISOString(),
  framework: 'vue',
  bundler: 'vite'
})

createApp(App).mount('#app')