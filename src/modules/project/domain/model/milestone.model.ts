import { AggregateRoot } from '../../../../shared/models/aggregate-root';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { randomUUID } from 'crypto';

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  ACHIEVED = 'ACHIEVED',
  DELAYED = 'DELAYED',
  MISSED = 'MISSED',
}

export enum MilestoneImportance {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class MilestoneFilterProps {
  readonly projectId?: string;
  readonly status?: MilestoneStatus;
  readonly importance?: MilestoneImportance;
}

export class MilestoneProps {
  projectId: string;
  name: string;
  description?: string;
  targetDate: Date;
  importance: MilestoneImportance;
  dependencies?: string[];
  notes?: string;
}

export class Milestone extends AggregateRoot<string> {
  #projectId!: string;
  #name!: string;
  #description?: string;
  #targetDate!: Date;
  #actualDate?: Date;
  #status!: MilestoneStatus;
  #importance!: MilestoneImportance;
  #dependencies!: string[];
  #notes?: string;

  private constructor(
    id: string,
    projectId: string,
    name: string,
    targetDate: Date,
    importance: MilestoneImportance,
  ) {
    super(id);
    this.#projectId = projectId;
    this.#name = name;
    this.#targetDate = targetDate;
    this.#importance = importance;
    this.#status = MilestoneStatus.PENDING;
    this.#dependencies = [];
  }

  public static create(props: MilestoneProps): Milestone {
    if (!props.projectId || !props.name || !props.targetDate) {
      throw new BusinessException('Project ID, name, and target date are required');
    }

    const milestone = new Milestone(
      randomUUID(),
      props.projectId,
      props.name,
      props.targetDate,
      props.importance,
    );

    milestone.#description = props.description;
    milestone.#dependencies = props.dependencies || [];
    milestone.#notes = props.notes;

    return milestone;
  }

  public update(props: Partial<MilestoneProps>): void {
    if (props.name) this.#name = props.name;
    if (props.description !== undefined) this.#description = props.description;
    if (props.importance) this.#importance = props.importance;
    if (props.notes !== undefined) this.#notes = props.notes;
    if (props.dependencies) this.#dependencies = props.dependencies;

    if (props.targetDate) {
      this.#targetDate = props.targetDate;
      this.updateStatus();
    }
  }

  public markAsAchieved(actualDate?: Date): void {
    this.#actualDate = actualDate || new Date();
    this.#status = MilestoneStatus.ACHIEVED;
  }

  public updateStatus(): void {
    if (this.#actualDate) {
      this.#status = MilestoneStatus.ACHIEVED;
      return;
    }

    const now = new Date();
    const daysUntilTarget = Math.ceil((this.#targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilTarget < 0) {
      // Target date has passed
      this.#status = this.#status === MilestoneStatus.IN_PROGRESS 
        ? MilestoneStatus.DELAYED 
        : MilestoneStatus.MISSED;
    } else if (daysUntilTarget <= 7) {
      // Within 7 days of target
      this.#status = MilestoneStatus.IN_PROGRESS;
    } else {
      this.#status = MilestoneStatus.PENDING;
    }
  }

  // Getters
  get projectId(): string { return this.#projectId; }
  get name(): string { return this.#name; }
  get description(): string | undefined { return this.#description; }
  get targetDate(): Date { return this.#targetDate; }
  get actualDate(): Date | undefined { return this.#actualDate; }
  get status(): MilestoneStatus { return this.#status; }
  get importance(): MilestoneImportance { return this.#importance; }
  get dependencies(): string[] { return [...this.#dependencies]; }
  get notes(): string | undefined { return this.#notes; }

  public isAchieved(): boolean {
    return this.#status === MilestoneStatus.ACHIEVED;
  }

  public isDelayed(): boolean {
    return this.#status === MilestoneStatus.DELAYED;
  }

  public isMissed(): boolean {
    return this.#status === MilestoneStatus.MISSED;
  }
}

