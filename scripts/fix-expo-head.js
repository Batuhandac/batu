/**
 * Postinstall fix:
 * 1. Creates node_modules symlinks for ExpoHead.podspec compatibility
 * 2. Patches ExpoHead.podspec to use s.dependency directly instead of
 *    add_dependency() which fails because the CocoaPods sandbox is not
 *    ready when podspecs are loaded during use_expo_modules!
 */
const fs = require('fs');
const path = require('path');

const nm = path.join(process.cwd(), 'node_modules');

// ── 1. Symlinks ──────────────────────────────────────────────────────────────
const src = path.join(nm, 'react-native-screens');
if (fs.existsSync(src)) {
  for (const name of ['react-native--screens', 'RNScreens']) {
    const dst = path.join(nm, name);
    if (!fs.existsSync(dst)) {
      try {
        fs.symlinkSync(src, dst, 'dir');
        console.log('✓ Symlink:', name, '→ react-native-screens');
      } catch (e) {
        console.log('ℹ', name, ':', e.message);
      }
    }
  }
}

// ── 2. Patch ExpoHead.podspec ────────────────────────────────────────────────
const podspecPath = path.join(nm, 'expo-router', 'ios', 'ExpoHead.podspec');
if (fs.existsSync(podspecPath)) {
  let content = fs.readFileSync(podspecPath, 'utf8');
  const before = 'add_dependency(s, "RNScreens")';
  const after  = 's.dependency "RNScreens"';
  if (content.includes(before)) {
    fs.writeFileSync(podspecPath, content.replace(before, after));
    console.log('✓ Patched ExpoHead.podspec: add_dependency → s.dependency');
  } else if (content.includes(after)) {
    console.log('✓ ExpoHead.podspec already patched');
  } else {
    console.log('ℹ ExpoHead.podspec: RNScreens line not found, skipping patch');
  }
}
