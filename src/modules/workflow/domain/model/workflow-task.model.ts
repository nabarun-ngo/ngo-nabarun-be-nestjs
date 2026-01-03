import { BaseDomain } from '../../../../shared/models/base-domain';
import { TaskAssignment, TaskAssignmentStatus } from './task-assignment.model';
import { WorkflowStep } from './workflow-step.model';
import { generateUniqueNDigitNumber } from 'src/shared/utilities/password-util';
import { User } from 'src/modules/user/domain/model/user.model';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { TaskDef } from '../vo/workflow-def.vo';

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

export class TaskFilter {
  readonly assignedTo?: string;
  readonly status?: string[];
}

export class WorkflowTask extends BaseDomain<string> {

  // 🔒 All private fields
  #step: WorkflowStep;
  #workflowId: string;
  #taskId: string;
  #name: string;
  #description: string | null;
  #type: WorkflowTaskType;
  #status: WorkflowTaskStatus;
  #handler?: string;
  #checkList?: string[];
  #isAutoCloseable?: boolean;
  #jobId?: string;
  #autoCloseRefId?: string;
  #completedAt?: Date;
  #completedBy?: User;
  #failureReason?: string;

  #assignments: TaskAssignment[] = [];

  constructor(
    id: string,
    step: WorkflowStep,
    workflowId: string,
    taskId: string,
    name: string,
    description: string | null,
    type: WorkflowTaskType,
    status: WorkflowTaskStatus,
    handler?: string,
    checkList?: string[],
    isAutoCloseable?: boolean,
    jobId?: string,
    autoCloseRefId?: string,
    completedAt?: Date,
    completedBy?: User,
    failureReason?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);

    this.#step = step;
    this.#workflowId = workflowId;
    this.#taskId = taskId;
    this.#name = name;
    this.#description = description;
    this.#type = type;
    this.#status = status;
    this.#handler = handler;
    this.#checkList = checkList;
    this.#isAutoCloseable = isAutoCloseable;
    this.#jobId = jobId;
    this.#autoCloseRefId = autoCloseRefId;
    this.#completedAt = completedAt;
    this.#completedBy = completedBy;
    this.#failureReason = failureReason;
  }

  static create(workflowId: string, step: WorkflowStep, task: TaskDef): WorkflowTask {
    return new WorkflowTask(
      `NWT${generateUniqueNDigitNumber(6)}`,
      step,
      workflowId,
      task.taskId,
      task.name,
      task.description,
      task.type,
      WorkflowTaskStatus.PENDING,
      task.handler,
      task.taskDetail?.checklist,
      task.taskDetail?.isAutoCloseable,
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

  start(starter?: User): void {
    if (this.#status !== WorkflowTaskStatus.PENDING) {
      throw new BusinessException(`Cannot start task in status: ${this.#status}`);
    }
    const assignment = this.assignments.find((a) => a.assignedTo.id == starter?.id);
    if (this.requiresManualAction() && !assignment) {
      throw new BusinessException(`No assignment found for user: ${starter?.id}`);
    }
    assignment?.accept();
    this.#assignments.filter(f => f.assignedTo.id != starter?.id).forEach(a => a.remove());
    this.#status = WorkflowTaskStatus.IN_PROGRESS;

    this.touch();
  }

  complete(completedBy?: User): void {
    if (this.#status !== WorkflowTaskStatus.IN_PROGRESS) {
      throw new BusinessException(`Cannot complete task in status: ${this.#status}`);
    }
    const assignee = this.#assignments.find(a => a.assignedTo.id == completedBy?.id && a.status == TaskAssignmentStatus.ACCEPTED);
    if (this.requiresManualAction() && !assignee) {
      throw new BusinessException(`User: ${completedBy?.id} cannot act on this task.`);
    }
    this.#status = WorkflowTaskStatus.COMPLETED;
    this.#completedBy = completedBy;
    this.#completedAt = new Date();
    this.touch();
  }

  fail(reason: string, completedBy?: User): void {
    const assignee = this.#assignments.find(a => a.assignedTo.id == completedBy?.id && a.status == TaskAssignmentStatus.ACCEPTED);
    if (this.requiresManualAction() && !assignee) {
      throw new BusinessException(`User: ${completedBy?.id} cannot act on this task.`);
    }
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

  get workflowId(): string {
    return this.#workflowId;
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

  get assignedTo(): User | undefined {
    return this.#assignments.find((a) => a.status === TaskAssignmentStatus.ACCEPTED)?.assignedTo;
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

  get completedBy(): User | undefined {
    return this.#completedBy;
  }

  get failureReason(): string | undefined {
    return this.#failureReason;
  }
}
