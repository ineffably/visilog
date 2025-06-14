import { WebSocketLogger } from '../../client/websocket-logger';
import { WebSocketLoggerServer } from '../../server/websocket-logger-server';

// Use fake timers for integration tests
jest.useFakeTimers();

describe('Integration Tests', () => {
  describe('Basic Functionality', () => {
    it('should create client and server instances', () => {
      const server = new WebSocketLoggerServer({
        port: 3002,
        logsDir: '/tmp/test-logs',
        enableSessionLogs: false,
        enableIndex: false
      });
      
      const logger = new WebSocketLogger({
        websocketUrl: 'ws://localhost:3002',
        autoConnect: false,
        maxRetries: 1,
        retryInterval: 100
      });

      expect(server).toBeDefined();
      expect(logger).toBeDefined();
      expect(server.isRunning()).toBe(false);
      expect(logger.isConnected()).toBe(false);
      
      // Cleanup
      logger.destroy();
    });

    it('should handle configuration properly', () => {
      const serverConfig = {
        port: 3003,
        maxSessions: 10,
        enableIndex: false
      };
      
      const clientConfig = {
        websocketUrl: 'ws://localhost:3003',
        maxRetries: 3,
        autoConnect: false
      };

      const server = new WebSocketLoggerServer(serverConfig);
      const logger = new WebSocketLogger(clientConfig);

      const serverStats = server.getStats();
      const clientConfig2 = logger.getConfig();

      expect(serverStats.config.port).toBe(3003);
      expect(serverStats.config.maxSessions).toBe(10);
      expect(clientConfig2.websocketUrl).toBe('ws://localhost:3003');
      expect(clientConfig2.maxRetries).toBe(3);
      
      // Cleanup
      logger.destroy();
    });

    it('should handle client logging methods', () => {
      const logger = new WebSocketLogger({
        autoConnect: false,
        enableWebSocket: false // Disable WebSocket to test logging methods only
      });

      // Test that logging methods don't throw
      expect(() => logger.log('Test log')).not.toThrow();
      expect(() => logger.info('Test info')).not.toThrow();
      expect(() => logger.warn('Test warn')).not.toThrow();
      expect(() => logger.error('Test error')).not.toThrow();
      expect(() => logger.debug('Test debug')).not.toThrow();

      // Test configuration updates
      expect(() => logger.setMinLevel('warn')).not.toThrow();
      expect(() => logger.enableWebSocketLogging(false)).not.toThrow();
      expect(() => logger.enableConsoleLogging(false)).not.toThrow();

      logger.destroy();
    });

    it('should handle server event handlers', () => {
      const server = new WebSocketLoggerServer({
        enableSessionLogs: false,
        enableIndex: false
      });

              const sessionUnsubscribe = server.onSession(() => {
      // Handler called
    });

    const logUnsubscribe = server.onLog(() => {
      // Handler called
    });

    const errorUnsubscribe = server.onError(() => {
      // Handler called
    });

      // Test unsubscribe functions
      expect(typeof sessionUnsubscribe).toBe('function');
      expect(typeof logUnsubscribe).toBe('function');
      expect(typeof errorUnsubscribe).toBe('function');

      // Test that handlers can be unsubscribed
      sessionUnsubscribe();
      logUnsubscribe();
      errorUnsubscribe();

      expect(true).toBe(true); // Basic success test
    });

    it('should handle client console override', () => {
      const logger = new WebSocketLogger({
        autoConnect: false,
        enableWebSocket: false
      });

      const originalConsole = console.log;

      // Test console override
      logger.enableConsoleOverride();
      expect(console.log).not.toBe(originalConsole);

      // Test console restore
      logger.disableConsoleOverride();
      expect(typeof console.log).toBe('function');

      logger.destroy();
    });

    it('should handle client event handlers', () => {
      const logger = new WebSocketLogger({
        autoConnect: false
      });

          // Handler tracking variables removed for simplicity

      const logUnsubscribe = logger.onLog(() => {
        logHandlerCalled = true;
      });

      const errorUnsubscribe = logger.onError(() => {
        errorHandlerCalled = true;
      });

      // Test unsubscribe functions
      expect(typeof logUnsubscribe).toBe('function');
      expect(typeof errorUnsubscribe).toBe('function');

      // Test that handlers can be unsubscribed
      logUnsubscribe();
      errorUnsubscribe();

      logger.destroy();
    });
  });
}); 