import { test as base, expect } from '@playwright/test';

/**
 * Extended Playwright test fixtures for Siesa Agents CRM.
 * Provides shared setup/teardown and typed fixtures for all E2E tests.
 */

export type TestFixtures = {
  /** Navigates to the clientes route before the test */
  clientesPage: void;
  /** Navigates to the contactos route before the test */
  contactosPage: void;
};

export const test = base.extend<TestFixtures>({
  clientesPage: async ({ page }, use) => {
    await page.goto('/clientes');
    await use();
  },
  contactosPage: async ({ page }, use) => {
    await page.goto('/contactos');
    await use();
  },
});

export { expect };
