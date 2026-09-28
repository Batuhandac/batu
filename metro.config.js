const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK (v11) Metro uyumu:
// - .cjs uzantısını çöz
// - package "exports" alanını devre dışı bırak (firebase'in iç modül
//   çözümlemesinde "Component auth/firestore not registered" hatasını önler)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];
config.resolver.unstable_enablePackageExports = false;

// react-native-maps web'de çalışmaz; web derlemesinde (hekim paneli) yer tutucu kullan
const path = require('path');
const baseResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (ctx, name, platform) => {
  if (platform === 'web' && name === 'react-native-maps') {
    return { type: 'sourceFile', filePath: path.join(__dirname, 'lib/web/maps-stub.js') };
  }
  return baseResolve ? baseResolve(ctx, name, platform) : ctx.resolveRequest(ctx, name, platform);
};

module.exports = config;
