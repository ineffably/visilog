/**
 * Port detection utility for finding available ports
 */

import { createServer } from 'net';

export interface PortOptions {
  startPort?: number;
  endPort?: number;
  host?: string;
}

/**
 * Find the next available port starting from a given port
 */
export async function findAvailablePort(
  startPort: number = 3001, 
  options: PortOptions = {}
): Promise<number> {
  const { endPort = startPort + 100, host = '0.0.0.0' } = options;
  
  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }
  
  throw new Error(`No available ports found between ${startPort} and ${endPort}`);
}

/**
 * Check if a specific port is available
 */
export async function isPortAvailable(port: number, host: string = '0.0.0.0'): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, host, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Get a list of commonly used development ports to avoid
 */
export function getCommonDevPorts(): number[] {
  return [
    3000, // Create React App, Next.js
    3001, // Common alternative
    4200, // Angular CLI
    5173, // Vite
    5174, // Vite alternative
    8000, // Common Python/Django
    8080, // Common Java/Tomcat
    9000, // Common alternative
  ];
}

/**
 * Find an available port that avoids common dev server conflicts
 */
export async function findAvailablePortSafe(preferredPort: number = 3001): Promise<number> {
  const commonPorts = getCommonDevPorts();
  
  // First, try the preferred port if it's not a common conflict
  if (!commonPorts.includes(preferredPort)) {
    if (await isPortAvailable(preferredPort)) {
      return preferredPort;
    }
  }
  
  // Find a port that avoids common dev ports
  let port = preferredPort;
  while (port < preferredPort + 200) {
    if (!commonPorts.includes(port) && await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  
  // Fallback to any available port
  return findAvailablePort(preferredPort + 200);
}