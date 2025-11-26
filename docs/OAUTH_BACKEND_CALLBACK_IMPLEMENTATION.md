# OAuth Backend Callback Implementation - Complete Guide

## ✅ Implementation Complete

I've implemented the **secure backend callback approach** which is significantly more secure than frontend handling.

---

## 🔐 Security Benefits

✅ **Authorization code never exposed to frontend**
✅ **Protected from XSS attacks**
✅ **Code not in browser history/logs**
✅ **Follows OAuth 2.0 security best practices**
✅ **Reduced attack surface**

---

## 📋 What Was Implemented

### 1. **New Public Callback Endpoint**
- **Route:** `GET /api/auth/oauth/google/callback`
- **Access:** Public (no JWT required - Google redirects here)
- **Parameters:** `code`, `state`, `error` (query parameters from Google)

### 2. **Enhanced State Management**
- State now stores frontend redirect URLs
- Allows redirecting to frontend after processing

### 3. **Frontend Redirect Support**
- Optional `frontendSuccessUrl` and `frontendErrorUrl` parameters
- Stored in state and used for post-callback redirects

### 4. **Backward Compatibility**
- Old `POST /api/auth/oauth/google/submit-callback` endpoint still exists
- Marked as `@deprecated` but functional
- Can be removed once frontend migrates

---

## 🔄 New OAuth Flow

```
1. Frontend → Backend: GET /api/auth/oauth/google/auth-url
   Query params: scopes, frontendSuccessUrl, frontendErrorUrl
   Response: { url, state, clientId }

2. Frontend redirects user to Google (using url from step 1)

3. Google → Backend: GET /api/auth/oauth/google/callback?code=XXX&state=YYY
   (This is the SECURE step - code never touches frontend)

4. Backend processes code, validates state, stores tokens

5. Backend → Frontend: Redirect to frontendSuccessUrl or frontendErrorUrl
```

---

## 📝 API Changes

### Updated: `GET /api/auth/oauth/google/auth-url`

**New Query Parameters:**
- `frontendSuccessUrl` (optional): Frontend URL to redirect to on success
  - Example: `https://yourapp.com/oauth/success`
- `frontendErrorUrl` (optional): Frontend URL to redirect to on error
  - Example: `https://yourapp.com/oauth/error`

**Example Request:**
```
GET /api/auth/oauth/google/auth-url?scopes=https://www.googleapis.com/auth/gmail.send&frontendSuccessUrl=https://yourapp.com/oauth/success&frontendErrorUrl=https://yourapp.com/oauth/error
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "abc123...",
  "clientId": "your-client-id"
}
```

---

### New: `GET /api/auth/oauth/google/callback`

**Access:** Public (no authentication required)

**Query Parameters (from Google):**
- `code` (required): Authorization code from Google
- `state` (required): State parameter for CSRF protection
- `error` (optional): Error code if user denied authorization

**Behavior:**
1. Validates state parameter
2. Checks for code reuse
3. Exchanges code for tokens
4. Stores tokens securely
5. Redirects to `frontendSuccessUrl` on success
6. Redirects to `frontendErrorUrl` on error

**Redirect Examples:**
- Success: `https://yourapp.com/oauth/success`
- Error: `https://yourapp.com/oauth/error?reason=authorization_denied`

---

## ⚙️ Configuration Required

### 1. Update Google OAuth Redirect URI

In Google Cloud Console, set the authorized redirect URI to your backend:

```
https://api.yourapp.com/api/auth/oauth/google/callback
```

Or for development:
```
http://localhost:3000/api/auth/oauth/google/callback
```

### 2. Update Environment Variable

Ensure `GOOGLE_REDIRECT_URI` matches:

```env
GOOGLE_REDIRECT_URI=https://api.yourapp.com/api/auth/oauth/google/callback
```

---

## 🎯 Frontend Integration

### Step 1: Get Auth URL

```typescript
const response = await fetch('/api/auth/oauth/google/auth-url?scopes=https://www.googleapis.com/auth/gmail.send&frontendSuccessUrl=https://yourapp.com/oauth/success&frontendErrorUrl=https://yourapp.com/oauth/error', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

const { url, state } = await response.json();
```

### Step 2: Redirect User to Google

```typescript
window.location.href = url;
```

### Step 3: Handle Success/Error Pages

**Success Page (`/oauth/success`):**
```typescript
// User redirected here after successful OAuth
// Show success message, refresh data, etc.
```

**Error Page (`/oauth/error`):**
```typescript
// User redirected here on error
// Check query params for error reason
const params = new URLSearchParams(window.location.search);
const reason = params.get('reason'); // e.g., 'authorization_denied', 'processing_failed'
```

---

## 🔒 Security Features

1. **State Validation:** CSRF protection via state parameter
2. **Code Reuse Prevention:** Codes tracked and marked as used
3. **Rate Limiting:** 10 requests per minute per code
4. **Scope Whitelist:** Only approved scopes allowed
5. **Server-Side Only:** Code never exposed to frontend

---

## 🚨 Error Handling

The callback endpoint handles various error scenarios:

| Error | Redirect | Reason Parameter |
|-------|----------|-----------------|
| User denied authorization | `frontendErrorUrl` | `authorization_denied` |
| Missing code/state | `frontendErrorUrl` | `authorization_denied` |
| Rate limit exceeded | `/oauth/error` | `rate_limit_exceeded` |
| Invalid/expired state | `frontendErrorUrl` | `processing_failed` |
| Code already used | `frontendErrorUrl` | `processing_failed` |
| Token exchange failed | `frontendErrorUrl` | `processing_failed` |

---

## 📊 Comparison: Frontend vs Backend Callback

| Aspect | Frontend Callback | Backend Callback ✅ |
|--------|------------------|---------------------|
| Code Exposure | ❌ In URL | ✅ Never exposed |
| XSS Protection | ❌ Vulnerable | ✅ Protected |
| Browser History | ❌ Stored | ✅ Not stored |
| OAuth Best Practice | ❌ No | ✅ Yes |
| Implementation | ✅ Easier | ⚠️ Moderate |

---

## 🎉 Result

Your OAuth implementation now follows security best practices with:
- ✅ Secure backend callback handling
- ✅ No code exposure to frontend
- ✅ Proper state management
- ✅ Frontend redirect support
- ✅ Comprehensive error handling

The authorization code is now handled entirely server-side, significantly reducing the attack surface and following OAuth 2.0 security guidelines.

