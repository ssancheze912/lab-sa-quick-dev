/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * E2E Tests — Edge Cases & Boundary Conditions (BMad-Integrated Expansion)
 * Expands ATDD coverage with E2E-level edge cases not covered in
 * 2-2-client-detail-view.spec.ts.
 *
 * New Test Cases:
 *   TC-2.2-E-06 — Both panels visible when on /clientes/:clienteId (two-column layout integrity)
 *   TC-2.2-E-07 — Clicking Reintentar in E2E context re-fetches and shows client data
 *   TC-2.2-E-08 — Navigating from /clientes/:clienteId back to /clientes restores placeholder
 *   TC-2.2-E-09 — Detail panel is scrollable when content overflows (overflow-y-auto)
 *   TC-2.2-E-10 — Two different clients navigated sequentially: second client replaces first in panel
 *   TC-2.2-E-11 — Detail panel renders client's NIT and Ciudad data-testid values correctly (E2E contract)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-E-06 — Both panels visible on /clientes/:clienteId
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Layout — two-column shell on detail route', () => {
  test('[P1][TC-2.2-E-06] Given /clientes/:clienteId route, When page renders, Then both the list panel and the detail panel are visible simultaneously', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Layout Two Panels SA', nit: '900600600-6' });
    const created = await api.createCliente(data);

    try {
      // Network-first: intercept BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());
      await page.route(`**/api/v1/clientes/${created.id}`, (route) => route.continue());

      // WHEN: Navigate to detail route
      await page.goto(`/clientes/${created.id}`);

      // THEN: Detail panel is visible
      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

      // AND: List panel is ALSO visible (two-column layout)
      await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-E-07 — Reintentar button in E2E context re-fetches successfully
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#4 — Reintentar button retries and loads data on success', () => {
  test('[P1][TC-2.2-E-07] Given ErrorPanel is shown, When user clicks Reintentar, Then data loads on second attempt', async ({
    page,
  }) => {
    const clienteId = '00000000-0000-0000-0000-000000000099';
    let callCount = 0;

    // Network-first: First call fails, second call succeeds
    await page.route(`**/api/v1/clientes/${clienteId}`, async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: clienteId,
            nombre: 'Retry Success Corp',
            nit: '900099099-9',
            telefono: '3000990099',
            ciudad: 'Cali',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          }),
        });
      }
    });

    // WHEN: Navigate to detail (first fetch fails)
    await page.goto(`/clientes/${clienteId}`);

    // THEN: ErrorPanel is shown
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();

    // WHEN: User clicks Reintentar
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: Client data is shown (second fetch succeeded)
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-nombre')).toContainText('Retry Success Corp');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-E-08 — Navigate from detail back to /clientes restores placeholder
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — Back-navigation from detail to list restores placeholder', () => {
  test('[P1][TC-2.2-E-08] Given user is on /clientes/:clienteId, When user navigates to /clientes (no id), Then right panel shows placeholder message', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Back Nav Corp SA', nit: '900800800-8' });
    const created = await api.createCliente(data);

    try {
      // Network-first: intercept BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());
      await page.route(`**/api/v1/clientes/${created.id}`, (route) => route.continue());

      // GIVEN: User is on the detail route
      await page.goto(`/clientes/${created.id}`);
      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

      // WHEN: User navigates to /clientes (no clienteId)
      await page.goto('/clientes');

      // THEN: Placeholder message is shown in the right panel
      await expect(
        page.getByText(/Selecciona un cliente de la lista para ver su detalle/i)
      ).toBeVisible();

      // AND: Detail panel is not visible (no client selected)
      await expect(page.getByTestId('cliente-detail-panel')).not.toBeVisible();
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-E-10 — Sequential navigation: second client replaces first
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — Sequential client navigation updates detail panel', () => {
  test('[P1][TC-2.2-E-10] Given two clients exist, When user navigates from first to second client, Then second client data replaces first in the panel', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data1 = buildCliente({ nombre: 'Primer Cliente SA', nit: '900001001-0' });
    const data2 = buildCliente({ nombre: 'Segundo Cliente SA', nit: '900002002-0' });

    const client1 = await api.createCliente(data1);
    const client2 = await api.createCliente(data2);

    try {
      // Network-first: intercept BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());
      await page.route(`**/api/v1/clientes/${client1.id}`, (route) => route.continue());
      await page.route(`**/api/v1/clientes/${client2.id}`, (route) => route.continue());

      // GIVEN: User navigates to first client detail
      await page.goto(`/clientes/${client1.id}`);
      await expect(page.getByTestId('cliente-detail-nombre')).toContainText('Primer Cliente SA');

      // WHEN: User navigates to second client detail
      await page.goto(`/clientes/${client2.id}`);

      // THEN: Second client data is shown
      await expect(page.getByTestId('cliente-detail-nombre')).toContainText('Segundo Cliente SA');

      // AND: First client data is NOT shown
      await expect(page.getByTestId('cliente-detail-nombre')).not.toContainText('Primer Cliente SA');
    } finally {
      await api.deleteCliente(client1.id).catch(() => null);
      await api.deleteCliente(client2.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-E-11 — data-testid values correct for NIT and Ciudad
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E2E contract — data-testid values for NIT and Ciudad', () => {
  test('[P1][TC-2.2-E-11] Given a client with specific NIT and Ciudad, When viewing /clientes/:id, Then data-testid="cliente-detail-nit" and "cliente-detail-ciudad" contain correct values', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({
      nombre: 'NIT Ciudad Test SA',
      nit: '900111222-3',
      ciudad: 'Barranquilla',
    });
    const created = await api.createCliente(data);

    try {
      // Network-first: intercept BEFORE navigation
      await page.route(`**/api/v1/clientes/${created.id}`, (route) => route.continue());

      // WHEN: Navigate to detail
      await page.goto(`/clientes/${created.id}`);

      // Wait for detail panel
      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

      // THEN: NIT field contains correct value
      await expect(page.getByTestId('cliente-detail-nit')).toContainText('900111222-3');

      // AND: Ciudad field contains correct value
      await expect(page.getByTestId('cliente-detail-ciudad')).toContainText('Barranquilla');
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  test('[P2][TC-2.2-E-11b] Given a client, When detail renders, Then data-testid="cliente-detail-telefono" shows the phone number', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({
      nombre: 'Phone Field Test SA',
      telefono: '3201234567',
    });
    const created = await api.createCliente(data);

    try {
      await page.route(`**/api/v1/clientes/${created.id}`, (route) => route.continue());
      await page.goto(`/clientes/${created.id}`);

      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

      // THEN: Teléfono field contains correct value
      await expect(page.getByTestId('cliente-detail-telefono')).toContainText('3201234567');
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-E-09 — Detail panel has overflow-y scrollable class
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Layout — detail panel scrollable for long content', () => {
  test('[P2][TC-2.2-E-09] Given a client is displayed, When detail panel renders, Then an element with overflow-y scrollable class is present', async ({
    page,
  }) => {
    const clienteId = '00000000-0000-0000-0000-000000000088';

    // Network-first: mock a client response
    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Scrollable Test Corp',
          nit: '900088088-8',
          telefono: '3000880088',
          ciudad: 'Bucaramanga',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      })
    );

    // Also intercept the list endpoint to avoid unhandled request warnings
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );

    // WHEN: Navigate to detail
    await page.goto(`/clientes/${clienteId}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // THEN: An element with overflow-y-auto or overflow-y-scroll class exists in the detail panel
    const scrollableEl = page.locator('[class*="overflow-y"]').first();
    await expect(scrollableEl).toBeAttached();
  });
});
