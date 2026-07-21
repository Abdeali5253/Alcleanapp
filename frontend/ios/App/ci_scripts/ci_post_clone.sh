#!/bin/sh

# Xcode Cloud checks out the repository without ignored JavaScript dependencies.
# Capacitor's generated Swift package points at packages in frontend/node_modules,
# so install and sync them before Xcode starts resolving Swift packages.
set -eu

REPOSITORY_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}"
FRONTEND_DIR="$REPOSITORY_ROOT/frontend"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "error: Node.js and npm are required to prepare the Capacitor iOS project."
  exit 1
fi

cd "$FRONTEND_DIR"
npm ci --include=dev
npm run build
npx cap sync ios
