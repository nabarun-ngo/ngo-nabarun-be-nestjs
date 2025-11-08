import { randomUUID } from 'crypto';
import { AggregateRoot } from '../../../../shared/models/aggregate-root';
import { WorkflowStep } from './workflow-step.model';
import { WorkflowDefinition } from '../vo/workflow-def.vo';
import { User } from 'src/modules/user/domain/model/user.model';
import { WorkflowCreatedEvent } from '../events/workflow-created.event';
import { StepStartedEvent } from '../events/step-started.event';

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

export class WorkflowInstance extends AggregateRoot<string> {
  private _steps: WorkflowStep[] = [];

  constructor(
    protected _id: string,
    private _type: WorkflowType,
    private _name: string,
    private _description: string,
    private _status: WorkflowInstanceStatus,
    private _initiatedBy?: User,
    private _initiatedFor?: User,
    private _requestData?: Record<string, string>,
    private _currentStepId?: string,
    private _completedAt?: Date,
    private _remarks?: string,
    _createdAt?: Date,
    _updatedAt?: Date,
  ) {
    super(_id);
  }

  static create(data: {
    type: WorkflowType;
    definition: WorkflowDefinition;
  }) {
    const instance = new WorkflowInstance(
      randomUUID(),
      data.type,
      data.definition.name,
      data.definition.description,
      WorkflowInstanceStatus.PENDING,
    );
    data.definition.steps.forEach(step => {
      instance.addSteps(WorkflowStep.create(step))
    })
    instance.addDomainEvent(new WorkflowCreatedEvent(instance.id, instance))
    return instance;
  }

  public addSteps(step: WorkflowStep): void {
    this._steps.push(step);
    this.touch();
  }

  public start(): void {
    this._status = WorkflowInstanceStatus.IN_PROGRESS;
    this._currentStepId = this.steps.find(f => f.orderIndex == 0)?.stepId;
    const step = this.steps.find(f => f.stepId == this._currentStepId);
    step?.start();
    this.addDomainEvent(new StepStartedEvent(step?.id!, this.id, step!));
    this.touch();
  }

  public moveToNextStep(): void {
    const currentStep = this.steps.find(f => f.stepId == this._currentStepId);
    if (!currentStep) {
      this.complete();
      return;
    }
    
    if (currentStep?.isCompleted()) {
      //ON_SUCCESS : Update the current step id to next 
      this._currentStepId = currentStep.onSuccessStepId;
      const step=this.steps.find(f => f.stepId == this._currentStepId);
      step?.start()
      this.addDomainEvent(new StepStartedEvent(step?.id!, this.id, step!));
      this.touch();
    }
    if (currentStep?.isFailed()) {
      //ON_ERROR : Update the current step id to next 
      this._currentStepId = currentStep.onFailureStepId;
      const step=this.steps.find(f => f.stepId == this._currentStepId);
      step?.start()
      this.addDomainEvent(new StepStartedEvent(step?.id!, this.id, step!));
      this.touch();
    }

  }

  public complete(): void {
    if (this._status == WorkflowInstanceStatus.COMPLETED) {
      throw new Error(`Cannot complete workflow in status: ${this._status}`);
    }
    this._status = WorkflowInstanceStatus.COMPLETED;
    this._completedAt = new Date();
    this.touch();
  }

  public fail(reason: string): void {
    this._status = WorkflowInstanceStatus.FAILED;
    this._remarks = reason;
    this.touch();
  }

  public cancel(reason: string): void {
    this._status = WorkflowInstanceStatus.CANCELLED;
    this._remarks = reason;
    this.touch();
  }


  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get type(): WorkflowType {
    return this._type;
  }

  get status(): WorkflowInstanceStatus {
    return this._status;
  }

  get requestData(): Record<string, any> {
    return { ...this._requestData };
  }

  get currentStepId(): string | undefined {
    return this._currentStepId;
  }

  get steps(): ReadonlyArray<WorkflowStep> {
    return [...this._steps];
  }

  get initiatedBy(): User | undefined {
    return this._initiatedBy;
  }

  get initiatedFor(): User | undefined {
    return this._initiatedFor;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  get remarks(): string | undefined {
    return this._remarks;
  }

}

