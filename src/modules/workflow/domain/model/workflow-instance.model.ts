import { AggregateRoot } from '../../../../shared/models/aggregate-root';
import { WorkflowStep } from './workflow-step.model';
import { WorkflowDefinition } from '../vo/workflow-def.vo';
import { User } from 'src/modules/user/domain/model/user.model';
import { WorkflowCreatedEvent } from '../events/workflow-created.event';
import { StepStartedEvent } from '../events/step-started.event';
import { generateUniqueNDigitNumber } from 'src/shared/utilities/password-util';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { WorkflowTaskStatus } from './workflow-task.model';
import { TaskCompletedEvent } from '../events/task-completed.event';
import { StepCompletedEvent } from '../events/step-completed.event';

export enum WorkflowInstanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// export enum WorkflowType {
//   JOIN_REQUEST = 'JOIN_REQUEST',
//   CONTACT_REQUEST = "CONTACT_REQUEST",
//   DONATION_REQUEST = "DONATION_REQUEST",

// }

export interface WorkflowFilter {
  readonly initiatedBy?: string;
  readonly initiatedFor?: string;
  readonly status?: WorkflowInstanceStatus[];
  readonly type?: string[];
  readonly delegated?: boolean;
  readonly workflowId?: string;
}


export class WorkflowInstance extends AggregateRoot<string> {

  #type: string;
  #name: string;
  #description: string;
  #status: WorkflowInstanceStatus;
  #initiatedBy?: Partial<User>;
  #initiatedFor?: Partial<User>;
  #requestData?: Record<string, string>;
  #currentStepId?: string;
  #completedAt?: Date;
  #remarks?: string;
  #steps: WorkflowStep[] = [];
  #isExternalUser: boolean | undefined;
  #externalUserEmail: string | undefined;
  #context?: Record<string, any>;


  constructor(
    protected _id: string,
    type: string,
    name: string,
    description: string,
    status: WorkflowInstanceStatus,
    initiatedBy?: Partial<User>,
    initiatedFor?: Partial<User>,
    requestData?: Record<string, string>,
    context?: Record<string, any>,
    isExternalUser?: boolean,
    externalUserEmail?: string,
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
    this.#initiatedFor = initiatedFor;
    this.#requestData = requestData;
    this.#isExternalUser = isExternalUser;
    this.#externalUserEmail = externalUserEmail;
    this.#currentStepId = currentStepId;
    this.#completedAt = completedAt;
    this.#remarks = remarks;
    this.#context = context;
  }

  static create(data: {
    type: string;
    definition: WorkflowDefinition;
    requestedBy: Partial<User>;
    data?: Record<string, any>
    requestedFor?: Partial<User>;
    forExternalUser?: boolean;
    externalUserEmail?: string;
  }) {

    if (data.forExternalUser && !data.externalUserEmail) {
      throw new BusinessException('External user email is required');
    }
    const instance = new WorkflowInstance(
      `NW${generateUniqueNDigitNumber(6)}`,
      data.type,
      data.definition.name,
      data.definition.description,
      WorkflowInstanceStatus.PENDING,
      data.requestedBy,
      data.requestedFor ?? (data.forExternalUser ? undefined : data.requestedBy),
      // If external user, then requestedFor will be undefined, need to be updated later if required
      data.data,
      data.data,
      data.forExternalUser,
      data.externalUserEmail,
    );

    data.definition.steps.forEach(step => {
      instance.addSteps(WorkflowStep.create(step));
    });

    instance.addDomainEvent(new WorkflowCreatedEvent(instance));
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
    const currentStep = this.#steps.find((s) => s.stepId === this.#currentStepId);

    if (!currentStep) {
      throw new Error(`Current step not found: ${this.#currentStepId}`);
    }

    let nextStepId: string | undefined;

    // Evaluate transitions from the current step
    for (const transition of currentStep.transitions) {
      if (this.#evaluateCondition(transition.condition)) {
        nextStepId = transition.nextStepId;
        break;
      }
    }

    if (!nextStepId) {
      // If no next step is found after a step completion, the workflow is finished
      this.complete();
      return;
    }

    this.#currentStepId = nextStepId;
    const nextStep = this.#steps.find((s) => s.stepId === this.#currentStepId);

    if (!nextStep) {
      throw new Error(`Next step not found: ${this.#currentStepId}`);
    }
    nextStep.currentOrderIndex = currentStep.orderIndex + 1;
    nextStep.start();
    this.addDomainEvent(new StepStartedEvent(nextStep.id, this.id, nextStep.id));
    this.touch();
  }

  #evaluateCondition(expression: string): boolean {
    if (expression === 'default' || !expression) return true;

    try {
      // Create a context for evaluation that includes requestData and any other context
      const evaluationContext = {
        ...this.#requestData,
        ...this.#context,
      };

      // Simple evaluation using Function constructor
      // Security Note: In a production environment with untrusted users, 
      // use a safer expression evaluator like 'expr-eval' or 'jexl'.
      const fn = new Function(
        'context',
        `with(context) { return ${expression}; }`,
      );
      return Boolean(fn(evaluationContext));
    } catch (error) {
      console.error(`Error evaluating condition "${expression}":`, error);
      return false;
    }
  }

  updateTask(
    taskId: string,
    status: WorkflowTaskStatus,
    user?: Partial<User>,
    remarks?: string,
    data?: Record<string, any>,
  ) {
    const step = this.steps.find(s => s.stepId === this.#currentStepId);
    const task = step?.tasks?.find(t => t.id === taskId);

    if (!task) {
      throw new BusinessException(`Task not found: ${taskId}`);
    }

    // Check if task can be completed
    if (task.status === WorkflowTaskStatus.COMPLETED) {
      throw new BusinessException(`Task is already completed: ${task.id}`);
    }

    switch (status) {
      case WorkflowTaskStatus.IN_PROGRESS:
        task.start(user);
        break;
      case WorkflowTaskStatus.COMPLETED:
        task.complete(user, remarks, data);
        if (data) {
          this.#mergeResultIntoContext(task.taskId, data);
        }
        break;
      case WorkflowTaskStatus.FAILED:
        task.fail(remarks!, user);
        break;
      default:
        throw new BusinessException(`Invalid task status: ${status}`);
    }

    if (step?.isAllTasksCompleted()) {
      step.complete();
      this.moveToNextStep();
      this.addDomainEvent(new StepCompletedEvent(this.id, step?.id!));
      return task;
    }

    this.touch();
    this.addDomainEvent(new TaskCompletedEvent(this.id, step?.id!, task.id));
    return task;
  }

  #mergeResultIntoContext(taskId: string, data: Record<string, any>): void {
    // Preserve existing context and merge new data
    // We can also nest it under the taskId if preferred, 
    // but flat merge is often easier for expressions.
    this.#context = {
      ...this.#context,
      ...data,
      [`task_${taskId}`]: data, // Also provide a namespaced version
    };
    this.touch();
  }

  public complete(): void {
    if (this.#status === WorkflowInstanceStatus.COMPLETED) {
      throw new BusinessException(`Cannot complete workflow in status: ${this.#status}`);
    }
    this.#status = WorkflowInstanceStatus.COMPLETED;
    this.#completedAt = new Date();
    this.#currentStepId = undefined;
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

  public updateInitiatedFor(user: Partial<User>) {
    this.#initiatedFor = user;
    this.touch();
  }

  get isAllStepsCompleted(): boolean {
    return this.#steps.length > 0 && this.#steps.every(s => s.isCompleted());
  }


  // --- GETTERS (auto-picked by toJson) ---
  get name(): string { return this.#name; }

  get description(): string { return this.#description; }

  get type(): string { return this.#type; }

  get status(): WorkflowInstanceStatus { return this.#status; }

  get requestData(): Record<string, string> {
    return this.#requestData ? { ...this.#requestData } : {};
  }

  get currentStepId(): string | undefined { return this.#currentStepId; }

  get steps(): ReadonlyArray<WorkflowStep> { return [...this.#steps]; }

  get expectedSteps(): ReadonlyArray<WorkflowStep> {
    const expected: WorkflowStep[] = [];
    if (this.#steps.length === 0) return expected;

    let current = this.#steps.find((s) => s.orderIndex === 0);
    while (current) {
      expected.push(current);
      // For "expected" path, we just follow the first transition or default
      const nextId = current.transitions[0]?.nextStepId;
      current = nextId ? this.#steps.find((s) => s.stepId === nextId) : undefined;
      if (current && expected.includes(current)) break; // Prevent infinite loops
    }
    return expected;
  }

  get actualSteps(): ReadonlyArray<WorkflowStep> {
    const actual: WorkflowStep[] = [];
    if (this.#steps.length === 0) return actual;

    // Follow the steps that have actually been started or completed
    return this.#steps
      .filter((s) => s.status !== 'PENDING')
      .sort((a, b) => (a.startedAt?.getTime() || 0) - (b.startedAt?.getTime() || 0));
  }


  get initiatedBy(): Partial<User> | undefined { return this.#initiatedBy; }

  get initiatedFor(): Partial<User> | undefined { return this.#initiatedFor; }

  get completedAt(): Date | undefined { return this.#completedAt; }

  get remarks(): string | undefined { return this.#remarks; }

  get isDelegated(): boolean { return this.#initiatedBy?.id !== this.#initiatedFor?.id; }
  get isExternalUser(): boolean | undefined { return this.#isExternalUser; }
  get externalUserEmail(): string | undefined { return this.#externalUserEmail; }
  get context(): Record<string, any> | undefined { return this.#context; }
}

