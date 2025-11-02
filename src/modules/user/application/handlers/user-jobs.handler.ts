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
import { User } from "../../domain/model/user.model";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class UserJobsHandler {
  private readonly logger = new Logger(UserJobsHandler.name);

  constructor(
    private readonly metadataService: UserMetadataService,
    private readonly auth0UserService: Auth0UserService,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository

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
      this.logger.log(`Processing email job: ${job.id} to ${job.data.name} , ${job.data.email} Password ${job.data.password}`);

      // Simulate email sending

      this.logger.log(`Email sent successfully: ${job.id}`);
      return jobSuccessResponse({ messageId: `email-${job.id}` });
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
  async updateUserRole(job: Job<{userId: string; newRoles: Role[];}>) {
    try {
      const user = await this.userRepo.findById(job.data.userId);
      if (!user) {
        throw new Error(`User with id ${job.data.userId} not found`);
      }
      const defaultRole = await this.metadataService.getDefaultRoles();
      const allRoles = await this.auth0UserService.getRoles();
      const roleRecord: Record<string, string> = Object.fromEntries(
        allRoles.map(role => [role.authRoleCode, role.id])
      );

      const { toAdd, toRemove } = user?.updateRoles(job.data.newRoles, defaultRole);
      const roleIdsToAdd = toAdd?.map(role => roleRecord[role.authRoleCode])!;
      const roleIdsToRemove = toRemove?.map(role => roleRecord[role.authRoleCode])!;

      if (roleIdsToAdd?.length > 0) {
        await this.auth0UserService.assignRolesToUser(user.authUserId!, roleIdsToAdd);
      }

      if (roleIdsToRemove?.length > 0) {
        await this.auth0UserService.removeRolesFromUser(user.authUserId!, roleIdsToRemove!)
      }

      if (roleIdsToAdd?.length > 0 || roleIdsToRemove?.length > 0) {
        await this.userRepo.updateRoles(user?.id!, user.getRoles() as Role[]);
      }

      return jobSuccessResponse({
        userId: user.id,
        authUserId: user.authUserId,
        roleIdsToAdd,
        roleIdsToRemove
      });
    } catch (error) {
      return jobFailureResponse(error);
    }
  }

  
}

