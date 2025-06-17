// React + Vite Complete Working Example
// File: src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Add this single line for development logging
import 'visilog/auto'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ============================================================================
// React Component Example with Logging
// File: src/App.jsx

import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  // This will be captured by Visilog automatically
  console.log('🎯 App component mounting')

  useEffect(() => {
    // Example API call with automatic logging
    const fetchData = async () => {
      try {
        console.log('📡 Starting API call...')
        
        const response = await fetch('/api/data')
        const result = await response.json()
        
        // Complex objects are captured perfectly
        console.log('✅ API response:', { 
          status: response.status, 
          data: result,
          timestamp: new Date().toISOString()
        })
        
        setData(result)
      } catch (err) {
        // Errors are captured with full stack traces
        console.error('❌ API call failed:', err)
        setError(err.message)
      }
    }

    fetchData()
  }, [])

  const handleButtonClick = () => {
    // User interactions are logged
    console.log('🖱️ Button clicked:', { 
      timestamp: Date.now(),
      userId: 'demo-user',
      action: 'button-click'
    })
    
    // Complex state updates
    console.warn('⚠️ This is a warning message')
    console.debug('🔍 Debug info:', { component: 'App', state: { data, error } })
  }

  return (
    <div className="App">
      <h1>Visilog React Example</h1>
      <p>Check your ./logs/ directory for captured console output!</p>
      
      <button onClick={handleButtonClick}>
        Click me (logs to Visilog)
      </button>
      
      {error && <div style={{color: 'red'}}>Error: {error}</div>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}

export default App

// ============================================================================
// Package.json script setup
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
// "Please read the browser console logs in ./logs/ and help me debug any issues"