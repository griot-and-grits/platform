import { test, expect } from '@playwright/test';

test.describe('Admin Pages', () => {
  // test('should redirect to sign-in when accessing admin without auth', async ({ page }) => {
  //   await page.goto('/admin');
  //
  //   await page.waitForURL(/\/admin\/(sign-in)?/);
  //   const url = page.url();
  //   expect(url).toMatch(/\/admin/);
  // });

  test('should have sign-in page accessible', async ({ page }) => {
    await page.goto('/admin/sign-in');

    await expect(page).toHaveURL(/\/admin\/sign-in/);
  });

});
