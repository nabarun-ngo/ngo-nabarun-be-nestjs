import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { ProcessJob } from "src/modules/shared/job-processing/decorators/process-job.decorator";
import { JobResult } from "src/modules/shared/job-processing/interfaces/job.interface";

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
  async processEmailJob(job: Job<{ userId: string, email: string }>): Promise<JobResult> {
    try {
      this.logger.log(`Processing email job: ${job.id} to ${job.data.userId} , ${job.data.email}`);
      
      // Simulate email sending
      
      this.logger.log(`Email sent successfully: ${job.id}`);
      
      return {
        success: true,
        data: { messageId: `email-${job.id}` },
        metadata: {
          recipient: job.data.email,
          subject: job.data.email,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${job.id}`, error);
      return {
        success: false,
        error: error.message,
        metadata: {
          failedAt: new Date().toISOString(),
        },
      };
    }
  }
}