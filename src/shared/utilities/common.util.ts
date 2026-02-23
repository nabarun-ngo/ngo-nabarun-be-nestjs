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

