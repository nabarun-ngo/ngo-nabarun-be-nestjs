# Deployment Guide - GCP Cloud Run with GitHub Actions

This guide covers deploying your NestJS application to GCP Cloud Run within the free tier using GitHub Actions.

## 🎯 Features

- **Optimized Docker Image**: Multi-stage build targeting <200MB
- **Alpine Linux**: Minimal base image for smaller size
- **GitHub Container Registry**: Free image storage
- **GCP Cloud Run Free Tier**: Up to 2 million requests/month
- **Doppler Integration**: Secure secrets management
- **Automated CI/CD**: GitHub Actions workflow

## 📋 Prerequisites

1. GitHub repository
2. Google Cloud Platform account
3. Doppler account (for secrets management)

## 🚀 Setup Instructions

### 1. GCP Setup

#### Create a GCP Project
```bash
gcloud projects create YOUR_PROJECT_ID --name="NGO Nabarun"
gcloud config set project YOUR_PROJECT_ID
```

#### Enable Required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Create Service Account
```bash
# Create service account
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Create and download key
gcloud iam service-accounts keys create key.json \
    --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### Create Doppler Token Secret in GCP Secret Manager
```bash
echo -n "YOUR_DOPPLER_TOKEN" | gcloud secrets create doppler-token \
    --data-file=- \
    --replication-policy="automatic"
```

### 2. GitHub Secrets Setup

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example |
|------------|-------------|---------|
| `GCP_PROJECT_ID` | Your GCP project ID | `my-project-123456` |
| `GCP_SA_KEY` | Service account JSON key | Content of `key.json` |
| `DOPPLER_PROJECT` | Doppler project name | `ngo-nabarun` |
| `DOPPLER_CONFIG` | Doppler config name | `prd` |

**Note**: The `DOPPLER_TOKEN` should be stored in GCP Secret Manager, not as a GitHub secret.

### 3. Local Testing

#### Build the Docker image
```bash
docker build -t ngo-nabarun-api .
```

#### Check image size
```bash
docker images ngo-nabarun-api
```

#### Run locally (with Doppler)
```bash
docker run -p 3000:3000 \
  -e DOPPLER_TOKEN=your_doppler_token \
  -e DOPPLER_PROJECT=your_project \
  -e DOPPLER_CONFIG=your_config \
  ngo-nabarun-api
```

### 4. Deploy

#### Push to main branch
```bash
git add .
git commit -m "Add Docker and CI/CD configuration"
git push origin main
```

The GitHub Actions workflow will automatically:
1. Build the Docker image
2. Push it to GitHub Container Registry
3. Deploy to Cloud Run

### 5. Access Your Application

After deployment, get your service URL:
```bash
gcloud run services describe ngo-nabarun-api \
  --region us-central1 \
  --format 'value(status.url)'
```

## 💰 Free Tier Limits

**Cloud Run Free Tier (per month)**:
- 2 million requests
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds
- 1 GB network egress

**Configuration for Free Tier**:
- Memory: 512Mi
- CPU: 1
- Min instances: 0 (scales to zero)
- Max instances: 1

## 🔧 Configuration Options

### Update Service Name
Edit `.github/workflows/deploy-cloud-run.yml`:
```yaml
env:
  SERVICE_NAME: your-service-name
```

### Change Region
```yaml
env:
  REGION: us-central1  # or us-east1, europe-west1, etc.
```

### Adjust Resources (stay within free tier)
```bash
--memory 256Mi      # Minimum
--memory 512Mi      # Recommended
--cpu 1             # Keep at 1 for free tier
```

## 🐛 Troubleshooting

### Check logs
```bash
gcloud run services logs read ngo-nabarun-api \
  --region us-central1 \
  --limit 50
```

### Test locally without Doppler
```bash
docker run -p 3000:3000 \
  --env-file .env \
  ngo-nabarun-api
```

### Image too large?
Check what's included:
```bash
docker history ngo-nabarun-api
```

### Cloud Run deployment fails
```bash
# Describe the service
gcloud run services describe ngo-nabarun-api --region us-central1

# Check revisions
gcloud run revisions list --service ngo-nabarun-api --region us-central1
```

## 📊 Monitoring

View metrics in GCP Console:
- Go to Cloud Run → Select your service
- View request count, latency, memory usage
- Set up alerts for quota limits

## 🔐 Security Best Practices

1. ✅ Non-root user in Docker
2. ✅ Secrets via Secret Manager
3. ✅ Minimal Alpine base image
4. ✅ No secrets in environment variables
5. ✅ Service account with minimal permissions

## 🔄 Updating the Application

Simply push to main branch:
```bash
git push origin main
```

GitHub Actions will automatically build and deploy the new version.

## 📦 Docker Image Optimization Tips

Current optimizations:
- Multi-stage build (separate build and production stages)
- Alpine Linux (~5MB base vs ~180MB for full Node)
- Production dependencies only
- No dev tools or test files
- Prisma client pre-generated
- Layer caching for faster builds

Expected final size: **150-180MB**
