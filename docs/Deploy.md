# Cloud Run Deployment

Deploy the Retirement Simulator as a single Cloud Run service on GCP. The Docker image bundles the FastAPI backend with the built SvelteKit frontend served as static assets.

## Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` CLI installed and authenticated)
- Docker (for local builds/testing)
- A GCP project with billing enabled

## Configuration

Set these once per project:

```bash
export GCP_PROJECT=your-project-id
export GCP_REGION=us-central1
export SERVICE_NAME=retirement-model

gcloud config set project $GCP_PROJECT
gcloud config set run/region $GCP_REGION
```

Enable required APIs:

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

Create an Artifact Registry repository (one-time):

```bash
gcloud artifacts repositories create retirement-model \
  --repository-format=docker \
  --location=$GCP_REGION \
  --description="Retirement simulator images"
```

Configure Docker authentication:

```bash
gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev
```

## Build and Push

```bash
IMAGE=${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/retirement-model/${SERVICE_NAME}:latest

docker build -t $IMAGE .
docker push $IMAGE
```

## Deploy to Cloud Run

```bash
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE \
  --platform=managed \
  --allow-unauthenticated \
  --port=8000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="PYTHONUNBUFFERED=1"
```

Key options:
- `--allow-unauthenticated`: Public access (no auth required). Remove for private deployments.
- `--min-instances=0`: Scale to zero when idle (cost-effective).
- `--max-instances=3`: Cap concurrent instances.
- `--memory=512Mi`: Sufficient for Monte Carlo simulations.

## Verify

```bash
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --format='value(status.url)')
curl -s "$SERVICE_URL/api/v1/" | python3 -m json.tool
```

Expected output:
```json
{
    "name": "Retirement Simulation API",
    "version": "0.9.0",
    "endpoints": { ... }
}
```

Open the app in a browser: `open $SERVICE_URL`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PYTHONUNBUFFERED` | — | Set to `1` for real-time log streaming |

No secrets or API keys are required for the current single-user deployment.

## IAM

The default Cloud Run service account (`<project-number>-compute@developer.gserviceaccount.com`) needs:
- `roles/artifactregistry.reader` (to pull images)

For deployments via CI/CD, grant the deploying service account:
- `roles/run.admin`
- `roles/iam.serviceAccountUser`

## Quick Deploy

From the project root:

```bash
make deploy
```

This builds the Docker image, pushes to Artifact Registry, and deploys to Cloud Run using the configured project/region.

## Updating

After code changes:

```bash
make deploy
```

The image is rebuilt and the service updates with zero downtime (Cloud Run handles traffic shifting).

## Teardown

```bash
gcloud run services delete $SERVICE_NAME
gcloud artifacts repositories delete retirement-model --location=$GCP_REGION
```
