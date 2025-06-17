<template>
  <div style="padding: 20px; font-family: Arial">
    <h1>Visilog Vue Test App</h1>
    <div data-testid="test-content">
      <p>Count: <span data-testid="count">{{ count }}</span></p>
      <button 
        data-testid="increment-btn"
        @click="incrementCount"
      >
        Increment Count
      </button>
    </div>
    
    <div style="margin: 20px 0">
      <h3>Test Logging</h3>
      <button data-testid="log-info" @click="addTestLog('info')">
        Log Info
      </button>
      <button data-testid="log-warn" @click="addTestLog('warn')">
        Log Warning
      </button>
      <button data-testid="log-error" @click="addTestLog('error')">
        Log Error
      </button>
      <button data-testid="log-debug" @click="addTestLog('debug')">
        Log Debug
      </button>
    </div>

    <div>
      <h3>Generated Logs ({{ logs.length }})</h3>
      <div data-testid="logs-display" style="max-height: 200px; overflow: auto">
        <div 
          v-for="log in logs" 
          :key="log.id" 
          style="margin: 5px 0; padding: 5px; background: #f5f5f5"
        >
          [{{ log.type }}] {{ log.timestamp }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'App',
  setup() {
    const count = ref(0)
    const logs = ref([])

    onMounted(() => {
      console.log('🎯 Vue App component mounted', {
        timestamp: Date.now(),
        component: 'App'
      })
    })

    const addTestLog = (type) => {
      const timestamp = Date.now()
      const logData = {
        type,
        count: count.value,
        timestamp,
        component: 'App',
        testData: { level: type, random: Math.random() }
      }

      switch (type) {
        case 'info':
          console.log('ℹ️ Test info log from Vue', logData)
          break
        case 'warn':
          console.warn('⚠️ Test warning log from Vue', logData)
          break
        case 'error':
          console.error('❌ Test error log from Vue', logData)
          break
        case 'debug':
          console.debug('🔍 Test debug log from Vue', logData)
          break
      }

      logs.value.push({ ...logData, id: Date.now() })
    }

    const incrementCount = () => {
      const oldCount = count.value
      count.value++
      console.log('🖱️ Count incremented', {
        oldCount,
        newCount: count.value,
        timestamp: Date.now()
      })
    }

    return {
      count,
      logs,
      addTestLog,
      incrementCount
    }
  }
}
</script>