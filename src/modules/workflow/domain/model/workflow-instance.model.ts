import { randomUUID } from 'crypto';
import { AggregateRoot } from '../../../../shared/models/aggregate-root';
import { WorkflowStep } from './workflow-step.model';
import { WorkflowDefinition } from '../vo/workflow-def.vo';
import { User } from 'src/modules/user/domain/model/user.model';
import { WorkflowCreatedEvent } from '../events/workflow-created.event';
import { StepStartedEvent } from '../events/step-started.event';
import { generateUniqueNDigitNumber } from 'src/shared/utilities/password-util';

export enum WorkflowInstanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum WorkflowType {
  JOIN_REQUEST = 'JOIN_REQUEST',

}

export interface WorkflowFilter {
  readonly initiatedBy?: string;
  readonly initiatedFor?: string;
  readonly status?: string;
  readonly type?: string;
}


export class WorkflowInstance extends AggregateRoot<string> {

  #type: WorkflowType;
  #name: string;
  #description: string;
  #status: WorkflowInstanceStatus;
  #initiatedBy?: User;
  #initiatedFor?: User;
  #requestData?: Record<string, string>;
  #currentStepId?: string;
  #completedAt?: Date;
  #remarks?: string;
  #steps: WorkflowStep[] = [];

  constructor(
    protected _id: string,
    type: WorkflowType,
    name: string,
    description: string,
    status: WorkflowInstanceStatus,
    initiatedBy?: User,
    initiatedFor?: User,
    requestData?: Record<string, string>,
    currentStepId?: string,
    completedAt?: Date,
    remarks?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(_id, createdAt, updatedAt);

    this.#type = type;
    this.#name = name;
    this.#description = description;
    this.#status = status;
    this.#initiatedBy = initiatedBy;
    this.#initiatedFor = initiatedFor ?? initiatedBy;
    this.#requestData = requestData;
    this.#currentStepId = currentStepId;
    this.#completedAt = completedAt;
    this.#remarks = remarks;
  }

  static create(data: { 
    type: WorkflowType; 
    definition: WorkflowDefinition;
    requestedBy: string;
    data?: Record<string, any>
    requestedFor?: string;
  }) {
    const instance = new WorkflowInstance(
      `NW${generateUniqueNDigitNumber(6)}`,
      data.type,
      data.definition.name,
      data.definition.description,
      WorkflowInstanceStatus.PENDING,
      new User(data.requestedBy,'','',''),
      data.requestedFor ? new User(data.requestedFor,'','','') : undefined,
      data.data,
    );

    data.definition.steps.forEach(step => {
      instance.addSteps(WorkflowStep.create(step));
    });

    instance.addDomainEvent(new WorkflowCreatedEvent(instance.id));
    return instance;
  }

  public addSteps(step: WorkflowStep): void {
    this.#steps.push(step);
    this.touch();
  }

  public start(): void {
    this.#status = WorkflowInstanceStatus.IN_PROGRESS;

    this.#currentStepId = this.steps.find(s => s.orderIndex === 0)?.stepId;

    const step = this.steps.find(s => s.stepId === this.#currentStepId);
    step?.start();

    this.addDomainEvent(new StepStartedEvent(step?.id!, this.id, step?.id!));
    this.touch();
  }

  public moveToNextStep(): void {
    const current = this.steps.find(s => s.stepId === this.#currentStepId);

    if (!current) {
      this.complete();
      return;
    }

    if (current.isCompleted()) {
      this.#currentStepId = current.onSuccessStepId;
    } else if (current.isFailed()) {
      this.#currentStepId = current.onFailureStepId;
    }

    const step = this.steps.find(s => s.stepId === this.#currentStepId);
    step?.start();

    this.addDomainEvent(new StepStartedEvent(step?.id!, this.id, step?.id!));
    this.touch();
  }

  public complete(): void {
    if (this.#status === WorkflowInstanceStatus.COMPLETED) {
      throw new Error(`Cannot complete workflow in status: ${this.#status}`);
    }
    this.#status = WorkflowInstanceStatus.COMPLETED;
    this.#completedAt = new Date();
    this.touch();
  }

  public fail(reason: string): void {
    this.#status = WorkflowInstanceStatus.FAILED;
    this.#remarks = reason;
    this.touch();
  }

  public cancel(reason: string): void {
    this.#status = WorkflowInstanceStatus.CANCELLED;
    this.#remarks = reason;
    this.touch();
  }

  // --- GETTERS (auto-picked by toJson) ---
  get name(): string { return this.#name; }

  get description(): string { return this.#description; }

  get type(): WorkflowType { return this.#type; }

  get status(): WorkflowInstanceStatus { return this.#status; }

  get requestData(): Record<string, string> {
    return this.#requestData ? { ...this.#requestData } : {};
  }

  get currentStepId(): string | undefined { return this.#currentStepId; }

  get steps(): ReadonlyArray<WorkflowStep> { return [...this.#steps]; }

  get initiatedBy(): User | undefined { return this.#initiatedBy; }

  get initiatedFor(): User | undefined { return this.#initiatedFor; }

  get completedAt(): Date | undefined { return this.#completedAt; }

  get remarks(): string | undefined { return this.#remarks; }
}

