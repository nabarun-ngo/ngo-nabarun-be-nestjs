import { Injectable, Inject, Logger } from '@nestjs/common';
import { WorkflowFilter, WorkflowInstance } from '../../domain/model/workflow-instance.model';
import { TaskFilter } from '../../domain/model/workflow-task.model';
import { WorkflowInstanceDto, WorkflowTaskDto, StartWorkflowDto, UpdateTaskDto } from '../dto/workflow.dto';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { type IWorkflowInstanceRepository, WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowDtoMapper } from '../dto/workflow-dto.mapper';
import { StartWorkflowUseCase } from '../use-cases/start-workflow.use-case';
import { AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { CompleteTaskUseCase } from '../use-cases/complete-task.use-case';
import { User } from 'src/modules/user/domain/model/user.model';
import { AutomaticTaskService } from './automatic-task.service';

@Injectable()
export class WorkflowService {

  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IWorkflowInstanceRepository,
    private readonly workflowStart: StartWorkflowUseCase,
    private readonly completeTask: CompleteTaskUseCase,
    private readonly taskService: AutomaticTaskService,
  ) { }

  async getWorkflows(filter: BaseFilter<WorkflowFilter>): Promise<PagedResult<WorkflowInstanceDto>> {
    const result = await this.instanceRepository.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: filter.props,
    });
    return new PagedResult<WorkflowInstanceDto>(
      result.items.map(m => WorkflowDtoMapper.toDto(m)),
      result.total,
      result.pageIndex,
      result.pageSize,
    );
  }

  async getWorkflow(id: string, includeTask: boolean): Promise<WorkflowInstanceDto> {
    const instance = await this.instanceRepository.findById(id, includeTask);
    return WorkflowDtoMapper.toDto(instance!);
  }

  async getWorkflowTasks(filter: BaseFilter<TaskFilter>): Promise<PagedResult<WorkflowTaskDto>> {
    const instance = await this.instanceRepository.findTasksPaged(filter);
    return new PagedResult<WorkflowTaskDto>(
      instance.items.map(m => WorkflowDtoMapper.taskDomainToDto(m)),
      instance.total,
      instance.pageIndex,
      instance.pageSize,
    );
  }

  async updateTask(id: string, taskId: string, dto: UpdateTaskDto, authUser: AuthUser): Promise<WorkflowTaskDto> {
    const instance = await this.completeTask.execute({
      instanceId: id,
      taskId: taskId,
      remarks: dto.remarks,
      status: dto.status,
      completedBy: new User(authUser.profile_id!, '', '', ''),
    })
    return WorkflowDtoMapper.taskDomainToDto(instance);
  }

  async createWorkflow(input: StartWorkflowDto, requestedBy?: AuthUser) {
    const workflow = await this.workflowStart.execute({
      type: input.type,
      data: input.data,
      requestedBy: requestedBy?.profile_id!,
      requestedFor: input.requestedFor,
    });
    return WorkflowDtoMapper.toDto(workflow);
  }

  async processAutomaticTask(
    instance: string | WorkflowInstance,
    taskId: string,
  ): Promise<void> {
    const workflow: WorkflowInstance | null = instance instanceof WorkflowInstance ? instance :
      await this.instanceRepository.findById(instance, true);
    const step = workflow?.steps.find(s => s.stepId === workflow.currentStepId);
    const task = step?.tasks?.find(t => t.id == taskId);

    if (!task) {
      throw new BusinessException(`Task not found: ${taskId}`);
    }

    if (!task.isAutomatic()) {
      throw new BusinessException(`Task is not automatic: ${taskId}`);
    }
    await this.taskService.handleTask(task, workflow?.requestData);

    task.complete();
    await this.instanceRepository.update(workflow?.id!, workflow!);
  }

}

