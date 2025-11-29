# Production-Only Dependencies Optimization

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUILD PHASE (CI Runner)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Install ALL dependencies (dev + prod)                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ npm ci                                                │      │
│  │ ├── dependencies (production)                         │      │
│  │ │   ├── express                                       │      │
│  │ │   ├── @nestjs/core                                  │      │
│  │ │   └── ...                                           │      │
│  │ └── devDependencies                                   │      │
│  │     ├── typescript                                    │      │
│  │     ├── @types/node                                   │      │
│  │     ├── jest                                          │      │
│  │     └── ...                                           │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  Step 2: Build the application                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ npm run build                                         │      │
│  │ (Uses TypeScript, webpack, etc. from devDependencies) │      │
│  │                                                        │      │
│  │ Output: dist/ directory with compiled JavaScript      │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────────┐
│              OPTIMIZATION PHASE (CI Runner)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 3: Create clean deployment directory                      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ mkdir deployment-artifact/                            │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  Step 4: Copy ONLY build output                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ cp -r dist/ deployment-artifact/                      │      │
│  │ cp package.json deployment-artifact/                  │      │
│  │ cp package-lock.json deployment-artifact/             │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  Step 5: Install ONLY production dependencies                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ cd deployment-artifact/                               │      │
│  │ npm ci --omit=dev                                     │      │
│  │                                                        │      │
│  │ Result: node_modules/ with ONLY production deps       │      │
│  │ ├── express                                           │      │
│  │ ├── @nestjs/core                                      │      │
│  │ └── ...                                               │      │
│  │                                                        │      │
│  │ ❌ NO typescript, jest, @types/*, etc.                │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────────┐
│                  DEPLOYMENT ARTIFACT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  deployment-artifact/                                            │
│  ├── dist/                    ← Compiled JavaScript             │
│  │   ├── main.js                                                │
│  │   ├── app.module.js                                          │
│  │   └── ...                                                    │
│  ├── node_modules/            ← PRODUCTION ONLY                 │
│  │   ├── express/                                               │
│  │   ├── @nestjs/                                               │
│  │   └── ...                                                    │
│  ├── package.json                                               │
│  └── package-lock.json                                          │
│                                                                  │
│  📊 Size Comparison:                                             │
│  ├── Full node_modules:        ~500 MB                          │
│  └── Production node_modules:  ~150 MB (70% reduction!)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYED TO GCP                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Smaller deployment size                                      │
│  ✅ Faster upload to GCP                                         │
│  ✅ Faster cold starts                                           │
│  ✅ Lower storage costs                                          │
│  ✅ No dev tools in production                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration

### Enable (Default - Recommended)
```yaml
with:
  app_type: 'node'
  prod_only_dependencies: true
  include_node_modules: true
```

### Disable (Not Recommended)
```yaml
with:
  app_type: 'node'
  prod_only_dependencies: false
```

## Real-World Impact

### Typical NestJS Application

**Without Optimization:**
- Total size: ~550 MB
- Upload time: ~5-8 minutes
- Cold start: ~8-12 seconds
- Includes: TypeScript, Jest, ESLint, Prettier, etc.

**With Optimization:**
- Total size: ~180 MB (67% reduction)
- Upload time: ~2-3 minutes (60% faster)
- Cold start: ~3-5 seconds (58% faster)
- Includes: Only runtime dependencies

### Cost Savings

For a typical application with 10 deployments/month:
- **Storage**: 67% reduction in artifact storage
- **Network**: 60% reduction in upload bandwidth
- **Compute**: Faster cold starts = better user experience
- **Estimated savings**: $20-50/month depending on scale

## Why This Works

1. **Build tools are only needed during build** - TypeScript, webpack, etc. are not needed at runtime
2. **Testing tools are not needed in production** - Jest, testing libraries, etc.
3. **Type definitions are not needed at runtime** - @types/* packages are compile-time only
4. **Dev utilities are not needed** - Linters, formatters, etc.

## What Gets Excluded

Common dev dependencies that are excluded:
- `typescript` - Compiler (not needed after build)
- `@types/*` - Type definitions (compile-time only)
- `jest`, `@jest/*` - Testing framework
- `eslint`, `prettier` - Code quality tools
- `webpack`, `vite` - Build tools (if not used at runtime)
- `nodemon`, `ts-node` - Development servers
- `@nestjs/cli` - CLI tools

## Best Practices

1. ✅ **Always enable for production** - Use `prod_only_dependencies: true`
2. ✅ **Ensure correct dependency classification** - Runtime deps in `dependencies`, build tools in `devDependencies`
3. ✅ **Test your build** - Verify the app runs with only production dependencies
4. ✅ **Monitor artifact size** - Check the size comparison in CI logs
5. ❌ **Don't put build tools in dependencies** - Keep TypeScript, etc. in devDependencies
