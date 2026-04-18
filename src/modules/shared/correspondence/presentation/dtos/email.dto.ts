import { EmailTemplateName } from "src/shared/email-keys";
import { EmailTemplateData } from "./email-template.dto";

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
    fromName?: string;
    templateData?: EmailTemplateData;
    templateName?: EmailTemplateName;
    data?: Record<string, any>
}

export interface SendNotificationRequest {
    userId: string;
    type: 'email' | 'sms' | 'push' | 'slack';
    to: string;
    subject: string;
    message: string;
    html?: string;
}

export class SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}