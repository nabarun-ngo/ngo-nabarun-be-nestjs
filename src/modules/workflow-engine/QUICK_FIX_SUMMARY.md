# Workflow Engine - Quick Fix Summary

## 🎯 Executive Summary

**Status:** 🟡 85% Ready  
**Time to Production:** 1-2 days  
**Required Fixes:** 4 items (1 Critical, 3 Medium)

---

## 🔴 CRITICAL - MUST FIX

### 1. Add External User Support (3-4 hours)

**What:** Legacy module supports guest users (non-registered). New engine doesn't.

**Files to Modify:**
1. `prisma/schema.prisma` - Add `isExternalUser` and `externalUserEmail` fields
2. `domain/model/engine-workflow-instance.model.ts` - Add fields to model
3. `infrastructure/engine-infra.mapper.ts` - Update mappers
4. `application/dto/workflow-engine.dto.ts` - Add to DTOs
5. `application/use-cases/start-workflow.use-case.ts` - Accept parameters
6. `application/handlers/engine-workflow-event.handler.ts` - Send email to external user

**Key Code Changes:**

```prisma
// In EngineWorkflowInstance model
isExternalUser    Boolean  @default(false)
externalUserEmail String?  @db.VarChar(100)
```

```typescript
// In domain model
#isExternalUser: boolean;
#externalUserEmail: string | null;
```

**Migration:**
```bash
npx prisma migrate dev --name add_external_user_support
npx prisma generate
```

**Test:**
```bash
POST /workflow-engine/start
{
  "type": "USER_ONBOARDING",
  "data": { ... },
  "isExternalUser": true,
  "externalUserEmail": "guest@example.com"
}
```

---

## 🟡 MEDIUM PRIORITY - SHOULD FIX

### 2. Add Static Data Endpoints (2-3 hours)

**What:** Frontend needs workflow types and field definitions.

**Create New Files:**
- `application/services/static-data.service.ts`
- `application/dto/static-data.dto.ts`

**Add Endpoints:**
```typescript
GET /workflow-engine/static/referenceData        → Returns workflow types
GET /workflow-engine/static/additionalFields?workflowType=X → Returns required fields
```

**Update:**
- `workflow-engine.module.ts` - Register `StaticDataService`
- `workflow-engine.controller.ts` - Add endpoints

---

### 3. Add Task Query Endpoints (2 hours)

**What:** Users need to see tasks assigned to them.

**Create:**
- `application/use-cases/list-my-tasks.use-case.ts`

**Add Endpoint:**
```typescript
GET /workflow-engine/tasks/forMe?completed=N     → Returns my pending tasks
GET /workflow-engine/tasks/forMe?completed=Y     → Returns my completed tasks
```

---

### 4. Add Convenience Alias Endpoints (1 hour)

**What:** Legacy has "forMe" and "byMe" shortcuts.

**Add Endpoints:**
```typescript
GET /workflow-engine/instances/forMe             → Workflows where I'm recipient
GET /workflow-engine/instances/byMe              → Workflows I initiated
```

These are just aliases that reuse existing `listInstances` with filters.

---

## ✅ TESTING REQUIREMENTS

Before deploying:

1. **External User Flow**
   - [ ] Create workflow as guest user
   - [ ] Verify email sent to guest email
   - [ ] Verify workflow visible in admin panel

2. **Static Data**
   - [ ] Call reference data endpoint
   - [ ] Verify workflow types returned
   - [ ] Call additional fields endpoint
   - [ ] Verify required fields marked correctly

3. **Task Queries**
   - [ ] Login as user with assigned tasks
   - [ ] Call tasks/forMe endpoint
   - [ ] Verify only user's tasks returned

4. **End-to-End**
   - [ ] Create workflow → Complete all tasks → Workflow completes
   - [ ] Verify emails sent at each stage
   - [ ] Verify reminders work for overdue tasks

---

## 📦 DEPLOYMENT STRATEGY

**Recommended: Parallel Running**

1. Keep both modules enabled:
   ```typescript
   // app.module.ts
   WorkflowModule,        // Legacy (existing workflows)
   WorkflowEngineModule,  // New (new workflows)
   ```

2. New workflows → Use new engine
3. Existing workflows → Remain on legacy
4. Gradually migrate definitions over 2-4 weeks
5. Deprecate legacy module after migration complete

---

## 🎯 SUCCESS CRITERIA

When these are all ✅, you're ready for production:

- [ ] External user workflows work end-to-end
- [ ] Static data endpoints return correct data
- [ ] Task query endpoints filter correctly
- [ ] All emails send to correct recipients (internal vs external)
- [ ] Database migration successful
- [ ] TypeScript compiles without errors
- [ ] All tests passing
- [ ] Code reviewed and approved

---

## 📞 NEED HELP?

1. Review detailed checklist: `PRODUCTION_READINESS_CHECKLIST.md`
2. Check implementation context: `REVIEWER_GAPS_FIXED.md`
3. Ask senior architect for clarification

---

**Estimated Total Time:** 10-13 hours (1.5-2 days)

**Priority:** Fix Item #1 (External User Support) first. Items #2-4 can be done in parallel by different developers.

---

**Good luck! The new engine is architecturally superior with parallel workflows, conditional transitions, and full assignment lifecycle. Once these gaps are filled, it will be a major upgrade! 🚀**
