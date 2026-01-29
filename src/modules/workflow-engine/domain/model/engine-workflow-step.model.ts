import { BaseDomain } from '../../../../shared/models/base-domain';
import { randomUUID } from 'crypto';
import {
  EngineWorkflowTask,
  EngineWorkflowTaskStatus,
} from './engine-workflow-task.model';
import { StepDef, StepTransitionsDef } from '../vo/engine-workflow-def.vo';
import { BusinessException } from 'src/shared/exceptions/business-exception';

export enum EngineWorkflowStepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export interface JoinConfig {
  stepId: string;
  joinType: 'ALL' | 'ANY';
  requiredStepIds: string[];
}

export interface TransitionConfig {
  onSuccess: string | null;
  onFailure: string | null;
  conditions?: { expression: string; nextStepId: string }[];
}

export interface EngineWorkflowStepProps {
  id: string;
  instanceId: string;
  stepId: string;
  name: string;
  description: string | null;
  status: EngineWorkflowStepStatus;
  orderIndex: number;
  transitionConfig: TransitionConfig;
  parallelGroup?: string | null;
  joinConfig?: JoinConfig | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  remarks?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EngineWorkflowStep extends BaseDomain<string> {
  #instanceId: string;
  #stepId: string;
  #name: string;
  #description: string | null;
  #status: EngineWorkflowStepStatus;
  #orderIndex: number;
  #onSuccessStepId: string | null;
  #onFailureStepId: string | null;
  #conditions: { expression: string; nextStepId: string }[];
  #parallelGroup: string | null;
  #joinConfig: JoinConfig | null;
  #startedAt: Date | null;
  #completedAt: Date | null;
  #remarks: string | null;
  #tasks: EngineWorkflowTask[] = [];

  constructor(props: EngineWorkflowStepProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.#instanceId = props.instanceId;
    this.#stepId = props.stepId;
    this.#name = props.name;
    this.#description = props.description ?? null;
    this.#status = props.status;
    this.#orderIndex = props.orderIndex;
    this.#onSuccessStepId = props.transitionConfig.onSuccess ?? null;
    this.#onFailureStepId = props.transitionConfig.onFailure ?? null;
    this.#conditions = props.transitionConfig.conditions ?? [];
    this.#parallelGroup = props.parallelGroup ?? null;
    this.#joinConfig = props.joinConfig ?? null;
    this.#startedAt = props.startedAt ?? null;
    this.#completedAt = props.completedAt ?? null;
    this.#remarks = props.remarks ?? null;
  }

  static create(instanceId: string, def: StepDef): EngineWorkflowStep {
    const transitions = def.transitions as StepTransitionsDef;
    return new EngineWorkflowStep({
      id: randomUUID(),
      instanceId,
      stepId: def.stepId,
      name: def.name,
      description: def.description ?? null,
      status: EngineWorkflowStepStatus.PENDING,
      orderIndex: def.orderIndex,
      transitionConfig: {
        onSuccess: transitions.onSuccess ?? null,
        onFailure: transitions.onFailure ?? null,
        conditions: transitions.conditions ?? [],
      },
      parallelGroup: def.parallelGroup ?? null,
      joinConfig: def.joinStep ?? null,
    });
  }

  setTasks(tasks: EngineWorkflowTask[]): void {
    this.#tasks = [...tasks];
    this.touch();
  }

  start(): void {
    if (
      this.#status === EngineWorkflowStepStatus.COMPLETED ||
      this.#status === EngineWorkflowStepStatus.FAILED
    ) {
      throw new BusinessException(`Cannot start step in status: ${this.#status}`);
    }
    this.#status = EngineWorkflowStepStatus.IN_PROGRESS;
    this.#startedAt = new Date();
    this.touch();
  }

  complete(): string | null {
    if (this.#status !== EngineWorkflowStepStatus.IN_PROGRESS) {
      throw new BusinessException(`Cannot complete step in status: ${this.#status}`);
    }
    this.#status = EngineWorkflowStepStatus.COMPLETED;
    this.#completedAt = new Date();
    this.touch();
    return this.#onSuccessStepId;
  }

  fail(reason: string): string | null {
    this.#status = EngineWorkflowStepStatus.FAILED;
    this.#remarks = reason;
    this.touch();
    return this.#onFailureStepId;
  }

  get instanceId(): string {
    return this.#instanceId;
  }
  get stepId(): string {
    return this.#stepId;
  }
  get name(): string {
    return this.#name;
  }
  get description(): string | null {
    return this.#description;
  }
  get status(): EngineWorkflowStepStatus {
    return this.#status;
  }
  get orderIndex(): number {
    return this.#orderIndex;
  }
  get onSuccessStepId(): string | null {
    return this.#onSuccessStepId;
  }
  get onFailureStepId(): string | null {
    return this.#onFailureStepId;
  }
  get conditions(): ReadonlyArray<{ expression: string; nextStepId: string }> {
    return [...this.#conditions];
  }
  get parallelGroup(): string | null {
    return this.#parallelGroup;
  }
  get joinConfig(): JoinConfig | null {
    return this.#joinConfig ? { ...this.#joinConfig } : null;
  }
  get startedAt(): Date | null {
    return this.#startedAt;
  }
  get completedAt(): Date | null {
    return this.#completedAt;
  }
  get remarks(): string | null {
    return this.#remarks;
  }
  get tasks(): ReadonlyArray<EngineWorkflowTask> {
    return [...this.#tasks];
  }

  isCompleted(): boolean {
    return this.#status === EngineWorkflowStepStatus.COMPLETED;
  }
  isFailed(): boolean {
    return this.#status === EngineWorkflowStepStatus.FAILED;
  }
  isAllTasksCompleted(): boolean {
    return (
      this.#tasks.length > 0 &&
      this.#tasks.every((t) =>
        [
          EngineWorkflowTaskStatus.COMPLETED,
          EngineWorkflowTaskStatus.FAILED,
          EngineWorkflowTaskStatus.SKIPPED,
        ].includes(t.status),
      )
    );
  }
}
