import { Inject, Injectable, Logger } from "@nestjs/common";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { StepStartedEvent } from "../../domain/events/step-started.event";
import { OnEvent } from "@nestjs/event-emitter";
import { JobName } from "src/modules/shared/job-processing/decorators/process-job.decorator";
import { TaskCompletedEvent } from "../../domain/events/task-completed.event";
import { WorkflowCreatedEvent } from "../../domain/events/workflow-created.event";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { WORKFLOW_INSTANCE_REPOSITORY, type IWorkflowInstanceRepository } from "../../domain/repositories/workflow-instance.repository.interface";
import { EmailTemplateName } from "src/shared/email-keys";
import { WorkflowInstance } from "../../domain/model/workflow-instance.model";
import { StepCompletedEvent } from "../../domain/events/step-completed.event";

@Injectable()
export class WorkflowEventsHandler {
  private readonly logger = new Logger(WorkflowEventsHandler.name);

  constructor(
    private readonly jobProcessingService: JobProcessingService,
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowRepository: IWorkflowInstanceRepository,
    private readonly corrService: CorrespondenceService,
  ) { }

  @OnEvent(StepStartedEvent.name, { async: true })
  async handleStepStartedEvent(event: StepStartedEvent) {
    await this.jobProcessingService.addJob<{ instanceId: string; stepId: string }>(JobName.START_WORKFLOW_STEP, {
      instanceId: event.instanceId,
      stepId: event.stepId,
    });
  }

  @OnEvent(StepCompletedEvent.name, { async: true })
  async handleStepCompletedEvent(event: StepCompletedEvent) {
    const workflow = await this.workflowRepository.findById(event.aggregateId);
    if (workflow?.initiatedBy || workflow?.initiatedFor || workflow?.isExternalUser) {
      await this.sendWorkflowUpdateEmail(workflow, 'Request Updated');
    }
  }

  @OnEvent(WorkflowCreatedEvent.name, { async: true })
  async handleWorkflowCreatedEvent(event: WorkflowCreatedEvent) {
    const workflow = await this.workflowRepository.findById(event.aggregateId);
    if (workflow?.initiatedBy || workflow?.initiatedFor || workflow?.isExternalUser) {
      await this.sendWorkflowUpdateEmail(workflow, 'Request Created');
    }
  }

  private async sendWorkflowUpdateEmail(workflow: WorkflowInstance, action: string = 'Request Created') {
    const emailData = await this.corrService.getEmailTemplateData(EmailTemplateName.WORKFLOW_UPDATE, {
      workflow: workflow?.toJson(),
      action,
      currentStepName: workflow?.steps?.find(step => step.stepId === workflow?.currentStepId)?.name ?? ''
    })

    emailData.body.content.table[0].data = workflow?.steps.map(m => [m.name, m.status])

    await this.corrService.sendTemplatedEmail({
      templateData: emailData,
      options: {
        recipients: {
          ...(workflow?.initiatedBy ? { cc: workflow?.initiatedBy?.email } : {}),
          ...(workflow?.isExternalUser ? { to: workflow?.externalUserEmail } : {}),
          ...(workflow?.initiatedFor ? { to: workflow?.initiatedFor?.email } : {}),
        }
      }
    })
  }

}