import { AggregateRoot } from '../../../../shared/models/aggregate-root';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { randomUUID } from 'crypto';

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ACHIEVED = 'ACHIEVED',
  PARTIALLY_ACHIEVED = 'PARTIALLY_ACHIEVED',
  FAILED = 'FAILED',
}

export class GoalFilterProps {
  readonly projectId?: string;
  readonly status?: GoalStatus;
  readonly priority?: GoalPriority;
}

export class GoalProps {
  projectId: string;
  title: string;
  description?: string;
  targetValue?: number;
  targetUnit?: string;
  deadline?: Date;
  priority: GoalPriority;
  weight?: number;
  dependencies?: string[];
}

export class Goal extends AggregateRoot<string> {
  #projectId!: string;
  #title!: string;
  #description?: string;
  #targetValue?: number;
  #targetUnit?: string;
  #currentValue!: number;
  #deadline?: Date;
  #priority!: GoalPriority;
  #status!: GoalStatus;
  #weight?: number;
  #dependencies!: string[];

  private constructor(
    id: string,
    projectId: string,
    title: string,
    priority: GoalPriority,
  ) {
    super(id);
    this.#projectId = projectId;
    this.#title = title;
    this.#priority = priority;
    this.#currentValue = 0;
    this.#status = GoalStatus.NOT_STARTED;
    this.#dependencies = [];
  }

  public static create(props: GoalProps): Goal {
    if (!props.projectId || !props.title) {
      throw new BusinessException('Project ID and title are required');
    }

    if (props.targetValue !== undefined && props.targetValue <= 0) {
      throw new BusinessException('Target value must be positive');
    }

    if (props.weight !== undefined && (props.weight < 0 || props.weight > 1)) {
      throw new BusinessException('Weight must be between 0 and 1');
    }

    const goal = new Goal(
      randomUUID(),
      props.projectId,
      props.title,
      props.priority,
    );

    goal.#description = props.description;
    goal.#targetValue = props.targetValue;
    goal.#targetUnit = props.targetUnit;
    goal.#deadline = props.deadline;
    goal.#weight = props.weight;
    goal.#dependencies = props.dependencies || [];

    return goal;
  }

  public update(props: Partial<GoalProps>): void {
    if (props.title) this.#title = props.title;
    if (props.description !== undefined) this.#description = props.description;
    if (props.targetUnit !== undefined) this.#targetUnit = props.targetUnit;
    if (props.deadline !== undefined) this.#deadline = props.deadline;
    if (props.priority) this.#priority = props.priority;
    if (props.dependencies) this.#dependencies = props.dependencies;

    if (props.targetValue !== undefined) {
      if (props.targetValue <= 0) {
        throw new BusinessException('Target value must be positive');
      }
      this.#targetValue = props.targetValue;
      this.updateStatus();
    }

    if (props.weight !== undefined) {
      if (props.weight < 0 || props.weight > 1) {
        throw new BusinessException('Weight must be between 0 and 1');
      }
      this.#weight = props.weight;
    }
  }

  public updateProgress(currentValue: number): void {
    if (currentValue < 0) {
      throw new BusinessException('Current value cannot be negative');
    }

    this.#currentValue = currentValue;
    this.updateStatus();
  }

  private updateStatus(): void {
    if (!this.#targetValue) {
      this.#status = this.#currentValue > 0 ? GoalStatus.IN_PROGRESS : GoalStatus.NOT_STARTED;
      return;
    }

    if (this.#currentValue >= this.#targetValue) {
      this.#status = GoalStatus.ACHIEVED;
    } else if (this.#currentValue === 0) {
      this.#status = GoalStatus.NOT_STARTED;
    } else {
      const now = new Date();
      const deadlinePassed = this.#deadline && now > this.#deadline;
      
      if (deadlinePassed && this.#currentValue < this.#targetValue * 0.5) {
        this.#status = GoalStatus.FAILED;
      } else if (deadlinePassed) {
        this.#status = GoalStatus.PARTIALLY_ACHIEVED;
      } else {
        this.#status = GoalStatus.IN_PROGRESS;
      }
    }
  }

  // Getters
  get projectId(): string { return this.#projectId; }
  get title(): string { return this.#title; }
  get description(): string | undefined { return this.#description; }
  get targetValue(): number | undefined { return this.#targetValue; }
  get targetUnit(): string | undefined { return this.#targetUnit; }
  get currentValue(): number { return this.#currentValue; }
  get deadline(): Date | undefined { return this.#deadline; }
  get priority(): GoalPriority { return this.#priority; }
  get status(): GoalStatus { return this.#status; }
  get weight(): number | undefined { return this.#weight; }
  get dependencies(): string[] { return [...this.#dependencies]; }

  public getProgressPercentage(): number {
    if (!this.#targetValue || this.#targetValue === 0) return 0;
    return Math.min((this.#currentValue / this.#targetValue) * 100, 100);
  }

  public isAchieved(): boolean {
    return this.#status === GoalStatus.ACHIEVED;
  }

  public isFailed(): boolean {
    return this.#status === GoalStatus.FAILED;
  }
}

