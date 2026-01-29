import { AggregateRoot } from '../../../../shared/models/aggregate-root';
import { EngineWorkflowStep, EngineWorkflowStepStatus } from './engine-workflow-step.model';
import { EngineWorkflowDefinition, StepDef } from '../vo/engine-workflow-def.vo';
import { generateUniqueNDigitNumber } from 'src/shared/utilities/password-util';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { EngineWorkflowCreatedEvent } from '../events/engine-workflow-created.event';
import { EngineStepStartedEvent } from '../events/engine-step-started.event';
import { EngineTaskCompletedEvent } from '../events/engine-task-completed.event';
import { EngineWorkflowCompletedEvent } from '../events/engine-workflow-completed.event';
import { EngineWorkflowFailedEvent } from '../events/engine-workflow-failed.event';
import {
  EngineWorkflowTask,
  EngineWorkflowTaskStatus,
} from './engine-workflow-task.model';

export enum EngineWorkflowInstanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface EngineWorkflowInstanceProps {
  id: string;
  type: string;
  definitionVersion?: number | null;
  name: string;
  description: string;
  status: EngineWorkflowInstanceStatus;
  contextData: Record<string, unknown>;
  activeStepIds: string[];
  initiatedById?: string | null;
  initiatedForId?: string | null;
  // External user support
  initiatedByEmail?: string | null;
  initiatedForEmail?: string | null;
  initiatedByName?: string | null;
  initiatedForName?: string | null;
  requestData?: Record<string, unknown> | null;
  completedAt?: Date | null;
  remarks?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EngineWorkflowInstance extends AggregateRoot<string> {
  #type: string;
  #definitionVersion: number | null;
  #name: string;
  #description: string;
  #status: EngineWorkflowInstanceStatus;
  #contextData: Record<string, unknown>;
  #activeStepIds: string[];
  #initiatedById: string | null;
  #initiatedForId: string | null;
  // External user support
  #initiatedByEmail: string | null;
  #initiatedForEmail: string | null;
  #initiatedByName: string | null;
  #initiatedForName: string | null;
  #requestData: Record<string, unknown>;
  #completedAt: Date | null;
  #remarks: string | null;
  #steps: EngineWorkflowStep[] = [];

  constructor(props: EngineWorkflowInstanceProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.#type = props.type;
    this.#definitionVersion = props.definitionVersion ?? null;
    this.#name = props.name;
    this.#description = props.description;
    this.#status = props.status;
    this.#contextData = props.contextData ? { ...props.contextData } : {};
    this.#activeStepIds = props.activeStepIds ? [...props.activeStepIds] : [];
    this.#initiatedById = props.initiatedById ?? null;
    this.#initiatedForId = props.initiatedForId ?? null;
    this.#initiatedByEmail = props.initiatedByEmail ?? null;
    this.#initiatedForEmail = props.initiatedForEmail ?? null;
    this.#initiatedByName = props.initiatedByName ?? null;
    this.#initiatedForName = props.initiatedForName ?? null;
    this.#requestData = props.requestData ? { ...props.requestData } : {};
    this.#completedAt = props.completedAt ?? null;
    this.#remarks = props.remarks ?? null;
  }

  static create(data: {
    type: string;
    definition: EngineWorkflowDefinition;
    requestedBy: string;
    data?: Record<string, unknown>;
    requestedFor?: string | null;
  }): EngineWorkflowInstance {
    const contextData: Record<string, unknown> = data.data
      ? { requestData: data.data, ...data.data }
      : {};
    const instance = new EngineWorkflowInstance({
      id: `ENG${generateUniqueNDigitNumber(6)}`,
      type: data.type,
      definitionVersion: data.definition.version ?? null,
      name: data.definition.name,
      description: data.definition.description,
      status: EngineWorkflowInstanceStatus.PENDING,
      contextData,
      activeStepIds: [],
      initiatedById: data.requestedBy,
      initiatedForId: data.requestedFor ?? data.requestedBy,
      requestData: data.data ?? {},
    });

    data.definition.steps.forEach((stepDef: StepDef) => {
      const step = EngineWorkflowStep.create(instance.id, stepDef);
      const tasks = (stepDef.tasks ?? []).map((tDef) =>
        EngineWorkflowTask.create(instance.id, step.stepId, tDef),
      );
      step.setTasks(tasks);
      instance.addStep(step);
    });

    instance.addDomainEvent(
      new EngineWorkflowCreatedEvent(instance.id, data.type),
    );
    return instance;
  }

  addStep(step: EngineWorkflowStep): void {
    this.#steps.push(step);
    this.touch();
  }

  start(): void {
    this.#status = EngineWorkflowInstanceStatus.IN_PROGRESS;
    const firstStep = this.#steps.find((s) => s.orderIndex === 0);
    if (!firstStep) {
      throw new BusinessException('No first step in workflow');
    }
    this.#activeStepIds = [firstStep.stepId];
    firstStep.start();
    this.addDomainEvent(new EngineStepStartedEvent(this.id, firstStep.id));
    this.touch();
  }

  getContext(): Record<string, unknown> {
    return { ...this.#contextData };
  }

  mergeResultIntoContext(outputKey: string, resultData: Record<string, unknown>): void {
    this.#contextData[outputKey] = resultData;
    this.#contextData = { ...this.#contextData };
    this.touch();
  }

  updateTask(
    taskId: string,
    status: EngineWorkflowTaskStatus,
    completedBy?: string,
    remarks?: string,
    resultData?: Record<string, unknown>,
  ): EngineWorkflowTask {
    const step = this.#steps.find((s) =>
      this.#activeStepIds.includes(s.stepId),
    );
    const task = step?.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new BusinessException(`Task not found: ${taskId}`);
    }
    if (task.status === EngineWorkflowTaskStatus.COMPLETED) {
      throw new BusinessException(`Task already completed: ${taskId}`);
    }

    switch (status) {
      case EngineWorkflowTaskStatus.IN_PROGRESS:
        task.start(completedBy);
        break;
      case EngineWorkflowTaskStatus.COMPLETED:
        task.complete(completedBy!, remarks, resultData);
        if (task.outputKey && resultData) {
          this.mergeResultIntoContext(task.outputKey, resultData);
        }
        break;
      case EngineWorkflowTaskStatus.FAILED:
        task.fail(remarks ?? 'Failed', completedBy);
        break;
      default:
        throw new BusinessException(`Invalid task status: ${status}`);
    }

    this.addDomainEvent(new EngineTaskCompletedEvent(this.id, step!.id, task.id));

    if (step?.isAllTasksCompleted()) {
      step.complete();
      this.moveToNextStep(step);
      if (this.#status === EngineWorkflowInstanceStatus.COMPLETED) {
        this.addDomainEvent(new EngineWorkflowCompletedEvent(this.id));
      } else if (this.#status === EngineWorkflowInstanceStatus.FAILED) {
        this.addDomainEvent(
          new EngineWorkflowFailedEvent(this.id, this.#remarks ?? ''),
        );
      }
    }
    this.touch();
    return task;
  }

  private evaluateCondition(expression: string): boolean {
    try {
      const context = this.getContext();
      const fn = new Function('context', `with(context) { return ${expression}; }`);
      return Boolean(fn(context));
    } catch {
      return false;
    }
  }

  private moveToNextStep(completedStep: EngineWorkflowStep): void {
    // Remove completed step from active list
    this.#activeStepIds = this.#activeStepIds.filter(
      (id) => id !== completedStep.stepId,
    );

    // Handle failure
    if (completedStep.isFailed()) {
      const nextId = completedStep.onFailureStepId;
      if (!nextId) {
        this.#status = EngineWorkflowInstanceStatus.FAILED;
        this.#remarks = completedStep.remarks ?? 'Step failed';
        this.#activeStepIds = [];
        this.#completedAt = new Date();
        this.touch();
        return;
      }
      const next = this.#steps.find((s) => s.stepId === nextId);
      if (next) {
        this.#activeStepIds.push(next.stepId);
        next.start();
        this.addDomainEvent(new EngineStepStartedEvent(this.id, next.id));
      }
      this.touch();
      return;
    }

    // Check if any step with a join is now satisfied
    const joinableSteps = this.#steps.filter(
      (s) =>
        s.joinConfig &&
        s.status === EngineWorkflowStepStatus.PENDING &&
        this.isJoinSatisfied(s),
    );
    for (const joinStep of joinableSteps) {
      this.#activeStepIds.push(joinStep.stepId);
      joinStep.start();
      this.addDomainEvent(new EngineStepStartedEvent(this.id, joinStep.id));
    }

    // If there are still active steps (parallel execution), wait for them
    if (this.#activeStepIds.length > 0) {
      this.touch();
      return;
    }

    // Evaluate conditions for next step
    const conditions = completedStep.conditions;
    let nextStepId: string | null = null;
    if (conditions && conditions.length > 0) {
      for (const c of conditions) {
        if (this.evaluateCondition(c.expression)) {
          nextStepId = c.nextStepId;
          break;
        }
      }
    }
    if (nextStepId === null) {
      nextStepId = completedStep.onSuccessStepId;
    }

    if (!nextStepId) {
      this.#status = EngineWorkflowInstanceStatus.COMPLETED;
      this.#activeStepIds = [];
      this.#completedAt = new Date();
      this.touch();
      return;
    }

    // Check if next step is part of a parallel group
    const next = this.#steps.find((s) => s.stepId === nextStepId);
    if (next) {
      if (next.parallelGroup) {
        // Start all steps in the parallel group
        const parallelSteps = this.#steps.filter(
          (s) =>
            s.parallelGroup === next.parallelGroup &&
            s.status === EngineWorkflowStepStatus.PENDING,
        );
        for (const pStep of parallelSteps) {
          this.#activeStepIds.push(pStep.stepId);
          pStep.start();
          this.addDomainEvent(new EngineStepStartedEvent(this.id, pStep.id));
        }
      } else {
        // Start single next step
        this.#activeStepIds.push(next.stepId);
        next.start();
        this.addDomainEvent(new EngineStepStartedEvent(this.id, next.id));
      }
    }
    this.touch();
  }

  private isJoinSatisfied(joinStep: EngineWorkflowStep): boolean {
    if (!joinStep.joinConfig) return false;

    const { joinType, requiredStepIds } = joinStep.joinConfig;
    const completedSteps = this.#steps.filter(
      (s) =>
        requiredStepIds.includes(s.stepId) &&
        s.status === EngineWorkflowStepStatus.COMPLETED,
    );

    if (joinType === 'ALL') {
      return completedSteps.length === requiredStepIds.length;
    } else if (joinType === 'ANY') {
      return completedSteps.length > 0;
    }
    return false;
  }

  cancel(reason: string): void {
    this.#status = EngineWorkflowInstanceStatus.CANCELLED;
    this.#remarks = reason;
    this.#activeStepIds = [];
    this.touch();
  }

  get type(): string {
    return this.#type;
  }
  get definitionVersion(): number | null {
    return this.#definitionVersion;
  }
  get name(): string {
    return this.#name;
  }
  get description(): string {
    return this.#description;
  }
  get status(): EngineWorkflowInstanceStatus {
    return this.#status;
  }
  get contextData(): Record<string, unknown> {
    return { ...this.#contextData };
  }
  get activeStepIds(): string[] {
    return [...this.#activeStepIds];
  }
  get initiatedById(): string | null {
    return this.#initiatedById;
  }
  get initiatedForId(): string | null {
    return this.#initiatedForId;
  }
  get initiatedByEmail(): string | null {
    return this.#initiatedByEmail;
  }
  get initiatedForEmail(): string | null {
    return this.#initiatedForEmail;
  }
  get initiatedByName(): string | null {
    return this.#initiatedByName;
  }
  get initiatedForName(): string | null {
    return this.#initiatedForName;
  }
  get requestData(): Record<string, unknown> {
    return { ...this.#requestData };
  }
  get completedAt(): Date | null {
    return this.#completedAt;
  }
  get remarks(): string | null {
    return this.#remarks;
  }
  get steps(): ReadonlyArray<EngineWorkflowStep> {
    return [...this.#steps];
  }

  getCurrentStep(): EngineWorkflowStep | undefined {
    if (this.#activeStepIds.length === 0) return undefined;
    return this.#steps.find((s) => s.stepId === this.#activeStepIds[0]);
  }

  getActiveSteps(): EngineWorkflowStep[] {
    return this.#steps.filter((s) => this.#activeStepIds.includes(s.stepId));
  }
}
