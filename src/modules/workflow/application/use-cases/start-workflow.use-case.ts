import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowInstance } from '../../domain/model/workflow-instance.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { StartWorkflowDto, WorkflowInstanceDto } from '../dto/start-workflow.dto';
import { WorkflowService } from '../../application/services/workflow.service';
import { WorkflowDefService } from '../../infrastructure/external/workflow-def.service';
import { WorkflowDtoMapper } from '../../presentation/WorkflowDtoMapper';
import { StepStartedEvent } from '../../domain/events/step-started.event';

@Injectable()
export class StartWorkflowUseCase implements IUseCase<StartWorkflowDto, WorkflowInstanceDto> {
  constructor(
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IWorkflowInstanceRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly workflowService: WorkflowService,
    private readonly definitionRepository: WorkflowDefService,
  ) { }

  async execute(request: StartWorkflowDto): Promise<WorkflowInstanceDto> {
    // Find workflow definition
    const definition = await this.definitionRepository.findWorkflowByType(request.type);
    if (!definition) {
      throw new BusinessException(`Workflow definition not found for type: ${request.type}`);
    }

    // Execute pre-creation tasks
    // if (definition.preCreationTasks) {
    //   for (const preTask of definition.preCreationTasks) {
    //     await this.workflowService.executeAutomaticTask(preTask, request.data);
    //   }
    // }

    // Create workflow instance
    const instance = WorkflowInstance.create({
      type: request.type,
      definition,
    });

    // Save instance
    instance.start();
    const savedInstance = await this.instanceRepository.create(instance);
    // Emit domain events
    instance.domainEvents.forEach((event) => {
      this.eventEmitter.emit(event.constructor.name, event);
    });
    instance.clearEvents();
    return WorkflowDtoMapper.toDto(savedInstance);
  }
}

