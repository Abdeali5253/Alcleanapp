#!/bin/bash

# AlClean - Component Migration Script
# This script copies all components from root to /frontend/src/

echo "🚀 Starting AlClean Component Migration..."

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p frontend/src/components/ui
mkdir -p frontend/src/components/figma

# Copy main components
echo "📋 Copying main components..."
cp -r components/*.tsx frontend/src/components/ 2>/dev/null || true

# Copy UI components
echo "🎨 Copying UI components..."
cp -r components/ui/* frontend/src/components/ui/ 2>/dev/null || true

# Copy figma components (ImageWithFallback.tsx already exists, don't overwrite)
echo "🖼️  Copying Figma components..."
if [ ! -f "frontend/src/components/figma/ImageWithFallback.tsx" ]; then
  cp components/figma/ImageWithFallback.tsx frontend/src/components/figma/ 2>/dev/null || true
fi

# Copy root App.tsx if it doesn't exist in frontend
echo "📄 Checking App.tsx..."
if [ ! -f "frontend/src/App.tsx" ]; then
  cp App.tsx frontend/src/App.tsx 2>/dev/null || true
  echo "✅ Copied App.tsx to frontend/src/"
else
  echo "ℹ️  App.tsx already exists in frontend/src/"
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test the app: cd frontend && npm run dev"
echo "2. If everything works, run the cleanup script: ./cleanup-old-files.sh"
echo ""
