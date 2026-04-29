export enum JobName {
    SEND_ONBOARDING_EMAIL = 'send-onboarding-email',
    UPDATE_USER_ROLE = 'update-user-role',
    CREATE_DONATION = "CREATE_DONATION",

    // Cron Triggered Events
    TriggerMonthlyDonationEvent = "TriggerMonthlyDonationEvent",
    TriggerMarkDonationAsPendingEvent = "TriggerMarkDonationAsPendingEvent",
    TriggerRemindPendingDonationsEvent = "TriggerRemindPendingDonationsEvent",
    TriggerRemindPendingTasksEvent = "TriggerRemindPendingTasksEvent",
    TriggerDeleteNotificationRequestEvent = "TriggerDeleteNotificationRequestEvent",
    TriggerDeleteFCMTokenRequestEvent = "TriggerDeleteFCMTokenRequestEvent",
    TriggerAutoCloseWorkflowTasksEvent = "TriggerAutoCloseWorkflowTasksEvent",
    TriggerWorkflowRequestEvent = "TriggerWorkflowRequestEvent",

    // Integrations
    PROCESS_FATHOM_MEETING_WEBHOOK = "PROCESS_FATHOM_MEETING_WEBHOOK",
    //GENERATE_REPORT = "GENERATE_REPORT",
    //TriggerDonationSummaryReportEvent = "TriggerDonationSummaryReportEvent",
}