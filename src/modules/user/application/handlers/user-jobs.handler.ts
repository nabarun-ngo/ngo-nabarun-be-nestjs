import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { JobName, ProcessJob } from "src/modules/shared/job-processing/decorators/process-job.decorator";
import { Role } from "../../domain/model/role.model";
import { AssignRoleUseCase } from "../use-cases/assign-role.use-case";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { EmailTemplateName } from "src/modules/shared/correspondence/dtos/email.dto";
import { Logger } from "@nestjs/common";

@Injectable()
export class UserJobsHandler {
  private readonly logger = new Logger(UserJobsHandler.name);

  constructor(
    private readonly assignRoleUseCase: AssignRoleUseCase,
    private readonly corrService: CorrespondenceService,

  ) { }


  @ProcessJob({
    name: JobName.UPDATE_USER_ROLE
  })
  async updateUserRole(job: Job<{ userId: string; newRoles: Role[]; }>) {
    await this.assignRoleUseCase.execute({
      userId: job.data.userId,
      newRoles: []
    });
  }


  @ProcessJob({
    name: JobName.SEND_ONBOARDING_EMAIL
  })
  async sendOnboardingEmail(job: Job<{ fullName: string; email: string; password: string; }>) {
    await this.corrService.sendTemplatedEmail({
      templateName: EmailTemplateName.USER_ONBOARDED,
      data: {
        name: job.data.fullName,
        email: job.data.email,
        password: job.data.password,
      },
      options: {
        recipients: {
          to: job.data.email,
        }
      }
    });
    this.logger.log(`Onboarding Email sent successfully!!`);
  }



}

