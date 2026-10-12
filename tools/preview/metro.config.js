const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const appSrc = path.resolve(__dirname, "../../apps/mobile/src");
const fakes = path.resolve(__dirname, "src/fakes");

/*
 * The gallery imports the app's own code through the app's "@/" alias. Imports of the app's
 * services ("@/services/...") are answered by fakes here, so screens render with sample data and
 * the app itself contains no preview code.
 */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/services/")) {
    return context.resolveRequest(context, path.join(fakes, moduleName.slice("@/services/".length)), platform);
  }
  if (moduleName.startsWith("@/")) {
    return context.resolveRequest(context, path.join(appSrc, moduleName.slice(2)), platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
