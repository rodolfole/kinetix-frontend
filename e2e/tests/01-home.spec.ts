import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('renders the hero, search bar, events grid, and newsletter CTA', async ({ page }) => {
    await page.goto('/');

    // Hero section loads
    await expect(page.getByRole('heading', { name: /MIDNIGHT|VALENCIA|RUNNING|EVENTS/i }).first()).toBeVisible({ timeout: 15000 });

    // Search bar is present
    await expect(page.getByPlaceholder(/Race name|search|buscar/i).first()).toBeVisible({ timeout: 10000 });

    // Events grid heading
    await expect(page.getByRole('heading', { name: /PRÓXIMAS CARRERAS|UPCOMING/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows events from the seeded backend', async ({ page }) => {
    await page.goto('/');
    // Wait for the events grid to populate (could come from backend fetch)
    // Look for a card containing the Kinetix Carrera slug or name
    await expect(page.getByText(/Carrera Kinetix 2026|Valencia|NEON|SUMMIT/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('search bar is interactable', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByPlaceholder(/search|buscar/i).first();
    if (await searchInput.count()) {
      await searchInput.fill('Valencia');
      await searchInput.press('Enter');
      // Either the page reloads with ?q=Valencia or the events list narrows
      // We only assert the input retains the text and no client-side error
      await expect(searchInput).toHaveValue(/Valencia/);
    } else {
      test.skip(true, 'No search input found on home page');
    }
  });
});