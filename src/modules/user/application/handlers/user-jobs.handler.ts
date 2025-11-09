import { Inject, Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { ProcessJob } from "src/modules/shared/job-processing/decorators/process-job.decorator";
import { JobResult } from "src/modules/shared/job-processing/interfaces/job.interface";
import { UserMetadataService } from "../../infrastructure/external/user-metadata.service";
import { jobFailureResponse, jobSuccessResponse } from "src/shared/utilities/common.util";
import { Auth0UserService } from "../../infrastructure/external/auth0-user.service";
import { USER_REPOSITORY } from "../../domain/repositories/user.repository.interface";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { Role } from "../../domain/model/role.model";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { EmailTemplateName, SendEmailResult } from "src/modules/shared/correspondence/dtos/email.dto";
import { AssignRoleUseCase } from "../use-cases/assign-role.use-case";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class UserJobsHandler {
  private readonly logger = new Logger(UserJobsHandler.name);

  constructor(
    private readonly assignRoleUseCase: AssignRoleUseCase,
    private readonly corrService: CorrespondenceService

  ) { }

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
      this.logger.log(`Processing email job: ${job.id}`);
      const result = await this.corrService.sendTemplatedEmail({
        templateName: EmailTemplateName.USER_ONBOARDED,
        data: {
          name: job.data.name,
          email: job.data.email,
          password: job.data.password,
        },
        options: {
          recipients: {
            to: job.data.email,
          }
        }
      });
      this.logger.log(`Email sent successfully: ${job.id}`);
      return jobSuccessResponse({ messageId: `email-${job.id}`, result });
    } catch (error) {
      this.logger.error(`Failed to send email: ${job.id}`, error);
      return jobFailureResponse(error);
    }
  }

  @ProcessJob({
    name: 'update-user-role',
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
  async updateUserRole(job: Job<{ userId: string; newRoles: Role[]; }>) {
    try {
      


      return jobSuccessResponse();
    } catch (error) {
      return jobFailureResponse(error);
    }
  }


}

