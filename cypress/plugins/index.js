/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
}

// Enable a browserify + tsify preprocessor when deps are installed.
// This allows Cypress 4 to compile TypeScript and ES module syntax in tests.
// If the packages are not installed, the code logs a friendly message and
// leaves the plugin file as a no-op so Cypress continues to run (but will
// still fail to parse TS/ES without the preprocessor).
try {
  const browserify = require('@cypress/browserify-preprocessor');

  module.exports = (on, config) => {
    const options = browserify.defaultOptions || {};
    options.typescript = require.resolve('typescript');
    options.browserifyOptions = options.browserifyOptions || {};
    options.browserifyOptions.transform = options.browserifyOptions.transform || [];
    // Ensure babelify is configured to handle ES modules
    const babelifyIndex = options.browserifyOptions.transform.findIndex(
      (t) => Array.isArray(t) && t[0].includes('babelify')
    );
    if (babelifyIndex !== -1) {
      // Update existing babelify with proper sourceType
      options.browserifyOptions.transform[babelifyIndex][1] = {
        ...options.browserifyOptions.transform[babelifyIndex][1],
        sourceType: 'module'
      };
    }
    on('file:preprocessor', browserify(options));
    return config;
  };
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('Cypress TypeScript preprocessor not configured. Install devDeps: @cypress/browserify-preprocessor typescript');
}
