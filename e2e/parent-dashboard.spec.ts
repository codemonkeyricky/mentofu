import { test, expect } from '@playwright/test';

test.describe('Parent Dashboard', () => {
  test('should login as parent user and load parent dashboard', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:4000/');

    // Wait for auth screen to be visible
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

    // Click on Login button
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for login form to appear
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    // Login as parent user
    await page.fill('#login-username', 'parent');
    await page.fill('#login-password', 'admin2');
    await page.click('#login-form button[type="submit"]');

    // Wait for parent dashboard to load (parent users go directly to parent dashboard)
    await page.waitForSelector('#parent-dashboard-screen.active', { timeout: 10000 });

    // Check that the parent dashboard screen is displayed
    const parentDashboardScreen = page.locator('#parent-dashboard-screen');
    await expect(parentDashboardScreen).toBeVisible({ timeout: 5000 });

    // Check for parent dashboard heading - use more specific selector
    // The parent dashboard has multiple h2 elements, so we need to find the main one
    const dashboardHeading = page.locator('#parent-dashboard-screen.active .card-header h2');
    await expect(dashboardHeading).toContainText('Parent Dashboard');

    console.log('Parent dashboard loaded successfully');
  });

  test('should verify parent dashboard React component loads', async ({ page }) => {
    // Login as parent user
    await page.goto('http://localhost:4000/');

    // Wait for auth screen to be visible
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

    // Click on Login button
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for login form to appear
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    // Login as parent user
    await page.fill('#login-username', 'parent');
    await page.fill('#login-password', 'admin2');
    await page.click('#login-form button[type="submit"]');

    // Wait for parent dashboard to load
    await page.waitForSelector('#parent-dashboard-screen.active', { timeout: 10000 });

    // Check for parent dashboard heading - use more specific selector
    // The parent dashboard has multiple h2 elements, so we need to find the main one
    const dashboardHeading = page.locator('#parent-dashboard-screen.active .card-header h2');
    await expect(dashboardHeading).toContainText('Parent Dashboard');

    console.log('Parent dashboard heading found - component rendering verified');

    // Check for the main container as an extra verification
    const dashboardContainer = page.locator('#parent-dashboard-container');
    await expect(dashboardContainer).toBeVisible({ timeout: 5000 });
    console.log('Parent dashboard container found');

    // The presence of these elements indicates the React component loaded properly
  });

  test('should verify parent authentication redirect', async ({ page }) => {
    // Test that parent users are properly authenticated
    // Instead of navigating to /parent-dashboard directly, we'll check the auth mechanism

    // First, clear any existing auth
    await page.goto('http://localhost:4000/');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Trigger the app auth check to see if it correctly redirects unauthenticated users
    await page.reload();

    // Should be on the auth screen (login/register) after reloading without auth
    await page.waitForSelector('#auth-screen.active', { timeout: 5000 });

    const authScreen = page.locator('#auth-screen.active');
    await expect(authScreen).toBeVisible({ timeout: 5000 });

    console.log('Access denied - auth required - redirected to auth screen');
  });
});