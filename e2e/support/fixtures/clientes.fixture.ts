/**
 * Test fixtures for Clientes E2E tests (Story 2.1 — Epic 2)
 *
 * Extends Playwright's base test with:
 *   - clientesPageWithData: intercepts API and navigates to /clientes with mocked client list
 *   - clientesPageEmpty: intercepts API returning empty array and navigates to /clientes
 *   - clientesPageError: intercepts API returning 500 and navigates to /clientes
 *
 * Pattern: Network-first (route interception BEFORE navigation) per ATDD rules.
 */

import { test as base, expect } from '@playwright/test';
import {
  buildClienteFixture,
  buildClienteFixtures,
  type ClienteFixture,
} from '../factories/cliente.factory';

const API_CLIENTES_GLOB = '**/api/v1/clientes';

export type ClienteTestFixtures = {
  /**
   * Navigates to /clientes with 3 mocked clients already in API response.
   * Provides the mocked clients array for assertions.
   */
  clientesPageWithData: { clientes: ClienteFixture[] };

  /**
   * Navigates to /clientes with an empty API response (no clients).
   */
  clientesPageEmpty: void;

  /**
   * Navigates to /clientes with a 500 error from the API.
   */
  clientesPageError: void;

  /**
   * Navigates to /clientes with 500 mocked clients for performance testing.
   * Provides the mocked clients array.
   */
  clientesPageBulk: { clientes: ClienteFixture[] };
};

export const test = base.extend<ClienteTestFixtures>({
  clientesPageWithData: async ({ page }, use) => {
    // Setup: intercept BEFORE navigation (network-first)
    const clientes = buildClienteFixtures(3);
    await page.route(API_CLIENTES_GLOB, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');

    // Provide to test
    await use({ clientes });

    // Cleanup: unroute (Playwright auto-cleans routes after test)
  },

  clientesPageEmpty: async ({ page }, use) => {
    // Setup: intercept with empty array BEFORE navigation
    await page.route(API_CLIENTES_GLOB, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/clientes');

    await use();
  },

  clientesPageError: async ({ page }, use) => {
    // Setup: intercept with 500 error BEFORE navigation
    await page.route(API_CLIENTES_GLOB, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Internal Server Error',
          status: 500,
        }),
      })
    );

    await page.goto('/clientes');

    await use();
  },

  clientesPageBulk: async ({ page }, use) => {
    // Setup: intercept with 500 clients BEFORE navigation (NFR1 performance test)
    const clientes = Array.from({ length: 500 }, (_, i) =>
      buildClienteFixture({
        nombre: `Empresa Bulk ${String(i + 1).padStart(3, '0')} SAS`,
        nit: `${String(900000000 + i)}`,
      })
    );

    await page.route(API_CLIENTES_GLOB, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');

    await use({ clientes });
  },
});

export { expect };
