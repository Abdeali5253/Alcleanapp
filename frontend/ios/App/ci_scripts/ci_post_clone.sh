#!/bin/sh

# Prepare the ignored JavaScript and generated Capacitor dependencies before
# Xcode resolves the local Swift packages used by the application.
set -eux

REPOSITORY_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(CDPATH= cd -- "$(dirname -- "$0")/../../../.." && pwd)}"
FRONTEND_DIR="$REPOSITORY_ROOT/frontend"

NODE_MAJOR=0
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
fi

if [ "$NODE_MAJOR" -lt 22 ] || ! command -v npm >/dev/null 2>&1; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "error: Homebrew is required to install Node.js 22 for Capacitor 8."
    exit 1
  fi

  brew install node@22
  export PATH="$(brew --prefix node@22)/bin:$PATH"
fi

cd "$FRONTEND_DIR"
echo "Using Node $(node --version) and npm $(npm --version)"
npm ci --include=dev --no-audit --no-fund
npm run build
npx cap sync ios

for package_dir in \
  node_modules/@capacitor-firebase/authentication \
  node_modules/@capacitor-firebase/messaging \
  node_modules/@capacitor/app \
  node_modules/@capacitor/browser \
  node_modules/@capacitor/local-notifications \
  ios/capacitor-cordova-ios-plugins/sources/CordovaPluginInappbrowser
do
  if [ ! -d "$package_dir" ]; then
    echo "error: Capacitor sync did not create required package: $package_dir"
    exit 1
  fi
done
