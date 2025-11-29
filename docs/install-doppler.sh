#!/bin/sh
set -e

echo "🔧 App Engine Build Hook - Installing Doppler CLI..."

# Install Doppler CLI
if [ "$DOPPLER_INSTALL" = "true" ]; then
    echo "📦 Installing Doppler CLI..."
    (curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh || wget -t 3 -qO- https://cli.doppler.com/install.sh) | sh
    
    # Verify installation
    if command -v doppler &> /dev/null; then
        echo "✅ Doppler CLI installed successfully"
        doppler --version
    else
        echo "❌ Failed to install Doppler CLI"
        exit 1
    fi
else
    echo "⏭️  Skipping Doppler installation"
fi

echo "✅ Build hook completed"
