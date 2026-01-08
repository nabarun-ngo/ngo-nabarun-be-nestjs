export interface CronJobDto {
    name: string;
    description: string;
    handler: string; // method name in service
    enabled: boolean,
    nextRun: Date
}