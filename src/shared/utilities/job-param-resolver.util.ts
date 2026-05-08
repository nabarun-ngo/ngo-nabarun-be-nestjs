import { DateTime } from 'luxon';

export enum JobParamPlaceholder {
    LAST_MONTH_FIRST_DAY = 'LAST_MONTH_FIRST_DAY',
    PREV_MONTH_FIRST_DAY = 'PREV_MONTH_FIRST_DAY',
    LAST_MONTH_LAST_DAY = 'LAST_MONTH_LAST_DAY',
    PREV_MONTH_LAST_DAY = 'PREV_MONTH_LAST_DAY',
    CURRENT_MONTH_FIRST_DAY = 'CURRENT_MONTH_FIRST_DAY',
    CURRENT_MONTH_LAST_DAY = 'CURRENT_MONTH_LAST_DAY',
    TODAY = 'TODAY',
    YESTERDAY = 'YESTERDAY'
}

/**
 * Resolves special placeholders in job parameters into actual values (e.g. dynamic dates).
 * @param params The original parameters object
 * @returns A new object with placeholders resolved
 */
export function resolveJobParams(params: any): any {
    if (!params || typeof params !== 'object') return params;
    
    const resolved = { ...params };
    const now = DateTime.now().setZone('Asia/Kolkata');

    for (const [key, value] of Object.entries(resolved)) {
        if (typeof value === 'string') {
            switch (value) {
                case JobParamPlaceholder.LAST_MONTH_FIRST_DAY:
                case JobParamPlaceholder.PREV_MONTH_FIRST_DAY:
                    resolved[key] = now.minus({ months: 1 }).startOf('month').toJSDate();
                    break;
                case JobParamPlaceholder.LAST_MONTH_LAST_DAY:
                case JobParamPlaceholder.PREV_MONTH_LAST_DAY:
                    resolved[key] = now.minus({ months: 1 }).endOf('month').toJSDate();
                    break;
                case JobParamPlaceholder.CURRENT_MONTH_FIRST_DAY:
                    resolved[key] = now.startOf('month').toJSDate();
                    break;
                case JobParamPlaceholder.CURRENT_MONTH_LAST_DAY:
                    resolved[key] = now.endOf('month').toJSDate();
                    break;
                case JobParamPlaceholder.TODAY:
                    resolved[key] = now.startOf('day').toJSDate();
                    break;
                case JobParamPlaceholder.YESTERDAY:
                    resolved[key] = now.minus({ days: 1 }).startOf('day').toJSDate();
                    break;
            }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively resolve nested objects
            resolved[key] = resolveJobParams(value);
        }
    }
    return resolved;
}
