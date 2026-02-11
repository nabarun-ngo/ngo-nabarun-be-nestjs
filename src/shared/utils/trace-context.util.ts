import { AsyncLocalStorage } from 'async_hooks';
import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { generateUniqueNDigitNumber } from '../utilities/password-util';

export interface UserContext {
    userId: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface TraceContext {
    traceId: string;
    user?: UserContext;
}

export const traceStorage = new AsyncLocalStorage<TraceContext>();

export function getTraceId(): string | undefined {
    return traceStorage.getStore()?.traceId;
}

export function getUserContext(): UserContext | undefined {
    return traceStorage.getStore()?.user;
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

        let formattedMessage = message;

        if (typeof message === 'object' && message !== null) {
            // If the message is an object (likely an error), prefer its message property
            // This fixes issues where internal NestJS errors are logged as unreadable JSON
            if ('message' in message && typeof (message as any).message === 'string') {
                formattedMessage = (message as any).message;
            } else {
                formattedMessage = JSON.stringify(message);
            }
        }

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

        let formattedMessage = message;

        if (typeof message === 'object' && message !== null) {
            if ('message' in message && typeof (message as any).message === 'string') {
                formattedMessage = (message as any).message;
            } else {
                formattedMessage = JSON.stringify(message);
            }
        }

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
