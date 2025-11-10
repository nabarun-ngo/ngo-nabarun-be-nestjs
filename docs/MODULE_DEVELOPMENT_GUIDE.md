# NestJS Module Development Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Folder Structure](#folder-structure)
4. [Step-by-Step Module Creation](#step-by-step-module-creation)
5. [Naming Conventions](#naming-conventions)
6. [Code Standards](#code-standards)
7. [Testing Guidelines](#testing-guidelines)
8. [Common Patterns](#common-patterns)

---

## Overview

This project follows **Clean Architecture** principles with a layered approach that separates concerns and promotes maintainability, testability, and scalability.

### Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │  (Controllers, DTOs, Mappers)
├─────────────────────────────────────────┤
│         Application Layer               │  (Use Cases, Handlers, DTOs)
├─────────────────────────────────────────┤
│           Domain Layer                  │  (Entities, Value Objects, Interfaces)
├─────────────────────────────────────────┤
│       Infrastructure Layer              │  (Repositories, External Services, Mappers)
└─────────────────────────────────────────┘
```

**Dependency Rule**: Dependencies point inward. Domain has no dependencies. Application depends on Domain. Infrastructure and Presentation depend on Domain and Application.

---

## Architecture Principles

### 1. **Domain Layer** (Core Business Logic)
- **No external dependencies** - Pure TypeScript/JavaScript
- Contains:
  - **Domain Models** (Entities, Aggregates)
  - **Value Objects** (Immutable, validated data)
  - **Domain Events** (Business event notifications)
  - **Repository Interfaces** (Contracts for data access)
  - **Domain Services** (Complex business logic)

### 2. **Application Layer** (Use Cases)
- Orchestrates business logic
- Contains:
  - **Use Cases** (Application-specific business rules)
  - **DTOs** (Data Transfer Objects for API contracts)
  - **Event Handlers** (React to domain events)
  - **Job Handlers** (Background job processing)

### 3. **Infrastructure Layer** (External Concerns)
- Implements interfaces defined in Domain
- Contains:
  - **Repositories** (Data persistence implementation)
  - **External Services** (Third-party integrations)
  - **Infrastructure Mappers** (Prisma ↔ Domain conversion)
  - **Mapper Helpers** (Type-safe extraction utilities)
  - **Persistence Types** (Prisma query result types)

### 4. **Presentation Layer** (API Interface)
- Handles HTTP concerns
- Contains:
  - **Controllers** (Route handlers)
  - **Presentation Mappers** (Domain → DTO conversion)
  - **Validation Pipes** (Input validation)

---

## Folder Structure

```
src/modules/
└── {module-name}/
    ├── domain/
    │   ├── model/
    │   │   ├── {entity}.model.ts           # Aggregate root or entity
    │   │   ├── {value-object}.vo.ts        # Value objects
    │   │   └── index.ts
    │   ├── repositories/
    │   │   └── {entity}.repository.interface.ts
    │   ├── events/
    │   │   └── {event}.event.ts
    │   └── value-objects/
    │       └── {filter}.vo.ts
    │
    ├── application/
    │   ├── use-cases/
    │   │   ├── create-{entity}.use-case.ts
    │   │   ├── update-{entity}.use-case.ts
    │   │   └── get-{entity}.use-case.ts
    │   ├── dto/
    │   │   ├── create-{entity}.dto.ts
    │   │   ├── update-{entity}.dto.ts
    │   │   └── mapper.ts                   # Domain → DTO mappers
    │   └── handlers/
    │       ├── {entity}-events.handler.ts
    │       └── {entity}-jobs.handler.ts
    │
    ├── infrastructure/
    │   ├── persistence/
    │   │   └── {entity}.repository.ts      # Repository implementation
    │   ├── external/
    │   │   └── {service}.service.ts        # External integrations
    │   ├── types/
    │   │   └── {entity}-persistence.types.ts
    │   ├── {module}-infra.mapper.ts        # Main infrastructure mapper
    │   └── {module}-mapper-helpers.ts      # Type-safe extraction helpers
    │
    ├── presentation/
    │   ├── controllers/
    │   │   └── {entity}.controller.ts
    │   └── mappers/
    │       └── {entity}-response.mapper.ts
    │
    ├── {module}.module.ts                  # NestJS module configuration
    └── README.md                            # Module-specific documentation
```

---

## Step-by-Step Module Creation

### Step 1: Use the PowerShell Script

Run the module scaffolding script:

```powershell
.\scripts\create-module.ps1 -ModuleName "product"
```

This creates the complete folder structure.

### Step 2: Define Domain Models

**Create the aggregate root:**

```typescript
// src/modules/product/domain/model/product.model.ts
import { AggregateRoot } from 'src/shared/models/aggregate-root';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class Product extends AggregateRoot {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public price: number,
    public status: ProductStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    super();
  }

  static create(props: {
    name: string;
    description: string;
    price: number;
  }): Product {
    const product = new Product(
      crypto.randomUUID(),
      props.name,
      props.description,
      props.price,
      ProductStatus.DRAFT,
      new Date(),
      new Date(),
    );
    
    return product;
  }

  publish(): void {
    if (this.status === ProductStatus.PUBLISHED) {
      throw new Error('Product is already published');
    }
    this.status = ProductStatus.PUBLISHED;
  }
}
```

**Create value objects:**

```typescript
// src/modules/product/domain/model/price.vo.ts
export class Price {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {
    if (amount < 0) {
      throw new Error('Price cannot be negative');
    }
  }

  static create(amount: number, currency: string = 'USD'): Price {
    return new Price(amount, currency);
  }
}
```

### Step 3: Define Repository Interface

```typescript
// src/modules/product/domain/repositories/product.repository.interface.ts
import { IRepository } from 'src/shared/interfaces/repository.interface';
import { Product } from '../model/product.model';

export interface IProductRepository extends IRepository<Product, string> {
  findById(id: string): Promise<Product | null>;
  findByStatus(status: string): Promise<Product[]>;
  create(product: Product): Promise<Product>;
  update(id: string, product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
  findAll(filter?: any): Promise<Product[]>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
```

### Step 4: Create Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String
  price       Decimal  @db.Decimal(10, 2)
  status      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  version     BigInt   @default(0)
  deletedAt   DateTime?

  @@map("products")
}
```

Run migration:

```bash
npx prisma migrate dev --name add_product_table
npx prisma generate
```

### Step 5: Create Persistence Types

```typescript
// src/modules/product/infrastructure/types/product-persistence.types.ts
import { Prisma } from 'prisma/client';

export namespace ProductPersistence {
  /**
   * Basic product without any relations
   */
  export type Base = Prisma.ProductGetPayload<{
    select: {
      id: true;
      name: true;
      description: true;
      price: true;
      status: true;
      createdAt: true;
      updatedAt: true;
      version: true;
      deletedAt: true;
    };
  }>;

  /**
   * Product with all relations included
   */
  export type Full = Prisma.ProductGetPayload<{
    include: {
      // Add relations here when needed
    };
  }>;
}
```

### Step 6: Create Infrastructure Mapper

```typescript
// src/modules/product/infrastructure/product-infra.mapper.ts
import { Product, ProductStatus } from '../domain/model/product.model';
import { Prisma } from 'prisma/client';
import { ProductPersistence } from './types/product-persistence.types';
import { MapperUtils } from 'src/modules/shared/database/mapper-utils';

export class ProductInfraMapper {
  /**
   * Convert Prisma persistence model to Domain model
   */
  static toProductDomain(p: ProductPersistence.Base | null): Product | null {
    if (!p) return null;

    return new Product(
      p.id,
      p.name,
      p.description,
      Number(p.price),
      p.status as ProductStatus,
      p.createdAt,
      p.updatedAt,
    );
  }

  /**
   * Convert Domain model to Prisma create input
   */
  static toProductCreatePersistence(domain: Product): Prisma.ProductUncheckedCreateInput {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      price: domain.price,
      status: domain.status,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      version: BigInt(0),
    };
  }

  /**
   * Convert Domain model to Prisma update input
   */
  static toProductUpdatePersistence(domain: Product): Prisma.ProductUncheckedUpdateInput {
    return {
      name: domain.name,
      description: domain.description,
      price: domain.price,
      status: domain.status,
      updatedAt: new Date(),
    };
  }
}
```

### Step 7: Implement Repository

```typescript
// src/modules/product/infrastructure/persistence/product.repository.ts
import { Injectable } from '@nestjs/common';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/model/product.model';
import { Prisma } from 'prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { PrismaBaseRepository } from 'src/modules/shared/database/base-repository';
import { ProductInfraMapper } from '../product-infra.mapper';
import { ProductPersistence } from '../types/product-persistence.types';

@Injectable()
class ProductRepository
  extends PrismaBaseRepository<
    Product,
    PrismaPostgresService['product'],
    Prisma.ProductWhereUniqueInput,
    Prisma.ProductWhereInput,
    ProductPersistence.Base,
    Prisma.ProductCreateInput,
    Prisma.ProductUpdateInput
  >
  implements IProductRepository
{
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }

  protected getDelegate() {
    return this.prisma.product;
  }

  protected toDomain(prismaModel: any): Product | null {
    return ProductInfraMapper.toProductDomain(prismaModel);
  }

  async findAll(filter?: any): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {
      status: filter?.status,
      deletedAt: null,
    };
    return this.findMany(where);
  }

  async findById(id: string): Promise<Product | null> {
    return this.findUnique({ id });
  }

  async findByStatus(status: string): Promise<Product[]> {
    return this.findMany({ status, deletedAt: null });
  }

  async create(product: Product): Promise<Product> {
    const createData = ProductInfraMapper.toProductCreatePersistence(product);
    return this.createRecord(createData);
  }

  async update(id: string, product: Product): Promise<Product> {
    const updateData = ProductInfraMapper.toProductUpdatePersistence(product);
    return this.updateRecord({ id }, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.softDelete({ id });
  }
}

export default ProductRepository;
```

### Step 8: Create Use Cases

```typescript
// src/modules/product/application/use-cases/create-product.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { Product } from '../../domain/model/product.model';
import { PRODUCT_REPOSITORY, IProductRepository } from '../../domain/repositories/product.repository.interface';
import { CreateProductDto } from '../dto/create-product.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateProductUseCase implements IUseCase<CreateProductDto, Product> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateProductDto): Promise<Product> {
    // Create domain entity
    const product = Product.create({
      name: request.name,
      description: request.description,
      price: request.price,
    });

    // Save to repository
    const savedProduct = await this.productRepository.create(product);

    // Emit domain events
    for (const event of product.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    product.clearEvents();

    return savedProduct;
  }
}
```

### Step 9: Create DTOs

```typescript
// src/modules/product/application/dto/create-product.dto.ts
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;
}
```

### Step 10: Create Controller

```typescript
// src/modules/product/presentation/controllers/product.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { CreateProductDto } from '../../application/dto/create-product.dto';

@Controller('products')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return await this.createProductUseCase.execute(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    // Implement get use case
  }
}
```

### Step 11: Configure Module

```typescript
// src/modules/product/product.module.ts
import { Module } from '@nestjs/common';
import { ProductController } from './presentation/controllers/product.controller';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository.interface';
import ProductRepository from './infrastructure/persistence/product.repository';

@Module({
  controllers: [ProductController],
  imports: [],
  providers: [
    CreateProductUseCase,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductModule {}
```

### Step 12: Register in App Module

```typescript
// src/app.module.ts
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    // ... other modules
    ProductModule,
  ],
})
export class AppModule {}
```

---

## Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Domain Model | `{entity}.model.ts` | `user.model.ts` |
| Value Object | `{name}.vo.ts` | `phone-number.vo.ts` |
| Repository Interface | `{entity}.repository.interface.ts` | `user.repository.interface.ts` |
| Repository Implementation | `{entity}.repository.ts` | `user.repository.ts` |
| Use Case | `{action}-{entity}.use-case.ts` | `create-user.use-case.ts` |
| DTO | `{action}-{entity}.dto.ts` | `create-user.dto.ts` |
| Controller | `{entity}.controller.ts` | `user.controller.ts` |
| Infrastructure Mapper | `{module}-infra.mapper.ts` | `user-infra.mapper.ts` |
| Mapper Helpers | `{module}-mapper-helpers.ts` | `user-mapper-helpers.ts` |
| Persistence Types | `{module}-persistence.types.ts` | `user-persistence.types.ts` |
| Event | `{entity}-{action}.event.ts` | `user-created.event.ts` |
| Handler | `{entity}-{type}.handler.ts` | `user-events.handler.ts` |

### Classes

| Type | Pattern | Example |
|------|---------|---------|
| Domain Model | `{Entity}` | `User` |
| Value Object | `{Name}` | `PhoneNumber` |
| Repository Interface | `I{Entity}Repository` | `IUserRepository` |
| Repository Class | `{Entity}Repository` | `UserRepository` |
| Use Case | `{Action}{Entity}UseCase` | `CreateUserUseCase` |
| DTO | `{Action}{Entity}Dto` | `CreateUserDto` |
| Controller | `{Entity}Controller` | `UserController` |
| Mapper | `{Module}InfraMapper` | `UserInfraMapper` |
| Event | `{Entity}{Action}Event` | `UserCreatedEvent` |

### Constants

| Type | Pattern | Example |
|------|---------|---------|
| Repository Token | `{ENTITY}_REPOSITORY` | `USER_REPOSITORY` |
| Service Token | `{SERVICE}_SERVICE` | `AUTH0_SERVICE` |

---

## Code Standards

### 1. Repository Standards

✅ **DO:**
- Extend `PrismaBaseRepository` with correct type parameters
- Use `any` for `toDomain` parameter type
- Export repository as default: `export default UserRepository`
- Use mapper methods with descriptive names: `toEntityDomain()`, `toEntityCreatePersistence()`
- Implement soft delete using `softDelete()` method
- Use `executeTransaction()` for complex updates

❌ **DON'T:**
- Use generic method names like `toDomain()` in mapper (use `toEntityDomain()`)
- Hard-code queries - use base repository methods
- Mix persistence and domain logic

### 2. Mapper Standards

✅ **DO:**
- Create separate mapper helper file for type-safe extraction
- Use `MapperUtils.nullToUndefined()` and `MapperUtils.undefinedToNull()`
- Add comprehensive JSDoc comments
- Create separate methods for create and update persistence
- Use descriptive method names: `toEntityDomain()`, `toEntityCreatePersistence()`

❌ **DON'T:**
- Put extraction logic directly in main mapper
- Use `as any` type assertions
- Mix different concerns in one method

### 3. Use Case Standards

✅ **DO:**
- Inject dependencies via constructor
- Use repository interfaces (via symbols)
- Emit domain events after successful operations
- Clear events after emitting: `entity.clearEvents()`
- Return DTOs, not domain entities
- Handle business validation

❌ **DON'T:**
- Access database directly
- Contain HTTP-specific logic
- Return Prisma entities

### 4. Domain Model Standards

✅ **DO:**
- Extend `AggregateRoot` for aggregate roots
- Provide static `create()` factory methods
- Encapsulate business logic in methods
- Emit domain events for important state changes
- Make IDs readonly
- Validate invariants

❌ **DON'T:**
- Have setters - use methods that express intent
- Reference infrastructure concerns
- Contain persistence logic

---

## Testing Guidelines

### Unit Test Structure

```typescript
// user.repository.spec.ts
import { Test } from '@nestjs/testing';
import UserRepository from './user.repository';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prisma: PrismaPostgresService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaPostgresService,
          useValue: {
            userProfile: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get(UserRepository);
    prisma = module.get(PrismaPostgresService);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = { id: '1', firstName: 'John' };
      jest.spyOn(prisma.userProfile, 'findUnique').mockResolvedValue(mockUser);

      // Act
      const result = await repository.findById('1');

      // Assert
      expect(result).toBeDefined();
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: undefined,
      });
    });
  });
});
```

---

## Common Patterns

### Pattern 1: Mapper Helpers

Create type-safe extraction methods in a separate helper file:

```typescript
// user-mapper-helpers.ts
import { UserPersistence } from './types/user-persistence.types';

export class UserMapperHelpers {
  static extractPhoneNumbers(model: UserPersistence.Full | UserPersistence.WithAuth) {
    const hasPhones = 'phoneNumbers' in model;
    const phones = hasPhones ? model.phoneNumbers : [];
    
    return {
      primary: phones.find(p => p.primary) ?? null,
      secondary: phones.find(p => !p.primary) ?? null,
    };
  }
}
```

### Pattern 2: Pagination

Use `RepositoryHelpers.buildPaginationOptions()`:

```typescript
return this.findMany(
  where,
  undefined,
  RepositoryHelpers.buildPaginationOptions(filter.pageIndex, filter.pageSize),
);
```

### Pattern 3: Transaction Management

Use `executeTransaction()` for complex operations:

```typescript
async update(id: string, entity: Entity): Promise<Entity> {
  return this.executeTransaction(async (tx) => {
    await tx.entity.update({ where: { id }, data });
    // More operations...
    return mappedEntity;
  });
}
```

### Pattern 4: Domain Events

Emit events after state changes:

```typescript
// In domain model
publish(): void {
  this.status = Status.PUBLISHED;
  this.addDomainEvent(new ProductPublishedEvent(this.id));
}

// In use case
const product = await this.repository.findById(id);
product.publish();
await this.repository.update(id, product);

for (const event of product.domainEvents) {
  this.eventEmitter.emit(event.constructor.name, event);
}
product.clearEvents();
```

---

## Checklist for New Module

- [ ] Run `create-module.ps1` script
- [ ] Define domain models with business logic
- [ ] Create repository interface in domain layer
- [ ] Add Prisma schema and run migrations
- [ ] Create persistence types
- [ ] Implement infrastructure mapper with helpers
- [ ] Implement repository extending `PrismaBaseRepository`
- [ ] Create use cases for business operations
- [ ] Define DTOs with validation
- [ ] Create controller with proper routing
- [ ] Configure module with dependency injection
- [ ] Register module in `AppModule`
- [ ] Write unit tests for critical paths
- [ ] Document module-specific behavior in README.md

---

## Additional Resources

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
