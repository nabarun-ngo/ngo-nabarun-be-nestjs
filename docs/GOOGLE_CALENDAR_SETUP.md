# Google Calendar Integration Setup

## Overview
The Notice module now includes Google Calendar API integration for creating Google Meet meetings automatically when creating online meetings.

## Installation

### 1. Install googleapis package
```bash
npm install googleapis
```

### 2. Configure Environment Variables
Add these to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth2 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Add authorized redirect URIs
   - Save Client ID and Client Secret
5. Get Refresh Token:
   - Use OAuth2 Playground: https://developers.google.com/oauthplayground/
   - Select "Google Calendar API v3" scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Authorize and get refresh token

## How It Works

### Automatic Google Meet Creation
When you create a meeting with type `ONLINE_VIDEO` or `ONLINE_AUDIO`:

1. **Meeting is created locally** in the database
2. **Google Calendar event is created** with Google Meet link
3. **Meeting record is updated** with:
   - `extMeetingId`: Google Calendar event ID
   - `extHtmlLink`: Link to Google Calendar event
   - `extVideoConferenceLink`: Google Meet video link
   - `extAudioConferenceLink`: Google Meet phone link (if available)
   - Status: `CREATED_G` (Created in Google)

### Meeting Update
When updating a meeting that has a Google Calendar event:

1. **Local meeting is updated**
2. **Google Calendar event is updated**
3. **Status set to `UPDATED_G`**

### Error Handling
- If Google Calendar creation fails:
  - Meeting is still saved locally
  - Status set to `FAILED_G` or `FAILED_L`
  - Error is logged but operation continues
  - Meeting can still be used without Google Calendar

## API Usage

### Create Meeting with Google Meet
```typescript
POST /api/meeting/create
{
  "meetingSummary": "Team Standup",
  "meetingDate": "2024-01-15T10:00:00Z",
  "meetingType": "ONLINE_VIDEO",
  "meetingStartTime": "10:00",
  "meetingEndTime": "11:00",
  "attendeeUserIds": ["user-id-1", "user-id-2"],
  "creatorEmail": "organizer@example.com"
}
```

Response includes:
- `extMeetingId`: Google Calendar event ID
- `extHtmlLink`: Link to calendar event
- `extVideoConferenceLink`: Google Meet link
- `meetingStatus`: `CREATED_G`

### Update Meeting
```typescript
PUT /api/meeting/:id/update
{
  "meetingSummary": "Updated Standup",
  "meetingStartTime": "11:00",
  "meetingEndTime": "12:00",
  "attendeeUserIds": ["user-id-1", "user-id-2", "user-id-3"]
}
```

This will update both local meeting and Google Calendar event.

## Service Architecture

### GoogleCalendarService
- `createCalendarEvent()`: Creates Google Calendar event with Meet link
- `updateCalendarEvent()`: Updates existing Google Calendar event
- `deleteCalendarEvent()`: Deletes Google Calendar event
- `createEventFromMeeting()`: Helper to create event from Meeting domain model
- `updateEventFromMeeting()`: Helper to update event from Meeting domain model

### Use Cases
- `CreateMeetingWithGoogleUseCase`: Creates meeting and Google Calendar event
- `UpdateMeetingWithGoogleUseCase`: Updates meeting and Google Calendar event

### Meeting Service
- Automatically uses Google Calendar integration for online meetings
- Falls back to local-only creation if Google Calendar is not configured

## Testing

### Without Google Calendar
- Service works normally
- Meetings are created locally
- No Google Calendar integration

### With Google Calendar
- Online meetings automatically get Google Meet links
- Calendar events are created
- Attendees receive calendar invites (via Google Calendar)

## Notes

- Timezone is currently hardcoded to `Asia/Kolkata` - make configurable if needed
- Attendee emails are fetched from user repository using `attendeeUserIds`
- Google Calendar API requires proper OAuth2 setup
- Refresh token should be kept secure (use environment variables)

