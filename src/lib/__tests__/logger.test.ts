import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, createLogger } from '../logger';

describe('Logger', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('logger.debug', () => {
    it('should log debug messages in development', () => {
      vi.stubEnv('NODE_ENV', 'development');

      logger.debug('Test debug message');

      expect(consoleLogSpy).toHaveBeenCalled();

      vi.unstubAllEnvs();
    });

    it('should not log debug messages in production', () => {
      vi.stubEnv('NODE_ENV', 'production');

      logger.debug('Test debug message');

      expect(consoleLogSpy).not.toHaveBeenCalled();

      vi.unstubAllEnvs();
    });
  });

  describe('logger.error', () => {
    it('should always log errors', () => {
      logger.error('Test error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should include error details', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Test error');
    });
  });

  describe('logger.warn', () => {
    it('should log warnings', () => {
      logger.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('createLogger', () => {
    it('should create child logger with prefix', () => {
      const childLogger = createLogger('TestModule');
      childLogger.debug('Test message');

      if (process.env.NODE_ENV === 'development') {
        expect(consoleLogSpy).toHaveBeenCalled();
        const loggedMessage = consoleLogSpy.mock.calls[0][0];
        expect(loggedMessage).toContain('[TestModule]');
      }
    });
  });
});
