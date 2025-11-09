# Type-Safe Infrastructure Layer - Implementation Guide

## ✅ What Was Implemented

### 1. **MapperUtils** - Type-Safe Utility Functions
Location: `src/modules/shared/database/mapper-utils.ts`

**Purpose:** Generic, reusable mapping utilities that maintain full type safety

**Key Methods:**
```typescript
MapperUtils.nullToUndefined<T>(value: T | null): T | undefined
MapperUtils.undefinedToNull<T>(value: T | undefined): T | null
MapperUtils.mapArray<TSource, TDest>(source, mapper): TDest[]
MapperUtils.safeFind<T>(array, predicate): T | null
MapperUtils.hasProperty<T, K>(obj, key): type guard
MapperUtils.withDefault<T>(value, defaultValue): T
```

### 2. **CommonMappers** - Cross-Cutting Mapping Logic
Location: `src/modules/shared/database/common-mappers.ts`

**Purpose:** Reusable patterns for common mapping scenarios

**Key Methods:**
```typescript
CommonMappers.mapAuditFieldsFromPrisma(source): audit fields
CommonMappers.mapAuditFieldsToPrisma(source): Prisma audit fields
CommonMappers.mapCollection<TSource, TDest>(source, mapper): TDest[]
CommonMappers.splitToArray(value): string[]
CommonMappers.joinToString(value): string | null
CommonMappers.toEnum<T>(value, enumType, defaultValue): T[keyof T]
```

### 3. **IncludePatterns** - Centralized Query Includes
Location: `src/modules/shared/database/include-patterns.ts`

**Purpose:** DRY principle for Prisma include clauses, fully type-safe with `as const`

**Patterns:**
```typescript
IncludePatterns.USER_FULL          // All user relations
IncludePatterns.USER_WITH_ROLES    // User with roles only
IncludePatterns.USER_WITH_AUTH     // User with auth data
IncludePatterns.WORKFLOW_INSTANCE_FULL  // Full workflow data
```

### 4. **UserMapperHelpers** - Module-Specific Type-Safe Helpers
Location: `src/modules/user/infrastructure/types/user-mapper-helpers.ts`

**Purpose:** Domain-specific helpers that maintain type safety for User aggregate

**Methods:**
```typescript
UserMapperHelpers.extractPhoneNumbers(model): { primary, secondary }
UserMapperHelpers.extractAddresses(model): { present, permanent }
UserMapperHelpers.extractSocialLinks(model): links[]
UserMapperHelpers.extractRoles(model): roles[]
UserMapperHelpers.hasFullRelations(model): type guard
```

### 5. **Updated UserInfraMapper** - Fully Type-Safe Mapping
Location: `src/modules/user/infrastructure/user-infra.mapper.ts`

**Changes:**
- ✅ Uses `MapperUtils` for null/undefined conversions
- ✅ Uses `UserMapperHelpers` for relation extraction
- ✅ Uses `CommonMappers` for string array conversions
- ✅ Full type safety with no `any` types
- ✅ Cleaner, more readable code

### 6. **Updated UserRepository** - Centralized Includes
Location: `src/modules/user/infrastructure/persistence/user.repository.ts`

**Changes:**
- ✅ Uses `IncludePatterns.USER_FULL` instead of hardcoded includes
- ✅ Consistent query patterns across all methods
- ✅ Easy to update includes in one place

## 🎯 Benefits Achieved

### Type Safety ✅
- **100% type-safe** - No `any` types used
- **Compile-time checks** - TypeScript catches errors early
- **Type guards** - Runtime type narrowing where needed
- **Generic constraints** - Ensures correct usage

### Code Quality ✅
- **DRY principle** - No repeated patterns
- **Reusability** - Utils work across all modules
- **Readability** - Clear intent with named functions
- **Maintainability** - Fix once, apply everywhere

### Developer Experience ✅
- **IDE autocomplete** - Full IntelliSense support
- **Clear errors** - TypeScript provides helpful messages
- **Easy testing** - Pure functions are simple to test
- **Documentation** - Types serve as documentation

## 📖 Usage Examples

### Example 1: Using MapperUtils
```typescript
// Before
const title = model.title ?? undefined;
const roles = model.roles?.map(r => new Role(...)) ?? [];

// After - Type-safe and clean
const title = MapperUtils.nullToUndefined(model.title);
const roles = MapperUtils.mapArray(model.roles, r => new Role(...));
```

### Example 2: Using UserMapperHelpers
```typescript
// Before - Manual extraction
const phoneNumbers = 'phoneNumbers' in model ? model.phoneNumbers : [];
const primary = phoneNumbers.find(p => p.primary) ?? null;

// After - Type-safe helper
const { primary, secondary } = UserMapperHelpers.extractPhoneNumbers(model);
```

### Example 3: Using IncludePatterns
```typescript
// Before - Repeated everywhere
include: {
  roles: true,
  phoneNumbers: true,
  addresses: true,
  socialMediaLinks: true,
}

// After - Centralized and reusable
include: IncludePatterns.USER_FULL
```

### Example 4: Using CommonMappers
```typescript
// Before
const loginMethods = user.loginMethod.join(',') || null;

// After - Type-safe utility
const loginMethods = CommonMappers.joinToString([...user.loginMethod]);
```

## 🚀 How to Extend

### Adding New Module Mappers

1. **Create persistence types:**
```typescript
// modules/yourModule/infrastructure/types/your-persistence.types.ts
export namespace YourPersistence {
  export type Full = Prisma.YourModelGetPayload<{
    include: { relations: true };
  }>;
}
```

2. **Create module-specific helpers:**
```typescript
// modules/yourModule/infrastructure/types/your-mapper-helpers.ts
export class YourMapperHelpers {
  static extractSomeRelation(model: YourPersistence.Full) {
    return MapperUtils.hasProperty(model, 'relation')
      ? model.relation
      : [];
  }
}
```

3. **Use in mapper:**
```typescript
import { MapperUtils, CommonMappers } from 'src/modules/shared/database';
import { YourMapperHelpers } from './types/your-mapper-helpers';

export class YourInfraMapper {
  static toDomain(model: YourPersistence.Full | null): YourDomain | null {
    if (!model) return null;
    
    const relations = YourMapperHelpers.extractSomeRelation(model);
    return new YourDomain(
      model.id,
      MapperUtils.nullToUndefined(model.optionalField),
      MapperUtils.mapArray(relations, r => ...),
    );
  }
}
```

4. **Add include patterns:**
```typescript
// In IncludePatterns class
static readonly YOUR_MODEL_FULL = {
  relations: true,
  nestedRelations: true,
} as const;
```

## ✨ Type Safety Guarantees

### All utilities provide:
1. **Generic type constraints** - Compile-time type checking
2. **Type guards** - Runtime type narrowing
3. **No `any` types** - Full type inference
4. **Explicit return types** - Clear contracts
5. **Immutability** - `as const` where applicable

### Example Type Safety:
```typescript
// ✅ Type-safe - TypeScript knows the exact type
const value: string | null = model.title;
const result: string | undefined = MapperUtils.nullToUndefined(value);
//    ^-- TypeScript infers this correctly

// ✅ Type-safe array mapping
const roles: Role[] = MapperUtils.mapArray(
  model.roles,              // Prisma role type
  (r) => new Role(...)      // Returns Role | null
);                          // Final type: Role[]

// ✅ Type-safe includes
const include = IncludePatterns.USER_FULL;
// TypeScript knows: { roles: true, phoneNumbers: true, ... }
```

## 📊 Comparison: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| Type Safety | ⚠️ Some `any` usage | ✅ 100% type-safe |
| Code Duplication | ❌ Repeated patterns | ✅ DRY principles |
| Maintainability | ⚠️ Change in many places | ✅ Change once |
| Readability | ⚠️ Verbose | ✅ Clean & clear |
| Testing | ⚠️ Complex | ✅ Simple pure functions |
| Performance | ✅ Good | ✅ Same (zero overhead) |

## 🔧 Available Utilities Quick Reference

```typescript
// Null/Undefined Conversion
MapperUtils.nullToUndefined(value)
MapperUtils.undefinedToNull(value)
MapperUtils.withDefault(value, defaultValue)

// Array Operations
MapperUtils.mapArray(array, mapper)
MapperUtils.safeFind(array, predicate)
MapperUtils.emptyIfUndefined(array)

// Type Guards & Checks
MapperUtils.hasProperty(obj, key)
MapperUtils.getNestedProperty(obj, key1, key2)

// String/Array Conversions
CommonMappers.splitToArray(string)
CommonMappers.joinToString(array)

// Collection Mapping
CommonMappers.mapCollection(source, mapper)
CommonMappers.mapOptional(source, mapper)

// Audit Fields
CommonMappers.mapAuditFieldsFromPrisma(source)
CommonMappers.mapAuditFieldsToPrisma(source)

// Enum Conversions
CommonMappers.toEnum(value, enumType, defaultValue)

// Include Patterns
IncludePatterns.USER_FULL
IncludePatterns.USER_WITH_ROLES
IncludePatterns.USER_WITH_AUTH
IncludePatterns.WORKFLOW_INSTANCE_FULL
```

## 🎓 Best Practices

1. **Always use MapperUtils** for null/undefined conversions
2. **Create module-specific helpers** for complex extractions
3. **Use IncludePatterns** for all Prisma queries
4. **Leverage type guards** for runtime type safety
5. **Keep mappers pure** - no side effects
6. **Test utilities** independently from domain logic
7. **Document complex mappings** with JSDoc comments
8. **Extend patterns** as new needs arise

## 🚦 Migration Path for Other Modules

To migrate existing modules (like workflow):

1. ✅ Import shared utilities
2. ✅ Create module-specific helpers
3. ✅ Add include patterns
4. ✅ Update mapper to use utilities
5. ✅ Update repository to use include patterns
6. ✅ Test thoroughly

The implementation is **fully backward compatible** - you can migrate modules incrementally.

