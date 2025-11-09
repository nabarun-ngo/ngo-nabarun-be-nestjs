# Using Prisma Types: Complete Guide

## TL;DR - Simple Approach

✅ **Use `Prisma.GetPayload<>` everywhere** - from persistence to API  
✅ **Create type aliases** for common query patterns  
✅ **Use simple DTOs** with `fromDomain()` static methods for APIs  
❌ **Don't use generated Prisma classes** - they don't match query results  

## The Problem

Prisma generates powerful types based on your queries, but they're complex to work with directly:
- Types change based on `include` clauses
- Generated "classes" in `generated/prisma/classes` don't match query results
- Converting between database, domain, and API layers requires careful type handling

## The Solution: Type Aliases

### 1. Create Type Aliases for Query Patterns

```typescript
// infrastructure/types/user-persistence.types.ts
import { Prisma } from 'generated/prisma';

export namespace UserPersistence {
  // Full user with all relations
  export type Full = Prisma.UserProfileGetPayload<{
    include: {
      roles: true;
      phoneNumbers: true;
      addresses: true;
      socialMediaLinks: true;
    };
  }>;

  // User with only roles
  export type WithRoles = Prisma.UserProfileGetPayload<{
    include: { roles: true };
  }>;

  // User for auth
  export type WithAuth = Prisma.UserProfileGetPayload<{
    include: {
      roles: true;
      phoneNumbers: true;
    };
  }>;
}
```

### 2. Use in Infrastructure Mapper

```typescript
// infrastructure/user-infra.mapper.ts
import { UserPersistence } from './types/user-persistence.types';

export class UserInfraMapper {
  static toUser(
    model: UserPersistence.Full | UserPersistence.WithRoles | null,
  ): User | null {
    if (!model) return null;

    // Check which relations exist
    const phoneNumbers = 'phoneNumbers' in model ? model.phoneNumbers : [];
    const addresses = 'addresses' in model ? model.addresses : [];
    
    return new User(
      model.id,
      model.firstName,
      model.lastName,
      model.email,
      // Map with proper null/undefined handling
      model.title ?? undefined,
      // ...
    );
  }

  static toUserCreateInput(user: User): Prisma.UserProfileCreateInput {
    return {
      id: user.id,
      firstName: user.firstName,
      title: user.title ?? null,  // Convert undefined to null
      // ...
    };
  }
}
```

### 3. Use in Repository

```typescript
// infrastructure/persistence/user.repository.ts
export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.userProfile.findUnique({
      where: { id },
      include: {
        roles: true,
        phoneNumbers: true,
        addresses: true,
        socialMediaLinks: true,
      },
    });
    return UserInfraMapper.toUser(user);
  }
}
```

### 4. Create Simple API DTOs

```typescript
// application/dto/user.dto.ts
export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ type: [RoleDto] })
  roles: RoleDto[];

  static fromDomain(user: User): UserDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map(r => RoleDto.fromDomain(r)),
    };
  }
}
```

### 5. Use in Controller

```typescript
// presentation/controllers/user.controller.ts
@Controller('users')
export class UserController {
  @Get(':id')
  @ApiResponse({ type: UserDto })
  async findOne(@Param('id') id: string): Promise<UserDto> {
    const user = await this.userService.findById(id);
    return UserDto.fromDomain(user);
  }
}
```

## Architecture Flow

```
Database Query → Prisma Types → Domain Model → DTO → API Response
                      ↓              ↓          ↓
              UserPersistence.Full  User    UserDto
```

## Key Patterns

### ✅ Handling Optional Relations

```typescript
static toUser(model: UserPersistence.Full | UserPersistence.WithRoles | null): User | null {
  if (!model) return null;

  // Safe check for optional relations
  const phoneNumbers = 'phoneNumbers' in model ? model.phoneNumbers : [];
  const primaryNumber = phoneNumbers.find(p => p.primary) ?? null;
  
  return new User(
    model.id,
    model.firstName,
    primaryNumber ? PhoneNumber.create(primaryNumber.phoneCode, ...) : undefined
  );
}
```

### ✅ Null vs Undefined Conversion

```typescript
// Domain uses undefined for optional fields
// Prisma uses null for nullable fields

// Domain → Prisma
static toCreateInput(user: User): Prisma.UserProfileCreateInput {
  return {
    title: user.title ?? null,  // undefined → null
    about: user.about ?? null,
  };
}

// Prisma → Domain
static toUser(model: UserPersistence.Full): User {
  return new User(
    model.title ?? undefined,  // null → undefined
    model.about ?? undefined,
  );
}
```

### ✅ Separate Create and Update Mappers

```typescript
// For CREATE - all required fields
static toUserCreateInput(user: User): Prisma.UserProfileCreateInput {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    status: user.status,
    isTemporary: user.isTemporary,
    title: user.title ?? null,
  };
}

// For UPDATE - partial fields
static toUserPersistence(user: User): Partial<Prisma.UserProfileUpdateInput> {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    title: user.title,
  };
}
```

### ✅ Extracting Nested Domain Objects

```typescript
// When domain model has User object but Prisma needs ID string
roles: {
  create: user.roles.map(role => ({
    id: role.id,
    roleCode: role.roleCode,
    createdBy: role.createdBy?.id ?? null,  // Extract ID from User
  })),
}
```

## Benefits

### Type Safety ✅
- Compile-time checks for all mappings
- No runtime type errors
- Full IDE autocomplete

### Simplicity ✅
- No class instantiation needed
- Direct object mappings
- Minimal boilerplate

### Maintainability ✅
- Clear separation of concerns
- Easy to update when schema changes
- Reusable type aliases

### Performance ✅
- No class overhead
- Plain objects throughout
- Efficient serialization

## What NOT to Do

### ❌ Don't Use Generated Prisma Classes for Persistence

```typescript
// ❌ BAD - This will fail at runtime
const user: PrismaModel.UserProfile = await prisma.userProfile.findUnique({
  where: { id },
  include: { roles: true }  // Only roles!
});

user.phoneNumbers.find(...);  // 💥 Runtime error - phoneNumbers is undefined!
```

**Why?** The class `PrismaModel.UserProfile` expects ALL relations, but your query might not include them.

### ❌ Don't Use Non-null Assertions

```typescript
// ❌ BAD
model.phoneNumbers.find(p => p.primary)!

// ✅ GOOD
model.phoneNumbers.find(p => p.primary) ?? null
```

### ❌ Don't Mix CreateInput and UpdateInput Types

```typescript
// ❌ BAD
Partial<Prisma.UserProfileUpdateInput | Prisma.UserProfileCreateInput>

// ✅ GOOD - Separate methods
toUserCreateInput(user: User): Prisma.UserProfileCreateInput
toUserPersistence(user: User): Partial<Prisma.UserProfileUpdateInput>
```

## Summary

1. ✅ Create **type aliases** for common query patterns
2. ✅ Use **`'propertyName' in object`** to check for optional relations
3. ✅ Convert **`null` ↔ `undefined`** appropriately between layers
4. ✅ Keep **separate mappers** for create vs update
5. ✅ Use **simple DTOs** with static `fromDomain()` for APIs
6. ❌ **Ignore** the generated Prisma classes in `generated/prisma/classes`

This approach gives you type safety, simplicity, and maintainability without any complex abstractions or generated code overhead.

