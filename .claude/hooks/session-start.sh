#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

echo "==> Pulling latest changes from git..."
git fetch origin
git pull origin "$(git rev-parse --abbrev-ref HEAD)" --ff-only || true

echo "==> Installing dependencies..."
npm install

echo "==> Type-checking (tsc)..."
npx tsc -b --noEmit

echo "==> Running tests..."
npm test

echo "==> Launching dev server in background..."
npm run dev &
echo "Dev server started (PID $!)"

echo "==> Session ready."
