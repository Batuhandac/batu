#!/usr/bin/env bash
# One-shot TestFlight pipeline. Run on a machine where you are logged in to Expo and have Apple access.
# Prereqs: npx eas-cli login  (once);  Apple Developer + App Store Connect access on the same Apple ID.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "1/4 EAS project link"
npx eas-cli project:init --non-interactive || npx eas-cli init

echo "2/4 iOS production build (EAS creates the bundle id, cert and profile on first run; answer the Apple prompts)"
npx eas-cli build --platform ios --profile production --auto-submit

echo "3/4 If --auto-submit was skipped, submit the latest build:"
echo "    npx eas-cli submit --platform ios --latest"

echo "4/4 Open App Store Connect > TestFlight, add internal testers. Build appears after Apple processing (10-30 min)."
