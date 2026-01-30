import { BaseDomain } from '../../../../shared/models/base-domain';
import { randomUUID } from 'crypto';
import { EngineTaskAssignment } from './engine-task-assignment.model';
import { EngineWorkflowTaskType } from '../vo/engine-workflow-def.vo';
import { TaskDef } from '../vo/engine-workflow-def.vo';
import { BusinessException } from 'src/shared/exceptions/business-exception';

export enum EngineWorkflowTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export const completedTaskStatuses = [
  EngineWorkflowTaskStatus.COMPLETED,
  EngineWorkflowTaskStatus.FAILED,
  EngineWorkflowTaskStatus.SKIPPED,
];

export const pendingTaskStatuses = [
  EngineWorkflowTaskStatus.PENDING,
  EngineWorkflowTaskStatus.IN_PROGRESS,
];

export interface EngineWorkflowTaskProps {
  id: string;
  stepId: string;
  instanceId: string;
  taskId: string;
  name: string;
  description: string | null;
  type: EngineWorkflowTaskType;
  status: EngineWorkflowTaskStatus;
  handler?: string | null;
  taskConfig?: Record<string, unknown> | null;
  resultData?: Record<string, unknown> | null;
  completedById?: string | null;
  completedAt?: Date | null;
  remarks?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EngineWorkflowTask extends BaseDomain<string> {
  #stepId: string;
  #instanceId: string;
  #taskId: string;
  #name: string;
  #description: string | null;
  #type: EngineWorkflowTaskType;
  #status: EngineWorkflowTaskStatus;
  #handler: string | null;
  #taskConfig: Record<string, unknown> | null;
  #resultData: Record<string, unknown> | null;
  #completedById: string | null;
  #completedAt: Date | null;
  #remarks: string | null;
  #assignments: EngineTaskAssignment[] = [];
  #requireAcceptance: boolean;
  #outputKey: string | null;

  constructor(props: EngineWorkflowTaskProps, requireAcceptance = false, outputKey?: string | null) {
    super(props.id, props.createdAt, props.updatedAt);
    this.#stepId = props.stepId;
    this.#instanceId = props.instanceId;
    this.#taskId = props.taskId;
    this.#name = props.name;
    this.#description = props.description ?? null;
    this.#type = props.type;
    this.#status = props.status;
    this.#handler = props.handler ?? null;
    this.#taskConfig = props.taskConfig ?? null;
    this.#resultData = props.resultData ?? null;
    this.#completedById = props.completedById ?? null;
    this.#completedAt = props.completedAt ?? null;
    this.#remarks = props.remarks ?? null;
    this.#requireAcceptance = requireAcceptance;
    this.#outputKey = outputKey ?? null;
  }

  get outputKey(): string | null {
    return this.#outputKey;
  }

  private static buildTaskConfig(def: TaskDef): Record<string, unknown> | null {
    const base = def.taskDetail
      ? (def.taskDetail as unknown as Record<string, unknown>)
      : {};
    const withDue = { ...base, etaHours: def.etaHours, dueInDays: def.dueInDays };
    return Object.keys(withDue).some((k) => withDue[k] != null) ? withDue : null;
  }

  static create(
    instanceId: string,
    stepId: string,
    def: TaskDef,
  ): EngineWorkflowTask {
    return new EngineWorkflowTask(
      {
        id: randomUUID(),
        stepId,
        instanceId,
        taskId: def.taskId,
        name: def.name,
        description: def.description ?? null,
        type: def.type,
        status: EngineWorkflowTaskStatus.PENDING,
        handler: def.handler ?? null,
        taskConfig: this.buildTaskConfig(def),
      },
      def.requireAcceptance ?? false,
      def.outputKey ?? null,
    );
  }

  setAssignments(assignments: EngineTaskAssignment[]): void {
    this.#assignments = [...assignments];
    this.touch();
  }

  start(completedBy?: string): void {
    if (this.#status !== EngineWorkflowTaskStatus.PENDING) {
      throw new BusinessException(`Cannot start task in status: ${this.#status}`);
    }
    this.#status = EngineWorkflowTaskStatus.IN_PROGRESS;
    if (completedBy) this.#completedById = completedBy;
    this.touch();
  }

  complete(completedBy: string, remarks?: string, resultData?: Record<string, unknown>): void {
    if (completedTaskStatuses.includes(this.#status)) {
      throw new BusinessException(`Task already in terminal status: ${this.#status}`);
    }
    this.#status = EngineWorkflowTaskStatus.COMPLETED;
    this.#completedById = completedBy;
    this.#completedAt = new Date();
    this.#remarks = remarks ?? null;
    if (resultData) this.#resultData = resultData;
    this.touch();
  }

  fail(remarks: string, completedBy?: string): void {
    if (completedTaskStatuses.includes(this.#status)) {
      throw new BusinessException(`Task already in terminal status: ${this.#status}`);
    }
    this.#status = EngineWorkflowTaskStatus.FAILED;
    this.#remarks = remarks;
    if (completedBy) this.#completedById = completedBy;
    this.#completedAt = new Date();
    this.touch();
  }

  get stepId(): string {
    return this.#stepId;
  }
  get instanceId(): string {
    return this.#instanceId;
  }
  get taskId(): string {
    return this.#taskId;
  }
  get name(): string {
    return this.#name;
  }
  get description(): string | null {
    return this.#description;
  }
  get type(): EngineWorkflowTaskType {
    return this.#type;
  }
  get status(): EngineWorkflowTaskStatus {
    return this.#status;
  }
  get handler(): string | null {
    return this.#handler;
  }
  get taskConfig(): Record<string, unknown> | null {
    return this.#taskConfig ? { ...this.#taskConfig } : null;
  }
  get resultData(): Record<string, unknown> | null {
    return this.#resultData ? { ...this.#resultData } : null;
  }
  get completedById(): string | null {
    return this.#completedById;
  }
  get completedAt(): Date | null {
    return this.#completedAt;
  }
  get remarks(): string | null {
    return this.#remarks;
  }
  get assignments(): ReadonlyArray<EngineTaskAssignment> {
    return [...this.#assignments];
  }
  get requireAcceptance(): boolean {
    return this.#requireAcceptance;
  }

  isManual(): boolean {
    return this.#type === 'MANUAL';
  }
  isAutomatic(): boolean {
    return this.#type === 'AUTOMATIC';
  }
  isCompleted(): boolean {
    return this.#status === EngineWorkflowTaskStatus.COMPLETED;
  }
  isFailed(): boolean {
    return this.#status === EngineWorkflowTaskStatus.FAILED;
  }
  isAllTasksCompleted(): boolean {
    return true;
  }

  getAcceptedAssigneeId(): string | null {
    const accepted = this.#assignments.find((a) => a.isAccepted());
    return accepted ? accepted.assigneeId : null;
  }
}
