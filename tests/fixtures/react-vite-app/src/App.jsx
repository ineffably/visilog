import { useState, useEffect } from 'react'

function App() {
  const [count, setCount] = useState(0)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    console.log('🎯 React App component mounted', {
      timestamp: Date.now(),
      component: 'App'
    })
  }, [])

  const addTestLog = (type) => {
    const timestamp = Date.now()
    const logData = {
      type,
      count,
      timestamp,
      component: 'App',
      testData: { level: type, random: Math.random() }
    }

    switch (type) {
      case 'info':
        console.log('ℹ️ Test info log from React', logData)
        break
      case 'warn':
        console.warn('⚠️ Test warning log from React', logData)
        break
      case 'error':
        console.error('❌ Test error log from React', logData)
        break
      case 'debug':
        console.debug('🔍 Test debug log from React', logData)
        break
    }

    setLogs(prev => [...prev, { ...logData, id: Date.now() }])
  }

  const incrementCount = () => {
    const newCount = count + 1
    setCount(newCount)
    console.log('🖱️ Count incremented', {
      oldCount: count,
      newCount,
      timestamp: Date.now()
    })
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Visilog React Test App</h1>
      <div data-testid="test-content">
        <p>Count: <span data-testid="count">{count}</span></p>
        <button 
          data-testid="increment-btn"
          onClick={incrementCount}
        >
          Increment Count
        </button>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h3>Test Logging</h3>
        <button data-testid="log-info" onClick={() => addTestLog('info')}>
          Log Info
        </button>
        <button data-testid="log-warn" onClick={() => addTestLog('warn')}>
          Log Warning
        </button>
        <button data-testid="log-error" onClick={() => addTestLog('error')}>
          Log Error
        </button>
        <button data-testid="log-debug" onClick={() => addTestLog('debug')}>
          Log Debug
        </button>
      </div>

      <div>
        <h3>Generated Logs ({logs.length})</h3>
        <div data-testid="logs-display" style={{ maxHeight: '200px', overflow: 'auto' }}>
          {logs.map(log => (
            <div key={log.id} style={{ margin: '5px 0', padding: '5px', background: '#f5f5f5' }}>
              [{log.type}] {log.timestamp}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App