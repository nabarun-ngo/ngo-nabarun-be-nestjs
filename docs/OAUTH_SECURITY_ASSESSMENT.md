# OAuth Controller Security Assessment

## Executive Summary
The OAuth controller has **3 Critical** and **5 Medium** security vulnerabilities that need immediate attention. The most severe issues are CSRF attacks due to missing state validation and scope injection vulnerabilities.

---

## 🔴 CRITICAL VULNERABILITIES

### 1. CSRF Attack - Missing State Parameter Validation
**Severity:** CRITICAL  
**CVSS Score:** 8.8 (High)

**Issue:**
- The `state` parameter is accepted in `getGmailAuthUrl()` but never validated in `handleGmailCallback()`
- No server-side state generation or storage

**Attack Scenario:**
1. Attacker initiates OAuth flow and gets authorization code
2. Attacker tricks victim into completing OAuth flow
3. Attacker uses victim's authorization code with their own state
4. Victim's account gets linked to attacker's session

**Location:**
- `oauth.controller.ts:42-44` (accepts state)
- `oauth.controller.ts:61-69` (doesn't validate state)

**Fix Required:**
```typescript
// Generate cryptographically secure state server-side
// Store state in session/cache with expiration
// Validate state on callback
```

---

### 2. Scope Injection / Privilege Escalation
**Severity:** CRITICAL  
**CVSS Score:** 8.1 (High)

**Issue:**
- Scopes are taken directly from query parameters without whitelist validation
- Any scope can be requested, including dangerous ones like `cloud-platform`

**Attack Scenario:**
```
GET /api/auth/oauth/google/auth-url?scopes=https://www.googleapis.com/auth/cloud-platform
```

**Location:**
- `oauth.controller.ts:42-43` - No scope validation

**Fix Required:**
```typescript
// Whitelist allowed scopes
const ALLOWED_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.send',
  // ... only approved scopes
];

// Validate all requested scopes against whitelist
```

---

### 3. Authorization Code Reuse
**Severity:** CRITICAL  
**CVSS Score:** 7.5 (High)

**Issue:**
- No tracking mechanism to prevent authorization code reuse
- If an attacker intercepts a code, they can exchange it multiple times

**Location:**
- `google-oauth.service.ts:85` - `getToken(code)` can be called multiple times

**Fix Required:**
```typescript
// Store used codes in cache with short TTL (5-10 minutes)
// Check if code was already used before exchanging
// Mark code as used after successful exchange
```

---

## 🟡 MEDIUM VULNERABILITIES

### 4. Missing PKCE (Proof Key for Code Exchange)
**Severity:** MEDIUM  
**CVSS Score:** 6.5 (Medium)

**Issue:**
- No PKCE implementation for additional security
- Authorization codes are vulnerable to interception

**Recommendation:**
- Implement PKCE flow for all OAuth requests
- Generate `code_verifier` and `code_challenge` server-side
- Validate `code_verifier` on callback

---

### 5. Incorrect Authentication Decorator
**Severity:** MEDIUM  
**CVSS Score:** 5.3 (Medium)

**Issue:**
- `@ApiBearerAuth('jwt')` decorator on controller level
- OAuth endpoints should be public (or conditionally authenticated)

**Location:**
- `oauth.controller.ts:23`

**Fix:**
```typescript
import { Public } from '../../application/decorators/public.decorator';

@Public() // Add to endpoints that should be public
@Get('google/auth-url')
```

---

### 6. No Rate Limiting
**Severity:** MEDIUM  
**CVSS Score:** 5.3 (Medium)

**Issue:**
- No rate limiting on callback endpoint
- Vulnerable to brute force, DoS, and code enumeration attacks

**Recommendation:**
```typescript
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
@Post('google/submit-callback')
```

---

### 7. Client ID in Request Body
**Severity:** MEDIUM  
**CVSS Score:** 4.3 (Low-Medium)

**Issue:**
- Client ID sent in request body (though validated)
- Should be derived from session or server configuration

**Location:**
- `oauth.controller.ts:67` - `callbackDto.clientId`

**Recommendation:**
- Remove clientId from DTO
- Use server-configured clientId only

---

### 8. Insufficient Input Validation
**Severity:** MEDIUM  
**CVSS Score:** 4.3 (Low-Medium)

**Issue:**
- No validation decorators on query parameters
- Scopes split without length/format validation
- Potential for DoS via malformed input

**Location:**
- `oauth.controller.ts:42-43`

**Fix:**
```typescript
@Get('google/auth-url')
@ApiQuery({ name: 'scopes', required: false, type: String })
getGmailAuthUrl(
  @Query('scopes') scopes?: string,
  @Query('state') state?: string
) {
  // Validate scopes format and length
  if (scopes && scopes.length > 1000) {
    throw new BadRequestException('Scopes parameter too long');
  }
  const scopeList = scopes ? scopes.split(' ').filter(s => s.length > 0) : [];
  // ... scope whitelist validation
}
```

---

## 🟢 LOW / INFORMATIONAL

### 9. Error Information Disclosure
**Issue:** Generic error messages might leak implementation details  
**Recommendation:** Use consistent error responses without exposing internals

### 10. Missing Server-Side State Generation
**Issue:** State parameter is optional and not generated server-side  
**Recommendation:** Always generate cryptographically secure state server-side

---

## Recommended Fix Priority

1. **Immediate (Critical):**
   - ✅ Implement state parameter validation (CSRF protection)
   - ✅ Add scope whitelist validation
   - ✅ Implement authorization code reuse prevention

2. **High Priority (Medium):**
   - ✅ Add rate limiting
   - ✅ Fix authentication decorators (add @Public)
   - ✅ Remove clientId from request body

3. **Medium Priority:**
   - ✅ Implement PKCE
   - ✅ Add input validation decorators
   - ✅ Improve error handling

---

## Security Best Practices Checklist

- [ ] State parameter generated server-side and validated
- [ ] Scope whitelist validation
- [ ] Authorization code single-use tracking
- [ ] PKCE implementation
- [ ] Rate limiting on all OAuth endpoints
- [ ] Proper authentication decorators
- [ ] Input validation on all parameters
- [ ] Secure error messages
- [ ] HTTPS only (enforced at infrastructure level)
- [ ] Token encryption at rest (✅ Already implemented)
- [ ] Token refresh mechanism (✅ Already implemented)

---

## References

- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OWASP OAuth 2.0 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Security_Cheat_Sheet.html)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)

