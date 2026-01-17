import { test, expect } from '@playwright/test';

test.describe('Quiz Functionality', () => {
  test('should start a multiplication quiz and submit answers', async ({ page }) => {
    await page.goto('/');

    // Wait for auth screen to be visible
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();

    // Register and login
    await page.getByRole('button', { name: 'Register' }).click();

    // Wait for registration form to appear
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    const username = 'quizuser' + Date.now() + Math.floor(Math.random() * 1000);
    await page.getByPlaceholder('Choose username').fill(username);
    await page.getByPlaceholder('Create password').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();

    // Wait for dashboard to load (after auto-login)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Click on multiplication quiz card (first one)
    await page.getByRole('button', { name: 'Start' }).first().click();

    // Wait for quiz screen to appear
    await expect(page.getByRole('heading', { name: 'Multiplication Quiz' })).toBeVisible();

    // Wait a bit for questions to load
    await page.waitForTimeout(1000);

    // Get the questions
    const questions = await page.locator('.question-card').all();
    const questionCount = questions.length;

    // Submit answers (all correct for this test)
    for (let i = 0; i < questionCount; i++) {
      // Get the question text to parse the multiplication
      const questionText = await questions[i].locator('.question-text-main').textContent();
      // Simple parsing to extract numbers from "5 x 6 =" or "What is 5 x 6?"
      const match = questionText?.match(/(\d+) x (\d+)/);
      if (match) {
        const num1 = parseInt(match[1]);
        const num2 = parseInt(match[2]);
        await questions[i].locator('.answer-input').fill((num1 * num2).toString());
      } else {
        // For other quiz types, just fill with a default value
        await questions[i].locator('.answer-input').fill('1');
      }
    }

    // Submit answers
    await page.getByRole('button', { name: 'Submit Answers' }).click();

    // Wait for results screen
    await expect(page.getByRole('heading', { name: 'Quiz Complete!' })).toBeVisible();
  });

  test('should take multiplication quiz twice', async ({ page }) => {
    await page.goto('/');

    // Wait for auth screen to be visible
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();

    // Register and login
    await page.getByRole('button', { name: 'Register' }).click();

    // Wait for registration form to appear
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    const username = 'quizuser' + Date.now() + Math.floor(Math.random() * 1000);
    await page.getByPlaceholder('Choose username').fill(username);
    await page.getByPlaceholder('Create password').fill('testpass123');
    await page.getByRole('button', { name: 'Register' }).click();

    // Wait for dashboard to load (after auto-login)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Take the multiplication quiz twice
    for (let attempt = 0; attempt < 2; attempt++) {
      // Click on multiplication quiz card (first one)
      await page.getByRole('button', { name: 'Start' }).first().click();

      // Wait for quiz screen to appear
      await expect(page.getByRole('heading', { name: 'Multiplication Quiz' })).toBeVisible();

      // Wait a bit for questions to load
      await page.waitForTimeout(1000);

      // Get the questions
      const questions = await page.locator('.question-card').all();
      const questionCount = questions.length;

      // Submit answers (all correct for this test)
      for (let i = 0; i < questionCount; i++) {
        // Get the question text to parse the multiplication
        const questionText = await questions[i].locator('.question-text-main').textContent();
        // Simple parsing to extract numbers from "5 x 6 =" or "What is 5 x 6?"
        const match = questionText?.match(/(\d+) x (\d+)/);
        if (match) {
          const num1 = parseInt(match[1]);
          const num2 = parseInt(match[2]);
          await questions[i].locator('.answer-input').fill((num1 * num2).toString());
        } else {
          // For other quiz types, just fill with a default value
          await questions[i].locator('.answer-input').fill('1');
        }
      }

      // Submit answers
      await page.getByRole('button', { name: 'Submit Answers' }).click();

      // Wait for results screen
      await expect(page.getByRole('heading', { name: 'Quiz Complete!' })).toBeVisible();

      // If this is the first attempt, we need to go back to dashboard to start the second quiz
      if (attempt === 0) {
        await page.getByRole('button', { name: 'Dashboard' }).click();
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
      }
    }
  });
});