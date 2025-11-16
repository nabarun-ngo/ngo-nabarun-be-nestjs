import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowInstance } from '../../domain/model/workflow-instance.model';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { WorkflowDefService } from '../../infrastructure/external/workflow-def.service';
import { WorkflowTask } from '../../domain/model/workflow-task.model';

@Injectable()
export class StartWorkflowStepUseCase implements IUseCase<string, WorkflowInstance> {
    constructor(
        @Inject(WORKFLOW_INSTANCE_REPOSITORY)
        private readonly instanceRepository: IWorkflowInstanceRepository,
        private readonly workflowDefService: WorkflowDefService,
    ) { }

    async execute(instanceId: string): Promise<WorkflowInstance> {
        const workflow = await this.instanceRepository.findById(instanceId, true);
        const definition = await this.workflowDefService.findWorkflowByType(workflow?.type!);
        if (!definition) {
            throw new BusinessException(`Workflow definition not found for type: ${workflow?.type}`);
        }
        const taskDefs = definition.steps.find(f => f.stepId === workflow?.currentStepId)?.tasks;
        const step = workflow?.steps.find(f => f.stepId === workflow?.currentStepId);

        step?.setTasks(taskDefs!.map(task => {
            return WorkflowTask.create(step, task);
        }));

        

        return workflow!;
    }
}

