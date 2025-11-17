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

  #taskId: string;
  #assignedTo: User;
  #roleName: string | null;
  #status: TaskAssignmentStatus;
  #assignedBy?: string;
  #acceptedAt?: Date;
  #completedAt?: Date;
  #notes?: string;

  constructor(
    protected _id: string,
    taskId: string,
    assignedTo: User,
    roleName: string | null,
    status: TaskAssignmentStatus,
    createdAt?: Date,
    updatedAt?: Date,
    assignedBy?: string,
    acceptedAt?: Date,
    completedAt?: Date,
    notes?: string,
  ) {
    super(_id, createdAt, updatedAt);

    this.#taskId = taskId;
    this.#assignedTo = assignedTo;
    this.#roleName = roleName;
    this.#status = status;
    this.#assignedBy = assignedBy;
    this.#acceptedAt = acceptedAt;
    this.#completedAt = completedAt;
    this.#notes = notes;
  }

  // -------- GETTERS (auto-exposed to toJson()) --------

  get taskId(): string {
    return this.#taskId;
  }

  get assignedTo(): User {
    return this.#assignedTo;
  }

  get roleName(): string | null {
    return this.#roleName;
  }

  get status(): TaskAssignmentStatus {
    return this.#status;
  }

  get assignedBy(): string | undefined {
    return this.#assignedBy;
  }

  get acceptedAt(): Date | undefined {
    return this.#acceptedAt;
  }

  get completedAt(): Date | undefined {
    return this.#completedAt;
  }

  get notes(): string | undefined {
    return this.#notes;
  }

  // -------- FACTORY --------

  static create(data: {
    taskId: string;
    assignedTo: User;
    roleName?: string | null;
    assignedBy?: string;
  }): TaskAssignment {
    return new TaskAssignment(
      randomUUID(),
      data.taskId,
      data.assignedTo,
      data.roleName ?? null,
      TaskAssignmentStatus.PENDING,
      undefined,
      undefined,
      data.assignedBy,
    );
  }

  // -------- STATE TRANSITIONS --------

  public accept(): void {
    if (this.#status !== TaskAssignmentStatus.PENDING) {
      throw new Error(`Cannot accept assignment in status: ${this.#status}`);
    }
    this.#status = TaskAssignmentStatus.ACCEPTED;
    this.#acceptedAt = new Date();
    this.touch();
  }

  public reject(notes?: string): void {
    if (this.#status !== TaskAssignmentStatus.PENDING) {
      throw new Error(`Cannot reject assignment in status: ${this.#status}`);
    }
    this.#status = TaskAssignmentStatus.REJECTED;
    this.#notes = notes;
    this.touch();
  }

  public complete(notes?: string): void {
    if (
      this.#status !== TaskAssignmentStatus.ACCEPTED &&
      this.#status !== TaskAssignmentStatus.PENDING
    ) {
      throw new Error(`Cannot complete assignment in status: ${this.#status}`);
    }
    this.#status = TaskAssignmentStatus.COMPLETED;
    this.#notes = notes;
    this.#completedAt = new Date();
    this.touch();
  }

  // -------- HELPERS --------

  public isCompleted(): boolean {
    return this.#status === TaskAssignmentStatus.COMPLETED;
  }

  public isPending(): boolean {
    return this.#status === TaskAssignmentStatus.PENDING;
  }
}
