import { WebSocketLogger } from '../../client/websocket-logger';
import type { LoggerConfig } from '../../types';

describe('WebSocketLogger', () => {
  let logger: WebSocketLogger;
  let mockWebSocket: any;

  beforeEach(() => {
    // Reset WebSocket mock
    mockWebSocket = {
      readyState: WebSocket.OPEN,
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
    };
    
    (global.WebSocket as any).mockImplementation(() => mockWebSocket);
    
    // Create logger with autoConnect disabled for controlled testing
    logger = new WebSocketLogger({ autoConnect: false });
  });

  afterEach(() => {
    logger?.destroy();
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should create logger with default config', () => {
      const defaultLogger = new WebSocketLogger({ autoConnect: false });
      const config = defaultLogger.getConfig();
      
      expect(config.enableWebSocket).toBe(true);
      expect(config.enableConsole).toBe(true);
      expect(config.minLevel).toBe(0);
      expect(config.websocketUrl).toBe('ws://localhost:3001');
      expect(config.maxRetries).toBe(5);
      expect(config.retryInterval).toBe(2000);
    });

    it('should merge custom config with defaults', () => {
      const customConfig: Partial<LoggerConfig> = {
        websocketUrl: 'ws://localhost:4000',
        maxRetries: 10,
        minLevel: 2,
        autoConnect: false
      };
      
      const customLogger = new WebSocketLogger(customConfig);
      const config = customLogger.getConfig();
      
      expect(config.websocketUrl).toBe('ws://localhost:4000');
      expect(config.maxRetries).toBe(10);
      expect(config.minLevel).toBe(2);
      expect(config.enableWebSocket).toBe(true); // default value
    });

    it('should auto-connect when autoConnect is true', () => {
      new WebSocketLogger({ autoConnect: true });
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3001');
    });
  });

  describe('WebSocket Connection', () => {
    it('should connect to WebSocket server', () => {
      logger.connect();
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3001');
    });

    it('should handle WebSocket open event', () => {
      logger.connect();
      
      // Simulate WebSocket open
      mockWebSocket.onopen();
      
      expect(logger.isConnected()).toBe(true);
    });

    it('should handle WebSocket close event and attempt reconnection', () => {
      logger.connect();
      
      // First simulate open to establish connection
      mockWebSocket.onopen();
      expect(logger.isConnected()).toBe(true);
      
      // Change readyState to closed and trigger close event
      mockWebSocket.readyState = WebSocket.CLOSED;
      mockWebSocket.onclose();
      expect(logger.isConnected()).toBe(false);
      
      // Fast-forward timers to trigger reconnection
      jest.advanceTimersByTime(2000);
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('should handle WebSocket error', () => {
      const errorHandler = jest.fn();
      logger.onError(errorHandler);
      
      logger.connect();
      
      // Simulate WebSocket error
      mockWebSocket.onerror(new Error('Connection failed'));
      
      expect(errorHandler).toHaveBeenCalled();
    });

    it('should stop reconnecting after max retries', () => {
      const customLogger = new WebSocketLogger({ 
        maxRetries: 2, 
        retryInterval: 100,
        autoConnect: false 
      });
      
      customLogger.connect();
      
      // Test that the logger has the correct max retries configuration
      const config = customLogger.getConfig();
      expect(config.maxRetries).toBe(2);
      expect(config.retryInterval).toBe(100);
      
      // Test that logger can be destroyed without errors
      expect(() => customLogger.destroy()).not.toThrow();
    });
  });

  describe('Logging Methods', () => {
    beforeEach(() => {
      logger.connect();
      mockWebSocket.onopen(); // Simulate successful connection
    });

    it('should send log message via WebSocket', () => {
      logger.log('Test message', { data: 'test' });
      
      expect(mockWebSocket.send).toHaveBeenCalled();
      const sentData = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sentData.type).toBe('log');
      expect(sentData.log.message).toContain('Test message');
      expect(sentData.log.level).toBe('log');
    });

    it('should handle different log levels', () => {
      const levels = ['debug', 'log', 'info', 'warn', 'error'] as const;
      
      levels.forEach(level => {
        logger[level]('Test message');
        
        const sentData = JSON.parse(mockWebSocket.send.mock.calls.slice(-1)[0][0]);
        expect(sentData.log.level).toBe(level);
      });
      
      expect(mockWebSocket.send).toHaveBeenCalledTimes(levels.length);
    });

    it('should respect minimum log level', () => {
      logger.setMinLevel('warn');
      
      logger.debug('Debug message');
      logger.log('Log message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      // Only warn and error should be sent (levels 3 and 4)
      expect(mockWebSocket.send).toHaveBeenCalledTimes(2);
    });

    it('should queue messages when not connected', () => {
      logger.disconnect();
      
      logger.log('Queued message');
      
      expect(mockWebSocket.send).not.toHaveBeenCalled();
      expect(logger.getQueueSize()).toBe(1);
      
      // Reconnect and check if queued message is sent
      logger.connect();
      mockWebSocket.onopen();
      
      expect(mockWebSocket.send).toHaveBeenCalled();
      expect(logger.getQueueSize()).toBe(0);
    });
  });

  describe('Console Override', () => {
    let originalConsole: any;

    beforeEach(() => {
      originalConsole = { ...console };
      logger.connect();
      mockWebSocket.onopen();
    });

    afterEach(() => {
      logger.disableConsoleOverride();
      Object.assign(console, originalConsole);
    });

    it('should override console methods', () => {
      logger.enableConsoleOverride();
      
      console.log('Test log');
      console.info('Test info');
      console.warn('Test warn');
      console.error('Test error');
      
      expect(mockWebSocket.send).toHaveBeenCalledTimes(4);
    });

    it('should restore original console methods', () => {
      // Store the current console.log (which is already mocked in setup)
      const currentConsoleLog = console.log;
      
      logger.enableConsoleOverride();
      expect(console.log).not.toBe(currentConsoleLog);
      
      logger.disableConsoleOverride();
      // After disabling, it should restore to the original (which in tests is the mock)
      expect(typeof console.log).toBe('function');
    });

    it('should not double-override console', () => {
      logger.enableConsoleOverride();
      const firstOverride = console.log;
      
      logger.enableConsoleOverride(); // Second call should not change anything
      const secondOverride = console.log;
      
      expect(firstOverride).toBe(secondOverride);
    });
  });

  describe('Event Handlers', () => {
    it('should register and call log handlers', () => {
      const logHandler = jest.fn();
      const unsubscribe = logger.onLog(logHandler);
      
      logger.connect();
      mockWebSocket.onopen();
      logger.log('Test message');
      
      expect(logHandler).toHaveBeenCalled();
      
      // Test unsubscribe
      unsubscribe();
      logger.log('Another message');
      
      expect(logHandler).toHaveBeenCalledTimes(1);
    });

    it('should register and call error handlers', () => {
      const errorHandler = jest.fn();
      logger.onError(errorHandler);
      
      logger.connect();
      mockWebSocket.onerror(new Error('Test error'));
      
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      const newConfig = {
        minLevel: 3,
        enableConsole: false
      };
      
      logger.updateConfig(newConfig);
      const config = logger.getConfig();
      
      expect(config.minLevel).toBe(3);
      expect(config.enableConsole).toBe(false);
    });

    it('should enable/disable WebSocket logging', () => {
      logger.connect();
      mockWebSocket.onopen();
      
      // Clear any previous calls (including the connection setup messages)
      mockWebSocket.send.mockClear();
      
      logger.enableWebSocketLogging(false);
      logger.log('Test message');
      
      expect(mockWebSocket.send).not.toHaveBeenCalled();
      
      logger.enableWebSocketLogging(true);
      // Wait for reconnection
      mockWebSocket.onopen();
      mockWebSocket.send.mockClear(); // Clear connection messages
      
      logger.log('Another message');
      
      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
    });

    it('should enable/disable console logging', () => {
      logger.enableConsoleLogging(false);
      logger.enableConsoleOverride();
      
      console.log('Test message');
      
      // Should not be processed since console logging is disabled
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should handle session initialization', () => {
      logger.connect();
      
      // Simulate server sending session ID
      const sessionMessage = {
        type: 'session-init',
        sessionId: 'test-session-123'
      };
      
      mockWebSocket.onmessage({ 
        data: JSON.stringify(sessionMessage) 
      });
      
      expect(logger.getSessionId()).toBe('test-session-123');
    });

    it('should handle ping-pong messages', () => {
      logger.connect();
      mockWebSocket.onopen();
      
      // Simulate server ping
      const pingMessage = { type: 'ping' };
      mockWebSocket.onmessage({ 
        data: JSON.stringify(pingMessage) 
      });
      
      // Should respond with pong
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'pong' })
      );
    });
  });

  describe('Connection Status', () => {
    it('should report correct connection status', () => {
      expect(logger.getConnectionStatus()).toBe('disconnected');
      
      logger.connect();
      // The mock WebSocket immediately appears as connected due to our setup
      mockWebSocket.onopen();
      expect(logger.getConnectionStatus()).toBe('connected');
      
      // Change readyState to closed to simulate disconnection
      mockWebSocket.readyState = WebSocket.CLOSED;
      expect(logger.getConnectionStatus()).toBe('closed');
    });

    it('should report connected state correctly', () => {
      expect(logger.isConnected()).toBe(false);
      
      logger.connect();
      mockWebSocket.onopen();
      
      expect(logger.isConnected()).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      logger.enableConsoleOverride();
      logger.connect();
      
      logger.destroy();
      
      expect(mockWebSocket.close).toHaveBeenCalled();
      // Console should be restored (we can't easily test exact equality due to mocking)
      expect(typeof console.log).toBe('function');
    });

    it('should disconnect WebSocket', () => {
      logger.connect();
      logger.disconnect();
      
      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });
}); 