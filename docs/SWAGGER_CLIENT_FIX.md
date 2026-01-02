# Swagger TypeScript Client - Class Name Consistency Fix

## Problem
The `ng-openapi-gen` tool was generating inconsistent names in the TypeScript client:

### Service Names
- Some services: `DonationControllerService`, `AccountControllerService`, `ExpenseControllerService`
- Other services: `UserService`, `DmsService`, `OAuthService`

### Method Names
- Generated methods included "Controller": `donationControllerUpdate`, `accountControllerCreate`
- Expected clean method names: `donationUpdate`, `accountCreate`

## Root Cause

### Service Name Issue
The inconsistency was caused by different `@ApiTags()` decorator values across controllers:
- Controllers with `@ApiTags('donation-controller')` → generated `DonationControllerService`
- Controllers with `@ApiTags('Donation')` or no tag → generated `DonationService` or based on route

### Method Name Issue
NestJS Swagger plugin auto-generates operation IDs from controller class names, including the "Controller" suffix:
- `DonationController.update()` → operationId: `DonationControllerUpdate` → method: `donationControllerUpdate()`

## Solution Applied

### 1. Updated `nest-cli.json`
Added Swagger plugin configuration options:
```json
{
  "name": "@nestjs/swagger",
  "options": {
    "classValidatorShim": true,
    "introspectComments": true,
    "dtoFileNameSuffix": [".dto.ts"],
    "controllerFileNameSuffix": [".controller.ts"],
    "dtoKeyOfComment": "description",
    "controllerKeyOfComment": "description"
  }
}
```

### 2. Standardized `@ApiTags()` Across All Controllers
Changed all controller tags to use clean, PascalCase names without "-controller" suffix:

| Controller | Old Tag | New Tag |
|------------|---------|---------|
| DonationController | `'donation-controller'` | `'Donation'` |
| AccountController | `'account-controller'` | `'Account'` |
| ExpenseController | `'expense-controller'` | `'Expense'` |
| EarningController | `'earning-controller'` | `'Earning'` |
| NoticeController | `'notice-controller'` | `'Notice'` |
| MeetingController | `'meeting-controller'` | `'Meeting'` |
| UserController | *(none)* | `'User'` |
| HealthController | *(none)* | `'Health'` |
| CallbackController | *(none)* | `'Callback'` |

### 3. Added Missing Imports
Added `ApiTags` import to controllers that were missing it:
- `UserController`
- `CallbackController`

### 4. Added Custom Operation ID Factory
Added `operationIdFactory` in `swagger-config.ts` to remove "Controller" suffix from generated method names:

```typescript
operationIdFactory: (controllerKey: string, methodKey: string) => {
  // Remove 'Controller' suffix from controller name for cleaner operation IDs
  const cleanControllerName = controllerKey.replace(/Controller$/, '');
  // Convert to camelCase: DonationUpdate -> donationUpdate
  const operationId = cleanControllerName.charAt(0).toLowerCase() + 
    cleanControllerName.slice(1) + 
    methodKey.charAt(0).toUpperCase() + 
    methodKey.slice(1);
  return operationId;
}
```

This ensures:
- `DonationController.update()` → operationId: `donationUpdate` → method: `donationUpdate()`
- `AccountController.create()` → operationId: `accountCreate` → method: `accountCreate()`


## Expected Generated Service Names
After regenerating the client with `ng-openapi-gen`, you should now see consistent service names:
- `DonationService` (instead of `DonationControllerService`)
- `AccountService` (instead of `AccountControllerService`)
- `ExpenseService` (instead of `ExpenseControllerService`)
- `EarningService` (instead of `EarningControllerService`)
- `NoticeService` (instead of `NoticeControllerService`)
- `MeetingService` (instead of `MeetingControllerService`)
- `UserService` ✓ (already correct)
- `HealthService` ✓ (already correct)
- `CallbackService` ✓ (already correct)
- `WorkflowsService` ✓ (already correct)
- `DmsService` ✓ (already correct)
- `OAuthService` ✓ (already correct)
- `ApiKeyService` ✓ (already correct)
- `JobMonitoringService` ✓ (already correct)
- `PublicService` ✓ (already correct)

## Expected Generated Method Names
After regenerating the client, method names will be clean without "Controller":
- ✅ `donationUpdate()` (instead of `donationControllerUpdate()`)
- ✅ `donationCreate()` (instead of `donationControllerCreate()`)
- ✅ `accountUpdate()` (instead of `accountControllerUpdate()`)
- ✅ `expenseList()` (instead of `expenseControllerList()`)
- ✅ `userCreate()`, `userGetUser()`, `userListUsers()`, etc.

## How to Regenerate the Client

1. **Ensure your NestJS application is running:**
   ```bash
   npm run start:dev
   ```

2. **Run the ng-openapi-gen command:**
   ```bash
   ng-openapi-gen --input http://localhost:8080/api/docs --output src/app/core/api-client
   ```

3. **Verify the generated services** in `src/app/core/api-client/services/` - all service names should now be consistent without the "Controller" suffix.

## Benefits
- **Cleaner API**: Service names are more intuitive (e.g., `DonationService` vs `DonationControllerService`)
- **Cleaner Methods**: Method names are concise (e.g., `donationUpdate()` vs `donationControllerUpdate()`)
- **Consistency**: All services and methods follow the same naming pattern
- **Better Developer Experience**: Easier to understand and use the generated client
- **Swagger UI**: Tags in Swagger UI are also cleaner and more professional
- **Reduced Verbosity**: Less typing and more readable code in your Angular application

## Notes
- The changes are backward compatible with your existing API
- Only the Swagger documentation tags changed, not the actual API endpoints
- The Swagger UI will now group endpoints by cleaner tag names (e.g., "Donation" instead of "donation-controller")
