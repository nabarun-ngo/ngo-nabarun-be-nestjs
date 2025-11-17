import { User } from 'src/modules/user/domain/model/user.model';
import { BaseDomain } from '../../../../shared/models/base-domain';
import { randomUUID } from 'crypto';

export enum TaskAssignmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export class TaskAssignment extends BaseDomain<string> {
  constructor(
    protected _id: string,
    private _taskId: string,
    private _assignedTo: User,
    private _roleName: string | null,
    private _status: TaskAssignmentStatus,
    createdAt?: Date,
    updatedAt?: Date,
    private _assignedBy?: string,
    private _acceptedAt?: Date,
    private _completedAt?: Date,
    private _notes?: string,
  ) {
    super(_id, createdAt, updatedAt);
  }

  get taskId(): string {
    return this._taskId;
  }

  get assignedTo(): User {
    return this._assignedTo;
  }

  get roleName(): string | null {
    return this._roleName;
  }

  get status(): TaskAssignmentStatus {
    return this._status;
  }

  get assignedBy(): string | undefined {
    return this._assignedBy;
  }

  get acceptedAt(): Date | undefined {
    return this._acceptedAt;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  static create(data:{
    taskId: string;
    assignedTo: User;
    roleName?: string | null;
    assignedBy?: string;
  }): TaskAssignment {
    return new TaskAssignment(
      randomUUID(),
      data.taskId,
      data.assignedTo,
      data.roleName || null,
      TaskAssignmentStatus.PENDING,
      undefined,
      undefined,
      data.assignedBy,
    );
  }

  public accept(): void {
    if (this._status !== TaskAssignmentStatus.PENDING) {
      throw new Error(`Cannot accept assignment in status: ${this._status}`);
    }
    this._status = TaskAssignmentStatus.ACCEPTED;
    this._acceptedAt = new Date();
    this.touch();
  }

  public reject(notes?: string): void {
    if (this._status !== TaskAssignmentStatus.PENDING) {
      throw new Error(`Cannot reject assignment in status: ${this._status}`);
    }
    this._status = TaskAssignmentStatus.REJECTED;
    this._notes = notes;
    this.touch();
  }

  public complete(notes?: string): void {
    if (this._status !== TaskAssignmentStatus.ACCEPTED && this._status !== TaskAssignmentStatus.PENDING) {
      throw new Error(`Cannot complete assignment in status: ${this._status}`);
    }
    this._status = TaskAssignmentStatus.COMPLETED;
    this._notes = notes;
    this._completedAt = new Date();
    this.touch();
  }

  public isCompleted(): boolean {
    return this._status === TaskAssignmentStatus.COMPLETED;
  }

  public isPending(): boolean {
    return this._status === TaskAssignmentStatus.PENDING;
  }
}

