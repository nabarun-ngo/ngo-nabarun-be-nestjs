# Auth Module

This module provides Auth0 JWT authentication for securing all API endpoints.

## Features

- 🔐 Global authentication guard that secures all controllers by default
- 🎫 JWT token validation using Auth0's JWKS (JSON Web Key Set)
- 🔑 Permission-based access control (RBAC) with flexible permission checking
- 🌐 Public route decorator for endpoints that don't require authentication
- 👤 Current user decorator to access authenticated user information

## Configuration

The following environment variables are required:

```env
AUTH0_ISSUER_URI=https://your-auth0-domain.auth0.com/
AUTH0_RESOURCE_API_AUDIENCE=your-api-identifier
```

## Usage

### Secured Routes (Default)

All routes are secured by default. No additional configuration is needed:

```typescript
@Controller('users')
export class UserController {
  @Get()
  async getUsers() {
    // This route is automatically protected
    // Requires: Authorization: Bearer <token>
  }
}
```

### Public Routes

Use the `@Public()` decorator to make a route publicly accessible:

```typescript
import { Public } from '../auth/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  async login() {
    // This route is public and doesn't require authentication
  }
}
```

### Accessing Current User

Use the `@CurrentUser()` decorator to access the authenticated user information:

```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('users')
export class UserController {
  @Get('me')
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    // Access full user payload
    return user;
  }

  @Get('my-id')
  async getMyId(@CurrentUser('userId') userId: string) {
    // Access specific property
    return { userId };
  }
}
```

### Permission-Based Access Control

Use the `@RequirePermissions()` decorator to enforce permission-based access control. Permissions are automatically extracted from the Auth0 JWT token's `permissions` claim.

#### Requiring ALL Permissions (Default - AND logic)

The user must have **all** specified permissions:

```typescript
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('users')
export class UserController {
  @RequirePermissions('read:users', 'write:users')
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    // User must have BOTH 'read:users' AND 'write:users' permissions
    return await this.createUserUseCase.execute(dto);
  }

  @RequirePermissions('admin:access')
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    // User must have 'admin:access' permission
    return await this.deleteUserUseCase.execute(id);
  }
}
```

#### Requiring ANY Permission (OR logic)

The user must have **at least one** of the specified permissions:

```typescript
import { RequirePermissions, PermissionsMode } from '../auth/decorators/require-permissions.decorator';

@Controller('users')
export class UserController {
  @RequirePermissions('read:users', 'admin:access', PermissionsMode.ANY)
  @Get()
  async getUsers() {
    // User must have EITHER 'read:users' OR 'admin:access' permission
    return await this.getUsersUseCase.execute();
  }

  @RequirePermissions('read:reports', 'admin:reports', PermissionsMode.ANY)
  @Get('reports')
  async getReports() {
    // User must have at least one reporting permission
    return await this.getReportsUseCase.execute();
  }
}
```

#### Controller-Level Permissions

Apply permissions at the controller level to protect all routes:

```typescript
@RequirePermissions('read:users')
@Controller('users')
export class UserController {
  // All routes in this controller require 'read:users' permission
  // Additional permissions can be added at method level
  
  @Get()
  async getUsers() {
    // Requires 'read:users' (from controller)
  }

  @RequirePermissions('read:users', 'write:users')
  @Post()
  async createUser() {
    // Requires both 'read:users' (from controller) AND 'write:users' (from method)
    // Note: Method-level decorator REPLACES controller-level, doesn't combine
  }
}
```

#### Combining with Public Routes

Public routes bypass both authentication and permission checks:

```typescript
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('users')
export class UserController {
  @Public()
  @Get('public-info')
  async getPublicInfo() {
    // No authentication or permissions required
  }

  @RequirePermissions('read:users')
  @Get('private-info')
  async getPrivateInfo() {
    // Requires authentication AND 'read:users' permission
  }
}
```

#### Permission Error Handling

When a user lacks required permissions, they receive a `403 Forbidden` response:

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required all of: read:users, write:users",
  "error": "Forbidden"
}
```

For ANY mode:

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required at least one of: read:users, admin:access",
  "error": "Forbidden"
}
```

### Swagger Integration

The auth module is integrated with Swagger. When testing endpoints:

1. Click the "Authorize" button in Swagger UI
2. Enter your Auth0 JWT token in the format: `Bearer <your-token>`
3. All subsequent requests will include the token

## How It Works

1. **JWT Strategy**: Validates JWT tokens from Auth0 using JWKS and extracts permissions from the token payload
2. **Auth Guard**: Applied globally to all routes via `APP_GUARD` - validates authentication
3. **Permissions Guard**: Applied globally to all routes via `APP_GUARD` - validates permissions
4. **Public Decorator**: Allows bypassing both authentication and permission checks for specific routes
5. **Token Validation**: Automatically validates:
   - Token signature (using Auth0's public keys)
   - Token expiration
   - Token audience (API identifier)
   - Token issuer (Auth0 domain)
   - User permissions (from token's `permissions` claim)

## Auth0 Configuration

To enable permissions in Auth0 tokens:

1. **Create an API** in Auth0 Dashboard
2. **Enable RBAC** in the API settings
3. **Create Permissions** in the API (e.g., `read:users`, `write:users`, `admin:access`)
4. **Assign Permissions** to users via:
   - Direct user assignment
   - Role-based assignment (assign permissions to roles, then roles to users)
5. **Request Permissions** in token:
   - Include `scope` parameter when requesting tokens
   - Use Machine to Machine applications with appropriate permissions
   - Or request via Authorization Code flow with `audience` parameter

Example token payload with permissions:
```json
{
  "sub": "auth0|user123",
  "permissions": ["read:users", "write:users", "admin:access"],
  "iss": "https://your-domain.auth0.com/",
  "aud": "your-api-identifier",
  "exp": 1234567890
}
```

## Error Handling

The module will return `401 Unauthorized` if:
- No token is provided
- Token is invalid or expired
- Token doesn't match the expected audience or issuer

The module will return `403 Forbidden` if:
- User doesn't have required permissions
- Token is valid but lacks necessary permission claims

