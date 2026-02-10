import { OnEvent } from "@nestjs/event-emitter";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { UserCreatedEvent } from "../../domain/events/user-created.event";
import { Injectable, Logger } from "@nestjs/common";
import { RoleAssignedEvent } from "../../domain/events/role-assigned.event";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { EmailTemplateName } from "src/shared/email-keys";
import { JobName } from "src/shared/job-names";
import { formatDate } from "src/shared/utilities/common.util";
import { StaticDocsService } from "src/modules/shared/dms/application/services/static-docs.service";
import { UserDeletedEvent } from "../../domain/events/user-deleted.event";

@Injectable()
export class UserEventsHandler {
  private readonly logger = new Logger(UserEventsHandler.name);

  constructor(
    private readonly corrService: CorrespondenceService,
    private readonly jobProcessingService: JobProcessingService,
    private readonly staticDocs: StaticDocsService

  ) { }

  @OnEvent(UserCreatedEvent.name, { async: true })
  async handleUserCreatedEvent(event: UserCreatedEvent) {
    this.logger.log(`Handling ${UserCreatedEvent.name} event: for user ${event.user.email} `)

    await this.jobProcessingService.addJob(
      JobName.SEND_ONBOARDING_EMAIL,
      {
        fullName: event.user.fullName,
        email: event.user.email,
        password: event.user.password,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
    await this.jobProcessingService.addJob(
      JobName.UPDATE_USER_ROLE,
      {
        userId: event.user.id,
        newRoles: []
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }

  @OnEvent(RoleAssignedEvent.name, { async: true })
  async handleRoleAssignedEvent(event: RoleAssignedEvent) {
    this.logger.log(`Handling ${RoleAssignedEvent.name} event: for user ${event.user.email} `)
    const policyLink = await this.staticDocs.getStaticLink('POLICY_RULES_AND_REGULATIONS');

    const user = event.user;
    if (user.getRoles().length > 0) {
      await this.corrService.sendTemplatedEmail({
        templateName: EmailTemplateName.ROLE_ASSIGNED,
        data: {
          assigneeName: user.fullName,
          roleNames: user.getRoles().map(role => role.roleName).join(', '),
          effectiveDate: user.getRoles().length > 0 ? formatDate(user.getRoles()[0].createdAt) : 'Not Applicable',
          rulesDoc: policyLink?.VALUE
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

  @OnEvent(UserDeletedEvent.name, { async: true })
  async handleUserDeletedEvent(event: UserDeletedEvent) {
    this.logger.warn(`TODO : Send final email to user ${event.user.email} about account deactivation`)

  }

}