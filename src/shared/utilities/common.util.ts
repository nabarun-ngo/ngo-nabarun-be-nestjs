import { JobResult } from "src/modules/shared/job-processing/interfaces/job.interface";
import moment from 'moment';

export function jobSuccessResponse1(data?: any): JobResult {
    return {
        success: true,
        data: data,
        metadata: {
            successAt: new Date().toISOString(),
        },
    };
}

export function jobFailureResponse2(error: Error, data?: any): JobResult {
    return {
        success: false,
        error: {
            message: error.message,
            stack: error.stack,
        },
        data: data,
        metadata: {
            failedAt: new Date().toISOString(),
        },
    };
}

export function formatDate(date: Date, format?: string): string {
    return moment(date).format(format || 'DD/MM/YYYY');
}