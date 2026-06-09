/**
 * Creates node_modules symlinks that ExpoHead.podspec (from expo-router)
 * needs to resolve react-native-screens. Runs automatically via postinstall.
 */
const fs = require('fs');
const path = require('path');

const nm = path.join(process.cwd(), 'node_modules');
const src = path.join(nm, 'react-native-screens');

if (!fs.existsSync(src)) {
  console.log('ℹ react-native-screens not yet installed, skipping ExpoHead patch');
  process.exit(0);
}

const variants = [
  'react-native--screens',
  'RNScreens',
];

for (const name of variants) {
  const dst = path.join(nm, name);
  if (!fs.existsSync(dst)) {
    try {
      fs.symlinkSync(src, dst, 'dir');
      console.log('✓ Created:', name, '→ react-native-screens');
    } catch (e) {
      console.log('ℹ', name, ':', e.message);
    }
  } else {
    console.log('✓', name, 'already present');
  }
}
