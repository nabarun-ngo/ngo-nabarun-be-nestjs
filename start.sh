#!/bin/sh
set -e

echo "🚀 Starting NestJS application with Doppler..."

if [ -z "$DOPPLER_TOKEN" ]; then
    echo "❌ Error: DOPPLER_TOKEN environment variable is not set"
    exit 1
fi

if [ -z "$DOPPLER_PROJECT" ] || [ -z "$DOPPLER_CONFIG" ]; then
    echo "❌ Error: DOPPLER_PROJECT and DOPPLER_CONFIG must be set"
    exit 1
fi

echo "📦 Doppler Project: $DOPPLER_PROJECT"
echo "⚙️  Doppler Config: $DOPPLER_CONFIG"
echo "🔄 Fetching secrets from Doppler at runtime..."


# Run Prisma migrations with Doppler secrets, then start the app
doppler run \
    --token="$DOPPLER_TOKEN" \
    --project="$DOPPLER_PROJECT" \
    --config="$DOPPLER_CONFIG" \
    -- sh -c '
        echo "🚀 Starting application..."
        exec node dist/main'