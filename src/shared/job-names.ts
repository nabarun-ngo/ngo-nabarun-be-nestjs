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
}