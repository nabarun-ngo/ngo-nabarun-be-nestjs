import { randomUUID } from 'crypto';
import { BaseDomain } from '../../../../shared/models/base-domain';
import { StepDTO, StepTransitionsDTO } from '../vo/workflow-def.vo';
import { WorkflowTask } from './workflow-task.model';
import { WorkflowInstance } from './workflow-instance.model';
import { StepStartedEvent } from '../events/step-started.event';

export enum WorkflowStepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class WorkflowStep extends BaseDomain<string> {
  private _tasks: WorkflowTask[] = [];

  constructor(
    protected _id: string,
    private _stepId: string,
    private _name: string,
    private _description: string,
    private _status: WorkflowStepStatus,
    private _orderIndex: number,
    private _onSuccessStepId?: string,
    private _onFailureStepId?: string,

    private _completedAt?: Date,
    private _failureReason?: string,
    private _startedAt?: Date,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(_id, createdAt, updatedAt);
  }

  static create(step: StepDTO): WorkflowStep {
    const instance = new WorkflowStep(
      randomUUID(),
      step.stepId,
      step.name,
      step.description,
      WorkflowStepStatus.PENDING,
      step.orderIndex,
    );
    instance.setTransitions(step.transitions);
    return instance;
  }
  private setTransitions(transitions: StepTransitionsDTO) {
    this._onSuccessStepId = transitions.onSuccess!;
    this._onFailureStepId = transitions.onFailure!;
    this.touch();
  }

  public setTasks(tasks: WorkflowTask[]): void {
    this._tasks = [...tasks];
    this.touch();
  }

  public start(): void {
    if (this._status == WorkflowStepStatus.IN_PROGRESS) {
      throw new Error(`Cannot start step in status: ${this._status}`);
    }
    this._status = WorkflowStepStatus.IN_PROGRESS;
    this._startedAt = new Date();
    this.touch();
  }

  public complete() {
    if (this._status !== WorkflowStepStatus.IN_PROGRESS) {
      throw new Error(`Cannot complete step in status: ${this._status}`);
    }
    this._status = WorkflowStepStatus.COMPLETED;
    this._completedAt = new Date();
    this.touch();
    return this._onSuccessStepId;
  }

  public fail(reason: string) {
    this._status = WorkflowStepStatus.FAILED;
    this._failureReason = reason;
    this.touch();
    return this._onFailureStepId;
  }

  public isCompleted(): boolean {
    return this._status === WorkflowStepStatus.COMPLETED;
  }

  public isFailed(): boolean {
    return this._status === WorkflowStepStatus.FAILED;
  }

  public isAllTasksCompleted(): boolean {
    return this._tasks.length > 0 && this._tasks.every(task => task.isCompleted());
  }

  get stepId(): string {
    return this._stepId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get status(): WorkflowStepStatus {
    return this._status;
  }

  get orderIndex(): number {
    return this._orderIndex;
  }

  get tasks(): ReadonlyArray<WorkflowTask> {
    return [...this._tasks];
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  get onSuccessStepId(): string | undefined {
    return this._onSuccessStepId;
  }

  get onFailureStepId(): string | undefined {
    return this._onFailureStepId
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  get startedAt(): Date | undefined {
    return this._startedAt;
  }
}

