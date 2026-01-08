import { TriggerMarkDonationAsPendingEvent, TriggerMonthlyDonationEvent, TriggerRemindPendingDonationsEvent } from "src/modules/finance/application/handlers/donation-event.handler";
import { CronJob } from "src/modules/shared/cron/cron-job.model";
import { TriggerRemindPendingTasksEvent } from "src/modules/workflow/application/handlers/workflow-event.handler";

export const CRON_JOBS: CronJob[] = [
    {
        name: 'Trigger Monthly Donations',
        expression: '0 0 1 * *',
        description: 'Trigger monthly donations on 1st day of every month',
        handler: TriggerMonthlyDonationEvent.name,
        enabled: true
    },
    {
        name: 'Trigger Remind Donations',
        expression: '0 9 16-31/2 * *',
        description: 'Trigger remind donations every alternate day between 16th and 31st day of every month',
        handler: TriggerRemindPendingDonationsEvent.name,
        enabled: true
    },
    {
        name: 'Trigger Mark Donations as Pending',
        expression: '0 9 15 * *',
        description: 'Trigger mark donations as pending on 15th day of every month at 9AM',
        handler: TriggerMarkDonationAsPendingEvent.name,
        enabled: true
    },
    {
        name: 'Trigger Remind Pending Tasks',
        expression: '0 9,21 * * *',
        description: 'Trigger remind pending tasks every alternate day between 16th and 31st day of every month',
        handler: TriggerRemindPendingTasksEvent.name,
        enabled: true
    }
]