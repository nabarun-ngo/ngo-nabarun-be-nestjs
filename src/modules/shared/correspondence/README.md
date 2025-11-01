# Correspondence Module

This module provides email and notification sending capabilities using Gmail API with OAuth2 authentication.

## Features

- 📧 Gmail API integration for sending emails
- 🔐 Secure OAuth2 token storage with encryption
- 🔄 Automatic token refresh
- 📬 Support for HTML emails, attachments, CC, BCC
- 🔑 User-specific Gmail account management
- 📝 Multiple Gmail accounts per user

## Prerequisites

### Google OAuth Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Gmail API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs (e.g., `http://localhost:8080/api/oauth/gmail/callback`)
   - Save Client ID and Client Secret

4. **Configure Environment Variables**

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/oauth/gmail/callback
GOOGLE_SCOPES=https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/userinfo.email
OAUTH_TOKEN_ENCRYPTION_KEY=your-secret-encryption-key # Optional, defaults to APP_SECRET
```

## Database Migration

After adding the OAuth token model, run the migration:

```bash
npx prisma migrate dev --name add_oauth_tokens
```

## Usage

### 1. Authenticate Gmail (OAuth Flow)

#### Step 1: Get Authorization URL

```http
GET /api/oauth/gmail/auth-url?state=optional-state
Authorization: Bearer <your-auth0-token>
```

Response:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### Step 2: Redirect User to Authorization URL

The user should be redirected to the `authUrl` to grant permissions.

#### Step 3: Handle OAuth Callback

After user grants permission, Google redirects back with a `code`. Send it to your backend:

```http
POST /api/oauth/gmail/callback
Authorization: Bearer <your-auth0-token>
Content-Type: application/json

{
  "code": "4/0AX4XfWj...",
  "email": "user@gmail.com" // Optional, will be fetched from Google if not provided
}
```

Response:
```json
{
  "success": true,
  "email": "user@gmail.com"
}
```

### 2. Send Email

```http
POST /api/correspondence/email
Authorization: Bearer <your-auth0-token>
Content-Type: application/json

{
  "fromEmail": "user@gmail.com",
  "to": "recipient@example.com",
  "subject": "Test Email",
  "html": "<h1>Hello World</h1>",
  "text": "Hello World"
}
```

Response:
```json
{
  "success": true,
  "messageId": "1234567890abcdef"
}
```

### 3. Send Text Email (Simple)

```typescript
import { CorrespondenceService } from './correspondence.service';

// In your service
await this.correspondenceService.sendEmail({
  userId: 'user-id',
  fromEmail: 'user@gmail.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  text: 'This is a plain text email',
});
```

### 4. Send HTML Email with Attachments

```typescript
await this.correspondenceService.sendEmail({
  userId: 'user-id',
  fromEmail: 'user@gmail.com',
  to: ['recipient1@example.com', 'recipient2@example.com'],
  subject: 'Email with Attachment',
  html: '<h1>Hello</h1><p>This email has an attachment</p>',
  text: 'Hello\n\nThis email has an attachment',
  cc: 'cc@example.com',
  bcc: 'bcc@example.com',
  attachments: [
    {
      filename: 'document.pdf',
      content: Buffer.from('...'), // File buffer
      contentType: 'application/pdf',
    },
  ],
});
```

### 5. Check Gmail Authentication Status

```http
GET /api/oauth/gmail/status?email=user@gmail.com
Authorization: Bearer <your-auth0-token>
```

Response:
```json
{
  "authenticated": true,
  "email": "user@gmail.com"
}
```

### 6. List Authenticated Gmail Accounts

```http
GET /api/oauth/gmail/accounts
Authorization: Bearer <your-auth0-token>
```

Response:
```json
{
  "accounts": [
    {
      "email": "user@gmail.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 7. Revoke Gmail Authentication

```http
POST /api/oauth/gmail/revoke/user@gmail.com
Authorization: Bearer <your-auth0-token>
```

Response:
```json
{
  "success": true,
  "message": "Gmail authentication revoked"
}
```

## Token Management

### Automatic Token Refresh

The service automatically refreshes expired access tokens using the stored refresh token. Tokens are refreshed when:
- Token is expired
- Token will expire within 5 minutes

### Token Encryption

All OAuth tokens are encrypted before storage using AES-256-CTR encryption. The encryption key is configured via `OAUTH_TOKEN_ENCRYPTION_KEY` environment variable (defaults to `APP_SECRET`).

### Token Storage

Tokens are stored in the `oauth_tokens` table with the following structure:
- Encrypted access token
- Encrypted refresh token
- Token expiration time
- OAuth scopes
- Associated user and Gmail email

## Permissions

The following permissions are used:
- `send:email` - Required to send emails
- `send:notification` - Required to send notifications

## Integration with Job Processing

You can integrate with the job processing module to send emails asynchronously:

```typescript
import { JobProcessingService } from '../job-processing/services/job-processing.service';

@Injectable()
export class EmailJobProcessor {
  constructor(
    private readonly correspondenceService: CorrespondenceService,
  ) {}

  @ProcessJob({ name: 'send-email' })
  async processEmailJob(job: Job<EmailJobData>): Promise<JobResult> {
    const result = await this.correspondenceService.sendEmail({
      userId: job.data.userId,
      fromEmail: job.data.fromEmail,
      to: job.data.to,
      subject: job.data.subject,
      html: job.data.html,
      text: job.data.text,
    });

    return {
      success: result.success,
      data: { messageId: result.messageId },
    };
  }
}
```

## Error Handling

Common errors:

- **404 Not Found**: Gmail OAuth token not found. User needs to authenticate first.
- **401 Unauthorized**: Invalid or expired access token (will attempt refresh).
- **403 Forbidden**: Missing required permissions.
- **400 Bad Request**: Invalid email format or missing required fields.

## Security Considerations

1. **Token Encryption**: All tokens are encrypted at rest
2. **Secure Storage**: Tokens are stored in the database, not in memory
3. **Automatic Expiration**: Expired tokens are automatically refreshed
4. **User Isolation**: Users can only access their own Gmail accounts
5. **Permission Checks**: All endpoints require authentication and appropriate permissions

## Troubleshooting

### "No Gmail OAuth token found"
- Ensure the user has completed the OAuth flow
- Check that the email matches the authenticated Gmail account

### "Token refresh failed"
- The refresh token may have been revoked
- User needs to re-authenticate

### "Invalid OAuth code"
- The authorization code expires quickly (usually within minutes)
- Ensure the callback is handled promptly

