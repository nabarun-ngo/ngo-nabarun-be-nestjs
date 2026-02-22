export interface CronExecutionLog {
    jobName: string;
    executedAt: Date;
    duration: number;
    trigger: 'AUTOMATIC' | 'MANUAL';
    status: 'SUCCESS' | 'FAILED' | 'TRIGGERED';
    error?: string;
    result?: any;

}

export interface CronJob {
    name: string;
    expression: string; // simplified cron: "*/30 * * * *"
    description: string;
    handler: string; // method name in service
    enabled: boolean
    inputData?: any;
}