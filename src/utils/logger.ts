/**
 * Structured JSON logger for production observability.
 *
 * Every log line is a single JSON object written to stdout so it can be
 * ingested by CloudWatch or any log aggregator without extra parsing.
 *
 * Fields always present: timestamp, level, message.
 * Contextual fields (requestId, memberId, partnerId, durationMs) are included
 * when available so logs are searchable during incidents.
 */

import { config } from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

interface LogContext {
  requestId?: string;
  memberId?: string;
  partnerId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

class Logger {
  private minLevel: number;

  constructor(level: string) {
    this.minLevel = LOG_LEVEL_PRIORITY[level as LogLevel] ?? LOG_LEVEL_PRIORITY.info;
  }

  /** Log at DEBUG level — verbose detail for development only. */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /** Log at INFO level — normal operational events. */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /** Log at WARN level — unexpected but recoverable situations. */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /** Log at ERROR level — failures requiring attention. */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (LOG_LEVEL_PRIORITY[level] < this.minLevel) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    const line = JSON.stringify(entry);

    if (level === 'error') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  }
}

export const logger = new Logger(config.logLevel);
