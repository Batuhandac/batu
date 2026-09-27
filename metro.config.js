const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK (v11) Metro uyumu:
// - .cjs uzantısını çöz
// - package "exports" alanını devre dışı bırak (firebase'in iç modül
//   çözümlemesinde "Component auth/firestore not registered" hatasını önler)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
