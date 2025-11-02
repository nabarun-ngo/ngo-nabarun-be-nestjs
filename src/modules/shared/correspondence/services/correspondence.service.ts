import { Injectable, Logger } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { EmailTemplateName, SendEmailRequest, SendEmailResult, SendNotificationRequest } from '../dtos/email.dto';
import { RemoteConfigService } from '../../firebase/remote-config/remote-config.service';
import { loadTemplate, renderJsonTemplateFromString } from '../utilities/email-template.utility';
import { EmailTemplateData } from '../dtos/email-template.dto';

import { ConfigService } from '@nestjs/config';
import { Configkey } from 'src/shared/config-keys';



@Injectable()
export class CorrespondenceService {
  private readonly logger = new Logger(CorrespondenceService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly gmailService: GmailService,
    private readonly rcService: RemoteConfigService,
  ) { }

  /**
   * Send an email using Gmail API
   * Automatically uses the authenticated Gmail account for the user
   */
  async sendTemplatedEmail(request: SendEmailRequest): Promise<SendEmailResult> {

    const data = request.templateData ?? await this.getEmailTemplateData(request.templateName!, request.data!);
    const html = await this.buildEmailHtml(data);
    const isProdMode = this.configService.get<string | boolean>(Configkey.ENABLE_PROD_MODE);
    const isMockingEnabled = this.configService.get<string | boolean>(Configkey.ENABLE_EMAIL_MOCKING);
    if (isProdMode === 'true' || isProdMode === true) {
      return await this.gmailService.sendEmail(html, {
        ...request.options,
        subject: request.options.subject ?? data.subject
      }, request.fromEmail!);
    } else if (isMockingEnabled === 'true' || isMockingEnabled === true) {
      const mockedEmail = this.configService.get<string>(Configkey.MOCKED_EMAIL_ADDRESS);
      this.logger.log(`Sending mocked email to ${mockedEmail}`)
      return await this.gmailService.sendEmail(html, {
        ...request.options,
        subject: request.options.subject ?? data.subject,
        recipients: { to: mockedEmail}
      }, request.fromEmail!);
    } else {
      return Promise.resolve({
        success: false,
        error: 'Email mocking is not enabled'
      })
    }

  }
  private async buildEmailHtml(templateData: EmailTemplateData) {
    const template = loadTemplate('email');
    return template(templateData);
  }

  async getEmailTemplateData(templateName: EmailTemplateName, data: Record<string, any>): Promise<EmailTemplateData> {
    const configStr = (await this.rcService.getAllKeyValues())[templateName].value;
    return renderJsonTemplateFromString<EmailTemplateData>(configStr, data);
  }

  /**
   * Send a notification (email, SMS, or push)
   */
  async sendNotification(
    request: SendNotificationRequest,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    switch (request.type) {
      case 'email':
        return {
          success: false,
          error: 'Email notifications not implemented',
        };
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

