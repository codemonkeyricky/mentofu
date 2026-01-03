describe('Quiz Functionality', () => {
  const testUsername = `testuser${Date.now()}`;
  const testPassword = 'testpass123';

  beforeEach(() => {
    // Visit the application
    cy.visit('/');

    // Register a new user first
    cy.register(testUsername, testPassword);

    // Then login with that user
    cy.login(testUsername, testPassword);

    // Verify we're logged in and on the welcome screen
    cy.contains('h2', 'Welcome to MathMaster Pro');
  });

  it('should allow user to start a math quiz and submit answers', () => {
    // Start a math quiz
    cy.get('#start-math-btn').click();

    // Wait for quiz screen to be visible with a longer timeout
    cy.get('#quiz-screen', { timeout: 20000 }).should('exist');

    // Verify we're on the quiz screen by checking for question header
    cy.contains('.quiz-header', 'Question 1 of 10');

    // Answer all questions (use correct answers)
    cy.get('.answer-input').each(($el, index) => {
      // For simplicity, we'll just fill in some values
      // In a real test, you'd want to get the actual question and answer it correctly
      cy.wrap($el).type('10');
    });

    // Submit answers
    cy.get('#submit-btn').click();

    // Verify results screen
    cy.contains('h2', 'Quiz Complete!');
  });

  it('should allow user to start a BODMAS quiz and submit answers', () => {
    // Start a BODMAS quiz
    cy.get('#start-math-4-btn').click();

    // Wait for quiz screen to be visible with a longer timeout
    cy.get('#quiz-screen', { timeout: 20000 }).should('exist');

    // Verify we're on the BODMAS quiz screen by checking for question header
    cy.contains('.quiz-header', 'Question 1 of 10');

    // Answer all questions (use correct answers)
    cy.get('.answer-input').each(($el, index) => {
      // For simplicity, we'll just fill in some values
      // In a real test, you'd want to get the actual question and answer it correctly
      cy.wrap($el).type('10');
    });

    // Submit answers
    cy.get('#submit-btn').click();

    // Verify results screen
    cy.contains('h2', 'Quiz Complete!');
  });
});