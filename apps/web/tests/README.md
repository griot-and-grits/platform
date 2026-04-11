# Playwright Tests

This directory contains end-to-end tests for the Griot and Grits web application using Playwright.

## Running Tests

```bash
# Run all tests in headless mode
npm test

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests
npm run test:debug

# View test report
npm run test:report
```

## Test Structure

- `tests/e2e/` - End-to-end tests
  - `admin.spec.ts` - Admin authentication tests
  - `collection.spec.ts` - Collection page tests
  - `home.spec.ts` - Homepage tests

## Configuration

The Playwright configuration is in `playwright.config.ts` at the project root. It includes:

- Single browser support (Chromium)
- Automatic dev server startup
- Screenshot on failure
- Trace on first retry

## Writing Tests

To add new tests:

1. Create a new `.spec.ts` file in `tests/e2e/`
2. Import test utilities: `import { test, expect } from '@playwright/test';`
3. Use `test.describe()` for grouping related tests
4. Write individual tests with `test()`

Example:
```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-page');
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```
