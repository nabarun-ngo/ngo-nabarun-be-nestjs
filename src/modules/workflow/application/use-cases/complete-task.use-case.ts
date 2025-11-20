import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import {  WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { WorkflowService } from '../../application/services/workflow.service';
import { UpdateTaskDto, WorkflowInstanceDto } from '../dto/workflow.dto';
import { WorkflowDtoMapper } from '../dto/workflow-dto.mapper';

@Injectable()
export class CompleteTaskUseCase implements IUseCase<UpdateTaskDto, WorkflowInstanceDto> {
  constructor(
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IWorkflowInstanceRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: UpdateTaskDto): Promise<WorkflowInstanceDto> {
    // Find instance with steps and tasks
    const instance = await this.instanceRepository.findById(request.instanceId, true);
    if (!instance) {
      throw new BusinessException(`Workflow instance not found: ${request.instanceId}`);
    }

    // Find task
    let targetTask = null;
    let targetStep = null;

    // for (const step of instance.steps) {
    //   for (const task of step.tasks) {
    //     if (task.id === request.taskId) {
    //       targetTask = task;
    //       targetStep = step;
    //       break;
    //     }
    //   }
    //   if (targetTask) break;
    // }

    if (!targetTask || !targetStep) {
      throw new BusinessException(`Task not found: ${request.taskId}`);
    }

    // // Check if task can be completed
    // if (targetTask.status !== WorkflowTaskStatus.PENDING && 
    //     targetTask.status !== WorkflowTaskStatus.IN_PROGRESS) {
    //   throw new BusinessException(`Task cannot be completed in status: ${targetTask.status}`);
    // }

    // // Complete the task
    // targetTask.complete(request.resultData, request.completedBy);

    // // Emit task completed event
    // instance.addDomainEvent(
    //   new TaskCompletedEvent(instance.id, instance.id, targetStep.id, targetTask),
    // );

    // // Check if all tasks in step are completed
    // if (targetStep.isAllTasksCompleted()) {
    //   targetStep.complete();
    //   instance.addDomainEvent(new StepCompletedEvent(instance.id, instance.id, targetStep));

    //   // Move to next step or complete workflow
    //   await this.workflowService.moveToNextStep(instance);
    // }

    // // Check if workflow is completed
    // const allStepsCompleted = instance.steps.every((s) => s.isCompleted());
    // if (allStepsCompleted && instance.steps.length > 0) {
    //   instance.complete(request.resultData, request.completedBy);
    //   instance.addDomainEvent(new WorkflowCompletedEvent(instance.id, instance));
    // }

    // Save instance
    const savedInstance = await this.instanceRepository.update(instance.id, instance);

    //Start the workflow 
    //Not updating this here, will be updated when job will completed
    instance.start();

    // Emit domain events
    for (const event of instance.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    instance.clearEvents();

    return WorkflowDtoMapper.toDto(savedInstance);
  }
}

