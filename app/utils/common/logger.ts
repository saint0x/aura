import { IS_DEVELOPMENT } from './constants';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const targetLevelIndex = levels.indexOf(level);
    return targetLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    const base = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    const context = entry.context ? `\nContext: ${JSON.stringify(entry.context, null, 2)}` : '';
    const error = entry.error ? `\nError: ${entry.error.stack}` : '';
    return `${base}${context}${error}`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    };
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    if (IS_DEVELOPMENT) {
      console.log(this.formatLogEntry(entry));
    } else {
      // TODO: Implement production logging
      // - Send to logging service (e.g., CloudWatch, Datadog)
      // - Write to log file
      // - Send to monitoring system
    }
  }

  public async debug(message: string, context?: Record<string, any>): Promise<void> {
    if (this.shouldLog(LogLevel.DEBUG)) {
      await this.persistLog(this.createLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  public async info(message: string, context?: Record<string, any>): Promise<void> {
    if (this.shouldLog(LogLevel.INFO)) {
      await this.persistLog(this.createLogEntry(LogLevel.INFO, message, context));
    }
  }

  public async warn(message: string, context?: Record<string, any>): Promise<void> {
    if (this.shouldLog(LogLevel.WARN)) {
      await this.persistLog(this.createLogEntry(LogLevel.WARN, message, context));
    }
  }

  public async error(message: string, error?: Error, context?: Record<string, any>): Promise<void> {
    if (this.shouldLog(LogLevel.ERROR)) {
      await this.persistLog(this.createLogEntry(LogLevel.ERROR, message, context, error));
    }
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Export singleton instance
export const logger = Logger.getInstance(); 