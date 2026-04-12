import { Parser } from 'expr-eval';
import { DateTime } from 'luxon';

export function formatDate(date: Date | string, options?: {
    timezone?: string;
    format?: string
}): string {
    const dt = typeof date === 'string'
        ? DateTime.fromISO(date)
        : DateTime.fromJSDate(date);

    return dt
        .setZone(options?.timezone || 'Asia/Kolkata')
        .toFormat(options?.format || 'dd/MM/yyyy');
};

export function evaluateCondition(expression: string, context: unknown) {
    try {
        const parser = new Parser();
        const result = parser.evaluate(
            expression,
            context as never
        );
        return !!result;;
    } catch (error) {
        throw new Error(`Error evaluating condition "${expression}": ${error.message}`, error);
    }
}