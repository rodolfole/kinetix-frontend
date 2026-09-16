import { test, expect } from '@playwright/test';

test.describe('Register page (participant)', () => {
  test('renders the form fields', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByRole('heading', { name: /Crear Cuenta/i })).toBeVisible();
    await expect(page.locator('input[name="first_name"]')).toBeVisible();
    await expect(page.locator('input[name="last_name"]')).toBeVisible();
    await expect(page.locator('input[name="birth_date"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="confirm_email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('client-side validation rejects short password', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('input[name="first_name"]').fill('Test');
    await page.locator('input[name="last_name"]').fill('User');
    await page.locator('input[name="birth_date"]').fill('1995-01-01');
    await page.locator('input[name="phone"]').fill('+5255555555555');
    await page.locator('input[name="email"]').fill(`test-${Date.now()}@example.com`);
    await page.locator('input[name="confirm_email"]').fill(`test-${Date.now()}@example.com`);
    await page.locator('input[name="password"]').fill('short');
    await page.getByRole('button', { name: /Crear Cuenta/i }).click();
    // Either an inline error appears or we remain on /auth/register
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/\/auth\/register/);
    const passwordField = page.locator('input[name="password"]');
    await expect(passwordField).toBeVisible();
  });

  test('client-side validation rejects mismatched emails', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('input[name="first_name"]').fill('Test');
    await page.locator('input[name="last_name"]').fill('User');
    await page.locator('input[name="birth_date"]').fill('1995-01-01');
    await page.locator('input[name="phone"]').fill('+5255555555555');
    await page.locator('input[name="email"]').fill('match@example.com');
    await page.locator('input[name="confirm_email"]').fill('different@example.com');
    await page.locator('input[name="password"]').fill('LongPassword1');
    await page.getByRole('button', { name: /Crear Cuenta/i }).click();
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/\/auth\/register/);
  });
});