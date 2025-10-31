import { Injectable, Logger } from '@nestjs/common';
import { ProcessJob } from '../decorators/process-job.decorator';
import { JobResult } from '../interfaces/job.interface';
import type { Job } from '../interfaces/job.interface';

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  template?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

@Injectable()
export class EmailJobProcessor {
  private readonly logger = new Logger(EmailJobProcessor.name);

  @ProcessJob({
    name: 'send-email',
    concurrency: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
  async processEmailJob(job: Job<EmailJobData>): Promise<JobResult> {
    try {
      this.logger.log(`Processing email job: ${job.id} to ${job.data.to}`);
      
      // Simulate email sending
      await this.sendEmail(job.data);
      
      this.logger.log(`Email sent successfully: ${job.id}`);
      
      return {
        success: true,
        data: { messageId: `email-${job.id}` },
        metadata: {
          recipient: job.data.to,
          subject: job.data.subject,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${job.id}`, error);
      return {
        success: false,
        error: error.message,
        metadata: {
          recipient: job.data.to,
          failedAt: new Date().toISOString(),
        },
      };
    }
  }


  private async sendEmail(data: EmailJobData): Promise<void> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, you would integrate with an email service
    // like SendGrid, AWS SES, or Nodemailer
    this.logger.log(`Email sent to ${data.to}: ${data.subject}`);
  }
}
