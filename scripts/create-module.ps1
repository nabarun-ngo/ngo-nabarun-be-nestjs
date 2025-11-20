<#
.SYNOPSIS
    Creates a complete NestJS module following Clean Architecture patterns.

.DESCRIPTION
    This script scaffolds a new NestJS module with the proper folder structure
    following Clean Architecture principles. It creates all necessary directories
    and placeholder files for Domain, Application, Infrastructure, and Presentation layers.

.PARAMETER ModuleName
    The name of the module to create (e.g., "product", "order", "customer").
    Should be lowercase and singular.

.PARAMETER BasePath
    Optional. The base path where modules are located. 
    Defaults to "src/modules" relative to script location.

.EXAMPLE
    .\scripts\create-module.ps1 -ModuleName "product"
    Creates a new product module with complete folder structure.

.EXAMPLE
    .\scripts\create-module.ps1 -ModuleName "order" -BasePath "C:\MyProject\src\modules"
    Creates a new order module in a custom location.

.NOTES
    Author: NestJS Module Generator
    Version: 1.0.0
    This follows the project's Clean Architecture standards.
#>

param(
    [Parameter(Mandatory=$true, HelpMessage="Enter the module name (lowercase, singular)")]
    [ValidateNotNullOrEmpty()]
    [ValidatePattern("^[a-z][a-z0-9-]*$")]
    [string]$ModuleName,

    [Parameter(Mandatory=$false)]
    [string]$BasePath = ""
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { param($Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-InfoMessage { param($Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
function Write-WarningMessage { param($Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-ErrorMessage { param($Message) Write-Host "✗ $Message" -ForegroundColor Red }

# Get script directory and project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Set base path
if ([string]::IsNullOrEmpty($BasePath)) {
    $BasePath = Join-Path $projectRoot "src\modules"
}

# Validate base path exists
if (!(Test-Path $BasePath)) {
    Write-ErrorMessage "Base path does not exist: $BasePath"
    Write-InfoMessage "Creating base path..."
    New-Item -ItemType Directory -Path $BasePath -Force | Out-Null
}

# Module path
$modulePath = Join-Path $BasePath $ModuleName

# Check if module already exists
if (Test-Path $modulePath) {
    Write-ErrorMessage "Module '$ModuleName' already exists at $modulePath"
    $response = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($response -ne "yes") {
        Write-InfoMessage "Operation cancelled."
        exit 0
    }
}

Write-InfoMessage "Creating module: $ModuleName"
Write-InfoMessage "Location: $modulePath"
Write-Host ""

# Create folder structure
Write-InfoMessage "Creating folder structure..."

$folders = @(
    # Domain layer
    "$modulePath\domain\model",
    "$modulePath\domain\repositories",
    "$modulePath\domain\events",
    "$modulePath\domain\value-objects",
    
    # Application layer
    "$modulePath\application\use-cases",
    "$modulePath\application\dto",
    "$modulePath\application\handlers",
    
    # Infrastructure layer
    "$modulePath\infrastructure\persistence",
    "$modulePath\infrastructure\external",
    "$modulePath\infrastructure\types",
    
    # Presentation layer
    "$modulePath\presentation\controllers",
    "$modulePath\presentation\mappers"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Success "Created: $($folder.Replace($modulePath, '.'))"
}

Write-Host ""
Write-InfoMessage "Creating placeholder files..."

# Capitalize first letter for class names
$entityName = (Get-Culture).TextInfo.ToTitleCase($ModuleName)
$EntityName = $entityName

# Generate file contents
$fileContents = @{
    # Domain Model
    "$modulePath\domain\model\$ModuleName.model.ts" = @"
import { AggregateRoot } from 'src/shared/models/aggregate-root';

export enum ${EntityName}Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * ${EntityName} Domain Model (Aggregate Root)
 * Contains business logic and invariants
 */
export class ${EntityName} extends AggregateRoot {
  constructor(
    public readonly id: string,
    public name: string,
    public status: ${EntityName}Status,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    super();
  }

  /**
   * Factory method to create a new ${EntityName}
   */
  static create(props: {
    name: string;
  }): ${EntityName} {
    const ${ModuleName} = new ${EntityName}(
      crypto.randomUUID(),
      props.name,
      ${EntityName}Status.ACTIVE,
      new Date(),
      new Date(),
    );
    
    // Add domain event if needed
    // ${ModuleName}.addDomainEvent(new ${EntityName}CreatedEvent(${ModuleName}.id));
    
    return ${ModuleName};
  }

  /**
   * Business logic methods go here
   */
  activate(): void {
    if (this.status === ${EntityName}Status.ACTIVE) {
      throw new Error('${EntityName} is already active');
    }
    this.status = ${EntityName}Status.ACTIVE;
  }

  deactivate(): void {
    if (this.status === ${EntityName}Status.INACTIVE) {
      throw new Error('${EntityName} is already inactive');
    }
    this.status = ${EntityName}Status.INACTIVE;
  }
}
"@

    # Repository Interface
    "$modulePath\domain\repositories\$ModuleName.repository.interface.ts" = @"
import { IRepository } from 'src/shared/interfaces/repository.interface';
import { ${EntityName} } from '../model/${ModuleName}.model';

/**
 * ${EntityName} Repository Interface
 * Defines the contract for data access operations
 */
export interface I${EntityName}Repository extends IRepository<${EntityName}, string> {
  findById(id: string): Promise<${EntityName} | null>;
  findByStatus(status: string): Promise<${EntityName}[]>;
  create(${ModuleName}: ${EntityName}): Promise<${EntityName}>;
  update(id: string, ${ModuleName}: ${EntityName}): Promise<${EntityName}>;
  delete(id: string): Promise<void>;
  findAll(filter?: any): Promise<${EntityName}[]>;
}

/**
 * Dependency Injection token for ${EntityName}Repository
 */
export const ${EntityName.ToUpper()}_REPOSITORY = Symbol('${EntityName.ToUpper()}_REPOSITORY');
"@

    # Filter Value Object
    "$modulePath\domain\value-objects\$ModuleName-filter.vo.ts" = @"
import { BaseFilterProps } from 'src/shared/models/base-filter-props';

/**
 * ${EntityName} Filter Value Object
 * Encapsulates filtering criteria
 */
export interface ${EntityName}FilterProps extends BaseFilterProps {
  name?: string;
  status?: string;
}

export class ${EntityName}Filter {
  constructor(public readonly props: ${EntityName}FilterProps) {}

  static create(props: ${EntityName}FilterProps): ${EntityName}Filter {
    return new ${EntityName}Filter(props);
  }
}
"@

    # Create Use Case
    "$modulePath\application\use-cases\create-$ModuleName.use-case.ts" = @"
import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { ${EntityName} } from '../../domain/model/${ModuleName}.model';
import { 
  ${EntityName.ToUpper()}_REPOSITORY, 
  I${EntityName}Repository 
} from '../../domain/repositories/${ModuleName}.repository.interface';
import { Create${EntityName}Dto } from '../dto/create-${ModuleName}.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessException } from 'src/shared/exceptions/business-exception';

/**
 * Create ${EntityName} Use Case
 * Handles the business logic for creating a new ${ModuleName}
 */
@Injectable()
export class Create${EntityName}UseCase implements IUseCase<Create${EntityName}Dto, ${EntityName}> {
  constructor(
    @Inject(${EntityName.ToUpper()}_REPOSITORY)
    private readonly ${ModuleName}Repository: I${EntityName}Repository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: Create${EntityName}Dto): Promise<${EntityName}> {
    // Business validation
    // const existing = await this.${ModuleName}Repository.findByName(request.name);
    // if (existing) {
    //   throw new BusinessException('${EntityName} with this name already exists');
    // }

    // Create domain entity
    const ${ModuleName} = ${EntityName}.create({
      name: request.name,
    });

    // Save to repository
    const saved${EntityName} = await this.${ModuleName}Repository.create(${ModuleName});

    // Emit domain events
    for (const event of ${ModuleName}.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    ${ModuleName}.clearEvents();

    return saved${EntityName};
  }
}
"@

    # Get Use Case
    "$modulePath\application\use-cases\get-$ModuleName.use-case.ts" = @"
import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { ${EntityName} } from '../../domain/model/${ModuleName}.model';
import { 
  ${EntityName.ToUpper()}_REPOSITORY, 
  I${EntityName}Repository 
} from '../../domain/repositories/${ModuleName}.repository.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';

/**
 * Get ${EntityName} Use Case
 * Handles retrieving a single ${ModuleName} by ID
 */
@Injectable()
export class Get${EntityName}UseCase implements IUseCase<string, ${EntityName}> {
  constructor(
    @Inject(${EntityName.ToUpper()}_REPOSITORY)
    private readonly ${ModuleName}Repository: I${EntityName}Repository,
  ) {}

  async execute(id: string): Promise<${EntityName}> {
    const ${ModuleName} = await this.${ModuleName}Repository.findById(id);
    
    if (!${ModuleName}) {
      throw new BusinessException('${EntityName} not found');
    }

    return ${ModuleName};
  }
}
"@

    # Create DTO
    "$modulePath\application\dto\create-$ModuleName.dto.ts" = @"
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * Create ${EntityName} DTO
 * Defines the structure for creating a new ${ModuleName}
 */
export class Create${EntityName}Dto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // Add more fields as needed
}

/**
 * ${EntityName} Response DTO
 */
export class ${EntityName}Dto {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
"@

    # DTO Mapper
    "$modulePath\application\dto\mapper.ts" = @"
import { ${EntityName} } from '../../domain/model/${ModuleName}.model';
import { ${EntityName}Dto } from './${ModuleName}.dto';

/**
 * Convert Domain model to DTO
 */
export function to${EntityName}Dto(${ModuleName}: ${EntityName}): ${EntityName}Dto {
  return {
    id: ${ModuleName}.id,
    name: ${ModuleName}.name,
    status: ${ModuleName}.status,
    createdAt: ${ModuleName}.createdAt,
    updatedAt: ${ModuleName}.updatedAt,
  };
}
"@

    # Event Handler
    "$modulePath\application\handlers\$ModuleName-events.handler.ts" = @"
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

/**
 * ${EntityName} Events Handler
 * Handles domain events related to ${ModuleName}
 */
@Injectable()
export class ${EntityName}EventsHandler {
  // @OnEvent('${EntityName}CreatedEvent')
  // async handle${EntityName}Created(event: ${EntityName}CreatedEvent): Promise<void> {
  //   // Handle the event
  // }
}
"@

    # Persistence Types
    "$modulePath\infrastructure\types\$ModuleName-persistence.types.ts" = @"
import { Prisma } from '@prisma/client';

/**
 * ${EntityName} Persistence Types
 * Defines type-safe Prisma query result types
 */
export namespace ${EntityName}Persistence {
  /**
   * Basic ${ModuleName} without any relations
   */
  export type Base = Prisma.${EntityName}GetPayload<{
    select: {
      id: true;
      name: true;
      status: true;
      createdAt: true;
      updatedAt: true;
      version: true;
      deletedAt: true;
    };
  }>;

  /**
   * ${EntityName} with all relations included
   * Add relations as needed
   */
  export type Full = Prisma.${EntityName}GetPayload<{
    include: {
      // Add relations here
    };
  }>;
}
"@

    # Infrastructure Mapper
    "$modulePath\infrastructure\$ModuleName-infra.mapper.ts" = @"
import { ${EntityName}, ${EntityName}Status } from '../domain/model/${ModuleName}.model';
import { Prisma } from '@prisma/client';
import { ${EntityName}Persistence } from './types/${ModuleName}-persistence.types';
import { MapperUtils } from 'src/modules/shared/database/mapper-utils';

/**
 * ${EntityName} Infrastructure Mapper
 * Handles conversion between Prisma persistence models and Domain models
 */
export class ${EntityName}InfraMapper {
  /**
   * Convert Prisma persistence model to Domain model
   * Primary mapper method matching module standards
   */
  static to${EntityName}Domain(p: ${EntityName}Persistence.Base | any): ${EntityName} | null {
    if (!p) return null;

    return new ${EntityName}(
      p.id,
      p.name,
      p.status as ${EntityName}Status,
      p.createdAt,
      p.updatedAt,
    );
  }

  /**
   * Legacy method - calls to${EntityName}Domain for backward compatibility
   */
  static toDomain(p: ${EntityName}Persistence.Base | any): ${EntityName} | null {
    return ${EntityName}InfraMapper.to${EntityName}Domain(p);
  }

  /**
   * Convert Domain model to Prisma create input
   * Used for creating new ${ModuleName} instances
   */
  static to${EntityName}CreatePersistence(domain: ${EntityName}): Prisma.${EntityName}UncheckedCreateInput {
    return {
      id: domain.id,
      name: domain.name,
      status: domain.status,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      version: BigInt(0),
    };
  }

  /**
   * Convert Domain model to Prisma update input
   * Used for updating existing ${ModuleName} instances
   */
  static to${EntityName}UpdatePersistence(domain: ${EntityName}): Prisma.${EntityName}UncheckedUpdateInput {
    return {
      name: domain.name,
      status: domain.status,
      updatedAt: new Date(),
    };
  }
}
"@

    # Mapper Helpers
    "$modulePath\infrastructure\$ModuleName-mapper-helpers.ts" = @"
import { ${EntityName}Persistence } from './types/${ModuleName}-persistence.types';

/**
 * ${EntityName} Mapper Helpers
 * Type-safe extraction methods for ${ModuleName} relations
 */
export class ${EntityName}MapperHelpers {
  /**
   * Example helper for extracting relations
   * Add specific extraction methods as needed
   */
  static extractRelations(model: ${EntityName}Persistence.Full | ${EntityName}Persistence.Base) {
    // Implement type-safe extraction logic here
    return {};
  }
}
"@

    # Repository Implementation
    "$modulePath\infrastructure\persistence\$ModuleName.repository.ts" = @"
import { Injectable } from '@nestjs/common';
import { I${EntityName}Repository } from '../../domain/repositories/${ModuleName}.repository.interface';
import { ${EntityName} } from '../../domain/model/${ModuleName}.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { PrismaBaseRepository } from 'src/modules/shared/database/base-repository';
import { ${EntityName}InfraMapper } from '../${ModuleName}-infra.mapper';
import { ${EntityName}Persistence } from '../types/${ModuleName}-persistence.types';

/**
 * ${EntityName} Repository Implementation
 * Handles data persistence for ${EntityName} aggregate
 */
@Injectable()
class ${EntityName}Repository
  extends PrismaBaseRepository<
    ${EntityName},
    PrismaPostgresService['${ModuleName}'],
    Prisma.${EntityName}WhereUniqueInput,
    Prisma.${EntityName}WhereInput,
    ${EntityName}Persistence.Base,
    Prisma.${EntityName}CreateInput,
    Prisma.${EntityName}UpdateInput
  >
  implements I${EntityName}Repository
{
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }

  protected getDelegate() {
    return this.prisma.${ModuleName};
  }

  protected toDomain(prismaModel: any): ${EntityName} | null {
    return ${EntityName}InfraMapper.to${EntityName}Domain(prismaModel);
  }

  async findAll(filter?: any): Promise<${EntityName}[]> {
    const where: Prisma.${EntityName}WhereInput = {
      status: filter?.status,
      deletedAt: null,
    };
    return this.findMany(where);
  }

  async findById(id: string): Promise<${EntityName} | null> {
    return this.findUnique({ id });
  }

  async findByStatus(status: string): Promise<${EntityName}[]> {
    return this.findMany({ status, deletedAt: null });
  }

  async create(${ModuleName}: ${EntityName}): Promise<${EntityName}> {
    const createData = ${EntityName}InfraMapper.to${EntityName}CreatePersistence(${ModuleName});
    return this.createRecord(createData);
  }

  async update(id: string, ${ModuleName}: ${EntityName}): Promise<${EntityName}> {
    const updateData = ${EntityName}InfraMapper.to${EntityName}UpdatePersistence(${ModuleName});
    return this.updateRecord({ id }, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.softDelete({ id });
  }
}

export default ${EntityName}Repository;
"@

    # Controller
    "$modulePath\presentation\controllers\$ModuleName.controller.ts" = @"
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { Create${EntityName}UseCase } from '../../application/use-cases/create-${ModuleName}.use-case';
import { Get${EntityName}UseCase } from '../../application/use-cases/get-${ModuleName}.use-case';
import { Create${EntityName}Dto } from '../../application/dto/create-${ModuleName}.dto';
import { to${EntityName}Dto } from '../../application/dto/mapper';

/**
 * ${EntityName} Controller
 * Handles HTTP requests for ${ModuleName} operations
 */
@Controller('${ModuleName}s')
export class ${EntityName}Controller {
  constructor(
    private readonly create${EntityName}UseCase: Create${EntityName}UseCase,
    private readonly get${EntityName}UseCase: Get${EntityName}UseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: Create${EntityName}Dto) {
    const ${ModuleName} = await this.create${EntityName}UseCase.execute(dto);
    return to${EntityName}Dto(${ModuleName});
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const ${ModuleName} = await this.get${EntityName}UseCase.execute(id);
    return to${EntityName}Dto(${ModuleName});
  }

  // Add more endpoints as needed
}
"@

    # Module Configuration
    "$modulePath\$ModuleName.module.ts" = @"
import { Module } from '@nestjs/common';
import { ${EntityName}Controller } from './presentation/controllers/${ModuleName}.controller';
import { Create${EntityName}UseCase } from './application/use-cases/create-${ModuleName}.use-case';
import { Get${EntityName}UseCase } from './application/use-cases/get-${ModuleName}.use-case';
import { ${EntityName.ToUpper()}_REPOSITORY } from './domain/repositories/${ModuleName}.repository.interface';
import ${EntityName}Repository from './infrastructure/persistence/${ModuleName}.repository';
import { ${EntityName}EventsHandler } from './application/handlers/${ModuleName}-events.handler';

/**
 * ${EntityName} Module
 * Configures dependency injection for the ${ModuleName} module
 */
@Module({
  controllers: [${EntityName}Controller],
  imports: [],
  providers: [
    // Use Cases
    Create${EntityName}UseCase,
    Get${EntityName}UseCase,
    
    // Repository
    {
      provide: ${EntityName.ToUpper()}_REPOSITORY,
      useClass: ${EntityName}Repository,
    },
    
    // Handlers
    ${EntityName}EventsHandler,
  ],
  exports: [${EntityName.ToUpper()}_REPOSITORY],
})
export class ${EntityName}Module {}
"@

    # README
    "$modulePath\README.md" = @"
# ${EntityName} Module

## Overview

The ${EntityName} module handles all business logic related to ${ModuleName}s in the system.

## Architecture

This module follows Clean Architecture principles with four main layers:

### Domain Layer
- **Models**: `${ModuleName}.model.ts` - Core business entities
- **Repositories**: `${ModuleName}.repository.interface.ts` - Data access contracts
- **Value Objects**: `${ModuleName}-filter.vo.ts` - Immutable value types
- **Events**: Domain events for ${ModuleName} state changes

### Application Layer
- **Use Cases**: Business operations (Create, Get, Update, Delete)
- **DTOs**: Data transfer objects for API contracts
- **Handlers**: Event and job handlers

### Infrastructure Layer
- **Repository**: `${ModuleName}.repository.ts` - Prisma-based data access
- **Mappers**: `${ModuleName}-infra.mapper.ts` - Domain ↔ Persistence conversion
- **Types**: TypeScript types for Prisma queries

### Presentation Layer
- **Controllers**: `${ModuleName}.controller.ts` - HTTP endpoints
- **Mappers**: Domain → DTO conversion

## API Endpoints

- \`POST /${ModuleName}s\` - Create a new ${ModuleName}
- \`GET /${ModuleName}s/:id\` - Get ${ModuleName} by ID
- \`PUT /${ModuleName}s/:id\` - Update ${ModuleName}
- \`DELETE /${ModuleName}s/:id\` - Delete ${ModuleName}
- \`GET /${ModuleName}s\` - List ${ModuleName}s with filters

## Database Schema

Add the following to \`prisma/schema.prisma\`:

\`\`\`prisma
model ${EntityName} {
  id          String   @id @default(uuid())
  name        String
  status      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  version     BigInt   @default(0)
  deletedAt   DateTime?

  @@map("${ModuleName}s")
}
\`\`\`

Then run:
\`\`\`bash
npx prisma migrate dev --name add_${ModuleName}_table
npx prisma generate
\`\`\`

## Usage Example

\`\`\`typescript
// Create a ${ModuleName}
const dto = { name: 'Example' };
const ${ModuleName} = await create${EntityName}UseCase.execute(dto);

// Get a ${ModuleName}
const ${ModuleName} = await get${EntityName}UseCase.execute(id);
\`\`\`

## Testing

Run tests with:
\`\`\`bash
npm test -- ${ModuleName}
\`\`\`

## Next Steps

1. Add Prisma schema for ${EntityName}
2. Run Prisma migrations
3. Implement additional use cases
4. Add unit tests
5. Update AppModule to import ${EntityName}Module
"@
}

# Create all files
foreach ($file in $fileContents.Keys) {
    $content = $fileContents[$file]
    Set-Content -Path $file -Value $content -Encoding UTF8
    $relativePath = $file.Replace($modulePath, ".")
    Write-Success "Created: $relativePath"
}

Write-Host ""
Write-Success "Module '$ModuleName' created successfully!"
Write-Host ""
Write-InfoMessage "Next Steps:"
Write-Host ""
Write-Host "1. Add Prisma schema to prisma/schema.prisma:" -ForegroundColor Yellow
Write-Host @"
   model ${EntityName} {
     id          String   @id @default(uuid())
     name        String
     status      String
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
     version     BigInt   @default(0)
     deletedAt   DateTime?

     @@map("${ModuleName}s")
   }
"@ -ForegroundColor Gray

Write-Host ""
Write-Host "2. Run Prisma migration:" -ForegroundColor Yellow
Write-Host "   npx prisma migrate dev --name add_${ModuleName}_table" -ForegroundColor Gray
Write-Host "   npx prisma generate" -ForegroundColor Gray

Write-Host ""
Write-Host "3. Register module in src/app.module.ts:" -ForegroundColor Yellow
Write-Host "   import { ${EntityName}Module } from './modules/${ModuleName}/${ModuleName}.module';" -ForegroundColor Gray
Write-Host "   @Module({ imports: [..., ${EntityName}Module], ... })" -ForegroundColor Gray

Write-Host ""
Write-Host "4. Implement business logic in:" -ForegroundColor Yellow
Write-Host "   - $modulePath\domain\model\${ModuleName}.model.ts" -ForegroundColor Gray

Write-Host ""
Write-Success "Happy coding! 🚀"

