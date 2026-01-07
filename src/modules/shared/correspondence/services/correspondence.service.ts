import { Injectable, Logger } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { SendEmailRequest, SendEmailResult } from '../dtos/email.dto';
import { RemoteConfigService } from '../../firebase/remote-config/remote-config.service';
import { loadTemplate, renderJsonTemplateFromString } from '../utilities/email-template.utility';
import { EmailTemplateData } from '../dtos/email-template.dto';

import { ConfigService } from '@nestjs/config';
import { Configkey } from 'src/shared/config-keys';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SendEmailDto } from '../dtos/correspondence.dto';
import { EmailTemplateName } from 'src/shared/email-keys';




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
    const from =
      request.fromName ??
      this.configService.get<string>(Configkey.APP_NAME)!;

    const data =
      request.templateData ??
      await this.getEmailTemplateData(
        request.templateName!,
        request.data!
      );

    const html = await this.buildEmailHtml(data);

    return this.sendInternalEmail({
      html,
      subject: request.options.subject ?? data.subject ?? '',
      to: request.options.recipients?.to!,
      cc: request.options.recipients?.cc,
      bcc: request.options.recipients?.bcc,
      from
    });
  }

  async sendEmail(request: SendEmailDto): Promise<SendEmailResult> {
    return this.sendInternalEmail({
      html: request.html,
      subject: request.subject,
      to: request.to,
      cc: request.cc,
      bcc: request.bcc,
      from: request.from
    });
  }

  async getEmailTemplateData(templateName: EmailTemplateName, data: Record<string, any>): Promise<EmailTemplateData> {
    const configStr = (await this.rcService.getAllKeyValues())[templateName].value;
    return renderJsonTemplateFromString<EmailTemplateData>(configStr, data);
  }

  async sendSlackAlert(
    message: string,
    type: 'error' | 'warning' | 'info' = 'error'
  ): Promise<{ success: boolean; response?: any; error?: string }> {

    this.logger.log('Sending Slack notification');

    try {
      const webhookUrl = this.configService.get<string>(
        Configkey.SLACK_WEBHOOK_URL
      );

      if (!webhookUrl) {
        return { success: false, error: 'Slack webhook URL not configured' };
      }

      const env = this.configService.get<string>(Configkey.NODE_ENV) ?? 'unknown';

      const mention =
        env === 'production' ? '<!here>' : ''; // avoid noise in dev

      const payload = {
        text: `
        ${mention} 🚨 *${type.toUpperCase()} ALERT*

        *Environment:* \`${env}\`
        *Type:* *${type}*

        *Message:*
        >${message.replace(/\n/g, '\n>')}`
      };

      const response = await firstValueFrom(
        this.httpService.post(webhookUrl, payload, {
          headers: { 'Content-Type': 'application/json' }
        })
      );

      this.logger.log('Slack notification sent successfully');

      return { success: true, response };

    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.message ||
        'Unknown error';

      this.logger.error(
        `Failed to send Slack notification: ${errorMessage}`
      );

      return { success: false, error: errorMessage };
    }
  }


  /**
   * PRIVATE METHODS 
   */

  private async buildEmailHtml(templateData: EmailTemplateData) {
    const template = loadTemplate('email');
    return template(templateData);
  }

  private isTrue(value?: string | boolean): boolean {
    return value === true || value === 'true';
  }
  private resolveRecipients(to?: string | string[], cc?: string | string[], bcc?: string | string[]): {
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
  } {
    const isProdEnv = this.configService.get(Configkey.ENVIRONMENT) == 'prod';

    const isProdMode = this.isTrue(
      this.configService.get(Configkey.ENABLE_PROD_MODE)
    );

    if (isProdEnv || isProdMode) {
      return { to, cc, bcc };
    }

    const isMockingEnabled = this.isTrue(
      this.configService.get(Configkey.ENABLE_EMAIL_MOCKING)
    );

    if (!isMockingEnabled) {
      throw new Error('Email mocking is not enabled');
    }

    const mockedEmail = this.configService.get<string>(
      Configkey.MOCKED_EMAIL_ADDRESS
    );

    this.logger.warn(`📧 Mocking email. Redirecting to ${mockedEmail}`);

    return { to: mockedEmail! };
  }

  private async sendInternalEmail(params: {
    html: string;
    subject: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    from?: string;
  }): Promise<SendEmailResult> {
    const from =
      params.from ??
      this.configService.get<string>(Configkey.APP_NAME)!;

    const recipients = this.resolveRecipients(params.to, params.cc, params.bcc);

    return this.gmailService.sendEmail(
      params.html,
      {
        subject: params.subject,
        recipients
      },
      from
    );
  }





}

