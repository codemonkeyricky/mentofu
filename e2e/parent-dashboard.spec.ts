import { test, expect } from '@playwright/test';

test.describe('Parent Dashboard', () => {
  test('should login as parent user and load parent dashboard', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Simulate parent login via localStorage (same approach as other tests)
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-parent-token-123');
      localStorage.setItem('user', JSON.stringify({
        username: 'parent',
        isParent: true,
        id: 'parent-user-id-123'
      }));
    });

    // Instead of navigating to /parent-dashboard, we need to trigger the app's auth check
    // This will cause the app to detect the authenticated parent user and show the parent dashboard
    await page.reload();

    // Wait for the parent dashboard screen to be visible (regardless of active state)
    await page.waitForSelector('#parent-dashboard-screen', { timeout: 10000 });

    // Check that the parent dashboard screen is displayed
    const parentDashboardScreen = page.locator('#parent-dashboard-screen');
    await expect(parentDashboardScreen).toBeVisible({ timeout: 5000 });

    // Check for parent dashboard heading
    const dashboardHeading = page.getByRole('heading', { name: 'Parent Dashboard' });
    await expect(dashboardHeading).toBeVisible({ timeout: 5000 });

    console.log('Parent dashboard loaded successfully');
  });

  test('should verify parent dashboard React component loads', async ({ page }) => {
    // Simulate parent login via localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-parent-token-456');
      localStorage.setItem('user', JSON.stringify({
        username: 'parent',
        isParent: true,
        id: 'parent-user-id-456'
      }));
    });

    // Trigger app auth check to show parent dashboard
    await page.reload();

    // Wait for parent dashboard screen to be visible (regardless of active state)
    await page.waitForSelector('#parent-dashboard-screen', { timeout: 10000 });

    // Check for parent dashboard heading
    const dashboardHeading = page.getByRole('heading', { name: 'Parent Dashboard' });
    await expect(dashboardHeading).toBeVisible({ timeout: 5000 });

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
    await page.goto('/');
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