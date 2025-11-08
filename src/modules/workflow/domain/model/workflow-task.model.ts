import { randomUUID } from 'crypto';
import { BaseDomain } from '../../../../shared/models/base-domain';
import { AssignedToDTO, TaskDTO } from '../vo/workflow-def.vo';
import { TaskAssignment } from './task-assignment.model';
import { WorkflowStep } from './workflow-step.model';

export enum WorkflowTaskType {
  VERIFICATION = 'VERIFICATION',
  APPROVAL = 'APPROVAL',
  AUTOMATIC = 'AUTOMATIC',
}

export enum WorkflowTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export class WorkflowTask extends BaseDomain<string> {

  private _assignments: TaskAssignment[] = [];

  constructor(
    protected _id: string,
    private _step: WorkflowStep,
    private _taskId: string,
    private _name: string,
    private _description: string | null,
    private _type: WorkflowTaskType,
    private _status: WorkflowTaskStatus,
    private _handler?: string,
    private _checkList?: string[],
    private _isAutoCloseable?: boolean,
    private _assignedTo?: AssignedToDTO,
    private _jobId?: string,
    private _autoCloseRefId?: string,
    private _completedAt?: Date,
    private _completedBy?: string,
    private _failureReason?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(_id, createdAt, updatedAt);
  }

  static create(step: WorkflowStep, task: TaskDTO): WorkflowTask {
    const instance = new WorkflowTask(
      randomUUID(),
      step,
      task.taskId,
      task.name,
      task.description,
      task.type,
      WorkflowTaskStatus.PENDING,
      task.handler,
      task.taskDetail?.checklist,
      task.taskDetail?.isAutoCloseable,

      task.taskDetail?.assignedTo,
    );
    return instance;
  }


  public addAssignment(assignment: TaskAssignment): void {
    this._assignments.push(assignment);
    this.touch();
  }

  public setAssignments(assignments: TaskAssignment[]): void {
    this._assignments = [...assignments];
    this.touch();
  }

  public start(): void {
    if (this._status !== WorkflowTaskStatus.PENDING) {
      throw new Error(`Cannot start task in status: ${this._status}`);
    }
    this._status = WorkflowTaskStatus.IN_PROGRESS;
    this.touch();
  }

  public complete(completedBy?: string): void {
    if (this._status !== WorkflowTaskStatus.IN_PROGRESS && this._status !== WorkflowTaskStatus.PENDING) {
      throw new Error(`Cannot complete task in status: ${this._status}`);
    }
    this._status = WorkflowTaskStatus.COMPLETED;
    this._completedBy = completedBy;
    this._completedAt = new Date();
    this.touch();
  }

  public fail(reason: string): void {
    this._status = WorkflowTaskStatus.FAILED;
    this._failureReason = reason;
    this.touch();
  }

  public setJobId(jobId: string): void {
    this._jobId = jobId;
    this.touch();
  }

  public isCompleted(): boolean {
    return this._status === WorkflowTaskStatus.COMPLETED;
  }

  public isAutomatic(): boolean {
    return this._type === WorkflowTaskType.AUTOMATIC;
  }

  public requiresManualAction(): boolean {
    return this._type !== WorkflowTaskType.AUTOMATIC;
  }

  get stepId(): string {
    return this._step.stepId;
  }

  get taskId(): string {
    return this._taskId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get type(): WorkflowTaskType {
    return this._type;
  }

  get status(): WorkflowTaskStatus {
    return this._status;
  }

  get handler(): string | undefined {
    return this._handler;
  }

  get checkList(): string[] | undefined {
    return this._checkList;
  }

  get isAutoCloseable(): boolean | undefined {
    return this._isAutoCloseable;
  }

  get autoCloseRefId(): string | undefined {
    return this._autoCloseRefId;
  }


  get assignedTo(): AssignedToDTO | undefined {
    return this._assignedTo;
  }

  get jobId(): string | undefined {
    return this._jobId;
  }

  get assignments(): TaskAssignment[] {
    return [...this._assignments];
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  get completedBy(): string | undefined {
    return this._completedBy;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

}

