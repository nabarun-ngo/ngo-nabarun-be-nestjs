# Notice Module

This module manages notices/announcements and meetings with Google Calendar integration.

## Features

- Notice creation, update, and publishing
- Meeting creation with Google Calendar integration
- Google Meet link generation for online meetings
- Meeting attendee management

## Google Calendar Integration

### Setup

1. **Install googleapis package:**
   ```bash
   npm install googleapis
   ```

2. **Configure environment variables:**
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=your-redirect-uri
   GOOGLE_REFRESH_TOKEN=your-refresh-token
   ```

3. **Get Google OAuth2 credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Calendar API
   - Create OAuth2 credentials
   - Get refresh token using OAuth2 flow

### How It Works

- When creating a meeting with type `ONLINE_VIDEO` or `ONLINE_AUDIO`, the system automatically:
  1. Creates a Google Calendar event
  2. Generates a Google Meet link
  3. Stores the Google Calendar event ID and Meet link in the meeting record
  4. Updates meeting status to `CREATED_G` (Created in Google)

- When updating a meeting that has a Google Calendar event:
  1. Updates the Google Calendar event
  2. Updates meeting status to `UPDATED_G` (Updated in Google)

- If Google Calendar creation/update fails:
  1. Meeting is still saved locally
  2. Meeting status is set to `FAILED_G` or `FAILED_L`
  3. Error is logged but doesn't block the operation

## API Endpoints

### Notice Endpoints
- `POST /api/notice/create` - Create notice
- `PATCH /api/notice/:id/update` - Update notice
- `GET /api/notice/:id` - Get notice by ID
- `GET /api/notice/list` - List notices
- `GET /api/notice/getDraftedNotice` - Get draft notices

### Meeting Endpoints
- `POST /api/meeting/create` - Create meeting (with Google Calendar if online)
- `PUT /api/meeting/:id/update` - Update meeting (updates Google Calendar if exists)
- `GET /api/meeting/list` - List meetings
- `GET /api/meeting/:id` - Get meeting by ID

## Domain Models

### Notice
- Status: `DRAFT`, `ACTIVE`, `EXPIRED`
- Can be linked to a meeting
- Business logic: publish, expire, update

### Meeting
- Type: `OFFLINE`, `ONLINE_VIDEO`, `ONLINE_AUDIO`
- Status: `CREATED_L`, `CREATED_G`, `FAILED_L`, `FAILED_G`, `UPDATED_L`, `UPDATED_G`
- Stores Google Calendar event ID and Meet links
- Business logic: update, mark created/failed, manage attendees

