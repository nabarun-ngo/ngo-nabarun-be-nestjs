import { randomUUID } from 'crypto';
import { User } from 'src/modules/user/domain/model/user.model';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { AggregateRoot } from 'src/shared/models/aggregate-root';


export enum MeetingType {
    OFFLINE = 'OFFLINE',
    ONLINE = 'ONLINE',
}


export class Participant {
    name?: string;
    email: string;
    attended?: boolean;
}

export class AgendaItem {
    agenda: string;
    outcomes?: string;
}

export class Meeting extends AggregateRoot<string> {
    #extMeetingId: string | undefined;
    #summary: string;
    #type: MeetingType;
    #description?: string;
    #agenda?: AgendaItem[];
    #outcomes?: string;
    #location?: string;
    #startTime: Date;
    #endTime: Date;
    #attendees: Participant[];
    #meetLink?: string;
    #calendarLink?: string;
    #status: string;
    #hostEmail: string | undefined;
    #creator: Partial<User> | undefined;

    constructor(
        id: string,
        summary: string,
        type: MeetingType,
        description: string,
        startTime: Date,
        endTime: Date,
        agenda: AgendaItem[],
        status: string,
        location?: string,
        attendees?: Participant[],
        hostEmail?: string,
        creator?: Partial<User>,
        calendarLink?: string,
        extMeetingId?: string,
        outcomes?: string,
        meetLink?: string,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, createdAt, updatedAt);
        this.#summary = summary;
        this.#type = type;
        this.#startTime = startTime;
        this.#endTime = endTime;
        this.#calendarLink = calendarLink;
        this.#status = status;
        this.#extMeetingId = extMeetingId;
        this.#description = description;
        this.#agenda = agenda;
        this.#outcomes = outcomes;
        this.#location = location;
        this.#attendees = attendees || [];
        this.#meetLink = meetLink;
        this.#hostEmail = hostEmail;
        this.#creator = creator;
    }

    static create(op: {
        summary: string;
        description: string;
        type: MeetingType;
        startTime: Date;
        endTime: Date;
        agenda: AgendaItem[];
        status: string;
        location: string;
        attendees: Participant[],
        hostEmail?: string;
        creator?: Partial<User>;
    }) {
        if (op.endTime && op.startTime && op.endTime.getTime() < op.startTime.getTime()) {
            throw new BusinessException('End time must be after start time');
        }
        return new Meeting(
            randomUUID(),
            op.summary,
            op.type,
            op.description,
            op.startTime,
            op.endTime,
            op.agenda,
            op.status,
            op.location,
            op.attendees,
            op.hostEmail,
            op.creator
        );
    }

    update(op: {
        summary?: string;
        description?: string;
        startTime?: Date;
        endTime?: Date;
        agenda?: AgendaItem[];
        status?: string;
        location?: string;
        attendees?: Participant[],
        outcomes?: string
    }) {
        if (op.endTime && op.startTime && op.endTime.getTime() < op.startTime.getTime()) {
            throw new BusinessException('End time must be after start time');
        }

        const needUpdate = op.summary !== this.#summary ||
            op.agenda?.map((agenda) => agenda.agenda) !== this.#agenda?.map((agenda) => agenda.agenda) ||
            op.description !== this.#description ||
            op.startTime !== this.#startTime ||
            op.endTime !== this.#endTime ||
            op.location !== this.#location ||
            op.attendees?.map((attendee) => attendee.email) !== this.#attendees?.map((attendee) => attendee.email);

        this.#summary = op.summary ?? this.#summary;
        this.#agenda = op.agenda ?? this.#agenda;
        this.#description = op.description ?? this.#description;
        this.#startTime = op.startTime ?? this.#startTime;
        this.#endTime = op.endTime ?? this.#endTime;
        this.#status = op.status ?? this.#status;
        this.#location = op.location ?? this.#location;
        this.#attendees = op.attendees ?? this.#attendees;
        this.#outcomes = op.outcomes ?? this.#outcomes;
        return needUpdate;
    }

    addExtEvent(id: string, meetingLink: string, htmlLink: string) {
        this.#extMeetingId = id;
        this.#meetLink = meetingLink;
        this.#calendarLink = htmlLink;
    }

    get summary() { return this.#summary; }
    get type() { return this.#type; }
    get startTime() { return this.#startTime; }
    get endTime() { return this.#endTime; }
    get calendarLink() { return this.#calendarLink; }
    get status() { return this.#status; }
    get extMeetingId() { return this.#extMeetingId; }
    get description() { return this.#description; }
    get agenda() { return this.#agenda; }
    get outcomes() { return this.#outcomes; }
    get location() { return this.#location; }
    get attendees() { return this.#attendees; }
    get meetLink() { return this.#meetLink; }
    get hostEmail() { return this.#hostEmail; }
    get creator() { return this.#creator; }
}
