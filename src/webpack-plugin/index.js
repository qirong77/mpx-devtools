const path = require("path");

class MpxDevtoolsWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
    this.pluginName = "MpxDevtoolsWebpackPlugin";
  }

  apply(compiler) {
    const loaderPath = 'mpx-devtools/src/webpack-plugin/loader/mpx-devtools-source-loader.js'
    compiler.options.module.rules.push({
      test: /\.mpx$/,
      use: [{ loader: loaderPath }],
      enforce: "pre",
    });
    if (compiler.hooks && compiler.hooks.normalModuleFactory) {
      compiler.hooks.normalModuleFactory.tap(this.pluginName, (nmf) => {
        nmf.hooks.afterResolve.tap(this.pluginName, (resolveData) => {
          if (!resolveData) return;
          const resource =
            resolveData.resource ||
            (resolveData.resourceResolveData &&
              resolveData.resourceResolveData.path);
          if (resource && /\.mpx$/.test(resource)) {
            resolveData.loaders = resolveData.loaders || [];
            const already = resolveData.loaders.some(
              (l) =>
                l &&
                (l.loader || l) &&
                path.resolve(l.loader || l) === loaderPath
            );
            if (!already) {
              resolveData.loaders.unshift({ loader: loaderPath });
            }
          }
        });
      });
    }
  }
}

module.exports = MpxDevtoolsWebpackPlugin;
