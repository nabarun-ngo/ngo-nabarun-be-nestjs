import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowInstance } from '../../domain/model/workflow-instance.model';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { WorkflowDefService } from '../../infrastructure/external/workflow-def.service';
import { WorkflowTask, WorkflowTaskStatus, WorkflowTaskType } from '../../domain/model/workflow-task.model';
import { type IUserRepository, USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';
import { TaskAssignment } from '../../domain/model/task-assignment.model';
import { CorrespondenceService } from 'src/modules/shared/correspondence/services/correspondence.service';
import { AutomaticTaskService } from '../services/automatic-task.service';
import { EmailTemplateName } from 'src/shared/email-keys';

@Injectable()
export class StartWorkflowStepUseCase implements IUseCase<string, WorkflowInstance> {
    constructor(
        @Inject(WORKFLOW_INSTANCE_REPOSITORY)
        private readonly instanceRepository: IWorkflowInstanceRepository,
        private readonly workflowDefService: WorkflowDefService,
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
        private readonly corrService: CorrespondenceService,
        private readonly automaticTaskService: AutomaticTaskService,
    ) { }

    async execute(instanceId: string): Promise<WorkflowInstance> {
        const workflow = await this.instanceRepository.findById(instanceId, true);
        if (!workflow) {
            throw new BusinessException(`Workflow instance not found: ${instanceId}`);
        }
        const data = {
            requestData: workflow?.requestData
        };
        const definition = await this.workflowDefService.findWorkflowByType(workflow?.type!, data);
        if (!definition) {
            throw new BusinessException(`Workflow definition not found for type: ${workflow?.type}`);
        }
        const taskDefs = definition.steps.find(f => f.stepId === workflow?.currentStepId)?.tasks;
        const step = workflow?.steps.find(f => f.stepId === workflow?.currentStepId);
        if (!step) {
            throw new BusinessException(`Workflow step not found: ${workflow?.currentStepId}`);
        }

        if (taskDefs && taskDefs.length > 0) {
            const tasks = taskDefs.map(td => WorkflowTask.create(workflow.id, step, td));
            step?.setTasks(tasks);

            for (const task of tasks) {
                if (task.type === WorkflowTaskType.AUTOMATIC) {
                    try {
                        workflow.updateTask(task.id, WorkflowTaskStatus.IN_PROGRESS);
                        await this.automaticTaskService.handleTask(task, workflow.requestData, definition);
                        workflow.updateTask(task.id, WorkflowTaskStatus.COMPLETED);
                    } catch (error) {
                        workflow.updateTask(task.id, WorkflowTaskStatus.FAILED, undefined, error.message);
                    }
                }
                else {
                    var roleCodes = taskDefs.find(td => td.taskId == task.taskId)?.taskDetail?.assignedTo?.roleNames;
                    const users = await this.userRepository.findAll({ roleCodes: roleCodes });
                    const assignments = users.map(u => TaskAssignment.create({
                        taskId: task.id,
                        assignedTo: u,
                        roleName: u.roles.find(r => roleCodes?.includes(r.roleCode))?.roleCode!
                    }));
                    task.setAssignments(assignments);
                    this.corrService.sendTemplatedEmail({
                        templateName: EmailTemplateName.TASK_ASSIGNED,
                        data: { ...task.toJson(), workflowId: workflow.id },
                        options: {
                            recipients: { to: users.map(user => user.email) }
                        }
                    })
                }
            }
            await this.instanceRepository.update(workflow.id, workflow!);
        }
        return workflow!;
    }
}

