/**
 * Database logger utility for standardized logging.
 * Provides structured logging with different log levels.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogContext {
  [key: string]: any;
}

class DatabaseLogger {
  private level: LogLevel;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.level = logLevel;
  }

  /**
   * Logs a message at the specified level.
   * @param level - The log level
   * @param message - The message to log
   * @param context - Optional additional context to log
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    if (this.shouldLog(level)) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level}]`;
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`${prefix} ${message}${contextStr}`);
          break;
        case LogLevel.INFO:
          console.log(`${prefix} ${message}${contextStr}`);
          break;
        case LogLevel.WARN:
          console.warn(`${prefix} ${message}${contextStr}`);
          break;
        case LogLevel.ERROR:
          console.error(`${prefix} ${message}${contextStr}`);
          break;
      }
    }
  }

  /**
   * Checks if the message should be logged based on the log level.
   * @param level - The message level to check
   * @returns true if the message should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }
}

// Export singleton instance
export const databaseLogger = new DatabaseLogger();
