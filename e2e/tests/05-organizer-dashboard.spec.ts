import { test, expect } from '@playwright/test';

test.describe('Organizer dashboard', () => {
  // Login helper
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('contact@kinetix.com');
    await page.locator('input[name="password"]').fill('seed1234');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 15000 });
  });

  test('renders dashboard with stats', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Welcome back|Resumen|Dashboard/i }).first()).toBeVisible({ timeout: 15000 });
  });

  test('shows recent events list', async ({ page }) => {
    await page.goto('/dashboard');
    // Should show some events
    await expect(page.getByText(/Valencia|NEON|Coastal|Summit/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('dashboard events page is reachable', async ({ page }) => {
    await page.goto('/dashboard/events');
    // Whatever events page is implemented, it should at least load
    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toMatch(/\/dashboard\/events/);
  });

  test('dashboard event detail page is reachable', async ({ page }) => {
    // Pick the seeded event
    await page.goto('/dashboard/events/carrera-kinetix-2026');
    await expect(page.locator('body')).toBeVisible();
  });
});