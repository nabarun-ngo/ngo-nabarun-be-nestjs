# Generic GCP App Engine Deployment Workflow v2

A reusable GitHub Actions workflow for deploying both **Java** and **Node.js** applications to Google Cloud Platform (GCP) App Engine.

## Features

✅ **Multi-language Support**: Works with both Java (Maven) and Node.js (npm/yarn/pnpm)  
✅ **Flexible Build Configuration**: Customizable build commands and options  
✅ **Automatic Artifact Management**: Handles JAR files for Java and build directories for Node.js  
✅ **Production-Only Dependencies** (Node.js): Builds with dev dependencies, deploys only production dependencies (50-70% smaller)  
✅ **Doppler Integration**: Installs Doppler CLI in artifact and manages secrets  
✅ **Database Migrations**: Built-in support for pre/post-deployment migrations (e.g., Prisma)  
✅ **Environment Variable Management**: Integrates with Doppler for secrets management  
✅ **Health Checks**: Optional post-deployment health verification  
✅ **Resource Cleanup**: Automatic cleanup of old GAE versions and GCS files  
✅ **GitHub Deployments**: Creates deployment records with status tracking  
✅ **Caching**: Optional build caching for faster builds  

## Usage

### For Java Applications

```yaml
name: Deploy Java App

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    uses: ./.github/workflows/deploy-gcp-app-engine-v2.yml
    with:
      app_type: 'java'
      tag_name: ${{ github.ref_name }}
      repo_name: ${{ github.event.repository.name }}
      repo_owner_name: ${{ github.repository_owner }}
      environment_name: 'production'
      environment_url: 'https://your-app.appspot.com'
      
      # Java-specific
      java_version: '17'
      maven_command: 'clean package'
      target_folder: 'target'
      
      # Environment
      app_env: 'production'
      app_doppler_project_name: 'my-java-app'
      
    secrets:
      gcp_project_id: ${{ secrets.GCP_PROJECT_ID }}
      gcp_service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}
      app_doppler_service_token: ${{ secrets.DOPPLER_SERVICE_TOKEN }}
      repo_token: ${{ secrets.GITHUB_TOKEN }}
```

### For Node.js Applications

```yaml
name: Deploy Node.js App

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    uses: ./.github/workflows/deploy-gcp-app-engine-v2.yml
    with:
      app_type: 'node'
      tag_name: ${{ github.ref_name }}
      repo_name: ${{ github.event.repository.name }}
      repo_owner_name: ${{ github.repository_owner }}
      environment_name: 'production'
      environment_url: 'https://your-app.appspot.com'
      
      # Node-specific
      node_version: '20'
      package_manager: 'npm'
      build_command: 'npm run build'
      artifact_pattern: 'dist'
      
      # Environment
      app_env: 'production'
      app_doppler_project_name: 'my-node-app'
      
    secrets:
      gcp_project_id: ${{ secrets.GCP_PROJECT_ID }}
      gcp_service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}
      app_doppler_service_token: ${{ secrets.DOPPLER_SERVICE_TOKEN }}
      repo_token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

### Required Inputs (All Applications)

| Input | Description | Type |
|-------|-------------|------|
| `app_type` | Application type: `'java'` or `'node'` | string |
| `tag_name` | Git tag to deploy | string |
| `repo_name` | Repository name | string |
| `repo_owner_name` | Repository owner | string |
| `environment_name` | Deployment environment name | string |
| `app_env` | Application environment (e.g., production, staging) | string |
| `app_doppler_project_name` | Doppler project name for secrets | string |

### Java-Specific Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `java_version` | Java version to use | `'17'` |
| `maven_command` | Maven command to run | `'clean package'` |
| `maven_options` | Additional Maven options | `'-Dmaven.test.skip=true -Dmaven.javadoc.skip=true'` |
| `target_folder` | Target folder for build artifacts | `'target'` |
| `artifact_pattern` | Pattern to match JAR files | `'*.jar'` |

### Node.js-Specific Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `node_version` | Node.js version to use | `'20'` |
| `package_manager` | Package manager: `npm`, `yarn`, or `pnpm` | `'npm'` |
| `install_command` | Command to install dependencies | `'npm ci'` |
| `build_command` | Command to build the application | `'npm run build'` |
| `artifact_pattern` | Build output directory (e.g., `dist`, `build`) | Auto-detected |
| `prod_only_dependencies` | Install only production dependencies for deployment (recommended) | `true` |
| `include_node_modules` | Include node_modules in deployment artifact | `true` |
| `install_doppler_cli` | Install Doppler CLI in deployment artifact | `true` |

### Database Migration Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `enable_db_migration` | Enable database migration | `false` |
| `migration_command` | Command to run migrations | `'npx prisma migrate deploy'` |
| `migration_timeout` | Migration timeout in minutes | `10` |

### GCP Configuration Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `gae_app_yaml_path` | Path to app.yaml file | `'app.yaml'` |
| `gae_service_name` | GAE service name | `'default'` |
| `environment_url` | Deployment URL | - |

### Deployment Configuration

| Input | Description | Default |
|-------|-------------|---------|
| `deployment_timeout` | Deployment timeout in minutes | `25` |
| `enable_health_check` | Enable post-deployment health check | `true` |
| `enable_cache` | Enable build caching | `true` |
| `app_log_level` | Application log level | `'INFO'` |

### Cleanup Configuration

| Input | Description | Default |
|-------|-------------|---------|
| `keep_gae_versions` | Number of GAE versions to keep | `1` |
| `gcs_keep_days` | Days to keep files in GCS bucket | `5` |

## Secrets

| Secret | Description | Required |
|--------|-------------|----------|
| `gcp_project_id` | GCP Project ID | ✅ |
| `gcp_service_account` | GCP Service Account JSON | ✅ |
| `app_doppler_service_token` | Doppler service token | ✅ |
| `repo_token` | GitHub token for deployments | ✅ |

## Outputs

| Output | Description |
|--------|-------------|
| `build_status` | Status of the build process |
| `artifact_name` | Name of the built artifact |
| `deployment_status` | Status of the deployment |
| `deployment_version` | Deployed GAE version ID |
| `deployment_id` | GitHub deployment ID |
| `cleanup_status` | Status of cleanup process |
| `overall_status` | Overall workflow status |
| `deployment_summary` | Summary of deployment details |

## Workflow Jobs

### 1. Build Application
- Checks out the repository at the specified tag
- **For Java**: Builds with Maven, validates and uploads JAR artifact
- **For Node.js**: 
  - Installs all dependencies (including dev dependencies)
  - Builds the application
  - **Production Optimization** (when `prod_only_dependencies: true`):
    - Creates a clean deployment artifact directory
    - Copies only the build output (e.g., `dist/`)
    - Reinstalls **only production dependencies** (excludes dev dependencies)
    - Shows size comparison between full and production `node_modules`
    - Results in 50-70% smaller deployment size
  - Uploads optimized build directory
- Uploads `app.yaml` for deployment configuration

### 2. Deploy to GCP
- Downloads build artifacts
- Creates GitHub deployment record
- Authenticates with GCP
- Compiles environment variables into `app.yaml` using Doppler
- Deploys to App Engine (without promoting)
- Gets deployed version ID
- Promotes version to receive traffic
- Runs health check (if enabled)
- Updates deployment status

### 3. Clean GCP Resources
- Cleans up old Artifact Registry images
- Removes old GAE versions (keeps specified number)
- Cleans old GCS files (older than specified days)

## App.yaml Configuration

Your `app.yaml` should support environment variable substitution. Example:

### For Java:
```yaml
runtime: java17
service: default
instance_class: F2

env_variables:
  ENVIRONMENT: ${ENVIRONMENT}
  DOPPLER_PROJECT_NAME: ${DOPPLER_PROJECT_NAME}
  DOPPLER_SERVICE_TOKEN: ${DOPPLER_SERVICE_TOKEN}
  LOG_LEVEL: ${LOG_LEVEL}
  VERSION: ${VERSION}

automatic_scaling:
  min_instances: 1
  max_instances: 10
```

### For Node.js:
```yaml
runtime: nodejs20
service: default
instance_class: F2

env_variables:
  ENVIRONMENT: ${ENVIRONMENT}
  DOPPLER_PROJECT_NAME: ${DOPPLER_PROJECT_NAME}
  DOPPLER_SERVICE_TOKEN: ${DOPPLER_SERVICE_TOKEN}
  LOG_LEVEL: ${LOG_LEVEL}
  VERSION: ${VERSION}
  NODE_ENV: production

automatic_scaling:
  min_instances: 1
  max_instances: 10
```

## Prerequisites

### GCP Setup
1. **Enable APIs**:
   - App Engine Admin API
   - Cloud Build API
   - Artifact Registry API (if using)

2. **Service Account**:
   - Create a service account with these roles:
     - `App Engine Admin`
     - `Cloud Build Service Account`
     - `Storage Admin` (for GCS cleanup)
     - `Artifact Registry Administrator` (if using)

3. **App Engine Application**:
   - Initialize App Engine in your GCP project
   - Choose your region

### GitHub Setup
1. **Repository Secrets**:
   - Add all required secrets to your repository
   - For organization-level secrets, use GitHub organization secrets

2. **Environments** (Optional but recommended):
   - Create environments (e.g., `production`, `staging`)
   - Add environment-specific protection rules
   - Configure environment secrets

### Doppler Setup
1. Create a project in Doppler
2. Configure your environment variables
3. Generate a service token for the workflow

## Examples

See the `examples/` directory for complete working examples:
- [`deploy-java-example.yml`](./examples/deploy-java-example.yml) - Java application deployment
- [`deploy-node-example.yml`](./examples/deploy-node-example.yml) - Node.js application deployment

## Advanced Usage

### Using with pnpm (Node.js)

```yaml
with:
  app_type: 'node'
  package_manager: 'pnpm'
  install_command: 'pnpm install --frozen-lockfile'
  build_command: 'pnpm run build'
```

### Production-Only Dependencies (Node.js) - Recommended

This is the **recommended approach** for Node.js deployments. It builds with all dependencies but deploys only production dependencies:

```yaml
with:
  app_type: 'node'
  prod_only_dependencies: true  # Default: true
  include_node_modules: true    # Default: true
```

**Benefits:**
- 🚀 **50-70% smaller deployment** - Excludes TypeScript, testing tools, build tools
- ⚡ **Faster deployments** - Less data to upload
- 💰 **Lower costs** - Smaller instances, less storage
- 🔒 **Better security** - No dev tools in production
- ⏱️ **Faster cold starts** - Less code to load

**How it works:**
1. Installs all dependencies (including dev) → Builds the app
2. Creates clean deployment directory
3. Copies only build output (`dist/`)
4. Reinstalls **only** production dependencies
5. Uploads optimized artifact

To disable (not recommended):
```yaml
with:
  prod_only_dependencies: false
```

### Database Migrations

The workflow supports running database migrations (like Prisma) **before** deployment. This ensures your database schema is up-to-date before the new version receives traffic.

```yaml
with:
  enable_db_migration: true
  migration_command: 'npx prisma migrate deploy'
```

**Doppler Integration:**
The workflow automatically installs the Doppler CLI in the artifact if `install_doppler_cli: true`. This allows your migration script to access secrets securely:

```bash
# The workflow handles this automatically:
export DOPPLER_TOKEN=$SECRET_TOKEN
doppler run -- npx prisma migrate deploy
```

### Custom Build Directory (Node.js)

```yaml
with:
  app_type: 'node'
  build_directory: './apps/backend'
  artifact_pattern: 'dist'
```

### Multiple Environments

```yaml
jobs:
  deploy-staging:
    uses: ./.github/workflows/deploy-gcp-app-engine-v2.yml
    with:
      environment_name: 'staging'
      app_env: 'staging'
      # ... other inputs

  deploy-production:
    needs: deploy-staging
    uses: ./.github/workflows/deploy-gcp-app-engine-v2.yml
    with:
      environment_name: 'production'
      app_env: 'production'
      # ... other inputs
```

### Disable Health Check

```yaml
with:
  enable_health_check: false
```

### Keep More Versions

```yaml
with:
  keep_gae_versions: 5
  gcs_keep_days: 30
```

## Troubleshooting

### Build Fails
- **Java**: Check Maven logs, ensure `pom.xml` is valid
- **Node.js**: Check package.json scripts, ensure dependencies are correct

### Deployment Fails
- Verify GCP service account has correct permissions
- Check `app.yaml` syntax
- Ensure App Engine is initialized in your GCP project

### Health Check Fails
- Verify `environment_url` is correct
- Ensure your app responds to health check endpoint
- Check app logs in GCP Console

### Artifact Not Found
- **Java**: Verify `target_folder` path is correct
- **Node.js**: Verify `artifact_pattern` matches your build output directory

## Best Practices

1. **Use Environment Protection**: Configure GitHub environments with required reviewers for production
2. **Tag Versioning**: Use semantic versioning for tags (e.g., `v1.2.3`)
3. **Secrets Management**: Use Doppler or similar for managing application secrets
4. **Health Checks**: Always enable health checks for production deployments
5. **Version Retention**: Keep at least 2-3 versions for quick rollback
6. **Caching**: Enable caching to speed up builds
7. **Timeouts**: Adjust deployment timeout based on your app size
8. **Production Dependencies** (Node.js): Always use `prod_only_dependencies: true` for smaller, faster deployments

## License

This workflow is part of the ngo-nabarun-templates project.

## Support

For issues or questions, please open an issue in the repository.
