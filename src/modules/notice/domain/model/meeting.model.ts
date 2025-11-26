import { AggregateRoot } from 'src/shared/models/aggregate-root';
import { BusinessException } from 'src/shared/exceptions/business-exception';

export enum MeetingType {
  OFFLINE = 'OFFLINE',
  ONLINE_VIDEO = 'ONLINE_VIDEO',
  ONLINE_AUDIO = 'ONLINE_AUDIO',
}

export enum MeetingStatus {
  CREATED_L = 'CREATED_L',      // Created locally
  CREATED_G = 'CREATED_G',      // Created in Google Calendar
  FAILED_L = 'FAILED_L',        // Failed to create locally
  FAILED_G = 'FAILED_G',        // Failed to create in Google Calendar
  UPDATED_L = 'UPDATED_L',      // Updated locally
  UPDATED_G = 'UPDATED_G',      // Updated in Google Calendar
}

export enum MeetingRefType {
  NOTICE = 'NOTICE',
  EVENT = 'EVENT',
}

/**
 * Meeting Domain Model (Aggregate Root)
 * Represents a meeting in the system
 * All business logic and validations are in this domain model
 */
export class Meeting extends AggregateRoot<string> {
  // Private fields for encapsulation
  #extMeetingId: string | undefined;
  #meetingSummary: string;
  #meetingDescription: string | undefined;
  #meetingLocation: string | undefined;
  #meetingDate: Date;
  #meetingStartTime: string | undefined;
  #meetingEndTime: string | undefined;
  #meetingRefId: string | undefined;
  #meetingType: MeetingType;
  #status: MeetingStatus;
  #attendeeIds: string[];
  #meetingRemarks: string | undefined;
  #meetingRefType: MeetingRefType | undefined;
  #extAudioConferenceLink: string | undefined;
  #extVideoConferenceLink: string | undefined;
  #extHtmlLink: string | undefined;
  #creatorEmail: string | undefined;
  #extConferenceStatus: string | undefined;

  constructor(
    id: string,
    meetingSummary: string,
    meetingDate: Date,
    meetingType: MeetingType,
    status: MeetingStatus,
    meetingDescription?: string,
    meetingLocation?: string,
    meetingStartTime?: string,
    meetingEndTime?: string,
    meetingRefId?: string,
    attendeeIds: string[] = [],
    meetingRemarks?: string,
    meetingRefType?: MeetingRefType,
    extMeetingId?: string,
    extAudioConferenceLink?: string,
    extVideoConferenceLink?: string,
    extHtmlLink?: string,
    creatorEmail?: string,
    extConferenceStatus?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#extMeetingId = extMeetingId;
    this.#meetingSummary = meetingSummary;
    this.#meetingDescription = meetingDescription;
    this.#meetingLocation = meetingLocation;
    this.#meetingDate = meetingDate;
    this.#meetingStartTime = meetingStartTime;
    this.#meetingEndTime = meetingEndTime;
    this.#meetingRefId = meetingRefId;
    this.#meetingType = meetingType;
    this.#status = status;
    this.#attendeeIds = attendeeIds;
    this.#meetingRemarks = meetingRemarks;
    this.#meetingRefType = meetingRefType;
    this.#extAudioConferenceLink = extAudioConferenceLink;
    this.#extVideoConferenceLink = extVideoConferenceLink;
    this.#extHtmlLink = extHtmlLink;
    this.#creatorEmail = creatorEmail;
    this.#extConferenceStatus = extConferenceStatus;
  }

  /**
   * Factory method to create a new Meeting
   * Business validation: meetingSummary required
   */
  static create(props: {
    meetingSummary: string;
    meetingDate: Date;
    meetingType: MeetingType;
    meetingDescription?: string;
    meetingLocation?: string;
    meetingStartTime?: string;
    meetingEndTime?: string;
    meetingRefId?: string;
    attendeeIds?: string[];
    meetingRemarks?: string;
    meetingRefType?: MeetingRefType;
    creatorEmail?: string;
  }): Meeting {
    if (!props.meetingSummary || props.meetingSummary.trim().length === 0) {
      throw new BusinessException('Meeting summary is required');
    }
    if (!props.meetingDate) {
      throw new BusinessException('Meeting date is required');
    }

    return new Meeting(
      crypto.randomUUID(),
      props.meetingSummary,
      props.meetingDate,
      props.meetingType,
      MeetingStatus.CREATED_L,
      props.meetingDescription,
      props.meetingLocation,
      props.meetingStartTime,
      props.meetingEndTime,
      props.meetingRefId,
      props.attendeeIds || [],
      props.meetingRemarks,
      props.meetingRefType,
      undefined, // extMeetingId
      undefined, // extAudioConferenceLink
      undefined, // extVideoConferenceLink
      undefined, // extHtmlLink
      props.creatorEmail,
      undefined, // extConferenceStatus
      new Date(),
      new Date(),
    );
  }

  /**
   * Update meeting details
   */
  update(props: {
    meetingSummary?: string;
    meetingDescription?: string;
    meetingLocation?: string;
    meetingDate?: Date;
    meetingStartTime?: string;
    meetingEndTime?: string;
    meetingRemarks?: string;
    attendeeIds?: string[];
  }): void {
    if (props.meetingSummary !== undefined) {
      if (!props.meetingSummary || props.meetingSummary.trim().length === 0) {
        throw new BusinessException('Meeting summary cannot be empty');
      }
      this.#meetingSummary = props.meetingSummary;
    }
    if (props.meetingDescription !== undefined) {
      this.#meetingDescription = props.meetingDescription;
    }
    if (props.meetingLocation !== undefined) {
      this.#meetingLocation = props.meetingLocation;
    }
    if (props.meetingDate !== undefined) {
      this.#meetingDate = props.meetingDate;
    }
    if (props.meetingStartTime !== undefined) {
      this.#meetingStartTime = props.meetingStartTime;
    }
    if (props.meetingEndTime !== undefined) {
      this.#meetingEndTime = props.meetingEndTime;
    }
    if (props.meetingRemarks !== undefined) {
      this.#meetingRemarks = props.meetingRemarks;
    }
    if (props.attendeeIds !== undefined) {
      this.#attendeeIds = props.attendeeIds;
    }
    this.touch();
  }

  /**
   * Mark meeting as created in Google Calendar
   */
  markCreatedInGoogle(extMeetingId: string, extHtmlLink?: string): void {
    this.#extMeetingId = extMeetingId;
    this.#status = MeetingStatus.CREATED_G;
    if (extHtmlLink) {
      this.#extHtmlLink = extHtmlLink;
    }
    this.touch();
  }

  /**
   * Mark meeting creation as failed
   */
  markCreationFailed(inGoogle: boolean = false): void {
    this.#status = inGoogle ? MeetingStatus.FAILED_G : MeetingStatus.FAILED_L;
    this.touch();
  }

  /**
   * Mark meeting as updated
   */
  markUpdated(inGoogle: boolean = false): void {
    this.#status = inGoogle ? MeetingStatus.UPDATED_G : MeetingStatus.UPDATED_L;
    this.touch();
  }

  /**
   * Add attendee
   */
  addAttendee(userId: string): void {
    if (!this.#attendeeIds.includes(userId)) {
      this.#attendeeIds.push(userId);
      this.touch();
    }
  }

  /**
   * Remove attendee
   */
  removeAttendee(userId: string): void {
    this.#attendeeIds = this.#attendeeIds.filter(id => id !== userId);
    this.touch();
  }

  /**
   * Set conference links
   */
  setConferenceLinks(props: {
    audioLink?: string;
    videoLink?: string;
    htmlLink?: string;
    status?: string;
  }): void {
    if (props.audioLink !== undefined) {
      this.#extAudioConferenceLink = props.audioLink;
    }
    if (props.videoLink !== undefined) {
      this.#extVideoConferenceLink = props.videoLink;
    }
    if (props.htmlLink !== undefined) {
      this.#extHtmlLink = props.htmlLink;
    }
    if (props.status !== undefined) {
      this.#extConferenceStatus = props.status;
    }
    this.touch();
  }

  // Getters
  get extMeetingId(): string | undefined { return this.#extMeetingId; }
  get meetingSummary(): string { return this.#meetingSummary; }
  get meetingDescription(): string | undefined { return this.#meetingDescription; }
  get meetingLocation(): string | undefined { return this.#meetingLocation; }
  get meetingDate(): Date { return this.#meetingDate; }
  get meetingStartTime(): string | undefined { return this.#meetingStartTime; }
  get meetingEndTime(): string | undefined { return this.#meetingEndTime; }
  get meetingRefId(): string | undefined { return this.#meetingRefId; }
  get meetingType(): MeetingType { return this.#meetingType; }
  get status(): MeetingStatus { return this.#status; }
  get attendeeIds(): string[] { return [...this.#attendeeIds]; }
  get meetingRemarks(): string | undefined { return this.#meetingRemarks; }
  get meetingRefType(): MeetingRefType | undefined { return this.#meetingRefType; }
  get extAudioConferenceLink(): string | undefined { return this.#extAudioConferenceLink; }
  get extVideoConferenceLink(): string | undefined { return this.#extVideoConferenceLink; }
  get extHtmlLink(): string | undefined { return this.#extHtmlLink; }
  get creatorEmail(): string | undefined { return this.#creatorEmail; }
  get extConferenceStatus(): string | undefined { return this.#extConferenceStatus; }
}

