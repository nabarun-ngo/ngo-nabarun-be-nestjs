import { AggregateRoot } from 'src/shared/models/aggregate-root';
import { BusinessException } from 'src/shared/exceptions/business-exception';

export enum NoticeStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DRAFT = 'DRAFT',
}

/**
 * Notice Domain Model (Aggregate Root)
 * Represents a notice/announcement in the system
 * All business logic and validations are in this domain model
 */
export class Notice extends AggregateRoot<string> {
  // Private fields for encapsulation
  #title: string;
  #description: string;
  #creatorId: string;
  #creatorRoleCode: string | undefined;
  #noticeDate: Date;
  #publishDate: Date | undefined;
  #status: NoticeStatus;
  #hasMeeting: boolean;
  #meetingId: string | undefined;

  constructor(
    id: string,
    title: string,
    description: string,
    creatorId: string,
    noticeDate: Date,
    status: NoticeStatus,
    creatorRoleCode?: string,
    publishDate?: Date,
    hasMeeting: boolean = false,
    meetingId?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#title = title;
    this.#description = description;
    this.#creatorId = creatorId;
    this.#creatorRoleCode = creatorRoleCode;
    this.#noticeDate = noticeDate;
    this.#publishDate = publishDate;
    this.#status = status;
    this.#hasMeeting = hasMeeting;
    this.#meetingId = meetingId;
  }

  /**
   * Factory method to create a new Notice
   * Business validation: title and description required
   */
  static create(props: {
    title: string;
    description: string;
    creatorId: string;
    creatorRoleCode?: string;
    noticeDate?: Date;
    hasMeeting?: boolean;
    meetingId?: string;
  }): Notice {
    if (!props.title || props.title.trim().length === 0) {
      throw new BusinessException('Notice title is required');
    }
    if (!props.description || props.description.trim().length === 0) {
      throw new BusinessException('Notice description is required');
    }
    if (!props.creatorId) {
      throw new BusinessException('Creator ID is required');
    }

    return new Notice(
      crypto.randomUUID(),
      props.title,
      props.description,
      props.creatorId,
      props.noticeDate || new Date(),
      NoticeStatus.DRAFT,
      props.creatorRoleCode,
      undefined, // publishDate
      props.hasMeeting || false,
      props.meetingId,
      new Date(),
      new Date(),
    );
  }

  /**
   * Publish notice
   * Business validation: Can only publish draft notices
   */
  publish(): void {
    if (this.#status !== NoticeStatus.DRAFT) {
      throw new BusinessException('Can only publish draft notices');
    }
    this.#status = NoticeStatus.ACTIVE;
    this.#publishDate = new Date();
    this.touch();
  }

  /**
   * Expire notice
   * Business validation: Can only expire active notices
   */
  expire(): void {
    if (this.#status !== NoticeStatus.ACTIVE) {
      throw new BusinessException('Can only expire active notices');
    }
    this.#status = NoticeStatus.EXPIRED;
    this.touch();
  }

  /**
   * Update notice details
   * Business validation: Can only update draft notices
   */
  update(props: {
    title?: string;
    description?: string;
    noticeDate?: Date;
  }): void {
    if (this.#status !== NoticeStatus.DRAFT) {
      throw new BusinessException('Can only update draft notices');
    }

    if (props.title !== undefined) {
      if (!props.title || props.title.trim().length === 0) {
        throw new BusinessException('Notice title cannot be empty');
      }
      this.#title = props.title;
    }
    if (props.description !== undefined) {
      if (!props.description || props.description.trim().length === 0) {
        throw new BusinessException('Notice description cannot be empty');
      }
      this.#description = props.description;
    }
    if (props.noticeDate !== undefined) {
      this.#noticeDate = props.noticeDate;
    }
    this.touch();
  }

  /**
   * Link meeting to notice
   */
  linkMeeting(meetingId: string): void {
    this.#hasMeeting = true;
    this.#meetingId = meetingId;
    this.touch();
  }

  /**
   * Unlink meeting from notice
   */
  unlinkMeeting(): void {
    this.#hasMeeting = false;
    this.#meetingId = undefined;
    this.touch();
  }

  // Getters
  get title(): string { return this.#title; }
  get description(): string { return this.#description; }
  get creatorId(): string { return this.#creatorId; }
  get creatorRoleCode(): string | undefined { return this.#creatorRoleCode; }
  get noticeDate(): Date { return this.#noticeDate; }
  get publishDate(): Date | undefined { return this.#publishDate; }
  get status(): NoticeStatus { return this.#status; }
  get hasMeeting(): boolean { return this.#hasMeeting; }
  get meetingId(): string | undefined { return this.#meetingId; }

  /**
   * Check if notice is draft
   */
  isDraft(): boolean {
    return this.#status === NoticeStatus.DRAFT;
  }

  /**
   * Check if notice is active
   */
  isActive(): boolean {
    return this.#status === NoticeStatus.ACTIVE;
  }
}

