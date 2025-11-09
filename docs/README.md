# Documentation Index

Welcome to the NestJS project documentation! This guide will help you navigate all available documentation resources.

## 📚 Available Documentation

### 🚀 Getting Started

1. **[Quick Reference Guide](./QUICK_REFERENCE.md)** - Start here!
   - Module scaffolding commands
   - Naming conventions cheat sheet
   - Common code snippets
   - Best practices checklist

2. **[Module Development Guide](./MODULE_DEVELOPMENT_GUIDE.md)** - Comprehensive guide
   - Clean Architecture principles
   - Step-by-step module creation
   - Complete folder structure
   - Testing guidelines

### 🔧 Technical Guides

3. **[Base Repository Guide](./BASE_REPOSITORY_GUIDE.md)**
   - Using PrismaBaseRepository
   - Type parameters explained
   - Common repository patterns

4. **[Type-Safe Infrastructure](./TYPE_SAFE_INFRASTRUCTURE.md)**
   - Infrastructure mapper patterns
   - Type-safe relation extraction
   - MapperUtils usage

5. **[Prisma Types Guide](./PRISMA_TYPES_GUIDE.md)**
   - Creating persistence type definitions
   - Query result types
   - Type safety best practices

## 🛠️ Tools

### PowerShell Script

**Location**: `scripts/create-module.ps1`

**Usage**:
```powershell
.\scripts\create-module.ps1 -ModuleName "product"
```

**What it does**:
- ✅ Creates complete folder structure
- ✅ Generates all template files
- ✅ Sets up proper naming conventions
- ✅ Includes documentation and examples
- ✅ Follows Clean Architecture standards

## 📖 Quick Navigation

### For New Modules

1. Read [Quick Reference](./QUICK_REFERENCE.md) (5 min)
2. Run `.\scripts\create-module.ps1 -ModuleName "your-module"`
3. Follow the on-screen instructions
4. Refer to [Module Development Guide](./MODULE_DEVELOPMENT_GUIDE.md) for details

### For Understanding Architecture

1. [Module Development Guide](./MODULE_DEVELOPMENT_GUIDE.md) - Architecture overview
2. [Base Repository Guide](./BASE_REPOSITORY_GUIDE.md) - Data access layer
3. [Type-Safe Infrastructure](./TYPE_SAFE_INFRASTRUCTURE.md) - Mapper patterns

### For Specific Tasks

| Task | Document |
|------|----------|
| Create new module | [Quick Reference](./QUICK_REFERENCE.md) |
| Implement repository | [Base Repository Guide](./BASE_REPOSITORY_GUIDE.md) |
| Create mapper | [Type-Safe Infrastructure](./TYPE_SAFE_INFRASTRUCTURE.md) |
| Define Prisma types | [Prisma Types Guide](./PRISMA_TYPES_GUIDE.md) |
| Full module walkthrough | [Module Development Guide](./MODULE_DEVELOPMENT_GUIDE.md) |

## 📋 Module Creation Checklist

Use this when creating a new module:

- [ ] Run `create-module.ps1` script
- [ ] Add Prisma schema to `schema.prisma`
- [ ] Run `npx prisma migrate dev --name add_entity_table`
- [ ] Run `npx prisma generate`
- [ ] Update persistence types if needed
- [ ] Implement domain model business logic
- [ ] Implement repository methods
- [ ] Create use cases
- [ ] Add controller endpoints
- [ ] Register module in `AppModule`
- [ ] Write unit tests
- [ ] Update module README.md

## 🏗️ Project Structure Overview

```
project-root/
├── docs/                           # 📚 You are here
│   ├── README.md                   # This file
│   ├── QUICK_REFERENCE.md          # Quick start guide
│   ├── MODULE_DEVELOPMENT_GUIDE.md # Comprehensive guide
│   ├── BASE_REPOSITORY_GUIDE.md    # Repository patterns
│   ├── TYPE_SAFE_INFRASTRUCTURE.md # Mapper patterns
│   └── PRISMA_TYPES_GUIDE.md       # Prisma types
│
├── scripts/
│   └── create-module.ps1           # 🛠️ Module generator
│
├── src/
│   ├── modules/                    # 📦 Your modules go here
│   │   ├── user/                   # Example: user module
│   │   ├── workflow/               # Example: workflow module
│   │   └── your-module/            # Your new module
│   │
│   └── shared/                     # 🔧 Shared utilities
│       ├── database/               # Base repository, utilities
│       ├── exceptions/             # Custom exceptions
│       ├── interfaces/             # Shared interfaces
│       └── models/                 # Base domain models
│
└── prisma/
    ├── schema.prisma               # 💾 Database schema
    └── migrations/                 # Database migrations
```

## 🎯 Common Scenarios

### Scenario 1: "I need to create a new module"

1. **Quick**: `.\scripts\create-module.ps1 -ModuleName "product"`
2. **Learn**: Read [Quick Reference](./QUICK_REFERENCE.md)
3. **Deep dive**: [Module Development Guide](./MODULE_DEVELOPMENT_GUIDE.md)

### Scenario 2: "I'm getting TypeScript errors in my repository"

1. Check [Base Repository Guide](./BASE_REPOSITORY_GUIDE.md) - Type parameters section
2. Verify you're using `any` for `toDomain` parameter
3. Confirm type parameter order matches `PrismaBaseRepository`

### Scenario 3: "My mapper isn't type-safe"

1. Read [Type-Safe Infrastructure](./TYPE_SAFE_INFRASTRUCTURE.md)
2. Create persistence types in `types/` folder
3. Use mapper helpers for relation extraction
4. Follow [Prisma Types Guide](./PRISMA_TYPES_GUIDE.md)

### Scenario 4: "I need to understand the architecture"

1. Start with [Module Development Guide](./MODULE_DEVELOPMENT_GUIDE.md) - Architecture section
2. Review existing modules: `src/modules/user/` and `src/modules/workflow/`
3. Follow the patterns in those modules

## 📞 Getting Help

### Documentation Priority

1. **Start here**: [Quick Reference](./QUICK_REFERENCE.md)
2. **Need examples**: Look at `src/modules/user/` (reference implementation)
3. **Deep dive**: [Module Development Guide](./MODULE_DEVELOPMENT_GUIDE.md)
4. **Specific issues**: Check relevant technical guide

### Example Modules

- **User Module** (`src/modules/user/`) - Complete reference implementation
- **Workflow Module** (`src/modules/workflow/`) - Complex relationships example

## 🔄 Keeping Up to Date

This documentation follows the current project standards. When standards change:

1. Update relevant documentation files
2. Update the `create-module.ps1` script templates
3. Refactor existing modules to match (gradually)
4. Update this index

## 📝 Contributing

When adding new patterns or standards:

1. Document in appropriate guide
2. Add to [Quick Reference](./QUICK_REFERENCE.md)
3. Update `create-module.ps1` templates
4. Update this index if needed

---

**Last Updated**: November 8, 2025

**Need something not covered here?** Check the [Module Development Guide](./MODULE_DEVELOPMENT_GUIDE.md) or examine the existing modules in `src/modules/`.
