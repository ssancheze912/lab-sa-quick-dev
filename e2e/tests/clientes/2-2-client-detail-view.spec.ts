/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD E2E Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Requires: frontend dev server on http://localhost:5173
 *           backend API on http://localhost:5000
 *
 * Acceptance Criteria covered:
 *   AC#1 — Clicking a client item shows full details in right panel and updates URL to /clientes/:clienteId
 *   AC#2 — Navigating directly to /clientes/:clienteId with cold cache fetches and displays client details
 *   AC#3 — Non-existent clienteId shows a graceful Spanish not-found message (no stack trace)
 *   AC#4 — Backend unavailable shows ErrorPanel with "Reintentar" button in right panel
 *
 * Test Cases:
 *   TC-2.2-E-01 (P1, AC#1, AC#2) — Navigate directly to /clientes/{uuid}, assert detail panel shows Nombre/NIT (R-005)
 *   TC-2.2-E-02 (P1, AC#3)       — Navigate to /clientes/nonexistent-uuid, assert not-found message in Spanish
 *   TC-2.2-E-03 (P1, AC#1)       — Click client item in list, assert URL changes to /clientes/:clienteId without full reload
 *   TC-2.2-E-04 (P1, AC#1)       — Click client item, assert right panel shows Nombre, NIT, Teléfono, Ciudad
 *   TC-2.2-E-05 (P1, AC#4)       — Backend unavailable when loading detail, assert ErrorPanel with "Reintentar"
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// AC#1 + AC#2 — Deep link: navigate directly to /clientes/:clienteId
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 + AC#2 — Deep link navigation to /clientes/:clienteId (R-005)', () => {
  test('[P1][TC-2.2-E-01] Given a client exists, When navigating directly to /clientes/{uuid} (cold cache), Then detail panel shows correct Nombre and NIT', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Deep Link Corp SA', nit: '900777888-1' });
    const created = await api.createCliente(data);

    try {
      // Network-first: intercept the single-client API BEFORE navigation (R-005 cold cache)
      await page.route(`**/api/v1/clientes/${created.id}`, (route) => route.continue());

      // WHEN: User navigates directly to /clientes/:clienteId (cold TanStack Query cache)
      await page.goto(`/clientes/${created.id}`);

      // THEN: The detail panel is visible
      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

      // AND: Client Nombre is shown in the detail panel
      await expect(page.getByTestId('cliente-detail-nombre')).toContainText('Deep Link Corp SA');

      // AND: Client NIT is shown in the detail panel
      await expect(page.getByTestId('cliente-detail-nit')).toContainText('900777888-1');
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  test('[P1][TC-2.2-E-04] Given a client exists, When navigating to /clientes/:clienteId, Then detail panel shows all four fields: Nombre, NIT, Teléfono, Ciudad', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({
      nombre: 'Empresa Completa SA',
      nit: '800999111-2',
      telefono: '3001112222',
      ciudad: 'Medellín',
    });
    const created = await api.createCliente(data);

    try {
      // Network-first: intercept BEFORE navigation
      await page.route(`**/api/v1/clientes/${created.id}`, (route) => route.continue());

      // WHEN: User navigates directly to /clientes/:clienteId
      await page.goto(`/clientes/${created.id}`);

      // Wait for detail panel to be visible
      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

      // THEN: Nombre is displayed
      await expect(page.getByTestId('cliente-detail-nombre')).toContainText('Empresa Completa SA');

      // AND: NIT is displayed
      await expect(page.getByTestId('cliente-detail-nit')).toContainText('800999111-2');

      // AND: Teléfono is displayed
      await expect(page.getByTestId('cliente-detail-telefono')).toContainText('3001112222');

      // AND: Ciudad is displayed
      await expect(page.getByTestId('cliente-detail-ciudad')).toContainText('Medellín');
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#1 — Click client item from list navigates to /clientes/:clienteId
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — Clicking client item updates URL and shows detail panel', () => {
  test('[P1][TC-2.2-E-03] Given /clientes is loaded, When user clicks a client item, Then URL changes to /clientes/:clienteId without full page reload', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Click Navigation SA', nit: '700333444-5' });
    const created = await api.createCliente(data);

    try {
      // Network-first: intercept list API BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());
      // Network-first: also intercept single-client API to avoid real backend dependency
      await page.route(`**/api/v1/clientes/${created.id}`, (route) => route.continue());

      // GIVEN: User is on /clientes list
      await page.goto('/clientes');
      await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

      // WHEN: User clicks on the client item
      await page.getByTestId('cliente-list-item').filter({ hasText: data.nombre }).click();

      // THEN: URL updates to /clientes/:clienteId (no full reload — TanStack Router)
      await expect(page).toHaveURL(new RegExp(`/clientes/${created.id}`));

      // AND: Detail panel appears in the right panel
      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#3 — Non-existent clienteId shows Spanish not-found message (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#3 — Non-existent clienteId shows graceful not-found message', () => {
  test('[P1][TC-2.2-E-02] Given clienteId does not exist, When navigating to /clientes/nonexistent-uuid, Then a Spanish not-found message is shown with no stack trace (NFR6)', async ({
    page,
  }) => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // Network-first: intercept BEFORE navigation, simulate 404 Problem Details (RFC 7807)
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Cliente no encontrado.', status: 404 }),
      })
    );

    // WHEN: User navigates directly to a non-existent clienteId
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: A Spanish not-found message is visible
    await expect(
      page.getByText(/cliente no encontrado/i)
    ).toBeVisible();

    // AND: No stack trace or technical details are shown (NFR6)
    await expect(page.getByText(/stackTrace|stack_trace|at line|Exception/i)).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#4 — Backend unavailable shows ErrorPanel with "Reintentar"
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#4 — Backend failure shows ErrorPanel with "Reintentar" in right panel', () => {
  test('[P1][TC-2.2-E-05] Given backend unavailable when loading detail, When fetching /clientes/:clienteId fails, Then ErrorPanel with "Reintentar" button appears in right panel', async ({
    page,
  }) => {
    const clienteId = '00000000-0000-0000-0000-000000000001';

    // Network-first: intercept BEFORE navigation, simulate network error
    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      })
    );

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${clienteId}`);

    // THEN: ErrorPanel is visible in the right panel
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: "Reintentar" button is rendered
    await expect(
      page.getByRole('button', { name: /reintentar/i })
    ).toBeVisible();

    // AND: No stack trace or technical error details shown (NFR6)
    await expect(page.getByText(/Service Unavailable/i)).not.toBeVisible();
  });
});
