import { EmailTemplateData } from "./email-template.dto";

export enum EmailTemplateName {
    TASK_ASSIGNED = 'TASK_ASSIGNED',
    TASK_UPDATED = 'TASK_UPDATED',
    USER_ONBOARDED = 'USER_ONBOARDED',
    ROLE_ASSIGNED = 'ROLE_ASSIGNED',
}

export interface EmailOptions {
    recipients: {
        to?: string | string[];
        cc?: string | string[];
        bcc?: string | string[];
    }
    replyTo?: string;
    subject?: string;

    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}

export interface SendEmailRequest {
    options: EmailOptions;
    fromEmail?: string;
    templateData?: EmailTemplateData;
    templateName?: EmailTemplateName;
    data?: Record<string, any>
}

export interface SendNotificationRequest {
    userId: string;
    type: 'email' | 'sms' | 'push';
    to: string;
    subject: string;
    message: string;
    html?: string;
}

export interface SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}