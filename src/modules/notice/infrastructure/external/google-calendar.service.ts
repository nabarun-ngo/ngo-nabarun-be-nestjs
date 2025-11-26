import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configkey } from 'src/shared/config-keys';
import { ThirdPartyException } from '../../../../shared/exceptions/third-party-exception';
import { Meeting, MeetingType } from '../../domain/model/meeting.model';

// Import googleapis - install with: npm install googleapis
// Note: If googleapis is not installed, the service will log a warning and continue without Google Calendar integration
let google: any;
try {
  // Try to import googleapis
  const googleapis = require('googleapis');
  google = googleapis.google || googleapis;
} catch (error) {
  // googleapis not installed - will be handled gracefully in initializeCalendar
  google = null;
}

export interface GoogleCalendarEvent {
  id: string;
  htmlLink: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
  };
}

export interface CreateCalendarEventParams {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{ email: string }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
  };
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private calendar: any;

  constructor(private readonly configService: ConfigService) {
    this.initializeCalendar();
  }

  private initializeCalendar() {
    try {
      if (!google) {
        this.logger.warn('googleapis package not installed. Install it with: npm install googleapis');
        return;
      }

      const clientId = this.configService.get<string>(Configkey.GOOGLE_CLIENT_ID);
      const clientSecret = this.configService.get<string>(Configkey.GOOGLE_CLIENT_SECRET);
      const redirectUri = this.configService.get<string>(Configkey.GOOGLE_REDIRECT_URI);
      const refreshToken = this.configService.get<string>(Configkey.GOOGLE_REFRESH_TOKEN);

      if (!clientId || !clientSecret || !refreshToken) {
        this.logger.warn('Google Calendar API credentials not configured. Meeting creation in Google Calendar will be disabled.');
        return;
      }

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri,
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      this.logger.log('Google Calendar API initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Google Calendar API: ${error}`);
      // Don't throw - allow the service to work without Google Calendar
      this.logger.warn('Continuing without Google Calendar integration');
    }
  }

  /**
   * Create a Google Calendar event with Google Meet link
   */
  async createCalendarEvent(params: CreateCalendarEventParams): Promise<GoogleCalendarEvent> {
    if (!this.calendar) {
      throw new ThirdPartyException(
        'google-calendar',
        new Error('Google Calendar API is not configured'),
      );
    }

    try {
      const event: any = {
        summary: params.summary,
        description: params.description,
        location: params.location,
        start: params.start,
        end: params.end,
        attendees: params.attendees,
      };

      // Add Google Meet conference data for online meetings
      if (params.conferenceData) {
        event.conferenceData = params.conferenceData;
      }

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1, // Required for Google Meet links
        requestBody: event,
      });

      const createdEvent = response.data;

      return {
        id: createdEvent.id!,
        htmlLink: createdEvent.htmlLink!,
        hangoutLink: createdEvent.hangoutLink,
        conferenceData: createdEvent.conferenceData,
      };
    } catch (error: any) {
      this.logger.error(`Failed to create Google Calendar event: ${error.message}`, error);
      throw new ThirdPartyException('google-calendar', error as Error);
    }
  }

  /**
   * Update a Google Calendar event
   */
  async updateCalendarEvent(
    eventId: string,
    params: Partial<CreateCalendarEventParams>,
  ): Promise<GoogleCalendarEvent> {
    if (!this.calendar) {
      throw new ThirdPartyException(
        'google-calendar',
        new Error('Google Calendar API is not configured'),
      );
    }

    try {
      // First, get the existing event
      const existingEvent = await this.calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });

      // Merge updates
      const updatedEvent: any = {
        ...existingEvent.data,
        summary: params.summary ?? existingEvent.data.summary,
        description: params.description ?? existingEvent.data.description,
        location: params.location ?? existingEvent.data.location,
      };

      if (params.start) {
        updatedEvent.start = params.start;
      }
      if (params.end) {
        updatedEvent.end = params.end;
      }
      if (params.attendees) {
        updatedEvent.attendees = params.attendees;
      }

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        conferenceDataVersion: 1,
        requestBody: updatedEvent,
      });

      const updated = response.data;

      return {
        id: updated.id!,
        htmlLink: updated.htmlLink!,
        hangoutLink: updated.hangoutLink,
        conferenceData: updated.conferenceData,
      };
    } catch (error: any) {
      this.logger.error(`Failed to update Google Calendar event: ${error.message}`, error);
      throw new ThirdPartyException('google-calendar', error as Error);
    }
  }

  /**
   * Delete a Google Calendar event
   */
  async deleteCalendarEvent(eventId: string): Promise<void> {
    if (!this.calendar) {
      throw new ThirdPartyException(
        'google-calendar',
        new Error('Google Calendar API is not configured'),
      );
    }

    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error: any) {
      this.logger.error(`Failed to delete Google Calendar event: ${error.message}`, error);
      throw new ThirdPartyException('google-calendar', error as Error);
    }
  }

  /**
   * Create Google Calendar event from Meeting domain model
   */
  async createEventFromMeeting(
    meeting: Meeting,
    attendeeEmails: string[],
  ): Promise<GoogleCalendarEvent> {
    if (!meeting.meetingDate) {
      throw new Error('Meeting date is required');
    }

    // Determine start and end times
    const meetingDate = new Date(meeting.meetingDate);
    let startDateTime: Date;
    let endDateTime: Date;

    if (meeting.meetingStartTime && meeting.meetingEndTime) {
      // Parse time strings (format: "HH:mm" or "HH:mm:ss")
      const [startHours, startMinutes] = meeting.meetingStartTime.split(':').map(Number);
      const [endHours, endMinutes] = meeting.meetingEndTime.split(':').map(Number);

      startDateTime = new Date(meetingDate);
      startDateTime.setHours(startHours, startMinutes || 0, 0, 0);

      endDateTime = new Date(meetingDate);
      endDateTime.setHours(endHours, endMinutes || 0, 0, 0);
    } else {
      // Default: 1 hour meeting
      startDateTime = new Date(meetingDate);
      endDateTime = new Date(meetingDate);
      endDateTime.setHours(endDateTime.getHours() + 1);
    }

    // Format for Google Calendar API (RFC3339)
    const formatDateTime = (date: Date): string => {
      return date.toISOString();
    };

    const params: CreateCalendarEventParams = {
      summary: meeting.meetingSummary,
      description: meeting.meetingDescription,
      location: meeting.meetingLocation,
      start: {
        dateTime: formatDateTime(startDateTime),
        timeZone: 'Asia/Kolkata', // TODO: Make configurable
      },
      end: {
        dateTime: formatDateTime(endDateTime),
        timeZone: 'Asia/Kolkata',
      },
      attendees: attendeeEmails.map(email => ({ email })),
    };

    // Add Google Meet conference for online meetings
    if (meeting.meetingType === MeetingType.ONLINE_VIDEO || meeting.meetingType === MeetingType.ONLINE_AUDIO) {
      params.conferenceData = {
        createRequest: {
          requestId: meeting.id, // Use meeting ID as request ID
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      };
    }

    return await this.createCalendarEvent(params);
  }

  /**
   * Update Google Calendar event from Meeting domain model
   */
  async updateEventFromMeeting(
    meeting: Meeting,
    googleEventId: string,
    attendeeEmails: string[],
  ): Promise<GoogleCalendarEvent> {
    if (!meeting.meetingDate) {
      throw new Error('Meeting date is required');
    }

    const meetingDate = new Date(meeting.meetingDate);
    let startDateTime: Date;
    let endDateTime: Date;

    if (meeting.meetingStartTime && meeting.meetingEndTime) {
      const [startHours, startMinutes] = meeting.meetingStartTime.split(':').map(Number);
      const [endHours, endMinutes] = meeting.meetingEndTime.split(':').map(Number);

      startDateTime = new Date(meetingDate);
      startDateTime.setHours(startHours, startMinutes || 0, 0, 0);

      endDateTime = new Date(meetingDate);
      endDateTime.setHours(endHours, endMinutes || 0, 0, 0);
    } else {
      startDateTime = new Date(meetingDate);
      endDateTime = new Date(meetingDate);
      endDateTime.setHours(endDateTime.getHours() + 1);
    }

    const formatDateTime = (date: Date): string => {
      return date.toISOString();
    };

    const params: Partial<CreateCalendarEventParams> = {
      summary: meeting.meetingSummary,
      description: meeting.meetingDescription,
      location: meeting.meetingLocation,
      start: {
        dateTime: formatDateTime(startDateTime),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: formatDateTime(endDateTime),
        timeZone: 'Asia/Kolkata',
      },
      attendees: attendeeEmails.map(email => ({ email })),
    };

    return await this.updateCalendarEvent(googleEventId, params);
  }
}

