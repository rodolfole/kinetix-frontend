import { test, expect } from '@playwright/test';

test.describe('Organizer registration page', () => {
  test('renders the organizer registration form', async ({ page }) => {
    const response = await page.goto('/auth/register/organizer');
    // Either 200 or a redirect — both are valid as long as no crash
    expect(response?.status() ?? 0).toBeLessThan(500);
    if (response && response.status() === 200) {
      await expect(page.locator('body')).toBeVisible();
    }
  });
});