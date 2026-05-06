import { test, expect } from '@playwright/test';

test.describe('Admin Pages', () => {
  test('should redirect /admin to sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(/\/admin\/sign-in/);
    await expect(page).toHaveURL(/\/admin\/sign-in/);
  });

  test('should render the sign-in page directly', async ({ page }) => {
    await page.goto('/admin/sign-in');
    await expect(page).toHaveURL(/\/admin\/sign-in/);
    await expect(page.getByRole('heading', { name: /admin sign in/i })).toBeVisible();
  });
});
