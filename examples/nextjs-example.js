// Next.js Complete Working Example
// File: pages/_app.js

import { useEffect } from 'react'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Client-side only import to avoid SSR issues
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      import('visilog/auto').then(() => {
        console.log('🎯 Visilog initialized in Next.js app')
      })
    }
  }, [])

  return <Component {...pageProps} />
}

export default MyApp

// ============================================================================
// Next.js API Route with Logging
// File: pages/api/users.js

export default function handler(req, res) {
  // Server-side logging (if you have visilog server setup)
  console.log('🔥 API route called:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    timestamp: new Date().toISOString()
  })

  // Simulate database query
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]

  if (req.method === 'GET') {
    console.log('✅ Returning users:', { count: users.length })
    res.status(200).json({ users, timestamp: Date.now() })
  } else {
    console.warn('⚠️ Method not allowed:', req.method)
    res.status(405).json({ error: 'Method not allowed' })
  }
}

// ============================================================================
// Next.js Page Component with Client-side Logging
// File: pages/index.js

import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Home({ serverData }) {
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // This runs client-side and will be captured by Visilog
    console.log('🎯 Next.js page mounted:', {
      page: 'Home',
      serverData,
      timestamp: Date.now()
    })
  }, [serverData])

  const fetchClientData = async () => {
    setLoading(true)
    
    console.log('📡 Fetching client-side data...')
    
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      
      // Complex objects captured perfectly
      console.log('✅ Client fetch success:', {
        status: response.status,
        data,
        page: 'Home',
        timestamp: new Date().toISOString()
      })
      
      setClientData(data)
    } catch (error) {
      console.error('❌ Client fetch error:', {
        message: error.message,
        stack: error.stack,
        page: 'Home'
      })
    } finally {
      setLoading(false)
      console.debug('🔍 Fetch completed', { loading: false })
    }
  }

  const handleInteraction = (action) => {
    console.log('🖱️ User interaction:', {
      action,
      page: 'Home',
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR'
    })
    
    if (action === 'error') {
      console.error('🧨 Simulated error:', {
        error: new Error('Demo error'),
        context: 'User triggered error demo'
      })
    }
  }

  return (
    <>
      <Head>
        <title>Visilog Next.js Example</title>
      </Head>
      
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <h1>Visilog Next.js Example</h1>
        <p>Check your ./logs/ directory for captured console output!</p>
        
        <div style={{ margin: '20px 0' }}>
          <button 
            onClick={() => handleInteraction('click')}
            style={{ margin: '5px', padding: '10px' }}
          >
            Log Click
          </button>
          
          <button 
            onClick={fetchClientData}
            disabled={loading}
            style={{ margin: '5px', padding: '10px' }}
          >
            {loading ? 'Loading...' : 'Fetch Data'}
          </button>
          
          <button 
            onClick={() => handleInteraction('error')}
            style={{ margin: '5px', padding: '10px', background: '#ff6b6b' }}
          >
            Trigger Error
          </button>
        </div>
        
        {serverData && (
          <div>
            <h3>Server Data (SSR):</h3>
            <pre style={{ background: '#f5f5f5', padding: '10px' }}>
              {JSON.stringify(serverData, null, 2)}
            </pre>
          </div>
        )}
        
        {clientData && (
          <div>
            <h3>Client Data (CSR):</h3>
            <pre style={{ background: '#e8f5e8', padding: '10px' }}>
              {JSON.stringify(clientData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </>
  )
}

// Server-side data fetching
export async function getServerSideProps() {
  // This runs server-side and won't be captured by client Visilog
  console.log('🔧 Server-side props fetching...')
  
  const serverData = {
    message: 'This data came from getServerSideProps',
    timestamp: new Date().toISOString(),
    random: Math.random()
  }
  
  return {
    props: { serverData }
  }
}

// ============================================================================
// Custom Hook with Logging
// File: hooks/useApiWithLogging.js

import { useState, useCallback } from 'react'

export function useApiWithLogging() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async (url, options = {}) => {
    setLoading(true)
    setError(null)
    
    console.log('🔧 useApiWithLogging hook executing:', {
      url,
      options,
      hook: 'useApiWithLogging',
      timestamp: Date.now()
    })

    try {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      console.log('✅ Hook API success:', {
        url,
        status: response.status,
        data: result,
        hook: 'useApiWithLogging'
      })
      
      setData(result)
      return result
    } catch (err) {
      console.error('❌ Hook API error:', {
        url,
        error: err.message,
        stack: err.stack,
        hook: 'useApiWithLogging'
      })
      
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
      console.debug('🔍 Hook execution completed')
    }
  }, [])

  return { data, error, loading, execute }
}

// ============================================================================
// Package.json setup
/*
{
  "scripts": {
    "dev": "concurrently \"npx visilog-server\" \"next dev\"",
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
// Next.js Config (optional)
// File: next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Webpack config to ensure Visilog works properly
  webpack: (config, { dev, isServer }) => {
    // Only modify client-side webpack config in development
    if (dev && !isServer) {
      console.log('🔧 Next.js webpack config modified for Visilog development mode')
    }
    
    return config
  }
}

module.exports = nextConfig

// ============================================================================
// Tell your LLM:
// "Please read the browser console logs in ./logs/ and help me debug this Next.js application"