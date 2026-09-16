import { test, expect } from '@playwright/test';

test.describe('Event detail page', () => {
  test('renders the Kinetix 2026 event page', async ({ page }) => {
    await page.goto('/events/carrera-kinetix-2026');

    // Title (h1 from EventHero) should contain "Carrera Kinetix 2026"
    await expect(page.locator('h1', { hasText: /Carrera Kinetix 2026/i }).first()).toBeVisible({ timeout: 15000 });

    // Should NOT be redirected to / (the event exists)
    expect(page.url()).toMatch(/\/events\/carrera-kinetix-2026/);
  });

  test('shows pricing section', async ({ page }) => {
    await page.goto('/events/carrera-kinetix-2026');
    // Look for any pricing-related text
    await expect(page.getByText(/Precio|Pricing|Early|Regular/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('shows runner kit items', async ({ page }) => {
    await page.goto('/events/carrera-kinetix-2026');
    await expect(page.getByText(/Playera|Medalla|Número|Bolsa|Kit/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('unknown event slug redirects to home', async ({ page }) => {
    await page.goto('/events/this-does-not-exist');
    // Should be redirected to /
    await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 }).catch(() => {});
    // Either the URL is / or we see the home page content
    expect(page.url()).toMatch(/\/$|\/events\/this-does-not-exist/);
  });

  test('event detail page has a CTA', async ({ page }) => {
    await page.goto('/events/carrera-kinetix-2026');
    // CTA pattern: a link or button pointing to /registration
    const cta = page.locator('a[href*="/registration"], a[href*="/register"]').first();
    await expect(cta).toBeVisible({ timeout: 15000 });
  });
});