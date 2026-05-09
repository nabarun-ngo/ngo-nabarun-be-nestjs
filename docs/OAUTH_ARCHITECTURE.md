# OAuth Architecture & Security

## Overview

The OAuth integration for Google (e.g., for Gmail sending, user profile data) is implemented using a **secure backend callback approach**. Authorization codes are handled entirely on the server-side, and the backend directly renders Handlebars templates for the UI, ensuring that sensitive authorization codes and states are never exposed to the frontend.

## Security Features

The implementation resolves critical security vulnerabilities from past assessments by enforcing strict security controls:

- **Backend Direct Callback**: Authorization codes are never exposed to the frontend. They are exchanged for tokens entirely on the backend, removing the risk of interception via browser history, XSS attacks, or browser extensions.
- **CSRF Protection (State Validation)**: Cryptographically secure state parameters are generated server-side using `randomBytes(32)` and stored in a Redis cache with a 10-minute TTL. The callback strictly validates and consumes this state.
- **Scope Whitelisting**: Requests are validated against a strict whitelist of approved scopes (e.g., `userinfo.email`, `userinfo.profile`, `gmail.send`). Any unauthorized scope requests are rejected.
- **Code Reuse Prevention**: Authorization codes are tracked in the Redis cache with a 10-minute TTL. Once a code is used for token exchange, it is marked as used, preventing replay attacks.
- **Rate Limiting**: Callback endpoints are protected by rate limiting (10 requests per minute per identifier) to prevent brute force and DoS attacks.
- **Input Validation**: DTOs strictly validate the length and format of all parameters (e.g., scopes, state, codes).
- **Client ID Protection**: The `clientId` is strictly maintained on the server-side configuration and is not accepted from client requests.

## Authentication Flow

1. **Initiation**: The frontend requests an authorization URL:
   `GET /api/auth/oauth/google/auth-url`
2. **URL Generation**: The backend generates a secure state, stores it in Redis, and returns the Google Auth URL.
3. **User Action**: The frontend redirects the user to Google.
4. **Google Callback**: Upon approval/denial, Google redirects directly to the backend's public endpoint:
   `GET /api/auth/oauth/google/callback?code=XXX&state=YYY`
5. **Processing**: The backend:
   - Validates the `state` parameter against Redis.
   - Checks that the `code` has not been reused.
   - Exchanges the code for Google access/refresh tokens.
   - Stores the tokens securely.
6. **UI Rendering**: The backend renders a beautiful HTML page directly using Handlebars, informing the user of success or failure. No frontend redirect is required.

## Handlebars Template UI

To provide a seamless user experience without requiring frontend redirects, the callback endpoint renders HTML templates directly:

- **Templates Location**: `src/modules/shared/auth/presentation/templates/`
- **`oauth-success.hbs`**: Displays a success page with animations and the connected email address. If opened in a popup, it automatically closes after 3 seconds.
- **`oauth-error.hbs`**: Displays clear error messages, reasons, and a retry option if applicable. Auto-closes after 5 seconds.

## Configuration

Ensure the Google Cloud Console is configured with the correct backend redirect URI:
```env
GOOGLE_REDIRECT_URI=https://api.yourapp.com/api/auth/oauth/google/callback
```
*(For local development, use `http://localhost:3000/api/auth/oauth/google/callback`)*
