import { AggregateRoot } from '../../../../shared/models/aggregate-root';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { randomUUID } from 'crypto';

export enum ProjectTeamMemberRole {
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  COORDINATOR = 'COORDINATOR',
  VOLUNTEER = 'VOLUNTEER',
  CONSULTANT = 'CONSULTANT',
  OTHER = 'OTHER',
}

export class ProjectTeamMemberFilterProps {
  readonly projectId?: string;
  readonly userId?: string;
  readonly isActive?: boolean;
  readonly role?: ProjectTeamMemberRole;
}

export class ProjectTeamMemberProps {
  projectId: string;
  userId: string;
  role: ProjectTeamMemberRole;
  responsibilities?: string;
  startDate: Date;
  endDate?: Date;
  hoursAllocated?: number;
}

export class ProjectTeamMember extends AggregateRoot<string> {
  #projectId!: string;
  #userId!: string;
  #role!: ProjectTeamMemberRole;
  #responsibilities?: string;
  #startDate!: Date;
  #endDate?: Date;
  #hoursAllocated?: number;
  #isActive!: boolean;

  private constructor(
    id: string,
    projectId: string,
    userId: string,
    role: ProjectTeamMemberRole,
    startDate: Date,
  ) {
    super(id);
    this.#projectId = projectId;
    this.#userId = userId;
    this.#role = role;
    this.#startDate = startDate;
    this.#isActive = true;
  }

  public static create(props: ProjectTeamMemberProps): ProjectTeamMember {
    if (!props.projectId || !props.userId || !props.role) {
      throw new BusinessException('Project ID, User ID, and role are required');
    }

    if (props.endDate && props.endDate <= props.startDate) {
      throw new BusinessException('End date must be after start date');
    }

    if (props.hoursAllocated !== undefined && props.hoursAllocated <= 0) {
      throw new BusinessException('Hours allocated must be positive');
    }

    const member = new ProjectTeamMember(
      randomUUID(),
      props.projectId,
      props.userId,
      props.role,
      props.startDate,
    );

    member.#responsibilities = props.responsibilities;
    member.#endDate = props.endDate;
    member.#hoursAllocated = props.hoursAllocated;

    return member;
  }

  public update(props: Partial<ProjectTeamMemberProps>): void {
    if (props.role) this.#role = props.role;
    if (props.responsibilities !== undefined) this.#responsibilities = props.responsibilities;
    if (props.hoursAllocated !== undefined) {
      if (props.hoursAllocated <= 0) {
        throw new BusinessException('Hours allocated must be positive');
      }
      this.#hoursAllocated = props.hoursAllocated;
    }

    if (props.endDate !== undefined) {
      if (props.endDate && props.endDate <= this.#startDate) {
        throw new BusinessException('End date must be after start date');
      }
      this.#endDate = props.endDate;
      if (props.endDate) {
        this.#isActive = false;
      }
    }
  }

  public deactivate(): void {
    this.#isActive = false;
    if (!this.#endDate) {
      this.#endDate = new Date();
    }
  }

  public activate(): void {
    this.#isActive = true;
    this.#endDate = undefined;
  }

  // Getters
  get projectId(): string { return this.#projectId; }
  get userId(): string { return this.#userId; }
  get role(): ProjectTeamMemberRole { return this.#role; }
  get responsibilities(): string | undefined { return this.#responsibilities; }
  get startDate(): Date { return this.#startDate; }
  get endDate(): Date | undefined { return this.#endDate; }
  get hoursAllocated(): number | undefined { return this.#hoursAllocated; }
  get isActive(): boolean { return this.#isActive; }
}

