# Type-Safe Base Repository Guide

## Overview

The `PrismaBaseRepository` provides a fully type-safe foundation for all repository implementations in the application. It eliminates code duplication while maintaining 100% TypeScript type safety with Prisma.

## Architecture

### Core Components

1. **PrismaBaseRepository** - Generic base class with common CRUD operations
2. **RepositoryHelpers** - Utility functions for common repository patterns
3. **Module-Specific Repositories** - Extend base repository with domain-specific logic

## Files

- `src/modules/shared/database/base-repository.ts` - Base repository class
- `src/modules/shared/database/repository-helpers.ts` - Helper utilities
- `src/modules/shared/database/include-patterns.ts` - Centralized Prisma includes
- `src/modules/shared/database/mapper-utils.ts` - Generic mapping utilities
- `src/modules/shared/database/common-mappers.ts` - Common mapping patterns

## Features

### ✅ Type-Safe CRUD Operations
- `findUnique()` - Find by unique identifier
- `findFirst()` - Find first matching record
- `findMany()` - Find multiple records with filtering and pagination
- `createRecord()` - Create new record
- `updateRecord()` - Update existing record
- `upsertRecord()` - Update or create record
- `findPaginated()` - Find with pagination metadata

### ✅ Soft Delete Support
- `softDelete()` - Marks record as deleted (sets deletedAt)
- `hardDelete()` - Permanently removes record
- Automatic filtering of deleted records

### ✅ Batch Operations
- `createMany()` - Bulk create records
- `updateMany()` - Bulk update records
- `deleteMany()` - Bulk delete records

### ✅ Transaction Support
- `executeTransaction()` - Execute operations in transaction
- Full access to Prisma transaction client

### ✅ Query Utilities
- `count()` - Count matching records
- `exists()` - Check if records exist

## Usage

### 1. Define Persistence Types

Create a namespace with Prisma payload types:

```typescript
// user-persistence.types.ts
import { Prisma } from 'prisma/client';

export namespace UserPersistence {
  export type Full = Prisma.UserProfileGetPayload<{
    include: typeof IncludePatterns.USER_FULL;
  }>;

  export type WithRoles = Prisma.UserProfileGetPayload<{
    include: { roles: true };
  }>;
}
```

### 2. Extend Base Repository

```typescript
// user.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaBaseRepository } from 'src/modules/shared/database/base-repository';
import { Prisma } from 'prisma/client';

@Injectable()
class UserRepository 
  extends PrismaBaseRepository<
    User,                                      // Domain model
    PrismaPostgresService['userProfile'],     // Prisma delegate
    Prisma.UserProfileWhereUniqueInput,       // Unique where input
    Prisma.UserProfileWhereInput,             // Where input
    typeof IncludePatterns.USER_FULL,         // Include type
    Prisma.UserProfileCreateInput,            // Create input
    Prisma.UserProfileUpdateInput             // Update input
  >
  implements IUserRepository 
{
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }

  // Required implementations
  protected getDelegate() {
    return this.prisma.userProfile;
  }

  protected toDomain(prismaModel: any): User | null {
    return UserInfraMapper.toUserDomain(prismaModel);
  }

  protected getDefaultInclude() {
    return IncludePatterns.USER_FULL;
  }

  // Interface implementations using base methods
  async findById(id: string): Promise<User | null> {
    return this.findUnique({ id });
  }

  async findAll(filter: UserFilter): Promise<User[]> {
    const where: Prisma.UserProfileWhereInput = {
      firstName: filter.props.firstName,
      lastName: filter.props.lastName,
      email: filter.props.email,
      status: filter.props.status,
      deletedAt: null,
    };

    return this.findMany(
      where,
      undefined,
      RepositoryHelpers.buildPaginationOptions(
        filter.props.pageIndex,
        filter.props.pageSize,
      ),
    );
  }

  async create(user: User): Promise<User> {
    const createData: Prisma.UserProfileCreateInput = {
      ...UserInfraMapper.toUserCreatePersistence(user),
      roles: {
        create: user.roles.map((role) => 
          UserInfraMapper.toRolePersistance(role)
        ),
      },
    };

    return this.createRecord(createData);
  }

  async delete(id: string): Promise<void> {
    await this.softDelete({ id });
  }
}
```

### 3. Use Transaction Support

```typescript
async update(id: string, user: User): Promise<User> {
  return this.executeTransaction(async (tx) => {
    // Update main entity
    await tx.userProfile.update({
      where: { id },
      data: this.toUpdateData(user),
    });

    // Update related entities
    await Promise.all(
      user.roles.map((role) =>
        tx.userRole.upsert({
          where: { id: role.id },
          update: this.toRoleData(role),
          create: { ...this.toRoleData(role), userId: id },
        })
      )
    );

    // Return updated entity
    const updated = await tx.userProfile.findUnique({
      where: { id },
      include: this.getDefaultInclude(),
    });

    return this.toDomain(updated)!;
  });
}
```

## Repository Helpers

### Audit Fields

```typescript
// Create operation
const createData = {
  ...yourData,
  ...RepositoryHelpers.buildCreateAuditFields(),
};

// Update operation
const updateData = {
  ...yourData,
  ...RepositoryHelpers.buildUpdateAuditFields(currentVersion),
};

// Soft delete operation
const deleteData = RepositoryHelpers.buildSoftDeleteData();
```

### Pagination

```typescript
const paginationOptions = RepositoryHelpers.buildPaginationOptions(
  pageIndex,
  pageSize
);

const results = await this.findMany(where, undefined, paginationOptions);
```

### Batch Operations

```typescript
// Execute large batch in chunks
await RepositoryHelpers.executeBatch(
  largeArray,
  100, // batch size
  async (batch) => {
    return this.createMany(batch);
  }
);
```

### Optimistic Locking

```typescript
// Build where clause with version check
const where = RepositoryHelpers.buildOptimisticLockingWhere(entity);

try {
  await this.updateRecord(where, updateData);
} catch (error) {
  if (RepositoryHelpers.isOptimisticLockingError(error)) {
    throw new ConflictException('Entity was modified by another user');
  }
  throw error;
}
```

### Retry with Backoff

```typescript
const result = await RepositoryHelpers.retryWithBackoff(
  async () => this.findById(id),
  3, // max retries
  100 // initial delay in ms
);
```

## Best Practices

### 1. Use Centralized Include Patterns

Always define includes in `include-patterns.ts`:

```typescript
export const IncludePatterns = {
  USER_FULL: {
    roles: true,
    phoneNumbers: true,
    addresses: true,
    socialMediaLinks: true,
  } as const,
  
  WORKFLOW_FULL: {
    steps: {
      include: {
        tasks: {
          include: { assignments: true }
        }
      }
    }
  } as const,
} as const;
```

### 2. Always Use Type-Safe Mappers

```typescript
protected toDomain(prismaModel: any): User | null {
  // Use centralized mapper
  return UserInfraMapper.toUserDomain(prismaModel);
}
```

### 3. Handle Null Returns

```typescript
async findById(id: string): Promise<User | null> {
  // Base method handles null/undefined safely
  return this.findUnique({ id });
}
```

### 4. Use Soft Delete by Default

```typescript
async delete(id: string): Promise<void> {
  // Use soft delete to preserve data
  await this.softDelete({ id });
  
  // Only use hard delete when absolutely necessary
  // await this.hardDelete({ id });
}
```

### 5. Filter Deleted Records

Always exclude soft-deleted records in queries:

```typescript
const where: Prisma.UserProfileWhereInput = {
  email: email,
  deletedAt: null, // Exclude deleted records
};
```

### 6. Use Transactions for Multi-Entity Operations

```typescript
async complexUpdate(data: ComplexData): Promise<Result> {
  return this.executeTransaction(async (tx) => {
    // All operations succeed or all fail
    await tx.entity1.update(...);
    await tx.entity2.create(...);
    await tx.entity3.delete(...);
    
    return result;
  });
}
```

## Type Safety Benefits

### 1. Compile-Time Validation

```typescript
// TypeScript ensures all types match
const user: User = await repository.findById('id'); // ✅ Type-safe
const user: string = await repository.findById('id'); // ❌ Compile error
```

### 2. IntelliSense Support

Full autocomplete for:
- Prisma where clauses
- Include patterns
- Field names
- Filter options

### 3. Refactoring Safety

Changing domain models or Prisma schema triggers compile errors in all affected repositories.

## Migration Guide

### From Direct Prisma Calls

**Before:**
```typescript
async findById(id: string): Promise<User | null> {
  const user = await this.prisma.userProfile.findUnique({
    where: { id },
    include: { roles: true, phoneNumbers: true },
  });
  return UserInfraMapper.toUserDomain(user);
}
```

**After:**
```typescript
async findById(id: string): Promise<User | null> {
  return this.findUnique({ id });
}
```

### From Manual Transaction Handling

**Before:**
```typescript
const result = await this.prisma.$transaction(async (tx) => {
  // operations
});
```

**After:**
```typescript
const result = await this.executeTransaction(async (tx) => {
  // operations
});
```

## Example: Complete Repository

See `src/modules/user/infrastructure/persistence/user.repository.ts` for a complete, production-ready example using the base repository pattern.

## Testing

### Mock Base Repository

```typescript
class MockUserRepository extends PrismaBaseRepository<...> {
  protected getDelegate() {
    return mockPrismaDelegate;
  }
  
  protected toDomain(model: any) {
    return mockMapper(model);
  }
}
```

### Test Helper Usage

```typescript
it('should build create audit fields', () => {
  const fields = RepositoryHelpers.buildCreateAuditFields();
  expect(fields.version).toBe(BigInt(1));
  expect(fields.createdAt).toBeInstanceOf(Date);
});
```

## Summary

The base repository pattern provides:

✅ **Type Safety** - Full compile-time validation  
✅ **Code Reusability** - Common operations in one place  
✅ **Consistency** - Uniform patterns across all modules  
✅ **Maintainability** - Changes in one place affect all repositories  
✅ **Testing** - Easier to mock and test  
✅ **Best Practices** - Built-in soft delete, transactions, pagination  

Use this pattern for all new repositories and gradually migrate existing ones.
