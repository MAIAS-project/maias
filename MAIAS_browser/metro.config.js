const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// The bundled example IAs live at the repo root (examples/), outside
// this app's project root — let Metro watch and resolve them.
config.watchFolders = [path.resolve(__dirname, '..')];

// Move .yaml/.yml from asset extensions to source extensions
// so they go through the babel transformer instead of being treated as binary assets
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'yaml' && ext !== 'yml'
);
config.resolver.sourceExts.push('yaml', 'yml');

// Use custom transformer that embeds YAML source text at bundle time
config.transformer.babelTransformerPath = require.resolve('./yaml-transformer.js');

module.exports = config;
