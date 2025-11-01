import { Injectable, Logger } from '@nestjs/common';
import { GoogleOAuthService } from '../../auth/application/services/google-oauth.service';
import { gmail as googleMail } from '@googleapis/gmail';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  constructor(private readonly googleOAuthService: GoogleOAuthService) { }

  /**
   * Send an email using Gmail API
   */
  async sendEmail(
    userId: string,
    fromEmail: string,
    options: EmailOptions,
  ): Promise<SendEmailResult> {
    try {
      const oauth2Client =
        await this.googleOAuthService.getAuthenticatedClient(userId, fromEmail);

      const gmail = googleMail({ version: 'v1', auth: oauth2Client });

      // Build email message
      const message = this.buildEmailMessage(fromEmail, options);

      // Send email
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      const messageId = response.data.id;

      this.logger.log(
        `Email sent successfully. Message ID: ${messageId}, To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
      );

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Build RFC 2822 email message
   */
  private buildEmailMessage(fromEmail: string, options: EmailOptions): string {
    const lines: string[] = [];

    // Headers
    lines.push(`From: ${fromEmail}`);
    lines.push(`To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);

    if (options.cc) {
      lines.push(
        `Cc: ${Array.isArray(options.cc) ? options.cc.join(', ') : options.cc}`,
      );
    }

    if (options.bcc) {
      lines.push(
        `Bcc: ${Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc}`,
      );
    }

    if (options.replyTo) {
      lines.push(`Reply-To: ${options.replyTo}`);
    }

    lines.push(`Subject: ${options.subject}`);
    lines.push(`Date: ${new Date().toUTCString()}`);

    // MIME version
    lines.push('MIME-Version: 1.0');

    // Determine content type and build message body
    if (options.html && options.attachments && options.attachments.length > 0) {
      // Multipart message with HTML and attachments
      const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      lines.push('');
      lines.push(`--${boundary}`);

      // HTML part
      lines.push('Content-Type: multipart/alternative; boundary="alt"');
      lines.push('');
      lines.push('--alt');
      if (options.text) {
        lines.push('Content-Type: text/plain; charset=utf-8');
        lines.push('');
        lines.push(options.text);
        lines.push('--alt');
      }
      lines.push('Content-Type: text/html; charset=utf-8');
      lines.push('');
      lines.push(options.html);
      lines.push('--alt--');

      // Attachments
      for (const attachment of options.attachments) {
        lines.push(`--${boundary}`);
        lines.push(
          `Content-Type: ${attachment.contentType || 'application/octet-stream'}`,
        );
        lines.push('Content-Disposition: attachment');
        lines.push(
          `Content-Transfer-Encoding: base64`,
        );
        lines.push('');
        const content =
          typeof attachment.content === 'string'
            ? attachment.content
            : attachment.content.toString('base64');
        // Split base64 into 76 character lines (RFC 2045)
        const base64Lines = content.match(/.{1,76}/g) || [];
        lines.push(...base64Lines);
      }
      lines.push(`--${boundary}--`);
    } else if (options.html) {
      // HTML only
      if (options.text) {
        // Both HTML and text - use multipart/alternative
        const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
        lines.push('');
        lines.push(`--${boundary}`);
        lines.push('Content-Type: text/plain; charset=utf-8');
        lines.push('');
        lines.push(options.text);
        lines.push(`--${boundary}`);
        lines.push('Content-Type: text/html; charset=utf-8');
        lines.push('');
        lines.push(options.html);
        lines.push(`--${boundary}--`);
      } else {
        // HTML only
        lines.push('Content-Type: text/html; charset=utf-8');
        lines.push('');
        lines.push(options.html);
      }
    } else if (options.text) {
      // Text only
      lines.push('Content-Type: text/plain; charset=utf-8');
      lines.push('');
      lines.push(options.text);
    } else {
      throw new Error('Either text or html content must be provided');
    }

    const message = lines.join('\r\n');

    // Encode to base64url (RFC 4648)
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Send a simple text email
   */
  async sendTextEmail(
    userId: string,
    fromEmail: string,
    to: string | string[],
    subject: string,
    text: string,
  ): Promise<SendEmailResult> {
    return this.sendEmail(userId, fromEmail, {
      to,
      subject,
      text,
    });
  }

  /**
   * Send an HTML email
   */
  async sendHtmlEmail(
    userId: string,
    fromEmail: string,
    to: string | string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<SendEmailResult> {
    return this.sendEmail(userId, fromEmail, {
      to,
      subject,
      html,
      text,
    });
  }
}

