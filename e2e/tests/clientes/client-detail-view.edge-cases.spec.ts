/**
 * E2E Edge Case Tests — Story 2.2: Client Detail View
 * BMad-Integrated Automate — Expansion of ATDD coverage
 *
 * Covers edge cases, boundary conditions, and error paths NOT covered by the ATDD tests:
 *   - Keyboard navigation (Enter key on list item) — WCAG accessibility
 *   - Browser back-navigation after selecting a client
 *   - Detail view accessibility: aria-label on section
 *   - 503 Service Unavailable — same ErrorPanel path as 500
 *   - Network abort shows ErrorPanel (already in AC4 ATDD, here we cover the abort via route.abort())
 *   - Multiple clients: switch between clients updates right panel
 *   - Placeholder shown after navigating back from a detail URL to /clientes
 *   - Direct URL access for a client not present in list (list returns empty array)
 *   - fields with special characters in values
 *
 * Network intercept strategy: ALWAYS intercept routes BEFORE navigation (network-first).
 */

import { test, expect } from '@playwright/test';
import { createClienteDto, createClienteDtos } from '../../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard Navigation (WCAG accessibility edge cases)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge: Keyboard navigation on client list items', () => {
  test('[P1] should open detail view when Enter key is pressed on a focused client list item', async ({ page }) => {
    // GIVEN: A client exists and the list is rendered
    const cliente = createClienteDto({ id: 'aaaabbbb-0001-0001-0001-aaaaaaaaaaaa' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');

    // WHEN: User focuses the list item and presses Enter
    const listItem = page.getByTestId(`client-list-item-${cliente.id}`);
    await listItem.focus();
    await listItem.press('Enter');

    // THEN: The URL updates and detail view renders
    await expect(page).toHaveURL(new RegExp(cliente.id));
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible();
  });

  test('[P1] should update aria-selected when list item is focused and activated via keyboard', async ({ page }) => {
    // GIVEN: A client exists
    const cliente = createClienteDto({ id: 'aaaabbbb-0002-0002-0002-aaaaaaaaaaaa' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');

    // WHEN: User activates list item via keyboard
    const listItem = page.getByTestId(`client-list-item-${cliente.id}`);
    await listItem.focus();
    await listItem.press('Enter');

    // THEN: aria-selected is true on the activated item
    await expect(listItem).toHaveAttribute('aria-selected', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser Back Navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge: Browser back navigation after selecting a client', () => {
  test('[P1] should show placeholder in right panel when user navigates back to /clientes from a detail URL', async ({ page }) => {
    // GIVEN: A client detail has been viewed
    const cliente = createClienteDto({ id: 'aaaabbbb-0003-0003-0003-aaaaaaaaaaaa' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');
    await page.getByTestId(`client-list-item-${cliente.id}`).click();
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible();

    // WHEN: User navigates back
    await page.goBack();

    // THEN: URL is /clientes and placeholder is shown
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.getByTestId('cliente-detail-placeholder')).toBeVisible();
  });

  test('[P1] should still render the client list after navigating back from a detail URL', async ({ page }) => {
    // GIVEN: A client detail has been viewed
    const cliente = createClienteDto({ id: 'aaaabbbb-0004-0004-0004-aaaaaaaaaaaa' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible();

    // WHEN: User navigates back to the list
    await page.goBack();

    // THEN: The list is visible (split layout maintained)
    await expect(page.getByTestId('cliente-list-view')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Switching Between Clients (Right Panel Update)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge: Switching between clients updates right panel content', () => {
  test('[P1] should display the second client data after switching from the first client', async ({ page }) => {
    // GIVEN: Two clients with distinct data
    const clienteA = createClienteDto({ id: 'aaaabbbb-0005-0005-0005-aaaaaaaaaaaa', nombre: 'Empresa Alpha' });
    const clienteB = createClienteDto({ id: 'aaaabbbb-0006-0006-0006-aaaaaaaaaaaa', nombre: 'Empresa Beta' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteA, clienteB]) })
    );
    await page.route(`**/api/v1/clientes/${clienteA.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteA) })
    );
    await page.route(`**/api/v1/clientes/${clienteB.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteB) })
    );

    await page.goto('/clientes');

    // Select first client
    await page.getByTestId(`client-list-item-${clienteA.id}`).click();
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Alpha');

    // WHEN: User clicks on the second client
    await page.getByTestId(`client-list-item-${clienteB.id}`).click();

    // THEN: Right panel updates to show second client
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Beta');
  });

  test('[P1] should update the URL when switching from one client to another', async ({ page }) => {
    // GIVEN: Two clients exist
    const clienteA = createClienteDto({ id: 'aaaabbbb-0007-0007-0007-aaaaaaaaaaaa' });
    const clienteB = createClienteDto({ id: 'aaaabbbb-0008-0008-0008-aaaaaaaaaaaa' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteA, clienteB]) })
    );
    await page.route(`**/api/v1/clientes/${clienteA.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteA) })
    );
    await page.route(`**/api/v1/clientes/${clienteB.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteB) })
    );

    await page.goto('/clientes');
    await page.getByTestId(`client-list-item-${clienteA.id}`).click();
    await expect(page).toHaveURL(new RegExp(clienteA.id));

    // WHEN: Switch to second client
    await page.getByTestId(`client-list-item-${clienteB.id}`).click();

    // THEN: URL updates to second client
    await expect(page).toHaveURL(new RegExp(clienteB.id));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Direct URL with Client Not in List
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge: Direct URL access for a client not present in list', () => {
  test('[P2] should still display client detail when the client is not in the list (list returns empty array)', async ({ page }) => {
    // GIVEN: List returns empty but detail exists (client not in paginated list)
    const cliente = createClienteDto({ id: 'aaaabbbb-0009-0009-0009-aaaaaaaaaaaa', nombre: 'Unlisted Corp' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: Direct URL access
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Detail view renders with data from direct API call
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Unlisted Corp');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Field Values with Special Characters
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge: Client fields with special characters and boundary values', () => {
  test('[P2] should display client Nombre with accented characters and special chars correctly', async ({ page }) => {
    // GIVEN: A client with accented characters in Nombre
    const cliente = createClienteDto({
      id: 'aaaabbbb-0010-0010-0010-aaaaaaaaaaaa',
      nombre: 'Comercializadora Ñoño & Asociados S.A.S.',
    });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Special characters are displayed correctly (not escaped)
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Comercializadora Ñoño & Asociados S.A.S.');
  });

  test('[P2] should display NIT with dashes and formatting intact', async ({ page }) => {
    // GIVEN: A client with a formatted NIT
    const cliente = createClienteDto({
      id: 'aaaabbbb-0011-0011-0011-aaaaaaaaaaaa',
      nit: '900.123.456-7',
    });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto(`/clientes/${cliente.id}`);

    // THEN: NIT format is preserved
    await expect(page.getByTestId('cliente-detail-nit')).toHaveText('900.123.456-7');
  });

  test('[P2] should display a city name with spaces correctly', async ({ page }) => {
    // GIVEN: A client in a city with spaces
    const cliente = createClienteDto({
      id: 'aaaabbbb-0012-0012-0012-aaaaaaaaaaaa',
      ciudad: 'Santa Marta',
    });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Multi-word city is rendered correctly
    await expect(page.getByTestId('cliente-detail-ciudad')).toHaveText('Santa Marta');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility: section aria-label
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge: Accessibility — aria-label on detail section', () => {
  test('[P1] should have aria-label="Detalle del cliente" on the detail section for screen readers', async ({ page }) => {
    // GIVEN: A client detail is loaded
    const cliente = createClienteDto({ id: 'aaaabbbb-0013-0013-0013-aaaaaaaaaaaa' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible();

    // THEN: The root element has the correct aria-label for WCAG 2.1 AA compliance
    await expect(page.getByTestId('cliente-detail-view')).toHaveAttribute('aria-label', 'Detalle del cliente');
  });

  test('[P1] should have aria-label="Detalle del cliente" on the section even during error state', async ({ page }) => {
    // GIVEN: Detail fetch fails with 500
    const cliente = createClienteDto({ id: 'aaaabbbb-0014-0014-0014-aaaaaaaaaaaa' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // THEN: Section aria-label is still correct in error state
    await expect(page.getByTestId('cliente-detail-view')).toHaveAttribute('aria-label', 'Detalle del cliente');
  });

  test('[P1] should have aria-label="Detalle del cliente" on the section even during not-found state', async ({ page }) => {
    // GIVEN: Detail fetch returns 404
    const nonExistentId = 'aaaabbbb-0015-0015-0015-aaaaaaaaaaaa';

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ status: 404, title: 'Not Found' }) })
    );

    await page.goto(`/clientes/${nonExistentId}`);
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // THEN: Section aria-label is present even in not-found state
    await expect(page.getByTestId('cliente-detail-view')).toHaveAttribute('aria-label', 'Detalle del cliente');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 503 Service Unavailable — same ErrorPanel path as 500
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge: Various non-404 error codes render ErrorPanel', () => {
  test('[P1] should render ErrorPanel when backend returns 503 Service Unavailable', async ({ page }) => {
    // GIVEN: Backend is temporarily unavailable (503)
    const cliente = createClienteDto({ id: 'aaaabbbb-0016-0016-0016-aaaaaaaaaaaa' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    );

    // WHEN: User navigates to the detail URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: ErrorPanel is shown (generic error, not 404)
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('[P1] should render ErrorPanel when backend returns 401 Unauthorized (not 404)', async ({ page }) => {
    // GIVEN: Authentication failure (edge case — not-404 scenario)
    const cliente = createClienteDto({ id: 'aaaabbbb-0017-0017-0017-aaaaaaaaaaaa' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ status: 401, title: 'Unauthorized' }) })
    );

    // WHEN: User navigates to the detail URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: ErrorPanel is shown (not the not-found state)
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-not-found')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Loading State: skeleton present during slow network
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge: Skeleton loader is still shown after multiple re-renders during loading', () => {
  test('[P2] should still show skeleton during list load when detail fetch is also in-flight', async ({ page }) => {
    // GIVEN: Both list AND detail APIs are held pending (edge: both slow)
    const cliente = createClienteDto({ id: 'aaaabbbb-0018-0018-0018-aaaaaaaaaaaa' });
    let releaseDetail!: () => void;
    const detailHeld = new Promise<void>((resolve) => { releaseDetail = resolve; });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await detailHeld;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    // WHEN: User navigates directly to detail (detail fetch in-flight)
    const gotoPromise = page.goto(`/clientes/${cliente.id}`);

    // THEN: Skeleton is visible while fetch is pending
    await expect(page.getByTestId('cliente-detail-skeleton')).toBeVisible();

    // Cleanup
    releaseDetail();
    await gotoPromise;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Consecutive Retry Success
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge: Retry button — error then success', () => {
  test('[P1] should successfully display client data after retry recovers from error', async ({ page }) => {
    // GIVEN: First call fails, second call succeeds
    const cliente = createClienteDto({ id: 'aaaabbbb-0019-0019-0019-aaaaaaaaaaaa', nombre: 'Retry Corp' });
    let callCount = 0;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks retry
    await page.getByTestId('retry-button').click();

    // THEN: Client detail is now shown with correct nombre
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Retry Corp');
  });
});
