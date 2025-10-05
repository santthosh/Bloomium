#!/bin/bash

# Bloomium Local Setup Script
# This script sets up the local development environment

set -e

echo "🪷 Bloomium Local Setup"
echo "======================="
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing..."
    npm install -g pnpm@8
    echo "✅ pnpm installed"
else
    echo "✅ pnpm is already installed"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
else
    echo ""
    echo "✅ .env.local already exists"
fi

# Create local-data directory
echo ""
echo "📁 Creating local-data directory..."
mkdir -p local-data
echo "✅ local-data directory created"

# Generate demo tiles
echo ""
echo "🎨 Generating demo tiles (this may take a minute)..."
pnpm --filter @bloomium/worker dev:demo

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the services:"
echo "   Terminal 1: pnpm --filter @bloomium/api dev"
echo "   Terminal 2: pnpm --filter @bloomium/web dev"
echo ""
echo "Or use the convenience script:"
echo "   pnpm dev:all"
echo ""
echo "Then open http://localhost:3000 in your browser."
echo ""

