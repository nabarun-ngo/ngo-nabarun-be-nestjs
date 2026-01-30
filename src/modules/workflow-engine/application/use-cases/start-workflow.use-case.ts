import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import type { IWorkflowDefinitionSource } from '../../domain/repositories/workflow-definition-source.interface';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import type { IWorkflowTaskHandlerRegistry } from '../interfaces/workflow-task-handler.interface';
import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';
import { EngineWorkflowTaskStatus } from '../../domain/model/engine-workflow-task.model';
import { EngineTaskAssignment } from '../../domain/model/engine-task-assignment.model';
import { DefinitionTemplateResolver } from '../services/definition-template.resolver';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { WORKFLOW_DEFINITION_SOURCE } from '../../domain/vo/engine-workflow-def.vo';
import { WORKFLOW_TASK_HANDLER_REGISTRY } from '../interfaces/workflow-task-handler.interface';
import type { IUserRepository } from 'src/modules/user/domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';

export interface StartWorkflowInput {
  type: string;
  data: Record<string, unknown>;
  requestedBy: string;
  requestedFor?: string;
  definitionVersion?: number;
}

@Injectable()
export class StartWorkflowUseCase {
  constructor(
    @Inject(WORKFLOW_DEFINITION_SOURCE)
    private readonly definitionSource: IWorkflowDefinitionSource,
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IEngineWorkflowInstanceRepository,
    @Inject(WORKFLOW_TASK_HANDLER_REGISTRY)
    private readonly handlerRegistry: IWorkflowTaskHandlerRegistry,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(input: StartWorkflowInput): Promise<EngineWorkflowInstance> {
    const definition = await this.definitionSource.findByType(
      input.type,
      input.definitionVersion,
    );
    if (!definition) {
      throw new BusinessException(`Workflow definition not found: ${input.type}`);
    }

    const context = { requestData: input.data, ...input.data };

    // Validate required fields
    const required = definition.requiredFields ?? definition.fields ?? [];
    if (required.length) {
      const missing = required.filter(
        (k) => !(k in input.data) || input.data[k] == null,
      );
      if (missing.length) {
        throw new BusinessException(`Missing required fields: ${missing.join(', ')}`);
      }
    }

    // Resolve full definition (workflow + all steps/tasks)
    const resolvedDef = {
      ...DefinitionTemplateResolver.resolveWorkflowLevel(definition, context),
      steps: definition.steps.map((s) =>
        DefinitionTemplateResolver.resolveStepLevel(s, context),
      ),
      preCreationTasks: definition.preCreationTasks ?? [],
    };

    // Run pre-creation tasks (automatic only)
    if (resolvedDef.preCreationTasks?.length) {
      for (const taskDef of resolvedDef.preCreationTasks) {
        if (taskDef.type === 'AUTOMATIC' && taskDef.handler) {
          const handler = this.handlerRegistry.get(taskDef.handler);
          if (handler) {
            await handler.handle(context, taskDef.taskDetail as Record<string, unknown>);
          }
        }
      }
    }

    // Create instance (domain create() adds steps and tasks from definition)
    const instance = EngineWorkflowInstance.create({
      type: input.type,
      definition: resolvedDef,
      requestedBy: input.requestedBy,
      data: input.data,
      requestedFor: input.requestedFor ?? undefined,
    });

    // Add assignments for manual tasks with assignedTo (all steps)
    for (const step of instance.steps) {
      for (const task of step.tasks) {
        if (!task.isManual()) continue;
        const assignedTo = (task.taskConfig as { assignedTo?: { roleNames?: string[]; userId?: string } })?.assignedTo;
        if (assignedTo?.userId) {
          const dueAt = this.computeDueAtFromTaskConfig(task.taskConfig);
          task.setAssignments([
            EngineTaskAssignment.create({
              taskId: task.id,
              assigneeId: assignedTo.userId,
              assignedById: input.requestedBy,
              dueAt,
            }),
          ]);
        } else if (assignedTo?.roleNames?.length) {
          const users = await this.userRepository.findAll({
            roleCodes: assignedTo.roleNames,
          });
          const dueAt = this.computeDueAtFromTaskConfig(task.taskConfig);
          const assignments = users.map((u) =>
            EngineTaskAssignment.create({
              taskId: task.id,
              assigneeId: u.id,
              roleName: u.roles?.find((r) =>
                assignedTo.roleNames?.includes(r.roleCode),
              )?.roleCode ?? undefined,
              assignedById: input.requestedBy,
              dueAt,
            }),
          );
          task.setAssignments(assignments);
        }
      }
    }

    instance.start();

    // Run automatic tasks (current step and following until manual or end)
    while (instance.getCurrentStep()) {
      const step = instance.getCurrentStep()!;
      const pendingAuto = step.tasks.filter(
        (t) => t.isAutomatic() && t.status === EngineWorkflowTaskStatus.PENDING,
      );
      if (pendingAuto.length === 0) break;

      const task = pendingAuto[0];
      const handlerInstance = task.handler
        ? this.handlerRegistry.get(task.handler)
        : undefined;
      if (handlerInstance) {
        try {
          const result = await handlerInstance.handle(
            instance.getContext(),
            task.taskConfig ?? undefined,
          );
          instance.updateTask(
            task.id,
            EngineWorkflowTaskStatus.COMPLETED,
            input.requestedBy,
            undefined,
            result,
          );
        } catch (err) {
          instance.updateTask(
            task.id,
            EngineWorkflowTaskStatus.FAILED,
            input.requestedBy,
            err instanceof Error ? err.message : String(err),
          );
        }
      }
    }

    await this.instanceRepository.create(instance);
    return this.instanceRepository.findById(instance.id, true) as Promise<EngineWorkflowInstance>;
  }

  private computeDueAtFromTaskConfig(taskConfig: Record<string, unknown> | null): Date | undefined {
    if (!taskConfig) return undefined;
    const etaHours = taskConfig.etaHours as number | undefined;
    const dueInDays = taskConfig.dueInDays as number | undefined;
    const now = new Date();
    if (etaHours != null) {
      const d = new Date(now);
      d.setHours(d.getHours() + etaHours);
      return d;
    }
    if (dueInDays != null) {
      const d = new Date(now);
      d.setDate(d.getDate() + dueInDays);
      return d;
    }
    return undefined;
  }
}
