// Vue.js + Vite Complete Working Example
// File: src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Add this single line for development logging
import 'visilog/auto'

const app = createApp(App)

// Log app initialization
console.log('🎯 Vue app initializing...', {
  version: app.version,
  timestamp: new Date().toISOString()
})

app.mount('#app')

// ============================================================================
// Vue Component Example with Logging
// File: src/App.vue

/*
<template>
  <div id="app">
    <h1>Visilog Vue.js Example</h1>
    <p>Check your ./logs/ directory for captured console output!</p>
    
    <div>
      <button @click="handleClick">Click me (logs to Visilog)</button>
      <button @click="fetchData">Fetch Data</button>
      <button @click="triggerError">Trigger Error</button>
    </div>
    
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">Error: {{ error }}</div>
    <div v-if="data" class="data">
      <h3>API Data:</h3>
      <pre>{{ JSON.stringify(data, null, 2) }}</pre>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'

export default {
  name: 'App',
  setup() {
    const data = ref(null)
    const error = ref(null)
    const loading = ref(false)
    const clickCount = ref(0)

    // Component lifecycle logging
    onMounted(() => {
      console.log('🎯 Vue component mounted', { 
        component: 'App',
        timestamp: Date.now()
      })
    })

    // Watch reactive data changes
    watch(clickCount, (newCount, oldCount) => {
      console.log('📊 Click count changed:', { 
        from: oldCount, 
        to: newCount,
        component: 'App'
      })
    })

    const handleClick = () => {
      clickCount.value++
      
      // User interactions are logged with context
      console.log('🖱️ Button clicked:', { 
        clickCount: clickCount.value,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        action: 'button-click'
      })
      
      // Different log levels
      if (clickCount.value > 5) {
        console.warn('⚠️ User has clicked many times:', clickCount.value)
      }
    }

    const fetchData = async () => {
      loading.value = true
      error.value = null
      
      try {
        console.log('📡 Starting Vue API call...')
        
        // Simulate API call
        const response = await fetch('/api/users')
        const result = await response.json()
        
        // Complex objects logged perfectly
        console.log('✅ Vue API success:', { 
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data: result,
          component: 'App',
          timestamp: new Date().toISOString()
        })
        
        data.value = result
      } catch (err) {
        // Errors captured with full details
        console.error('❌ Vue API error:', {
          message: err.message,
          stack: err.stack,
          component: 'App',
          timestamp: Date.now()
        })
        
        error.value = err.message
      } finally {
        loading.value = false
        console.debug('🔍 API call completed', { loading: loading.value })
      }
    }

    const triggerError = () => {
      console.log('🧨 Deliberately triggering error for demo...')
      
      try {
        // This will throw an error
        const result = nonExistentFunction()
        console.log('This should not appear')
      } catch (err) {
        console.error('❌ Caught error:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          component: 'App',
          action: 'triggerError'
        })
        
        error.value = err.message
      }
    }

    return {
      data,
      error,
      loading,
      clickCount,
      handleClick,
      fetchData,
      triggerError
    }
  }
}
</script>

<style>
.loading { color: blue; }
.error { color: red; margin: 10px 0; }
.data { margin: 20px 0; }
button { margin: 5px; padding: 10px; }
pre { background: #f5f5f5; padding: 10px; border-radius: 4px; }
</style>
*/

// ============================================================================
// Composable with Logging
// File: src/composables/useApi.js

import { ref } from 'vue'

export function useApi() {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  const execute = async (url, options = {}) => {
    loading.value = true
    error.value = null
    
    console.log('🔧 useApi composable executing:', { 
      url, 
      options,
      timestamp: Date.now()
    })

    try {
      const response = await fetch(url, options)
      const result = await response.json()
      
      console.log('✅ useApi success:', { 
        url,
        status: response.status,
        data: result
      })
      
      data.value = result
      return result
    } catch (err) {
      console.error('❌ useApi error:', { 
        url,
        error: err.message,
        composable: 'useApi'
      })
      
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, execute }
}

// ============================================================================
// Package.json setup
/*
{
  "scripts": {
    "dev": "concurrently \"npx visilog-server\" \"vite\"",
    "dev:logs": "npx visilog-server --logs-dir ./debug-logs",
    "clean:logs": "rm -rf logs"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "visilog": "latest"
  }
}
*/

// ============================================================================
// Tell your LLM:
// "Please read the browser console logs in ./logs/ and help me debug the Vue.js application"