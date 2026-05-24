/**
 * Story 2.1: Client List & Search
 * Playwright Fixtures — Cliente List & Search
 *
 * Extends the base fixture with network interception helpers for the clientes
 * feature. All route mocks are set up BEFORE navigation (network-first pattern).
 *
 * Usage:
 *   import { test, expect } from '../../fixtures/clientes.fixture'
 *
 *   test('should render list', async ({ page, mockClientes }) => {
 *     await mockClientes([createCliente(), createCliente()])
 *     await page.goto('/clientes')
 *     ...
 *   })
 */

import { test as base, expect } from '@playwright/test'
import { createCliente, createClientes } from '../support/factories/cliente.factory'

export type ClientesFixtures = {
  /**
   * Intercepts GET /api/v1/clientes and fulfills it with the given clients.
   * MUST be called BEFORE page.goto('/clientes').
   */
  mockClientes: (clientes: ReturnType<typeof createCliente>[]) => Promise<void>

  /**
   * Intercepts GET /api/v1/clientes to return a network error (simulates
   * backend unavailability for AC4 tests).
   */
  mockClientesError: () => Promise<void>

  /**
   * Navigate to /clientes with an empty client list (intercepted).
   */
  emptyClientesList: void

  /**
   * Navigate to /clientes with 3 seeded clients (intercepted).
   */
  seededClientesList: {
    clientes: ReturnType<typeof createCliente>[]
  }
}

export const test = base.extend<ClientesFixtures>({
  mockClientes: async ({ page }, use) => {
    const mock = async (clientes: ReturnType<typeof createCliente>[]) => {
      // CRITICAL: Route must be set BEFORE navigation
      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clientes),
        })
      )
    }
    await use(mock)
  },

  mockClientesError: async ({ page }, use) => {
    const mock = async () => {
      // CRITICAL: Route must be set BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.abort('failed'))
    }
    await use(mock)
  },

  emptyClientesList: async ({ page }, use) => {
    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    )
    await page.goto('/clientes')
    await use()
  },

  seededClientesList: async ({ page }, use) => {
    const clientes = createClientes(3)

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    )

    await page.goto('/clientes')
    await expect(page.getByTestId('cliente-item').first()).toBeVisible()

    await use({ clientes })
  },
})

export { expect, createCliente, createClientes }
