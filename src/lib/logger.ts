import { NextRequest, NextResponse } from 'next/server';

// Logging levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Logger interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Production-ready logger
 */
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private requestId: string | null = null;

  private constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
    ];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= currentIndex;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      requestId: this.requestId || undefined,
    };

    return entry;
  }

  private writeLog(entry: LogEntry) {
    const logString = JSON.stringify(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
    }
  }

  error(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.formatMessage(LogLevel.ERROR, message, context);
      this.writeLog(entry);
    }
  }

  warn(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.formatMessage(LogLevel.WARN, message, context);
      this.writeLog(entry);
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.formatMessage(LogLevel.INFO, message, context);
      this.writeLog(entry);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.formatMessage(LogLevel.DEBUG, message, context);
      this.writeLog(entry);
    }
  }
}

// Global logger instance
export const logger = Logger.getInstance();

/**
 * Middleware to add request logging
 */
export type APIHandler = (
  request: NextRequest,
  context?: Record<string, unknown>
) => Promise<Response | NextResponse | void> | Response | NextResponse | void;

export function withLogging(handler: APIHandler) {
  return async (
    request: NextRequest,
    context?: Record<string, unknown>
  ): Promise<Response | NextResponse> => {
    const requestId = crypto.randomUUID();
    logger.setRequestId(requestId);

    const startTime = Date.now();
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    logger.info(`Request started: ${request.method} ${request.url}`, {
      method: request.method,
      url: request.url,
      ip: clientIP,
      userAgent,
    });

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      // response might be undefined/void for handlers that write directly; handle safely
      const status =
        (response as Response | NextResponse | undefined)?.status ?? 200;

      logger.info(`Request completed: ${request.method} ${request.url}`, {
        status,
        duration: `${duration}ms`,
      });

      return (
        (response as Response | NextResponse) ??
        NextResponse.json({}, { status })
      );
    } catch (err) {
      const duration = Date.now() - startTime;
      const error = err as unknown;

      logger.error(`Request failed: ${request.method} ${request.url}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${duration}ms`,
        ip: clientIP,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Error boundary for API routes
 */
export function withErrorHandler(handler: APIHandler) {
  return async (
    request: NextRequest,
    context?: Record<string, unknown>
  ): Promise<Response | NextResponse> => {
    try {
      return (await handler(request, context)) as Response | NextResponse;
    } catch (err) {
      const error = err as unknown;
      logger.error('Unhandled error in API route', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: request.url,
        method: request.method,
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Database error handler
 */
export function handleDatabaseError(error: unknown, operation: string): never {
  const err = error as
    | { message?: string; code?: string; errno?: number }
    | undefined;

  logger.error(`Database error during ${operation}`, {
    error: err?.message ?? String(error),
    code: err?.code,
    errno: err?.errno,
  });

  throw new Error(`Database operation failed: ${operation}`);
}

/**
 * Validation error handler
 */
export function handleValidationError(
  errors: unknown[],
  context: string
): { error: string; details: unknown[] } {
  logger.warn(`Validation errors in ${context}`, { errors });

  return {
    error: 'Validation failed',
    details: errors,
  };
}
