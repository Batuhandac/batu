#!/usr/bin/env bash
set -euo pipefail

NODE_MODULES="$(pwd)/node_modules"

echo "▸ Patching node_modules for ExpoHead.podspec compatibility..."

for name in "react-native--screens" "RNScreens"; do
  dst="$NODE_MODULES/$name"
  src="$NODE_MODULES/react-native-screens"
  if [ -d "$src" ] && [ ! -e "$dst" ]; then
    ln -sf "$src" "$dst" && echo "  ✓ Created $name → react-native-screens" || true
  else
    echo "  ✓ $name already present"
  fi
done

echo "▸ Done"
