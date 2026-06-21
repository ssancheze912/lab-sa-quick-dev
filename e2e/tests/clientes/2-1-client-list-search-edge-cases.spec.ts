/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * E2E Tests — Edge Cases & Boundary Conditions (BMad-Integrated Expansion)
 * Expands ATDD coverage with E2E-level edge cases not covered in
 * 2-1-client-list-search.spec.ts.
 *
 * New Test Cases:
 *   TC-2.1-E-09 — Panel has correct CSS width (w-[280px] class on root element)
 *   TC-2.1-E-10 — Search input can be cleared and all clients return
 *   TC-2.1-E-11 — Keyboard focus on search input (Tab navigation)
 *   TC-2.1-E-12 — Filter returning zero matches shows EmptyState, not ErrorPanel
 *   TC-2.1-E-13 — Multiple clients from API are all displayed in the list
 *   TC-2.1-E-14 — List panel is scrollable (overflow-y-auto)
 *   TC-2.1-E-15 — Right panel placeholder visible beside the list panel
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-E-09 — Panel has correct CSS width class
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — List panel CSS width edge cases', () => {
  test('[P2][TC-2.1-E-09] Given /clientes loaded, When inspecting the list panel container, Then an element with w-[280px] class exists on the page', async ({
    page,
  }) => {
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: Navigate to /clientes
    await page.goto('/clientes');

    // Wait for search input to be present (page loaded)
    await expect(page.getByTestId('search-input')).toBeVisible();

    // THEN: An element with the 280px width class exists (the list panel column)
    const panelEl = page.locator('[class*="w-\\[280px\\]"]').first();
    await expect(panelEl).toBeVisible();
  });

  test('[P2][TC-2.1-E-14] Given multiple clients, When list panel renders, Then overflow-y scrollable class is present', async ({
    page,
  }) => {
    // Network-first: intercept BEFORE navigation with 10 items
    const clientes = Array.from({ length: 10 }, (_, i) =>
      buildCliente({ nombre: `Empresa Scroll ${i + 1}` })
    );

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');

    // Wait for list items to appear
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // THEN: An element with overflow-y-auto class exists (the scrollable list container)
    const scrollableDiv = page.locator('[class*="overflow-y-auto"]').first();
    await expect(scrollableDiv).toBeAttached();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-E-10 — Clear search shows all clients
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#2 — Search clear restores full list', () => {
  test('[P1][TC-2.1-E-10] Given filtered list, When search input is cleared, Then all clients are shown again', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const clienteA = buildCliente({ nombre: 'Filterable Corp' });
    const clienteB = buildCliente({ nombre: 'Otro Empresa SAS' });

    const created1 = await api.createCliente(clienteA);
    const created2 = await api.createCliente(clienteB);

    try {
      // Network-first: allow real API to respond
      await page.route('**/api/v1/clientes', (route) => route.continue());
      await page.goto('/clientes');
      await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

      // Ensure both clients are shown
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: clienteA.nombre })
      ).toBeVisible();
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: clienteB.nombre })
      ).toBeVisible();

      // WHEN: User filters
      const searchInput = page.getByTestId('search-input');
      await searchInput.fill('Filterable');

      // AND: Only matching visible
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: clienteA.nombre })
      ).toBeVisible();
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: clienteB.nombre })
      ).not.toBeVisible();

      // WHEN: User clears search
      await searchInput.clear();

      // THEN: Both clients are visible again
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: clienteA.nombre })
      ).toBeVisible();
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: clienteB.nombre })
      ).toBeVisible();
    } finally {
      await api.deleteCliente(created1.id).catch(() => null);
      await api.deleteCliente(created2.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-E-11 — Keyboard navigation to search input
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility — keyboard navigation', () => {
  test('[P1][TC-2.1-E-11] Given /clientes loaded, When user focuses search input via keyboard, Then input receives focus and accepts typing', async ({
    page,
  }) => {
    // Network-first: empty list for simplicity
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // WHEN: User presses Tab to navigate to search input
    await page.keyboard.press('Tab');

    // THEN: Search input is focused
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeFocused();

    // AND: User can type in focused input
    await page.keyboard.type('busqueda');
    await expect(searchInput).toHaveValue('busqueda');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-E-12 — Filter with no match shows EmptyState, not ErrorPanel
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#2 — Filter with zero results', () => {
  test('[P1][TC-2.1-E-12] Given clients loaded, When filter query matches no client, Then EmptyState is shown (not ErrorPanel)', async ({
    page,
  }) => {
    // Network-first: intercept with two known clients
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          buildCliente({ nombre: 'Alpha Corp E2E', nit: '900001111-0' }),
          buildCliente({ nombre: 'Beta Corp E2E', nit: '900002222-0' }),
        ]),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);

    // WHEN: User types a query that matches nothing
    await page.getByTestId('search-input').fill('XYZNONEXISTENT999');

    // THEN: EmptyState is shown
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // AND: ErrorPanel is NOT shown
    await expect(page.getByTestId('error-panel')).not.toBeVisible();

    // AND: No list items
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-E-13 — Multiple clients all displayed
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — Multiple clients rendered correctly', () => {
  test('[P0][TC-2.1-E-13] Given 5 clients in backend, When list renders, Then all 5 are visible in the panel', async ({
    page,
  }) => {
    // Network-first: 5 clients
    const clientes = Array.from({ length: 5 }, (_, i) =>
      buildCliente({ nombre: `Empresa Multi ${i + 1}`, nit: `9000000${i + 1}0-0` })
    );

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');

    // THEN: All 5 client items are visible
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(5);

    // AND: Each name is visible
    for (const c of clientes) {
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: c.nombre })
      ).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-E-15 — Right panel placeholder visible beside list
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Layout — two-column shell', () => {
  test('[P2][TC-2.1-E-15] Given /clientes loaded, When page renders, Then both the list panel and the right panel (Outlet) are visible', async ({
    page,
  }) => {
    // Network-first: empty list
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/clientes');

    // THEN: List panel is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: Right panel / Outlet area exists (layout shell)
    // The right panel may have a placeholder text from Story 2.1 implementation
    // We verify it exists as a sibling of the list panel
    const listPanel = page.getByTestId('clientes-list-panel');
    const rightPanel = listPanel.locator('~ *').first();
    await expect(rightPanel).toBeAttached();
  });
});
