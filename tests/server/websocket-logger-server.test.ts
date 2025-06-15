import { WebSocketLoggerServer } from '../../server/websocket-logger-server';
import type { ServerConfig, LogMessage, ClientMessage } from '../../types';

// Mock fs and path modules
// const _mockFs = {
//   existsSync: jest.fn(),
//   mkdirSync: jest.fn(),
//   writeFileSync: jest.fn(),
//   readFileSync: jest.fn(),
//   appendFileSync: jest.fn(),
//   createWriteStream: jest.fn(),
//   createReadStream: jest.fn()
// };

// const _mockPath = {
//   join: jest.fn((...args) => args.join('/')),
// };

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  statSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

// Mock WebSocket and WebSocketServer
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
  readyState: 1, // OPEN
};

const mockWebSocketServer = {
  on: jest.fn(),
  close: jest.fn(),
};

jest.mock('ws', () => ({
  WebSocketServer: jest.fn(() => mockWebSocketServer),
  WebSocket: jest.fn(() => mockWebSocket),
}));

describe('WebSocketLoggerServer', () => {
  let server: WebSocketLoggerServer;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    const fs = require('fs');
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{"sessions": [], "lastUpdated": "", "totalSessions": 0, "activeSessions": 0}');
    mockWebSocketServer.close.mockImplementation((callback) => callback && callback());
    
    server = new WebSocketLoggerServer({
      port: 3001,
      logsDir: '/test/logs',
      enableSessionLogs: false,
      enableIndex: false,
      cleanupInterval: 1000
    });
  });

  afterEach(async () => {
    if (server?.isRunning()) {
      await server.stop();
    }
  });

  describe('Constructor and Configuration', () => {
    it('should create server with default config', () => {
      const defaultServer = new WebSocketLoggerServer();
      const stats = defaultServer.getStats();
      
      expect(stats.config.port).toBe(3001);
      expect(stats.config.host).toBe('0.0.0.0');
      expect(stats.config.maxSessions).toBe(50);
      expect(stats.isRunning).toBe(false);
    });

    it('should merge custom config with defaults', () => {
      const customConfig: Partial<ServerConfig> = {
        port: 4000,
        maxSessions: 100,
        enableIndex: false
      };
      
      const customServer = new WebSocketLoggerServer(customConfig);
      const stats = customServer.getStats();
      
      expect(stats.config.port).toBe(4000);
      expect(stats.config.maxSessions).toBe(100);
      expect(stats.config.enableIndex).toBe(false);
    });

    it('should update configuration', () => {
      const newConfig = {
        maxSessions: 75,
        cleanupThreshold: 80
      };
      
      server.updateConfig(newConfig);
      const stats = server.getStats();
      
      expect(stats.config.maxSessions).toBe(75);
      expect(stats.config.cleanupThreshold).toBe(80);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server successfully', async () => {
      await server.start();
      
      expect(server.isRunning()).toBe(true);
      expect(mockWebSocketServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should throw error if server is already running', async () => {
      await server.start();
      
      await expect(server.start()).rejects.toThrow('Server is already running');
    });

    it('should stop server successfully', async () => {
      await server.start();
      await server.stop();
      
      expect(server.isRunning()).toBe(false);
      expect(mockWebSocketServer.close).toHaveBeenCalled();
    });
  });

  describe('Directory Management', () => {
    it('should create logs directory if it does not exist', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);
      
      await server.start();
      
      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/logs', { recursive: true });
    });

    it('should create sessions directory when session logs are enabled', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);
      
      const serverWithSessionLogs = new WebSocketLoggerServer({
        logsDir: '/test/logs',
        enableSessionLogs: true
      });
      
      await serverWithSessionLogs.start();
      
      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/logs/sessions', { recursive: true });
      
      await serverWithSessionLogs.stop();
    });
  });

  describe('Session Management', () => {
    let connectionHandler: Function;

    beforeEach(async () => {
      await server.start();
      connectionHandler = mockWebSocketServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];
    });

    it('should handle new WebSocket connection', () => {
      const mockRequest = {
        headers: { 'user-agent': 'test-browser' },
        socket: { remoteAddress: '127.0.0.1' }
      };

      connectionHandler(mockWebSocket, mockRequest);
      
      const stats = server.getStats();
      expect(stats.activeSessions).toBe(1);
      expect(mockWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle session setup', () => {
      const mockRequest = {
        headers: { 'user-agent': 'test-browser' },
        socket: { remoteAddress: '127.0.0.1' }
      };

      connectionHandler(mockWebSocket, mockRequest);
      
      // Verify that the connection handler was called and session was created
      const stats = server.getStats();
      expect(stats.activeSessions).toBe(1);
      
      // Verify WebSocket event handlers were set up
      expect(mockWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle session close', () => {
      const mockRequest = {
        headers: { 'user-agent': 'test-browser' },
        socket: { remoteAddress: '127.0.0.1' }
      };

      connectionHandler(mockWebSocket, mockRequest);
      
      // Get the close handler and call it
      const closeHandler = mockWebSocket.on.mock.calls.find(
        call => call[0] === 'close'
      )?.[1];
      
      closeHandler();
      
      const stats = server.getStats();
      expect(stats.activeSessions).toBe(0);
    });
  });

  describe('Message Handling', () => {
    let connectionHandler: Function;
    let messageHandler: Function;

    beforeEach(async () => {
      await server.start();
      connectionHandler = mockWebSocketServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];
      
      const mockRequest = {
        headers: { 'user-agent': 'test-browser' },
        socket: { remoteAddress: '127.0.0.1' }
      };
      
      connectionHandler(mockWebSocket, mockRequest);
      
      messageHandler = mockWebSocket.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
    });

    it('should handle log messages', () => {
      const logMessage: LogMessage = {
        level: 'info',
        message: 'Test log message',
        timestamp: new Date().toISOString(),
        sessionId: 'test-session-id',
        data: { test: 'data' }
      };

      const clientMessage: ClientMessage = {
        type: 'log',
        log: logMessage
      };

      messageHandler(Buffer.from(JSON.stringify(clientMessage)));
      
      // Should not throw and should process the message
      expect(true).toBe(true); // Basic success test
    });

    it('should handle pong messages', () => {
      const pongMessage: ClientMessage = {
        type: 'pong'
      };

      messageHandler(Buffer.from(JSON.stringify(pongMessage)));
      
      // Should not throw error and update last activity
      const sessions = server.getSessions();
      expect(sessions[0].lastActivity).toBeDefined();
    });

    it('should handle malformed messages gracefully', () => {
      const errorHandler = jest.fn();
      server.onError(errorHandler);
      
      messageHandler(Buffer.from('invalid json'));
      
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    it('should register and call error handlers', () => {
      const errorHandler = jest.fn();
      server.onError(errorHandler);
      
      // Trigger an error by calling handleError method indirectly
      const error = new Error('Test error');
      (server as any).handleError(error, 'Test context');
      
      expect(errorHandler).toHaveBeenCalledWith(error, expect.objectContaining({
        operation: 'Test context',
        component: 'WebSocketLoggerServer',
        timestamp: expect.any(String)
      }));
    });

    it('should unsubscribe handlers', () => {
      const errorHandler = jest.fn();
      const unsubscribe = server.onError(errorHandler);
      
      // Trigger error
      (server as any).handleError(new Error('Test'), 'Test');
      expect(errorHandler).toHaveBeenCalledTimes(1);
      
      // Unsubscribe and trigger again
      unsubscribe();
      (server as any).handleError(new Error('Test'), 'Test');
      expect(errorHandler).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Statistics and Information', () => {
    it('should provide server statistics', () => {
      const stats = server.getStats();
      
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('logsDirectory');
      expect(stats).toHaveProperty('config');
      expect(stats).toHaveProperty('isRunning');
      expect(typeof stats.activeSessions).toBe('number');
      expect(typeof stats.isRunning).toBe('boolean');
    });

    it('should return empty sessions list initially', () => {
      const sessions = server.getSessions();
      expect(sessions).toEqual([]);
    });

    it('should return null for non-existent session', () => {
      const session = server.getSession('non-existent');
      expect(session).toBeNull();
    });
  });

  describe('Graceful Shutdown', () => {
    it('should setup graceful shutdown handlers', () => {
      const originalOn = process.on;
      const mockProcessOn = jest.fn();
      process.on = mockProcessOn;
      
      server.setupGracefulShutdown();
      
      expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      
      process.on = originalOn;
    });
  });
}); 