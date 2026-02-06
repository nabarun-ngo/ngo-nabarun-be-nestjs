import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowInstance } from '../../domain/model/workflow-instance.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { WorkflowDefService } from '../../infrastructure/external/workflow-def.service';
import { AutomaticTaskService } from '../services/automatic-task.service';

@Injectable()
export class StartWorkflowUseCase implements IUseCase<{
  type: string;
  data: Record<string, string>;
  requestedBy: string;
  requestedFor?: string;
  forExternalUser?: boolean;
  externalUserEmail?: string;
}, WorkflowInstance> {
  constructor(
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IWorkflowInstanceRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly definitionRepository: WorkflowDefService,
    private readonly taskService: AutomaticTaskService,

  ) { }

  async execute(request: {
    type: string;
    data: Record<string, string>;
    requestedBy: string;
    requestedFor?: string;
    forExternalUser?: boolean;
    externalUserEmail?: string;
  }): Promise<WorkflowInstance> {
    const data = {
      requestData: request.data
    };
    // Find workflow definition
    const definition = await this.definitionRepository.findWorkflowByType(request.type, data);
    if (!definition) {
      throw new BusinessException(`Workflow definition not found for type: ${request.type}`);
    }

    //Execute pre-creation tasks
    if (definition.preCreationTasks) {
      for (const preTask of definition.preCreationTasks) {
        await this.taskService.handleTask(preTask, request.data, definition);
      }
    }

    // Create workflow instance
    const instance = WorkflowInstance.create({
      type: request.type,
      definition,
      requestedBy: { id: request.requestedBy },
      data: request.data,
      requestedFor: { id: request.requestedFor },
      forExternalUser: request.forExternalUser ?? false,
      externalUserEmail: request.externalUserEmail,
    });
    instance.start();
    // Save instance
    const savedInstance = await this.instanceRepository.create(instance);
    // Emit domain events
    instance.domainEvents.forEach((event) => {
      this.eventEmitter.emit(event.constructor.name, event);
    });
    instance.clearEvents();
    return savedInstance;
  }
}

