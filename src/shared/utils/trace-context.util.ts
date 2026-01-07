import { AsyncLocalStorage } from 'async_hooks';
import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { generateUniqueNDigitNumber } from '../utilities/password-util';

export interface TraceContext {
    traceId: string;
}

export const traceStorage = new AsyncLocalStorage<TraceContext>();

/**
 * Gets the current trace ID from the async storage context.
 * Returns undefined if no context is found.
 */
export function getTraceId(): string | undefined {
    return traceStorage.getStore()?.traceId;
}

/**
 * Generates or retrieves a trace ID from the request headers.
 */
export function resolveTraceId(headers: Record<string, any>): string {
    return (
        headers['x-request-id'] ||
        headers['x-trace-id'] ||
        `trace-${generateUniqueNDigitNumber(6)}`
    );
}

/**
 * A custom logger that automatically adds the trace ID to all log messages.
 */
export class AppLogger extends ConsoleLogger {

    constructor(logLevel: LogLevel) {
        super({
            logLevels: [logLevel],
            timestamp: true,
        });
    }
    protected override formatMessage(
        logLevel: any,
        message: unknown,
        context: string,
        stack?: string,
        ms?: string,
        timestamp?: string,
    ): string {
        const traceId = getTraceId();
        const tracePrefix = traceId ? `[${traceId}] ` : '';
        const formattedMessage = typeof message === 'object'
            ? JSON.stringify(message)
            : message;

        return super.formatMessage(
            logLevel,
            `${tracePrefix}${formattedMessage}`,
            context,
            stack as any,
            ms as any,
            timestamp as any,
        );
    }
}

export class CronLogger extends ConsoleLogger {
    constructor(context: string) {
        super(context, {
            logLevels: ['log', 'error', 'warn'],
            timestamp: true,
        });
    }

    protected override formatMessage(
        logLevel: any,
        message: unknown,
        context: string,
        stack?: string,
        ms?: string,
        timestamp?: string,
    ): string {
        const traceId = getTraceId();
        const tracePrefix = traceId ? `[${traceId}] ` : '';
        const formattedMessage = typeof message === 'object'
            ? JSON.stringify(message)
            : message;

        return super.formatMessage(
            logLevel,
            `${tracePrefix}${formattedMessage}`,
            context,
            stack as any,
            ms as any,
            timestamp as any,
        );
    }
}
