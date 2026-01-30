import { BaseDomain } from '../../../../shared/models/base-domain';
import { randomUUID } from 'crypto';
import { BusinessException } from 'src/shared/exceptions/business-exception';

export enum EngineTaskAssignmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  REMOVED = 'REMOVED',
  SUPERSEDED = 'SUPERSEDED',
}

export enum EngineAssigneeType {
  INTERNAL = 'INTERNAL', // User exists in database
  EXTERNAL = 'EXTERNAL', // External user (email only)
}

export interface EngineTaskAssignmentProps {
  id: string;
  taskId: string;
  // Internal user
  assigneeId?: string | null;
  // External user support
  assigneeEmail?: string | null;
  assigneeName?: string | null;
  assigneeType: EngineAssigneeType;
  roleName?: string | null;
  status: EngineTaskAssignmentStatus;
  assignedById?: string | null;
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  supersededById?: string | null;
  dueAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EngineTaskAssignment extends BaseDomain<string> {
  #taskId: string;
  #assigneeId: string | null;
  #assigneeEmail: string | null;
  #assigneeName: string | null;
  #assigneeType: EngineAssigneeType;
  #roleName: string | null;
  #status: EngineTaskAssignmentStatus;
  #assignedById: string | null;
  #acceptedAt: Date | null;
  #rejectedAt: Date | null;
  #rejectionReason: string | null;
  #supersededById: string | null;
  #dueAt: Date | null;

  constructor(props: EngineTaskAssignmentProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.#taskId = props.taskId;
    this.#assigneeId = props.assigneeId ?? null;
    this.#assigneeEmail = props.assigneeEmail ?? null;
    this.#assigneeName = props.assigneeName ?? null;
    this.#assigneeType = props.assigneeType;
    this.#roleName = props.roleName ?? null;
    this.#status = props.status;
    this.#assignedById = props.assignedById ?? null;
    this.#acceptedAt = props.acceptedAt ?? null;
    this.#rejectedAt = props.rejectedAt ?? null;
    this.#rejectionReason = props.rejectionReason ?? null;
    this.#supersededById = props.supersededById ?? null;
    this.#dueAt = props.dueAt ?? null;
  }

  static create(data: {
    taskId: string;
    // For internal users
    assigneeId?: string | null;
    // For external users
    assigneeEmail?: string | null;
    assigneeName?: string | null;
    roleName?: string | null;
    assignedById?: string | null;
    dueAt?: Date | null;
  }): EngineTaskAssignment {
    // Validate: must have either assigneeId or assigneeEmail
    if (!data.assigneeId && !data.assigneeEmail) {
      throw new BusinessException(
        'Assignment must have either assigneeId (internal) or assigneeEmail (external)',
      );
    }

    // Determine assignee type
    const assigneeType = data.assigneeId
      ? EngineAssigneeType.INTERNAL
      : EngineAssigneeType.EXTERNAL;

    return new EngineTaskAssignment({
      id: randomUUID(),
      taskId: data.taskId,
      assigneeId: data.assigneeId ?? null,
      assigneeEmail: data.assigneeEmail ?? null,
      assigneeName: data.assigneeName ?? null,
      assigneeType,
      roleName: data.roleName ?? null,
      status: EngineTaskAssignmentStatus.PENDING,
      assignedById: data.assignedById ?? null,
      dueAt: data.dueAt ?? null,
    });
  }

  accept(): void {
    if (this.#status !== EngineTaskAssignmentStatus.PENDING) {
      throw new BusinessException(`Cannot accept assignment in status: ${this.#status}`);
    }
    this.#status = EngineTaskAssignmentStatus.ACCEPTED;
    this.#acceptedAt = new Date();
    this.touch();
  }

  reject(rejectionReason?: string): void {
    if (this.#status !== EngineTaskAssignmentStatus.PENDING) {
      throw new BusinessException(`Cannot reject assignment in status: ${this.#status}`);
    }
    this.#status = EngineTaskAssignmentStatus.REJECTED;
    this.#rejectedAt = new Date();
    this.#rejectionReason = rejectionReason ?? null;
    this.touch();
  }

  markSuperseded(newAssignmentId: string): void {
    this.#status = EngineTaskAssignmentStatus.SUPERSEDED;
    this.#supersededById = newAssignmentId;
    this.touch();
  }

  get taskId(): string {
    return this.#taskId;
  }
  get assigneeId(): string | null {
    return this.#assigneeId;
  }
  get assigneeEmail(): string | null {
    return this.#assigneeEmail;
  }
  get assigneeName(): string | null {
    return this.#assigneeName;
  }
  get assigneeType(): EngineAssigneeType {
    return this.#assigneeType;
  }
  get roleName(): string | null {
    return this.#roleName;
  }
  get status(): EngineTaskAssignmentStatus {
    return this.#status;
  }
  get assignedById(): string | null {
    return this.#assignedById;
  }
  get acceptedAt(): Date | null {
    return this.#acceptedAt;
  }
  get rejectedAt(): Date | null {
    return this.#rejectedAt;
  }
  get rejectionReason(): string | null {
    return this.#rejectionReason;
  }
  get supersededById(): string | null {
    return this.#supersededById;
  }
  get dueAt(): Date | null {
    return this.#dueAt;
  }

  isPending(): boolean {
    return this.#status === EngineTaskAssignmentStatus.PENDING;
  }
  isAccepted(): boolean {
    return this.#status === EngineTaskAssignmentStatus.ACCEPTED;
  }
}
