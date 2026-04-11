import { test, expect } from '@playwright/test';

test.describe('Collection Page', () => {
  test('should load collection page', async ({ page }) => {
    await page.goto('/collection');
    await expect(page).toHaveURL(/\/collection/);
  });

});
