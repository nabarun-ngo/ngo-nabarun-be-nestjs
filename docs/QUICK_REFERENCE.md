# Quick Reference Guide

## Create a New Module

```powershell
# Run the module generator script
.\scripts\create-module.ps1 -ModuleName "product"
```

## Module Structure Cheat Sheet

```
module-name/
├── domain/               # Business logic (no dependencies)
│   ├── model/           # Entities, Value Objects
│   ├── repositories/    # Repository interfaces
│   ├── events/          # Domain events
│   └── value-objects/   # Filters, specifications
│
├── application/         # Use cases (depends on domain)
│   ├── use-cases/       # Business operations
│   ├── dto/             # API contracts
│   └── handlers/        # Event/job handlers
│
├── infrastructure/      # External concerns
│   ├── persistence/     # Repository implementations
│   ├── external/        # Third-party integrations
│   ├── types/           # Prisma types
│   ├── *-infra.mapper.ts
│   └── *-mapper-helpers.ts
│
└── presentation/        # API layer
    ├── controllers/     # HTTP endpoints
    └── mappers/         # Response mappers
```

## Naming Conventions Quick Reference

| Component | Pattern | Example |
|-----------|---------|---------|
| **Files** |
| Domain Model | `{entity}.model.ts` | `user.model.ts` |
| Value Object | `{name}.vo.ts` | `email.vo.ts` |
| Repository Interface | `{entity}.repository.interface.ts` | `user.repository.interface.ts` |
| Repository | `{entity}.repository.ts` | `user.repository.ts` |
| Use Case | `{action}-{entity}.use-case.ts` | `create-user.use-case.ts` |
| DTO | `{action}-{entity}.dto.ts` | `create-user.dto.ts` |
| Controller | `{entity}.controller.ts` | `user.controller.ts` |
| Infra Mapper | `{module}-infra.mapper.ts` | `user-infra.mapper.ts` |
| Mapper Helpers | `{module}-mapper-helpers.ts` | `user-mapper-helpers.ts` |
| Persistence Types | `{module}-persistence.types.ts` | `user-persistence.types.ts` |
| **Classes** |
| Domain Entity | `{Entity}` | `User` |
| Repository Interface | `I{Entity}Repository` | `IUserRepository` |
| Use Case | `{Action}{Entity}UseCase` | `CreateUserUseCase` |
| DTO | `{Action}{Entity}Dto` | `CreateUserDto` |
| Mapper | `{Module}InfraMapper` | `UserInfraMapper` |
| **Constants** |
| Repository Token | `{ENTITY}_REPOSITORY` | `USER_REPOSITORY` |

## Common Code Snippets

### 1. Domain Model Template

```typescript
export class Entity extends AggregateRoot {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    super();
  }

  static create(props: { name: string }): Entity {
    const entity = new Entity(
      crypto.randomUUID(),
      props.name,
      new Date(),
      new Date(),
    );
    // entity.addDomainEvent(new EntityCreatedEvent(entity.id));
    return entity;
  }

  // Business methods here
}
```

### 2. Repository Interface Template

```typescript
export interface IEntityRepository extends IRepository<Entity, string> {
  findById(id: string): Promise<Entity | null>;
  create(entity: Entity): Promise<Entity>;
  update(id: string, entity: Entity): Promise<Entity>;
  delete(id: string): Promise<void>;
}

export const ENTITY_REPOSITORY = Symbol('ENTITY_REPOSITORY');
```

### 3. Repository Implementation Template

```typescript
@Injectable()
class EntityRepository
  extends PrismaBaseRepository<
    Entity,
    PrismaPostgresService['entity'],
    Prisma.EntityWhereUniqueInput,
    Prisma.EntityWhereInput,
    EntityPersistence.Base,
    Prisma.EntityCreateInput,
    Prisma.EntityUpdateInput
  >
  implements IEntityRepository
{
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }

  protected getDelegate() {
    return this.prisma.entity;
  }

  protected toDomain(prismaModel: any): Entity | null {
    return EntityInfraMapper.toEntityDomain(prismaModel);
  }

  async findById(id: string): Promise<Entity | null> {
    return this.findUnique({ id });
  }

  async create(entity: Entity): Promise<Entity> {
    const data = EntityInfraMapper.toEntityCreatePersistence(entity);
    return this.createRecord(data);
  }

  async update(id: string, entity: Entity): Promise<Entity> {
    const data = EntityInfraMapper.toEntityUpdatePersistence(entity);
    return this.updateRecord({ id }, data);
  }

  async delete(id: string): Promise<void> {
    await this.softDelete({ id });
  }
}

export default EntityRepository;
```

### 4. Infrastructure Mapper Template

```typescript
export class EntityInfraMapper {
  static toEntityDomain(p: EntityPersistence.Base | any): Entity | null {
    if (!p) return null;
    return new Entity(p.id, p.name, p.createdAt, p.updatedAt);
  }

  static toDomain(p: EntityPersistence.Base | any): Entity | null {
    return EntityInfraMapper.toEntityDomain(p);
  }

  static toEntityCreatePersistence(domain: Entity): Prisma.EntityUncheckedCreateInput {
    return {
      id: domain.id,
      name: domain.name,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      version: BigInt(0),
    };
  }

  static toEntityUpdatePersistence(domain: Entity): Prisma.EntityUncheckedUpdateInput {
    return {
      name: domain.name,
      updatedAt: new Date(),
    };
  }
}
```

### 5. Use Case Template

```typescript
@Injectable()
export class CreateEntityUseCase implements IUseCase<CreateEntityDto, Entity> {
  constructor(
    @Inject(ENTITY_REPOSITORY)
    private readonly entityRepository: IEntityRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateEntityDto): Promise<Entity> {
    const entity = Entity.create({ name: request.name });
    const saved = await this.entityRepository.create(entity);

    for (const event of entity.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    entity.clearEvents();

    return saved;
  }
}
```

### 6. Controller Template

```typescript
@Controller('entities')
export class EntityController {
  constructor(
    private readonly createUseCase: CreateEntityUseCase,
    private readonly getUseCase: GetEntityUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEntityDto) {
    return await this.createUseCase.execute(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.getUseCase.execute(id);
  }
}
```

### 7. Module Configuration Template

```typescript
@Module({
  controllers: [EntityController],
  imports: [],
  providers: [
    // Use Cases
    CreateEntityUseCase,
    GetEntityUseCase,
    
    // Repository
    {
      provide: ENTITY_REPOSITORY,
      useClass: EntityRepository,
    },
  ],
  exports: [ENTITY_REPOSITORY],
})
export class EntityModule {}
```

## Prisma Schema Template

```prisma
model Entity {
  id          String   @id @default(uuid())
  name        String
  status      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  version     BigInt   @default(0)
  deletedAt   DateTime?

  @@map("entities")
}
```

## Common Commands

```powershell
# Generate new module
.\scripts\create-module.ps1 -ModuleName "product"

# Prisma commands
npx prisma migrate dev --name add_product_table
npx prisma generate
npx prisma studio

# Build and run
npm run build
npm run start:dev

# Testing
npm test
npm run test:watch
npm run test:cov
```

## Best Practices Checklist

- [ ] Domain models extend `AggregateRoot`
- [ ] Repositories use default export: `export default EntityRepository`
- [ ] Mapper methods have descriptive names: `toEntityDomain()`, `toEntityCreatePersistence()`
- [ ] Repository `toDomain()` uses `any` parameter type
- [ ] Use `MapperUtils.nullToUndefined()` in mappers
- [ ] Emit domain events after operations
- [ ] Use `executeTransaction()` for complex updates
- [ ] Implement soft delete via `softDelete()`
- [ ] Add JSDoc comments to all public methods
- [ ] Return DTOs from controllers, not domain entities

## Troubleshooting

### Build Errors

**Problem**: `Property 'toEntityDomain' does not exist on type`
**Solution**: Ensure mapper has the correct method name and is exported

**Problem**: `Type parameter mismatch in repository`
**Solution**: Check PrismaBaseRepository type parameters are in correct order

**Problem**: `Cannot find module 'generated/prisma'`
**Solution**: Run `npx prisma generate`

### Common Mistakes

❌ Using `toDomain()` instead of `toEntityDomain()` in mapper
✅ Use descriptive names: `toUserDomain()`, `toProductDomain()`

❌ Hardcoding database queries
✅ Use base repository methods: `findUnique()`, `findMany()`

❌ Mixing persistence and domain logic
✅ Keep domain pure, persistence in infrastructure

## Additional Resources

- Full guide: [MODULE_DEVELOPMENT_GUIDE.md](./MODULE_DEVELOPMENT_GUIDE.md)
- PowerShell script: [scripts/create-module.ps1](../scripts/create-module.ps1)
- Example modules: `src/modules/user`, `src/modules/workflow`
