import { Injectable } from "@nestjs/common";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { StepStartedEvent } from "../../domain/events/step-started.event";
import { OnEvent } from "@nestjs/event-emitter";
import { WorkflowStep } from "../../domain/model/workflow-step.model";
import { JobName } from "src/modules/shared/job-processing/decorators/process-job.decorator";

@Injectable()
export class WorkflowEventsHandler {

  constructor(private readonly jobProcessingService: JobProcessingService) { }

  @OnEvent(StepStartedEvent.name)
  async handleUserCreatedEvent(event: StepStartedEvent) {    
    await this.jobProcessingService.addJob<{ instanceId: string; stepId: string }>(JobName.START_WORKFLOW_STEP, {
      instanceId: event.instanceId,
      stepId: event.stepId,
    });
  }

}