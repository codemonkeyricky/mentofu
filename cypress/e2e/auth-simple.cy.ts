describe('Authentication Flow - Simple Tests', () => {
  const testUsername = `testuser${Date.now()}`;
  const testPassword = 'testpass123';

  beforeEach(() => {
    // Visit the application
    cy.visit('/');
  });

  it('should allow user to register and login (basic)', () => {
    // Register a new user using the custom command
    cy.register(testUsername, testPassword);

    // Verify we're on the start screen after registration/login
    cy.contains('h2', 'Welcome to MathMaster Pro');
  });

  it('should prevent login with invalid credentials', () => {
    // Try to login with invalid credentials
    cy.get('#login-btn').click();

    // Fill in form and submit
    cy.get('#login-username').type('invaliduser');
    cy.get('#login-password').type('invalidpass');
    cy.get('#login-form').submit();

    // The error handling is complex in the frontend, but we can at least verify
    // that the login screen remains visible (which means it didn't redirect)
    cy.get('#login-screen').should('have.class', 'active');
  });
});