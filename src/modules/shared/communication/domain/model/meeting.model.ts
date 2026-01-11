import { randomUUID } from 'crypto';
import { AggregateRoot } from 'src/shared/models/aggregate-root';


export enum MeetingType {
    OFFLINE = 'OFFLINE',
    ONLINE = 'ONLINE',
}


export class Participant {
    name: string;
    email: string;
}

export class Meeting extends AggregateRoot<string> {
    #extMeetingId: string | undefined;
    #summary: string;
    #type: MeetingType;
    #description?: string;
    #agenda?: string;
    #outcomes?: string;
    #location?: string;
    #startTime: Date;
    #endTime: Date;
    #attendees: Participant[];
    #meetLink?: string;
    #calendarLink?: string;
    #status: string;

    constructor(
        id: string,
        summary: string,
        type: MeetingType,
        description: string,
        startTime: Date,
        endTime: Date,
        agenda: string,
        status: string,
        location?: string,
        attendees?: Participant[],
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
    }

    static create(op: {
        summary: string;
        description: string;
        type: MeetingType;
        startTime: Date;
        endTime: Date;
        agenda: string;
        status: string;
        location: string;
        attendees: Participant[]
    }) {
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
        );
    }

    update(op: {
        summary?: string;
        description?: string;
        startTime?: Date;
        endTime?: Date;
        agenda?: string;
        status?: string;
        location?: string;
        attendees?: Participant[],
        outcomes?: string
    }) {
        this.#summary = op.summary ?? this.#summary;
        this.#agenda = op.agenda ?? this.#agenda;
        this.#description = op.description ?? this.#description;
        this.#startTime = op.startTime ?? this.#startTime;
        this.#endTime = op.endTime ?? this.#endTime;
        this.#status = op.status ?? this.#status;
        this.#location = op.location ?? this.#location;
        this.#attendees = op.attendees ?? this.#attendees;
        this.#outcomes = op.outcomes ?? this.#outcomes;
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
}
