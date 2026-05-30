import { test as base } from '@playwright/test'

export const test = base.extend({
  clientesPage: async ({ page }, use) => {
    await page.goto('/clientes')
    await use(page)
  },
  contactosPage: async ({ page }, use) => {
    await page.goto('/contactos')
    await use(page)
  },
})

export { expect } from '@playwright/test'
