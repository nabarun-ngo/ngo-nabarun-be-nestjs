import { Injectable } from "@nestjs/common";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { StepStartedEvent } from "../../domain/events/step-started.event";
import { OnEvent } from "@nestjs/event-emitter";
import { JobName } from "src/modules/shared/job-processing/decorators/process-job.decorator";
import { TaskCompletedEvent } from "../../domain/events/task-completed.event";

@Injectable()
export class WorkflowEventsHandler {

  constructor(private readonly jobProcessingService: JobProcessingService) { }

  @OnEvent(StepStartedEvent.name)
  async handleWorkflowCreatedEvent(event: StepStartedEvent) {
    await this.jobProcessingService.addJob<{ instanceId: string; stepId: string }>(JobName.START_WORKFLOW_STEP, {
      instanceId: event.instanceId,
      stepId: event.stepId,
    });
  }

  @OnEvent(TaskCompletedEvent.name)
  async handleUserCreatedEvent(event: TaskCompletedEvent) {
    
  }

}