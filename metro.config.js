const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Bundle splitting and optimization for React Native
config.serializer = {
  ...config.serializer,
  // Enable tree shaking for better bundle optimization
  processModuleFilter: (module) => {
    // Exclude test files and unnecessary modules from bundle
    if (
      module.path.includes('__tests__') ||
      module.path.includes('test.') ||
      module.path.includes('.test.') ||
      module.path.includes('.spec.')
    ) {
      return false;
    }

    return true;
  },
};

// Resolver optimizations
config.resolver = {
  ...config.resolver,
  // Asset extensions (only include what we use)
  assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ttf', 'otf', 'woff', 'woff2'],
};

// Transformer optimizations
config.transformer = {
  ...config.transformer,
  // Enable inline requires for better code splitting
  inlineRequires: true,
};

module.exports = withNativeWind(config, { input: './global.css' });
