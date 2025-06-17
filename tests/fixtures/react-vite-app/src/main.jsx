import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Test visilog auto-import
import 'visilog/auto'

// Log initialization
console.log('🎯 React test app initializing with Visilog', {
  timestamp: new Date().toISOString(),
  framework: 'react',
  bundler: 'vite'
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)