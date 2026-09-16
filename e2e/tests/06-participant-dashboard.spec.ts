import { test, expect } from '@playwright/test';

test.describe('Participant dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('juan.perez@example.com');
    await page.locator('input[name="password"]').fill('seed1234');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 15000 });
  });

  test('lands on participant dashboard', async ({ page }) => {
    expect(page.url()).toMatch(/\/participant\/dashboard/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('participant dashboard profile is reachable', async ({ page }) => {
    await page.goto('/participant/dashboard/profile');
    await expect(page.locator('body')).toBeVisible();
  });

  test('participant dashboard registrations is reachable', async ({ page }) => {
    await page.goto('/participant/dashboard/registrations');
    await expect(page.locator('body')).toBeVisible();
  });

  test('participant dashboard history is reachable', async ({ page }) => {
    await page.goto('/participant/dashboard/history');
    await expect(page.locator('body')).toBeVisible();
  });

  test('participant dashboard settings is reachable', async ({ page }) => {
    await page.goto('/participant/dashboard/settings');
    await expect(page.locator('body')).toBeVisible();
  });
});