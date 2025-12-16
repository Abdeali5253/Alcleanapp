#!/bin/bash

# AlClean - Cleanup Old Files Script
# ⚠️  WARNING: This will DELETE old files from root directory
# Only run this AFTER you've tested that everything works in /frontend

echo "⚠️  WARNING: This will delete old root-level files and folders!"
echo "Make sure you've tested the app and everything works before proceeding."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cleanup cancelled."
  exit 0
fi

echo ""
echo "🗑️  Starting cleanup..."

# Delete root-level folders
echo "📁 Deleting old folders..."
rm -rf components/
rm -rf lib/
rm -rf types/
rm -rf styles/
rm -rf server/

# Delete root-level files
echo "📄 Deleting old files..."
rm -f App.tsx
rm -f main.tsx
rm -f index.html
rm -f index.css
rm -f vite.config.ts
rm -f manifest.json

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Deleted:"
echo "  - /components/ folder"
echo "  - /lib/ folder"
echo "  - /types/ folder"
echo "  - /styles/ folder"
echo "  - /server/ folder"
echo "  - Root App.tsx, main.tsx, index.html, etc."
echo ""
echo "🎉 Your project structure is now clean!"
echo "All code is in /frontend and /backend"
echo ""
