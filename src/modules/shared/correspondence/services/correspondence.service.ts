import { Injectable, Logger } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { EmailTemplateName, SendEmailRequest, SendEmailResult, SendNotificationRequest } from '../dtos/email.dto';
import { RemoteConfigService } from '../../firebase/remote-config/remote-config.service';
import { loadTemplate, renderJsonTemplateFromString } from '../utilities/email-template.utility';
import { EmailTemplateData } from '../dtos/email-template.dto';

import { ConfigService } from '@nestjs/config';
import { Configkey } from 'src/shared/config-keys';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';




@Injectable()
export class CorrespondenceService {
  private readonly logger = new Logger(CorrespondenceService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly gmailService: GmailService,
    private readonly rcService: RemoteConfigService,
    private readonly httpService: HttpService,
  ) { }

  /**
   * Send an email using Gmail API
   * Automatically uses the authenticated Gmail account for the user
   */
  async sendTemplatedEmail(request: SendEmailRequest): Promise<SendEmailResult> {
    const from = request.fromName ?? this.configService.get<string>(Configkey.APP_NAME)!;
    const data = request.templateData ?? await this.getEmailTemplateData(request.templateName!, request.data!);
    const html = await this.buildEmailHtml(data);
    const isProdMode = this.configService.get<string | boolean>(Configkey.ENABLE_PROD_MODE);
    const isMockingEnabled = this.configService.get<string | boolean>(Configkey.ENABLE_EMAIL_MOCKING);
    if (isProdMode === 'true' || isProdMode === true) {
      return await this.gmailService.sendEmail(html, {
        ...request.options,
        subject: request.options.subject ?? data.subject
      }, from);
    } else if (isMockingEnabled === 'true' || isMockingEnabled === true) {
      const mockedEmail = this.configService.get<string>(Configkey.MOCKED_EMAIL_ADDRESS);
      this.logger.log(`Sending mocked email to ${mockedEmail}`)
      return await this.gmailService.sendEmail(html, {
        ...request.options,
        subject: request.options.subject ?? data.subject,
        recipients: { to: mockedEmail }
      }, from);
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


  async sendSlackAlert(message: string, type: string = 'error') {
    this.logger.log(`Sending slack notification`);
    try {
      const webhookUrl = this.configService.get<string>(Configkey.SLACK_WEBHOOK_URL);
      if (!webhookUrl) {
        return { success: false, error: 'Slack webhook URL not configured' };
      }
      const response$ = this.httpService.post(webhookUrl, {
        text: `
        <!channel> 🚨 *${type} Notification*
        *Environment:* \`${this.configService.get<string>(Configkey.NODE_ENV)}\`
        *Type:* *${type}*
        *Message:*
        ${message}
        `
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const response = await firstValueFrom(response$)
      this.logger.log(`Slack notification sent successfully`);
      return {
        success: true,
        response: response,
      };
    }
    catch (error) {
      this.logger.error(`Failed to send slack notification: ${error}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

