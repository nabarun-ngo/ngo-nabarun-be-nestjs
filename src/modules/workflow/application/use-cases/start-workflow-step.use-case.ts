import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowInstance } from '../../domain/model/workflow-instance.model';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { WorkflowDefService } from '../../infrastructure/external/workflow-def.service';
import { WorkflowTask, WorkflowTaskType } from '../../domain/model/workflow-task.model';
import { type IUserRepository, USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';
import { TaskAssignment } from '../../domain/model/task-assignment.model';
import { CorrespondenceService } from 'src/modules/shared/correspondence/services/correspondence.service';
import { EmailTemplateName } from 'src/modules/shared/correspondence/dtos/email.dto';
import { JobProcessingService } from 'src/modules/shared/job-processing/services/job-processing.service';
import { JobName } from 'src/modules/shared/job-processing/decorators/process-job.decorator';

@Injectable()
export class StartWorkflowStepUseCase implements IUseCase<string, WorkflowInstance> {
    constructor(
        @Inject(WORKFLOW_INSTANCE_REPOSITORY)
        private readonly instanceRepository: IWorkflowInstanceRepository,
        private readonly workflowDefService: WorkflowDefService,
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
        private readonly corrService: CorrespondenceService,
        private readonly jobService: JobProcessingService,
    ) { }

    async execute(instanceId: string): Promise<WorkflowInstance> {
        const workflow = await this.instanceRepository.findById(instanceId, true);
        if (!workflow) {
            throw new BusinessException(`Workflow instance not found: ${instanceId}`);
        }
        const definition = await this.workflowDefService.findWorkflowByType(workflow?.type!);
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
                    task.start();
                    await this.jobService.addJob(JobName.TASK_AUTOMATIC, {
                        instanceId: workflow.id,
                        task: task.toJson(),
                    });
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

