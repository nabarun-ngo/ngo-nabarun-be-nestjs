# External User Support - Workflow Engine Analysis

## 📅 Date: 2026-01-29

---

## ❌ Current Status: **NO External User Support**

The workflow engine currently **ONLY supports internal users** who exist in the system's user database. External users (users without accounts) are **NOT supported**.

---

## 🔍 Current Implementation Analysis

### 1. User References - Internal IDs Only

All user references throughout the workflow engine use internal database user IDs (strings):

#### Workflow Instance
```typescript
export class EngineWorkflowInstance {
  #initiatedById: string | null;      // Internal user ID
  #initiatedForId: string | null;     // Internal user ID
  // ...
}
```

#### Task Assignment
```typescript
export class EngineTaskAssignment {
  #assigneeId: string;                // Internal user ID (REQUIRED)
  #assignedById: string | null;       // Internal user ID
  // ...
}
```

#### Start Workflow Use Case
```typescript
// Task assignments by user ID
if (assignedTo?.userId) {
  task.setAssignments([
    EngineTaskAssignment.create({
      taskId: task.id,
      assigneeId: assignedTo.userId,  // Must be internal user ID
      assignedById: input.requestedBy, // Must be internal user ID
      dueAt,
    }),
  ]);
}

// Task assignments by role - queries internal users only
else if (assignedTo?.roleNames?.length) {
  const users = await this.userRepository.findAll({
    roleCodes: assignedTo.roleNames,
  });
  // Creates assignments only for users in database
}
```

### 2. Email Notifications - Requires Database User

The event handler loads user emails from the database:

```typescript
// engine-workflow-event.handler.ts
if (workflow.initiatedById) {
  const initiatedBy = await this.userRepository.findById(workflow.initiatedById);
  if (initiatedBy?.email) {
    recipients.cc = initiatedBy.email;
  }
}

if (workflow.initiatedForId) {
  const initiatedFor = await this.userRepository.findById(workflow.initiatedForId);
  if (initiatedFor?.email) {
    recipients.to = initiatedFor.email;
  }
}
```

**Impact:**
- If user ID doesn't exist in database → No email sent
- If user exists but has no email → No email sent
- **No way to specify email address directly**

### 3. Task Reminders - Requires Database User

```typescript
// engine-workflow-job.processor.ts
const user = await this.userRepository.findById(assigneeId);

if (!user || !user.email) {
  this.logger.warn(
    `[Job] User not found or no email: assigneeId=${assigneeId}`,
  );
  return; // Task reminder NOT sent
}
```

---

## ❌ What's NOT Supported

### 1. External User Assignment
- ❌ Cannot assign tasks to users not in the database
- ❌ Cannot use email addresses directly for task assignment
- ❌ Cannot create "guest" or "temporary" users for workflows

### 2. Email-Only Workflows
- ❌ Cannot send workflow notifications to arbitrary email addresses
- ❌ Cannot CC external stakeholders on workflow updates
- ❌ Cannot invite external users to participate in workflows

### 3. External Approval Workflows
- ❌ Cannot request approval from external parties (vendors, clients, partners)
- ❌ Cannot track external user responses
- ❌ Cannot send reminder emails to external users

### 4. Multi-Organization Workflows
- ❌ Cannot collaborate with users from partner organizations
- ❌ Cannot share workflow status with external stakeholders
- ❌ Cannot integrate with external identity providers (beyond Auth0 for internal users)

---

## 🔧 What Would Be Needed for External User Support

### Option A: Hybrid User Model (Recommended)

Add support for external users alongside internal users:

#### 1. Schema Changes

```typescript
// New: Support both internal user ID and external email
export interface EngineTaskAssignmentProps {
  id: string;
  taskId: string;
  
  // For INTERNAL users
  assigneeId?: string | null;         // Internal user ID (optional)
  
  // For EXTERNAL users
  assigneeEmail?: string | null;      // External email (optional)
  assigneeName?: string | null;       // External user name
  
  // Validation: ONE of assigneeId or assigneeEmail must be provided
  assigneeType: 'INTERNAL' | 'EXTERNAL';
  
  roleName?: string | null;
  status: EngineTaskAssignmentStatus;
  // ... rest
}

// Workflow instance changes
export interface EngineWorkflowInstanceProps {
  // ... existing fields ...
  
  // New: External user support
  initiatedByEmail?: string | null;   // For external initiators
  initiatedForEmail?: string | null;  // For external beneficiaries
}
```

#### 2. Prisma Schema Updates

```prisma
model EngineTaskAssignment {
  id              String   @id @default(uuid())
  taskId          String
  
  // Internal user reference (optional)
  assigneeId      String?  @db.VarChar(100)
  
  // External user fields (optional)
  assigneeEmail   String?  @db.VarChar(255)
  assigneeName    String?  @db.VarChar(255)
  assigneeType    String   @db.VarChar(20)  // 'INTERNAL' or 'EXTERNAL'
  
  // Validation: assigneeId OR assigneeEmail must be set
  // Add check constraint: CHECK ((assigneeId IS NOT NULL AND assigneeType = 'INTERNAL') OR (assigneeEmail IS NOT NULL AND assigneeType = 'EXTERNAL'))
  
  roleName        String?  @db.VarChar(100)
  status          String   @db.VarChar(50)
  // ... rest
}

model EngineWorkflowInstance {
  id                  String  @id @db.VarChar(50)
  
  // Internal users
  initiatedById       String? @db.VarChar(100)
  initiatedForId      String? @db.VarChar(100)
  
  // External users (new)
  initiatedByEmail    String? @db.VarChar(255)
  initiatedForEmail   String? @db.VarChar(255)
  initiatedByName     String? @db.VarChar(255)
  initiatedForName    String? @db.VarChar(255)
  
  // ... rest
}
```

#### 3. API Changes

```typescript
// Start Workflow - Support external users
export interface StartWorkflowInput {
  type: string;
  requestedBy: string;              // Internal user ID
  requestedFor?: string | null;     // Internal user ID
  
  // NEW: External user support
  requestedForEmail?: string | null;  // External user email
  requestedForName?: string | null;   // External user name
  
  data?: Record<string, unknown>;
}

// Task assignment - Support external assignees
taskConfig: {
  assignedTo: {
    // Option 1: Internal user
    userId?: string;
    
    // Option 2: Internal users by role
    roleNames?: string[];
    
    // Option 3: External user (NEW)
    externalEmail?: string;
    externalName?: string;
  }
}
```

#### 4. Email Notification Logic

```typescript
// Updated: sendWorkflowUpdateEmail()
private async sendWorkflowUpdateEmail(
  workflow: EngineWorkflowInstance,
  action: string,
): Promise<void> {
  const recipients: { to?: string; cc?: string } = {};
  
  // Load internal users from database
  if (workflow.initiatedById) {
    const user = await this.userRepository.findById(workflow.initiatedById);
    if (user?.email) recipients.cc = user.email;
  }
  
  if (workflow.initiatedForId) {
    const user = await this.userRepository.findById(workflow.initiatedForId);
    if (user?.email) recipients.to = user.email;
  }
  
  // NEW: Use external emails directly
  if (workflow.initiatedByEmail) {
    recipients.cc = workflow.initiatedByEmail;
  }
  
  if (workflow.initiatedForEmail) {
    recipients.to = workflow.initiatedForEmail;
  }
  
  // ... send email
}
```

#### 5. Task Reminder Logic

```typescript
// Updated: processSendTaskReminder()
async processSendTaskReminder(job: Job<{ assignmentId: string }>): Promise<void> {
  const assignment = await this.workflowRepository.findAssignmentById(job.data.assignmentId);
  
  if (!assignment) return;
  
  let email: string | undefined;
  let name: string | undefined;
  
  if (assignment.assigneeType === 'INTERNAL') {
    // Load from database
    const user = await this.userRepository.findById(assignment.assigneeId!);
    email = user?.email;
    name = user?.fullName;
  } else {
    // Use external user fields directly
    email = assignment.assigneeEmail!;
    name = assignment.assigneeName ?? 'External User';
  }
  
  if (!email) {
    this.logger.warn(`No email found for assignment: ${assignment.id}`);
    return;
  }
  
  // Send reminder email
  await this.correspondenceService.sendTemplatedEmail({
    options: { recipients: { to: email } },
    templateData: { assigneeName: name, /* ... */ },
  });
}
```

#### 6. Validation & Security

```typescript
// Add validation for external users
export class StartWorkflowUseCase {
  async execute(input: StartWorkflowInput): Promise<EngineWorkflowInstance> {
    // Validate: cannot specify both internal and external user
    if (input.requestedFor && input.requestedForEmail) {
      throw new BusinessException(
        'Cannot specify both requestedFor (internal) and requestedForEmail (external)',
      );
    }
    
    // Validate external email format
    if (input.requestedForEmail && !this.isValidEmail(input.requestedForEmail)) {
      throw new BusinessException('Invalid external email address');
    }
    
    // Security: Prevent email injection
    if (input.requestedForEmail) {
      input.requestedForEmail = this.sanitizeEmail(input.requestedForEmail);
    }
    
    // ... rest of logic
  }
  
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  private sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }
}
```

---

### Option B: External User Table (Alternative)

Create a separate table for external users:

```prisma
model ExternalUser {
  id          String   @id @default(uuid())
  email       String   @unique @db.VarChar(255)
  name        String?  @db.VarChar(255)
  organization String? @db.VarChar(255)
  metadata    String?  @db.Text  // JSON: phone, country, etc.
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  workflowsInitiated EngineWorkflowInstance[] @relation("ExternalInitiatedBy")
  workflowsFor       EngineWorkflowInstance[] @relation("ExternalInitiatedFor")
  taskAssignments    EngineTaskAssignment[]
}

model EngineWorkflowInstance {
  // ... existing fields ...
  
  // External user references
  externalInitiatedById  String? @db.Uuid
  externalInitiatedForId String? @db.Uuid
  
  externalInitiatedBy    ExternalUser? @relation("ExternalInitiatedBy", fields: [externalInitiatedById], references: [id])
  externalInitiatedFor   ExternalUser? @relation("ExternalInitiatedFor", fields: [externalInitiatedForId], references: [id])
}

model EngineTaskAssignment {
  // ... existing fields ...
  
  // External assignee
  externalAssigneeId String?       @db.Uuid
  externalAssignee   ExternalUser? @relation(fields: [externalAssigneeId], references: [id])
}
```

**Pros:**
- Unified handling of internal and external users
- Can track external user participation history
- Can add external user metadata (organization, phone, etc.)

**Cons:**
- More complex schema changes
- Need to create ExternalUser records before assignment
- Additional repository methods needed

---

## 📊 Use Cases That Need External User Support

### 1. Vendor Approval Workflows
- **Scenario:** Purchase order requires vendor approval
- **Requirement:** Send approval email to vendor@company.com (not in system)
- **Current:** ❌ Not possible
- **With External Support:** ✅ Assign task to external email

### 2. Client Onboarding
- **Scenario:** New client completes onboarding form
- **Requirement:** Send workflow updates to client email (before account creation)
- **Current:** ❌ Not possible
- **With External Support:** ✅ Workflow for external email

### 3. External Auditor Reviews
- **Scenario:** Compliance workflow requires external auditor approval
- **Requirement:** Assign review tasks to auditor@audit-firm.com
- **Current:** ❌ Not possible (must create user account first)
- **With External Support:** ✅ Direct external assignment

### 4. Partner Collaboration
- **Scenario:** Multi-organization project workflow
- **Requirement:** Notify partner organization stakeholders
- **Current:** ❌ Cannot send notifications to external emails
- **With External Support:** ✅ CC external stakeholders

### 5. Temporary Contributors
- **Scenario:** One-time consultant review
- **Requirement:** Assign task without creating full user account
- **Current:** ❌ Must create user account (pollutes user database)
- **With External Support:** ✅ Use external user type

---

## 🎯 Recommendation

### Short Term (Current State)
**Status:** ❌ **External users NOT supported**

**Workaround for limited cases:**
1. Create internal user accounts for external users (not ideal)
2. Assign to internal "External Relations" role, manually forward emails
3. Use `contextData` to store external email, manually send emails via separate process

### Long Term (Recommended Enhancement)

**Implement Option A: Hybrid User Model**

**Priority:** **MEDIUM-HIGH** (depends on business requirements)

**Estimated Effort:**
- Schema changes: 1 week
- Domain model updates: 1 week
- Use case updates: 1 week
- API changes: 3 days
- Testing: 1 week
- **Total:** ~4-5 weeks

**Benefits:**
- Unlocks vendor/client collaboration workflows
- Reduces friction for external participation
- More flexible workflow system
- Better user experience for external stakeholders

**Risks:**
- Email deliverability (spam filters)
- Security (email spoofing, phishing)
- Privacy compliance (storing external user data)
- Complexity in permission management

---

## 📋 Implementation Checklist (If External Support Added)

- [ ] Update Prisma schema (add external user fields)
- [ ] Update domain models (EngineWorkflowInstance, EngineTaskAssignment)
- [ ] Update DTOs and mappers
- [ ] Update use cases (StartWorkflow, AssignTask, etc.)
- [ ] Update event handlers (email loading logic)
- [ ] Update job processors (task reminder logic)
- [ ] Add validation for external emails
- [ ] Add security measures (email sanitization, rate limiting)
- [ ] Update API documentation (Swagger)
- [ ] Add integration tests for external user flows
- [ ] Update production readiness checklist
- [ ] Create migration guide
- [ ] Add monitoring for external user workflows

---

## 📖 Documentation Updates Needed

If external user support is added:

1. **API Documentation**
   - New request fields: `requestedForEmail`, `externalEmail` in task config
   - Examples for external user workflows

2. **Workflow Definition Guide**
   - How to assign tasks to external users
   - Email validation rules
   - Security best practices

3. **User Guide**
   - When to use internal vs external users
   - Limitations of external user workflows
   - Troubleshooting email delivery

---

## 🔐 Security Considerations

If implementing external user support:

### 1. Email Validation
- Validate email format (regex)
- Check against disposable email domains
- Verify DNS MX records (optional)

### 2. Rate Limiting
- Limit workflows per external email (prevent spam)
- Limit task assignments per external email
- Throttle email notifications

### 3. Privacy & Compliance
- **GDPR:** Right to be forgotten for external users
- **Data Retention:** Auto-delete external user data after X days
- **Consent:** Require opt-in for external user participation
- **Audit Logs:** Track all external user interactions

### 4. Email Security
- **SPF/DKIM/DMARC:** Ensure proper email authentication
- **Phishing Prevention:** Add warning banners in emails to external users
- **Link Expiry:** Time-bound links for external user actions
- **One-Time Tokens:** Use secure tokens instead of direct user references

---

## ✅ Conclusion

**Current Status:**
- ❌ **NO external user support**
- ✅ Internal users only (must exist in database)
- ✅ Email notifications work for internal users

**Recommendation:**
- Document limitation clearly for stakeholders
- Assess business need for external user support
- If needed, implement **Option A: Hybrid User Model**
- Plan for 4-5 weeks implementation time

**Next Steps:**
1. **Gather requirements:** Which workflows need external users?
2. **Prioritize:** How critical is this feature?
3. **Plan implementation:** If approved, follow Option A approach
4. **Update roadmap:** Add to product backlog with priority

---

**Last Updated:** 2026-01-29  
**Status:** Analysis Complete  
**Recommendation:** Document limitation, implement if business need exists
