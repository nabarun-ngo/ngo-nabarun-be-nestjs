import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { ProcessJob } from "src/modules/shared/job-processing/decorators/process-job.decorator";
import { JobResult } from "src/modules/shared/job-processing/interfaces/job.interface";
import { User } from "../../domain/model/user.model";

@Injectable()
export class UserJobsHandler {
  private readonly logger = new Logger(UserJobsHandler.name);

  @ProcessJob({
    name: 'send-onboarding-email',
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
  async sendOnboardingEmail(job: Job<{
    name: string,
    email: string,
    password: string,
  }>): Promise<JobResult> {
    try {

      this.logger.log(`Processing email job: ${job.id} to ${job.data.name} , ${job.data.email} Password ${job.data.password}`);

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