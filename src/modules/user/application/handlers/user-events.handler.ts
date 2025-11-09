import { OnEvent } from "@nestjs/event-emitter";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { UserCreatedEvent } from "../../domain/events/user-created.event";
import { Injectable, Logger } from "@nestjs/common";
import { RoleAssignedEvent } from "../../domain/events/role-assigned.event";
import { EmailTemplateName } from "src/modules/shared/correspondence/dtos/email.dto";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { AssignRoleUseCase } from "../use-cases/assign-role.use-case";
import { JobName } from "src/modules/shared/job-processing/decorators/process-job.decorator";

@Injectable()
export class UserEventsHandler {
  private readonly logger = new Logger(UserEventsHandler.name);

  constructor(
    private readonly corrService: CorrespondenceService,
    private readonly jobProcessingService: JobProcessingService,
  
    ) { }

  @OnEvent(UserCreatedEvent.name, { async: true })
  async handleUserCreatedEvent(event: UserCreatedEvent) {
    this.logger.log(`Handling ${UserCreatedEvent.name} event: for user ${event.user.email} `)
    await this.corrService.sendTemplatedEmail({
      templateName: EmailTemplateName.USER_ONBOARDED,
      data: {
        name: event.user.fullName,
        email: event.user.email,
        password: event.user.password,
      },
      options: {
        recipients: {
          to: event.user.email,
        }
      }
    });
    this.logger.log(`Onboarding Email sent successfully!!`);
    await this.jobProcessingService.addJob(JobName.UPDATE_USER_ROLE, {
      userId: event.user.id,
      newRoles: []
    });
  }

  @OnEvent(RoleAssignedEvent.name, { async: true })
  async handleRoleAssignedEvent(event: RoleAssignedEvent) {
    this.logger.log(`Handling ${RoleAssignedEvent.name} event: for user ${event.user.email} `)
    const user = event.user;
    let emailResult = {};
    if (user.getRoles().length > 0) {
      emailResult = await this.corrService.sendTemplatedEmail({
        templateName: EmailTemplateName.ROLE_ASSIGNED,
        data: {
          assigneeName: user.fullName,
          roleNames: user.getRoles().map(role => role.roleName).join(', '),
          assignedBy: '',
          effectiveDate: user.getRoles()[0].createdAt.toISOString()
        },
        options: {
          recipients: {
            to: user.email,
          }
        }
      })
      this.logger.log(`Role Assigned Email sent successfully!!`);
    }
  }

}