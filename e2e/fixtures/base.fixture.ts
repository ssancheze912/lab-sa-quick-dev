import { test as base, expect } from '@playwright/test'

export type TestFixtures = {
  clientesPage: void;
  contactosPage: void;
};

export const test = base.extend<TestFixtures>({
  clientesPage: async ({ page }, use) => {
    await page.goto('/clientes')
    await use()
  },
  contactosPage: async ({ page }, use) => {
    await page.goto('/contactos')
    await use()
  },
})

export { expect }
