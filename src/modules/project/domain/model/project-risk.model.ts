import { AggregateRoot } from '../../../../shared/models/aggregate-root';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { randomUUID } from 'crypto';

export enum RiskCategory {
  BUDGET = 'BUDGET',
  TIMELINE = 'TIMELINE',
  RESOURCE = 'RESOURCE',
  QUALITY = 'QUALITY',
  STAKEHOLDER = 'STAKEHOLDER',
  EXTERNAL = 'EXTERNAL',
  OTHER = 'OTHER',
}

export enum RiskSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RiskProbability {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum RiskStatus {
  IDENTIFIED = 'IDENTIFIED',
  MONITORING = 'MONITORING',
  MITIGATED = 'MITIGATED',
  CLOSED = 'CLOSED',
  OCCURRED = 'OCCURRED',
}

export class ProjectRiskFilterProps {
  readonly projectId?: string;
  readonly status?: RiskStatus;
  readonly severity?: RiskSeverity;
  readonly category?: RiskCategory;
}

export class ProjectRiskProps {
  projectId: string;
  title: string;
  description?: string;
  category: RiskCategory;
  severity: RiskSeverity;
  probability: RiskProbability;
  impact?: string;
  mitigationPlan?: string;
  ownerId?: string;
  identifiedDate: Date;
  notes?: string;
}

export class ProjectRisk extends AggregateRoot<string> {
  #projectId!: string;
  #title!: string;
  #description?: string;
  #category!: RiskCategory;
  #severity!: RiskSeverity;
  #probability!: RiskProbability;
  #status!: RiskStatus;
  #impact?: string;
  #mitigationPlan?: string;
  #ownerId?: string;
  #identifiedDate!: Date;
  #resolvedDate?: Date;
  #notes?: string;

  private constructor(
    id: string,
    projectId: string,
    title: string,
    category: RiskCategory,
    severity: RiskSeverity,
    probability: RiskProbability,
    identifiedDate: Date,
  ) {
    super(id);
    this.#projectId = projectId;
    this.#title = title;
    this.#category = category;
    this.#severity = severity;
    this.#probability = probability;
    this.#identifiedDate = identifiedDate;
    this.#status = RiskStatus.IDENTIFIED;
  }

  public static create(props: ProjectRiskProps): ProjectRisk {
    if (!props.projectId || !props.title) {
      throw new BusinessException('Project ID and title are required');
    }

    const risk = new ProjectRisk(
      randomUUID(),
      props.projectId,
      props.title,
      props.category,
      props.severity,
      props.probability,
      props.identifiedDate,
    );

    risk.#description = props.description;
    risk.#impact = props.impact;
    risk.#mitigationPlan = props.mitigationPlan;
    risk.#ownerId = props.ownerId;
    risk.#notes = props.notes;

    return risk;
  }

  public update(props: Partial<ProjectRiskProps>): void {
    if (props.title) this.#title = props.title;
    if (props.description !== undefined) this.#description = props.description;
    if (props.category) this.#category = props.category;
    if (props.severity) this.#severity = props.severity;
    if (props.probability) this.#probability = props.probability;
    if (props.impact !== undefined) this.#impact = props.impact;
    if (props.mitigationPlan !== undefined) this.#mitigationPlan = props.mitigationPlan;
    if (props.ownerId !== undefined) this.#ownerId = props.ownerId;
    if (props.notes !== undefined) this.#notes = props.notes;
  }

  public updateStatus(newStatus: RiskStatus): void {
    if (newStatus === RiskStatus.CLOSED || newStatus === RiskStatus.MITIGATED) {
      if ((this.#severity === RiskSeverity.HIGH || this.#severity === RiskSeverity.CRITICAL) 
          && !this.#mitigationPlan) {
        throw new BusinessException('Cannot close high/critical risk without mitigation plan');
      }
    }

    this.#status = newStatus;

    if ((newStatus === RiskStatus.CLOSED || newStatus === RiskStatus.MITIGATED) && !this.#resolvedDate) {
      this.#resolvedDate = new Date();
    }
  }

  public markAsResolved(resolvedDate?: Date): void {
    if ((this.#severity === RiskSeverity.HIGH || this.#severity === RiskSeverity.CRITICAL) 
        && !this.#mitigationPlan) {
      throw new BusinessException('Cannot resolve high/critical risk without mitigation plan');
    }

    this.#resolvedDate = resolvedDate || new Date();
    if (this.#resolvedDate <= this.#identifiedDate) {
      throw new BusinessException('Resolved date must be after identified date');
    }
    this.#status = RiskStatus.CLOSED;
  }

  // Getters
  get projectId(): string { return this.#projectId; }
  get title(): string { return this.#title; }
  get description(): string | undefined { return this.#description; }
  get category(): RiskCategory { return this.#category; }
  get severity(): RiskSeverity { return this.#severity; }
  get probability(): RiskProbability { return this.#probability; }
  get status(): RiskStatus { return this.#status; }
  get impact(): string | undefined { return this.#impact; }
  get mitigationPlan(): string | undefined { return this.#mitigationPlan; }
  get ownerId(): string | undefined { return this.#ownerId; }
  get identifiedDate(): Date { return this.#identifiedDate; }
  get resolvedDate(): Date | undefined { return this.#resolvedDate; }
  get notes(): string | undefined { return this.#notes; }

  public isHighRisk(): boolean {
    return this.#severity === RiskSeverity.HIGH || this.#severity === RiskSeverity.CRITICAL;
  }

  public isResolved(): boolean {
    return this.#status === RiskStatus.CLOSED || this.#status === RiskStatus.MITIGATED;
  }

  public getRiskScore(): number {
    const severityScore = {
      [RiskSeverity.LOW]: 1,
      [RiskSeverity.MEDIUM]: 2,
      [RiskSeverity.HIGH]: 3,
      [RiskSeverity.CRITICAL]: 4,
    };

    const probabilityScore = {
      [RiskProbability.LOW]: 1,
      [RiskProbability.MEDIUM]: 2,
      [RiskProbability.HIGH]: 3,
    };

    return severityScore[this.#severity] * probabilityScore[this.#probability];
  }
}

