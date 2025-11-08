import { Injectable } from "@nestjs/common";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { StepStartedEvent } from "../../domain/events/step-started.event";
import { OnEvent } from "@nestjs/event-emitter";
import { WorkflowStep } from "../../domain/model/workflow-step.model";

@Injectable()
export class WorkflowEventsHandler {

  constructor(private readonly jobProcessingService: JobProcessingService) { }

  @OnEvent(StepStartedEvent.name)
  async handleUserCreatedEvent(event: StepStartedEvent) {    
    await this.jobProcessingService.addJob<{ instanceId: string; step: WorkflowStep }>('start-workflow-step', {
      instanceId: event.instanceId,
      step: event.step,
    });
  }

}