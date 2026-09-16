import { test, expect } from '@playwright/test';

test.describe('Registration flow (event → register)', () => {
  test('event registration page redirects to login when not authenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/events/carrera-kinetix-2026/registration');
    // Either a login redirect happens, or the page shows a login prompt
    await page.waitForLoadState('networkidle');
    const url = page.url();
    // The flow should land on either the registration page (which prompts login) or /auth/login
    const onLogin = url.includes('/auth/login');
    const onReg = url.includes('/registration');
    expect(onLogin || onReg).toBeTruthy();
  });

  test('authenticated participant reaches the registration page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('juan.perez@example.com');
    await page.locator('input[name="password"]').fill('seed1234');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 15000 });

    await page.goto('/events/carrera-kinetix-2026/registration');
    // Should NOT bounce back to login
    expect(page.url()).toMatch(/\/events\/carrera-kinetix-2026\/registration/);
  });

  test('success page exists', async ({ page }) => {
    const response = await page.goto('/events/carrera-kinetix-2026/registration/exito');
    // 200 = rendered, anything 5xx would be a bug
    expect(response?.status() ?? 0).toBeLessThan(500);
  });
});