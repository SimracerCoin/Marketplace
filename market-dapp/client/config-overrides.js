const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = function override(config, env) {
    config.resolve = config.resolve || {};

    config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
        assert: require.resolve("assert"),
        http: require.resolve("stream-http"),
        os: require.resolve("os-browserify/browser"),
        url: require.resolve("url")
    };
    config.plugins = [
        ...config.plugins,
        new NodePolyfillPlugin(),
    ];
    config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: [new TerserPlugin()],
    }

    config.resolve.plugins = config.resolve.plugins.filter(plugin => !(plugin instanceof ModuleScopePlugin));
    
    return config;
  }