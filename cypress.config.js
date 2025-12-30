const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // We've connected to the backend API at the default port (3000)
    baseUrl: 'http://localhost:4000',

    // Setup node event listeners
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },

    // Default timeout for commands and assertions
    defaultCommandTimeout: 10000,

    // Default timeout for page loads
    pageLoadTimeout: 30000,

    // Enable support for TypeScript files
    supportFile: 'cypress/support/e2e.ts',

    // Test files pattern
    testFiles: '**/*.cy.{js,jsx,ts,tsx}',
  },

  // Configure screenshots and videos
  screenshotOnRunFailure: true,
  video: true,
  videoCompression: 32,
});
