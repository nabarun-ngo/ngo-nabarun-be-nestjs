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

  // 🔒 All private fields
  #step: WorkflowStep;
  #taskId: string;
  #name: string;
  #description: string | null;
  #type: WorkflowTaskType;
  #status: WorkflowTaskStatus;
  #handler?: string;
  #checkList?: string[];
  #isAutoCloseable?: boolean;
  #assignedTo?: AssignedToDTO;
  #jobId?: string;
  #autoCloseRefId?: string;
  #completedAt?: Date;
  #completedBy?: string;
  #failureReason?: string;

  #assignments: TaskAssignment[] = [];

  constructor(
    id: string,
    step: WorkflowStep,
    taskId: string,
    name: string,
    description: string | null,
    type: WorkflowTaskType,
    status: WorkflowTaskStatus,
    handler?: string,
    checkList?: string[],
    isAutoCloseable?: boolean,
    assignedTo?: AssignedToDTO,
    jobId?: string,
    autoCloseRefId?: string,
    completedAt?: Date,
    completedBy?: string,
    failureReason?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);

    this.#step = step;
    this.#taskId = taskId;
    this.#name = name;
    this.#description = description;
    this.#type = type;
    this.#status = status;
    this.#handler = handler;
    this.#checkList = checkList;
    this.#isAutoCloseable = isAutoCloseable;
    this.#assignedTo = assignedTo;
    this.#jobId = jobId;
    this.#autoCloseRefId = autoCloseRefId;
    this.#completedAt = completedAt;
    this.#completedBy = completedBy;
    this.#failureReason = failureReason;
  }

  static create(step: WorkflowStep, task: TaskDTO): WorkflowTask {
    return new WorkflowTask(
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
  }

  // 🔧 Mutators
  addAssignment(assignment: TaskAssignment): void {
    this.#assignments.push(assignment);
    this.touch();
  }

  setAssignments(assignments: TaskAssignment[]): void {
    this.#assignments = [...assignments];
    this.touch();
  }

  start(): void {
    if (this.#status !== WorkflowTaskStatus.PENDING) {
      throw new Error(`Cannot start task in status: ${this.#status}`);
    }
    this.#status = WorkflowTaskStatus.IN_PROGRESS;
    this.touch();
  }

  complete(completedBy?: string): void {
    if (this.#status !== WorkflowTaskStatus.IN_PROGRESS && this.#status !== WorkflowTaskStatus.PENDING) {
      throw new Error(`Cannot complete task in status: ${this.#status}`);
    }
    this.#status = WorkflowTaskStatus.COMPLETED;
    this.#completedBy = completedBy;
    this.#completedAt = new Date();
    this.touch();
  }

  fail(reason: string): void {
    this.#status = WorkflowTaskStatus.FAILED;
    this.#failureReason = reason;
    this.touch();
  }

  setJobId(jobId: string): void {
    this.#jobId = jobId;
    this.touch();
  }

  // 🔍 Query Methods
  isCompleted(): boolean {
    return this.#status === WorkflowTaskStatus.COMPLETED;
  }

  isAutomatic(): boolean {
    return this.#type === WorkflowTaskType.AUTOMATIC;
  }

  requiresManualAction(): boolean {
    return this.#type !== WorkflowTaskType.AUTOMATIC;
  }

  // 🔓 Getters (Public Read-Only API)
  get stepId(): string {
    return this.#step.stepId;
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

  get type(): WorkflowTaskType {
    return this.#type;
  }

  get status(): WorkflowTaskStatus {
    return this.#status;
  }

  get handler(): string | undefined {
    return this.#handler;
  }

  get checkList(): string[] | undefined {
    return this.#checkList;
  }

  get isAutoCloseable(): boolean | undefined {
    return this.#isAutoCloseable;
  }

  get autoCloseRefId(): string | undefined {
    return this.#autoCloseRefId;
  }

  get assignedTo(): AssignedToDTO | undefined {
    return this.#assignedTo;
  }

  get jobId(): string | undefined {
    return this.#jobId;
  }

  get assignments(): TaskAssignment[] {
    return [...this.#assignments];
  }

  get completedAt(): Date | undefined {
    return this.#completedAt;
  }

  get completedBy(): string | undefined {
    return this.#completedBy;
  }

  get failureReason(): string | undefined {
    return this.#failureReason;
  }
}
