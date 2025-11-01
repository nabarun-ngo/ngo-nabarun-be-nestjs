import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GmailService, EmailOptions } from './gmail.service';

export interface SendEmailRequest extends EmailOptions {
  userId: string;
  fromEmail: string;
}

export interface SendNotificationRequest {
  userId: string;
  type: 'email' | 'sms' | 'push';
  to: string;
  subject: string;
  message: string;
  html?: string;
}

@Injectable()
export class CorrespondenceService {
  private readonly logger = new Logger(CorrespondenceService.name);

  constructor(
    private readonly gmailService: GmailService,
  ) {}

  /**
   * Send an email using Gmail API
   * Automatically uses the authenticated Gmail account for the user
   */
  async sendEmail(request: SendEmailRequest): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Verify user exists and has OAuth token
   
      // Send email via Gmail service
      return await this.gmailService.sendEmail(
        request.userId,
        request.fromEmail,
        {
          to: request.to,
          subject: request.subject,
          text: request.text,
          html: request.html,
          cc: request.cc,
          bcc: request.bcc,
          attachments: request.attachments,
          replyTo: request.replyTo,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send a notification (email, SMS, or push)
   */
  async sendNotification(
    request: SendNotificationRequest,
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    switch (request.type) {
      case 'email':
      

        return await this.sendEmail({
          userId: request.userId,
          fromEmail: '',
          to: request.to,
          subject: request.subject,
          text: request.message,
          html: request.html,
        });

      case 'sms':
        // TODO: Implement SMS sending
        this.logger.warn('SMS notification not implemented yet');
        return {
          success: false,
          error: 'SMS notifications not implemented',
        };

      case 'push':
        // TODO: Implement push notification sending
        this.logger.warn('Push notification not implemented yet');
        return {
          success: false,
          error: 'Push notifications not implemented',
        };

      default:
        return {
          success: false,
          error: `Unsupported notification type: ${request.type}`,
        };
    }
  }

}

