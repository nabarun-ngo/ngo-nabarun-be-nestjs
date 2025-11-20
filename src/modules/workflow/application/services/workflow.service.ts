import { Injectable, Inject, Logger } from '@nestjs/common';
import * as workflowInstanceRepositoryInterface from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowInstance, WorkflowInstanceStatus } from '../../domain/model/workflow-instance.model';
import { WorkflowStepStatus } from '../../domain/model/workflow-step.model';
import { WorkflowTask, WorkflowTaskStatus, WorkflowTaskType } from '../../domain/model/workflow-task.model';
import { TaskAssignment, TaskAssignmentStatus } from '../../domain/model/task-assignment.model';
import { WorkflowInstanceDto, WorkflowStepDto, WorkflowTaskDto, TaskAssignmentDto, StartWorkflowDto } from '../dto/start-workflow.dto';
import { JobProcessingService } from '../../../shared/job-processing/services/job-processing.service';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { randomUUID } from 'crypto';
import { JobName } from 'src/modules/shared/job-processing/decorators/process-job.decorator';
import { type IWorkflowInstanceRepository, WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowDtoMapper } from '../../presentation/WorkflowDtoMapper';
import { StartWorkflowUseCase } from '../use-cases/start-workflow.use-case';
import { AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IWorkflowInstanceRepository,
    private readonly jobProcessingService: JobProcessingService,
    private readonly workflowStart: StartWorkflowUseCase,
  ) { }

  async createWorkflow(input: StartWorkflowDto,requestedBy:AuthUser) {
    const workflow = await this.workflowStart.execute({
      type: input.type,
      data: input.data,
      requestedBy:requestedBy.profile_id!,
      requestedFor: input.requestedFor ,
    });
    return WorkflowDtoMapper.toDto(workflow);
  }


  /**
   * 
   * @param instanceId 
   * @param stepId 
   * @returns 
   */

  async processStep(instanceId: string, stepId: string | null): Promise<void> {
    if (!stepId) {
      this.logger.warn(`No stepId provided for instance ${instanceId}`);
      return;
    }

    const instance = await this.instanceRepository.findById(instanceId, true);
    if (!instance) {
      throw new BusinessException(`Workflow instance not found: ${instanceId}`);
    }

    const step = instance.steps.find((s) => s.stepId === stepId);
    if (!step) {
      throw new BusinessException(`Step not found: ${stepId}`);
    }

    step.start();
    //instance.moveToStep(stepId);

    // Process tasks in the step
    for (const task of step.tasks) {
      if (task.isAutomatic()) {
        await this.processAutomaticTask(instance, step, task);
      } else {
        // Manual tasks - assignments are already created
        task.start();
      }
    }

    await this.instanceRepository.update(instance.id, instance);
  }

  async processAutomaticTask(
    instance: WorkflowInstance,
    step: any,
    task: WorkflowTask,
  ): Promise<void> {
    if (!task.handler) {
      throw new BusinessException(`Handler not specified for automatic task: ${task.taskId}`);
    }

    task.start();

    try {
      // Create job for automatic task
      const job = await this.jobProcessingService.addJob(
        JobName.TASK_AUTOMATIC,
        {
          instanceId: instance.id,
          stepId: step.id,
          taskId: task.id,
          handler: task.handler,
          requestData: instance.requestData,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      task.setJobId(job.id!);
      this.logger.log(`Created job ${job.id} for automatic task ${task.taskId}`);
    } catch (error) {
      this.logger.error(`Failed to create job for task ${task.id}`, error);
      task.fail(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async executeAutomaticTask(
    preTask: any,
    requestData: Record<string, any>,
  ): Promise<any> {
    if (!preTask.handler) {
      throw new BusinessException(`Handler not specified for pre-creation task: ${preTask.taskId}`);
    }

    try {
      // Execute pre-creation task synchronously
      const job = await this.jobProcessingService.addJob(
        JobName.TASK_AUTOMATIC,
        {
          handler: preTask.handler,
          requestData,
        },
        {
          attempts: 1,
        },
      );

      // Wait for job to complete (for pre-creation tasks, we might want synchronous execution)
      // For now, we'll let it run asynchronously and check result later
      return job;
    } catch (error) {
      this.logger.error(`Failed to execute pre-creation task ${preTask.taskId}`, error);
      throw error;
    }
  }

  async createTaskAssignments(
    taskId: string,
    assignmentConfig: any,
    requestData: Record<string, any>,
  ): Promise<TaskAssignment[]> {
    const assignments: TaskAssignment[] = [];

    // If roleNames specified, assign to users with those roles
    if (assignmentConfig.roleNames && assignmentConfig.roleNames.length > 0) {
      // TODO: Fetch users by roles from user repository
      // For now, we'll create assignments with role names
      // In production, you'd query the user repository to find users with these roles
      for (const roleName of assignmentConfig.roleNames) {
        // const assignment = new TaskAssignment(
        //   randomUUID(),
        //   taskId,
        //   roleName,
        //   TaskAssignmentStatus.PENDING,
        // );
        // assignments.push(assignment);
      }
    }

    // If individual user IDs provided
    if (assignmentConfig.userIds && assignmentConfig.userIds.length > 0) {
      for (const userId of assignmentConfig.userIds) {
        const assignment = new TaskAssignment(
          randomUUID(),
          taskId,
          userId,
          null,
          TaskAssignmentStatus.PENDING,
        );
        assignments.push(assignment);
      }
    }

    return assignments;
  }

  async moveToNextStep(instance: WorkflowInstance): Promise<void> {
    const currentStepIndex = instance.steps.findIndex(
      (s) => s.stepId === instance.currentStepId,
    );

    if (currentStepIndex === -1) {
      this.logger.warn(`Current step not found: ${instance.currentStepId}`);
      return;
    }

    const currentStep = instance.steps[currentStepIndex];
    const nextStepIndex = currentStepIndex + 1;

    // Check transitions
    const stepDef = instance.requestData; // This should come from definition
    // For now, we'll move to next step if available

    if (nextStepIndex < instance.steps.length) {
      const nextStep = instance.steps[nextStepIndex];
      // instance.moveToStep(nextStep.stepId);
      await this.processStep(instance.id, nextStep.stepId);
    } else {
      // All steps completed
      instance.complete();
    }
  }

  async getStepHistory(instanceId: string): Promise<any> {
    const instance = await this.instanceRepository.findById(instanceId, true);
    if (!instance) {
      throw new BusinessException(`Workflow instance not found: ${instanceId}`);
    }

    // Get step history from existing steps, ordered by creation/execution
    const stepHistory = instance.steps
      // .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((step) => ({
        stepId: step.stepId,
        name: step.name,
        status: step.status,
        orderIndex: step.orderIndex,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        failureReason: step.failureReason,
        createdAt: step.createdAt,
        updatedAt: step.updatedAt,
      }));

    return {
      instanceId: instance.id,
      currentStepId: instance.currentStepId,
      steps: stepHistory,
    };
  }

}

