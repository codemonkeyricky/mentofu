// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands for common operations
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/');

  // Click on login button if needed
  cy.get('#login-btn').click();

  // Fill in login form
  cy.get('#login-username').type(username);
  cy.get('#login-password').type(password);
  cy.get('#login-form').submit();
});

Cypress.Commands.add('register', (username, password) => {
  cy.visit('/');

  // Click on register button if needed
  cy.get('#register-btn').click();

  // Fill in registration form
  cy.get('#register-username').type(username);
  cy.get('#register-password').type(password);
  cy.get('#register-form').submit();
});

Cypress.Commands.add('startQuiz', (quizType) => {
  cy.get(`#start-${quizType}-btn`).click();
});