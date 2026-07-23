const path = require('path');

// Resolve the upstream Expo babel transformer from expo's nested node_modules
const expoDir = path.dirname(require.resolve('expo/package.json'));
const upstreamTransformer = require(
  require.resolve('@expo/metro-config/babel-transformer', { paths: [expoDir] })
);

// Bundled MAIAS documents are embedded as their RAW SOURCE TEXT (decision D8):
// the app parses and validates them at runtime through @maias/core, so bundled
// and picker-loaded documents take exactly the same code path.
module.exports.transform = async function ({ src, filename, options }) {
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
    const textSrc = 'module.exports = ' + JSON.stringify(src) + ';';
    return upstreamTransformer.transform({ src: textSrc, filename, options });
  }
  return upstreamTransformer.transform({ src, filename, options });
};
