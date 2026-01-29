# Workflow Task Handlers - Auto-Registration Guide

## Overview

Workflow task handlers are automatically discovered and registered at module initialization using the `@WorkflowHandler(name)` decorator. **No manual registration needed!**

---

## How It Works

### 1. Discovery Service
The `EngineHandlerRegistrationService` uses NestJS's `DiscoveryService` to scan all providers in the module at startup.

### 2. Decorator Detection
It looks for classes decorated with `@WorkflowHandler(name)` and extracts the handler name from the metadata.

### 3. Automatic Registration
Each discovered handler is automatically registered in the `WorkflowTaskHandlerRegistry` with its specified name.

### 4. Runtime Logging
On startup, you'll see logs showing all registered handlers:
```
[EngineHandlerRegistrationService] ✓ Registered workflow handler: 'ValidateInputs' (ValidateInputsHandler)
[EngineHandlerRegistrationService] ✓ Registered workflow handler: 'Auth0UserCreation' (Auth0UserCreationHandler)
[EngineHandlerRegistrationService] ✓ Successfully registered 3 workflow handler(s)
```

---

## Creating a New Handler

### Step 1: Create Handler Class

Create a new file in `src/modules/workflow-engine/infrastructure/handlers/`:

```typescript
// send-email.handler.ts
import { Injectable } from '@nestjs/common';
import { WorkflowTaskHandler } from '../../application/interfaces/workflow-task-handler.interface';
import { WorkflowHandler } from './workflow-handler.decorator';

@WorkflowHandler('SendEmail')  // <-- Decorator with handler name
@Injectable()
export class SendEmailHandler implements WorkflowTaskHandler {
  constructor(
    // Inject any dependencies you need
    // private readonly emailService: EmailService,
  ) {}

  async handle(
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const recipient = (taskConfig?.recipient ?? context.email) as string;
    const subject = taskConfig?.subject as string;
    const body = taskConfig?.body as string;

    // Send email logic
    // await this.emailService.send(recipient, subject, body);

    return {
      emailSent: true,
      sentTo: recipient,
      sentAt: new Date().toISOString(),
    };
  }
}
```

### Step 2: Add to Module Providers

Add your handler to the `WorkflowEngineModule` providers:

```typescript
// workflow-engine.module.ts
import { SendEmailHandler } from './infrastructure/handlers/send-email.handler';

@Module({
  providers: [
    // ... existing providers ...
    SendEmailHandler,  // <-- Add your handler
  ],
})
export class WorkflowEngineModule {}
```

### Step 3: That's It!

Your handler is now automatically registered and ready to use in workflow definitions:

```json
{
  "taskId": "notify-user",
  "name": "Send Welcome Email",
  "type": "AUTOMATIC",
  "handler": "SendEmail",  // <-- References the decorator name
  "taskConfig": {
    "subject": "Welcome to our platform!",
    "body": "Thank you for signing up..."
  }
}
```

---

## Handler Naming Convention

### Best Practices

1. **Use PascalCase** for handler names: `SendEmail`, `ValidateInputs`, `CreateStripeCustomer`
2. **Be descriptive**: Name should clearly indicate what the handler does
3. **Avoid generic names**: Instead of `Process`, use `ProcessPayment` or `ProcessUserRegistration`
4. **Match file naming**: `send-email.handler.ts` → `@WorkflowHandler('SendEmail')`

### Examples

| Handler File | Decorator | Usage in Workflow |
|--------------|-----------|-------------------|
| `validate-inputs.handler.ts` | `@WorkflowHandler('ValidateInputs')` | `"handler": "ValidateInputs"` |
| `send-email.handler.ts` | `@WorkflowHandler('SendEmail')` | `"handler": "SendEmail"` |
| `create-stripe-customer.handler.ts` | `@WorkflowHandler('CreateStripeCustomer')` | `"handler": "CreateStripeCustomer"` |
| `sync-to-salesforce.handler.ts` | `@WorkflowHandler('SyncToSalesforce')` | `"handler": "SyncToSalesforce"` |

---

## Handler Interface

All handlers MUST implement the `WorkflowTaskHandler` interface:

```typescript
export interface WorkflowTaskHandler {
  handle(
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}
```

### Parameters

**`context`**: The current workflow instance context
- Contains all accumulated data from previous tasks
- Includes `requestData` (initial workflow input)
- Contains outputs from previous tasks (via `outputKey`)

**`taskConfig`**: Configuration from the workflow definition
- Task-specific configuration from the definition's `taskConfig` field
- Optional - may be undefined

### Return Value

Returns a `Record<string, unknown>` with the task's output data:
- If the task has an `outputKey` in the definition, this data is merged into the workflow context
- Can be accessed by subsequent tasks or used in conditional transitions

---

## Handler Examples

### Example 1: Validation Handler (Pre-Creation Task)

```typescript
@WorkflowHandler('ValidateUserInput')
@Injectable()
export class ValidateUserInputHandler implements WorkflowTaskHandler {
  async handle(
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const requiredFields = taskConfig?.requiredFields as string[] ?? [];
    const data = context.requestData as Record<string, unknown> ?? {};

    const missing: string[] = [];
    for (const field of requiredFields) {
      if (!data[field]) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      throw new BusinessException(`Missing required fields: ${missing.join(', ')}`);
    }

    return { validated: true, validatedFields: requiredFields };
  }
}
```

**Usage in workflow definition:**
```json
{
  "preCreationTasks": [
    {
      "taskId": "validate-input",
      "type": "AUTOMATIC",
      "handler": "ValidateUserInput",
      "taskConfig": {
        "requiredFields": ["firstName", "lastName", "email"]
      }
    }
  ]
}
```

---

### Example 2: External Service Integration

```typescript
@WorkflowHandler('CreateStripeCustomer')
@Injectable()
export class CreateStripeCustomerHandler implements WorkflowTaskHandler {
  constructor(
    @Inject(STRIPE_SERVICE)
    private readonly stripeService: IStripeService,
  ) {}

  async handle(
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const email = context.email as string;
    const name = `${context.firstName} ${context.lastName}`;

    const customer = await this.stripeService.customers.create({
      email,
      name,
      metadata: {
        userId: context.userId as string,
      },
    });

    return {
      stripeCustomerId: customer.id,
      stripeCustomerCreated: true,
      createdAt: new Date().toISOString(),
    };
  }
}
```

**Usage with output:**
```json
{
  "taskId": "create-stripe-customer",
  "type": "AUTOMATIC",
  "handler": "CreateStripeCustomer",
  "outputKey": "stripeCustomer"
}
```

**Result in context:**
```json
{
  "stripeCustomer": {
    "stripeCustomerId": "cus_abc123",
    "stripeCustomerCreated": true,
    "createdAt": "2026-01-29T..."
  }
}
```

---

### Example 3: Conditional Logic Handler

```typescript
@WorkflowHandler('CheckUserEligibility')
@Injectable()
export class CheckUserEligibilityHandler implements WorkflowTaskHandler {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async handle(
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const userId = context.userId as string;
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return {
        eligible: false,
        reason: 'User not found',
      };
    }

    const isEligible =
      user.status === 'ACTIVE' &&
      user.kycVerified === true &&
      user.accountBalance >= 100;

    return {
      eligible: isEligible,
      reason: isEligible ? 'User meets all criteria' : 'Eligibility criteria not met',
      checks: {
        activeStatus: user.status === 'ACTIVE',
        kycVerified: user.kycVerified,
        sufficientBalance: user.accountBalance >= 100,
      },
    };
  }
}
```

**Usage with conditional transitions:**
```json
{
  "taskId": "check-eligibility",
  "type": "AUTOMATIC",
  "handler": "CheckUserEligibility",
  "outputKey": "eligibility"
},
{
  "stepId": "eligibility-check",
  "transitions": {
    "conditions": [
      {
        "expression": "eligibility.eligible === true",
        "nextStepId": "approve-application"
      },
      {
        "expression": "eligibility.eligible === false",
        "nextStepId": "reject-application"
      }
    ]
  }
}
```

---

## Debugging & Troubleshooting

### Handler Not Registered?

**Check the startup logs:**
```
[EngineHandlerRegistrationService] ✓ Registered workflow handler: 'YourHandler' (YourHandlerClass)
```

**If not appearing, verify:**
1. ✅ Handler class has `@WorkflowHandler(name)` decorator
2. ✅ Handler class has `@Injectable()` decorator
3. ✅ Handler is added to module `providers` array
4. ✅ Handler implements `WorkflowTaskHandler` interface (has `handle` method)

**Common mistakes:**
```typescript
// ❌ Missing @Injectable()
@WorkflowHandler('MyHandler')
export class MyHandler implements WorkflowTaskHandler { ... }

// ❌ Missing @WorkflowHandler decorator
@Injectable()
export class MyHandler implements WorkflowTaskHandler { ... }

// ❌ Not in module providers
// workflow-engine.module.ts - MyHandler not in providers array

// ❌ Wrong method name
@WorkflowHandler('MyHandler')
@Injectable()
export class MyHandler implements WorkflowTaskHandler {
  async execute(...) { ... }  // Wrong! Should be "handle"
}
```

### Handler Execution Errors

**Check workflow definition:**
```json
{
  "handler": "MyHandler"  // Must match decorator name EXACTLY (case-sensitive)
}
```

**Enable debug logging:**
```typescript
// In handler
async handle(context, taskConfig) {
  console.log('[MyHandler] Context:', JSON.stringify(context, null, 2));
  console.log('[MyHandler] TaskConfig:', JSON.stringify(taskConfig, null, 2));
  // ... implementation
}
```

---

## Testing Handlers

### Unit Testing

```typescript
describe('SendEmailHandler', () => {
  let handler: SendEmailHandler;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    emailService = {
      send: jest.fn().mockResolvedValue({ success: true }),
    } as any;

    handler = new SendEmailHandler(emailService);
  });

  it('should send email with context data', async () => {
    const context = { email: 'user@example.com', firstName: 'John' };
    const taskConfig = {
      subject: 'Welcome',
      body: 'Hello {{firstName}}',
    };

    const result = await handler.handle(context, taskConfig);

    expect(emailService.send).toHaveBeenCalledWith(
      'user@example.com',
      'Welcome',
      expect.stringContaining('Hello John'),
    );
    expect(result).toEqual({
      emailSent: true,
      sentTo: 'user@example.com',
      sentAt: expect.any(String),
    });
  });
});
```

---

## Migration from Manual Registration

### Before (Manual)

```typescript
@Injectable()
export class EngineHandlerRegistrationService implements OnModuleInit {
  constructor(
    private readonly registry: WorkflowTaskHandlerRegistry,
    private readonly handler1: Handler1,
    private readonly handler2: Handler2,
    private readonly handler3: Handler3,
  ) {}

  onModuleInit() {
    this.registry.register('Handler1', this.handler1);
    this.registry.register('Handler2', this.handler2);
    this.registry.register('Handler3', this.handler3);
  }
}
```

### After (Auto-Discovery)

```typescript
// Handler classes
@WorkflowHandler('Handler1')
@Injectable()
export class Handler1 implements WorkflowTaskHandler { ... }

@WorkflowHandler('Handler2')
@Injectable()
export class Handler2 implements WorkflowTaskHandler { ... }

@WorkflowHandler('Handler3')
@Injectable()
export class Handler3 implements WorkflowTaskHandler { ... }

// Registration service (no changes needed!)
@Injectable()
export class EngineHandlerRegistrationService implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly registry: WorkflowTaskHandlerRegistry,
  ) {}

  async onModuleInit() {
    await this.discoverAndRegisterHandlers(); // Automatic!
  }
}
```

---

## Summary

✅ **Zero manual registration** - Just decorate your handlers
✅ **Type-safe** - Compile-time checks via TypeScript
✅ **Runtime validation** - Verifies handlers implement the interface
✅ **Automatic logging** - See all registered handlers on startup
✅ **Easy to extend** - Add new handlers without modifying registration code
✅ **Testable** - Handlers are just injectable services

**To add a new handler:**
1. Create class with `@WorkflowHandler(name)` and `@Injectable()`
2. Implement `WorkflowTaskHandler` interface
3. Add to module providers
4. Done! 🎉
