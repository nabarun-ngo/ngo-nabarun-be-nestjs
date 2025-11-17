import { randomUUID } from 'crypto';
import { BaseDomain } from '../../../../shared/models/base-domain';
import { StepDTO, StepTransitionsDTO } from '../vo/workflow-def.vo';
import { WorkflowTask } from './workflow-task.model';

export enum WorkflowStepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class WorkflowStep extends BaseDomain<string> {
  // 🔒 Pure private fields
  #stepId: string;
  #name: string;
  #description: string;
  #status: WorkflowStepStatus;
  #orderIndex: number;

  #onSuccessStepId?: string;
  #onFailureStepId?: string;

  #completedAt?: Date;
  #failureReason?: string;
  #startedAt?: Date;

  #tasks: WorkflowTask[] = [];

  constructor(
    id: string,
    stepId: string,
    name: string,
    description: string,
    status: WorkflowStepStatus,
    orderIndex: number,
    onSuccessStepId?: string,
    onFailureStepId?: string,
    completedAt?: Date,
    failureReason?: string,
    startedAt?: Date,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);

    this.#stepId = stepId;
    this.#name = name;
    this.#description = description;
    this.#status = status;
    this.#orderIndex = orderIndex;

    this.#onSuccessStepId = onSuccessStepId;
    this.#onFailureStepId = onFailureStepId;

    this.#completedAt = completedAt;
    this.#failureReason = failureReason;
    this.#startedAt = startedAt;
  }

  // -----------------------------------
  //        Factory
  // -----------------------------------

  static create(step: StepDTO): WorkflowStep {
    const instance = new WorkflowStep(
      randomUUID(),
      step.stepId,
      step.name,
      step.description,
      WorkflowStepStatus.PENDING,
      step.orderIndex,
    );

    instance.#setTransitions(step.transitions);
    return instance;
  }

  // -----------------------------------
  //        Private methods
  // -----------------------------------

  #setTransitions(transitions: StepTransitionsDTO) {
    this.#onSuccessStepId = transitions.onSuccess!;
    this.#onFailureStepId = transitions.onFailure!;
    this.touch();
  }

  // -----------------------------------
  //        Mutators
  // -----------------------------------

  setTasks(tasks: WorkflowTask[]) {
    this.#tasks = [...tasks];
    this.touch();
  }

  start() {
    if (this.#status === WorkflowStepStatus.IN_PROGRESS) {
      throw new Error(`Cannot start step in status: ${this.#status}`);
    }
    this.#status = WorkflowStepStatus.IN_PROGRESS;
    this.#startedAt = new Date();
    this.touch();
  }

  complete(): string | undefined {
    if (this.#status !== WorkflowStepStatus.IN_PROGRESS) {
      throw new Error(`Cannot complete step in status: ${this.#status}`);
    }
    this.#status = WorkflowStepStatus.COMPLETED;
    this.#completedAt = new Date();
    this.touch();
    return this.#onSuccessStepId;
  }

  fail(reason: string): string | undefined {
    this.#status = WorkflowStepStatus.FAILED;
    this.#failureReason = reason;
    this.touch();
    return this.#onFailureStepId;
  }

  // -----------------------------------
  //        Read-only API
  // -----------------------------------

  get stepId() {
    return this.#stepId;
  }

  get name() {
    return this.#name;
  }

  get description() {
    return this.#description;
  }

  get status() {
    return this.#status;
  }

  get orderIndex() {
    return this.#orderIndex;
  }

  get tasks(): ReadonlyArray<WorkflowTask> {
    return [...this.#tasks];
  }

  get completedAt() {
    return this.#completedAt;
  }

  get failureReason() {
    return this.#failureReason;
  }

  get startedAt() {
    return this.#startedAt;
  }

  get onSuccessStepId() {
    return this.#onSuccessStepId;
  }

  get onFailureStepId() {
    return this.#onFailureStepId;
  }

  // -----------------------------------
  //        Query helpers
  // -----------------------------------

  isCompleted() {
    return this.#status === WorkflowStepStatus.COMPLETED;
  }

  isFailed() {
    return this.#status === WorkflowStepStatus.FAILED;
  }

  isAllTasksCompleted() {
    return this.#tasks.length > 0 && this.#tasks.every(t => t.isCompleted());
  }
}
