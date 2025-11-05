/**
 * Centralized logging utility for the application
 * Provides consistent logging across client and server with environment-aware behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isServer: boolean;

  constructor() {
    this.isServer = typeof window === 'undefined';
  }

  private get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Format log message with context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const env = this.isServer ? 'SERVER' : 'CLIENT';
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${env}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Log error messages (always logged)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        errorMessage: error.message,
        errorStack: this.isDevelopment ? error.stack : undefined,
      }),
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): ChildLogger {
    return new ChildLogger(this, prefix);
  }
}

class ChildLogger {
  constructor(private parent: Logger, private prefix: string) {}

  debug(message: string, context?: LogContext): void {
    this.parent.debug(`[${this.prefix}] ${message}`, context);
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(`[${this.prefix}] ${message}`, context);
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(`[${this.prefix}] ${message}`, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.parent.error(`[${this.prefix}] ${message}`, error, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory for creating child loggers
export const createLogger = (prefix: string) => logger.child(prefix);
