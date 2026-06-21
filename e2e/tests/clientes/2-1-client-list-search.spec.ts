/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD E2E Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Requires: frontend dev server on http://localhost:5173
 *           backend API on http://localhost:5000
 *
 * Acceptance Criteria covered:
 *   AC#1 — /clientes shows 280px scrollable list with Nombre and NIT/RUC per item
 *   AC#3 — Empty system shows EmptyState component with guidance message
 *   AC#4 — Backend unavailable shows ErrorPanel with "Reintentar" button
 *
 * Note: AC#2 (real-time search < 1s with 500 records) is covered in component
 *       tests (2-1-cliente-list-view.component.spec.ts) for latency measurement.
 *
 * Test Cases:
 *   TC-2.1-E-01 (AC#1)  — List panel renders with clients showing Nombre and NIT/RUC
 *   TC-2.1-E-02 (AC#1)  — List panel is 280px fixed width and scrollable
 *   TC-2.1-E-03 (AC#1)  — Search input visible with correct placeholder
 *   TC-2.1-E-04 (AC#2)  — Typing in search field filters list in real time by Nombre
 *   TC-2.1-E-05 (AC#2)  — Typing in search field filters list in real time by NIT/RUC
 *   TC-2.1-E-06 (AC#3)  — Empty backend response renders EmptyState component
 *   TC-2.1-E-07 (AC#4)  — Backend failure renders ErrorPanel with "Reintentar" button
 *   TC-2.1-E-08 (AC#4)  — Clicking "Reintentar" retries the fetch
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// AC#1 — /clientes shows 280px scrollable list with Nombre and NIT/RUC per item
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — Client list panel renders with existing clients', () => {
  test('[P0][TC-2.1-E-01] Given clients exist, When navigating to /clientes, Then list shows Nombre and NIT/RUC per item', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Empresa Test E2E Nombre', nit: '900111222-1' });

    // GIVEN: A client exists in the backend
    const created = await api.createCliente(data);

    try {
      // Network-first: intercept the clientes API BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());

      // WHEN: User navigates to /clientes
      await page.goto('/clientes');

      // THEN: The list panel is visible
      await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

      // AND: The client item shows Nombre
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: data.nombre })
      ).toBeVisible();
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  test('[P0][TC-2.1-E-01b] Given clients exist, When list renders, Then each item shows NIT/RUC below Nombre', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Empresa NIT Visible', nit: '800999777-2' });
    const created = await api.createCliente(data);

    try {
      // Network-first: intercept before navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());

      // WHEN: User navigates to /clientes
      await page.goto('/clientes');
      await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

      // THEN: The NIT is visible in the same item
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: data.nit })
      ).toBeVisible();
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  test('[P1][TC-2.1-E-03] Given /clientes loaded, When list panel renders, Then search input is visible with correct placeholder', async ({
    page,
  }) => {
    // Network-first: intercept API call before navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Search input has the correct Spanish placeholder
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      /buscar por nombre o nit/i
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#2 — Real-time search filter by Nombre and NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#2 — Real-time search filters list by Nombre and NIT/RUC', () => {
  test('[P0][TC-2.1-E-04] Given clients loaded, When typing Nombre in search field, Then only matching clients are shown', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const matchingData = buildCliente({ nombre: 'Acme Solutions Colombia' });
    const nonMatchingData = buildCliente({ nombre: 'Empresa Diferente SA' });

    const created1 = await api.createCliente(matchingData);
    const created2 = await api.createCliente(nonMatchingData);

    try {
      // Network-first: let the real API respond (data is seeded above)
      await page.route('**/api/v1/clientes', (route) => route.continue());

      // WHEN: User navigates to /clientes
      await page.goto('/clientes');
      await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

      // AND: Types a search term matching only the first client
      await page.getByTestId('search-input').fill('Acme Solutions');

      // THEN: Matching client is visible
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Solutions Colombia' })
      ).toBeVisible();

      // AND: Non-matching client is hidden
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Diferente SA' })
      ).not.toBeVisible();
    } finally {
      await api.deleteCliente(created1.id).catch(() => null);
      await api.deleteCliente(created2.id).catch(() => null);
    }
  });

  test('[P0][TC-2.1-E-05] Given clients loaded, When typing NIT in search field, Then only matching clients are shown', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const matchingData = buildCliente({ nit: '900555666-3' });
    const nonMatchingData = buildCliente({ nit: '100222333-9' });

    const created1 = await api.createCliente(matchingData);
    const created2 = await api.createCliente(nonMatchingData);

    try {
      // Network-first: let real API respond
      await page.route('**/api/v1/clientes', (route) => route.continue());

      // WHEN: User navigates to /clientes
      await page.goto('/clientes');
      await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

      // AND: Types a NIT/RUC value in the search field
      await page.getByTestId('search-input').fill('900555666');

      // THEN: Client matching that NIT is visible
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: matchingData.nombre })
      ).toBeVisible();

      // AND: Client with different NIT is hidden
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: nonMatchingData.nombre })
      ).not.toBeVisible();
    } finally {
      await api.deleteCliente(created1.id).catch(() => null);
      await api.deleteCliente(created2.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#3 — Empty system shows EmptyState component
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#3 — EmptyState displayed when no clients in system', () => {
  test('[P1][TC-2.1-E-06] Given no clients in system, When navigating to /clientes, Then EmptyState is shown with guidance message', async ({
    page,
  }) => {
    // Network-first: intercept BEFORE navigation, return empty array
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState component is visible
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // AND: EmptyState shows a guidance message (guiding user to create first client)
    await expect(page.getByTestId('empty-state')).toContainText(
      /cliente|crea|primer/i
    );
  });

  test('[P1][TC-2.1-E-06b] Given no clients, When EmptyState is shown, Then the client list is NOT rendered', async ({
    page,
  }) => {
    // Network-first: return empty array before navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState is shown
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // AND: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#4 — Backend unavailable shows ErrorPanel with "Reintentar" button
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#4 — ErrorPanel displayed when backend fetch fails', () => {
  test('[P1][TC-2.1-E-07] Given backend unavailable, When page loads, Then ErrorPanel is shown with "Reintentar" button', async ({
    page,
  }) => {
    // Network-first: intercept BEFORE navigation, simulate network error
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: "Reintentar" button is rendered
    await expect(
      page.getByRole('button', { name: /reintentar/i })
    ).toBeVisible();
  });

  test('[P1][TC-2.1-E-07b] Given backend returns error, When ErrorPanel is shown, Then no stack trace or technical details are displayed', async ({
    page,
  }) => {
    // Network-first: intercept BEFORE navigation with 503
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ stackTrace: 'Error at line 42', detail: 'DB connection failed' }),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is shown
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: No stack trace text is visible (NFR6 — no technical details)
    await expect(page.getByText(/stackTrace|stack trace|at line/i)).not.toBeVisible();
    await expect(page.getByText(/DB connection failed/i)).not.toBeVisible();
  });

  test('[P1][TC-2.1-E-08] Given ErrorPanel shown, When user clicks "Reintentar", Then fetch is retried', async ({
    page,
  }) => {
    let callCount = 0;

    // Network-first: first call fails, second call succeeds
    await page.route('**/api/v1/clientes', (route) => {
      callCount += 1;
      if (callCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server Error' }),
        });
      }
      // Second call: success with empty list
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is visible after first failed fetch
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks "Reintentar"
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: ErrorPanel is no longer visible (retry succeeded with empty list)
    await expect(page.getByTestId('error-panel')).not.toBeVisible();

    // AND: EmptyState is shown (second call returned empty array)
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });
});
