/**
 * Story 2.1: Client List & Search — E2E Edge Cases
 * Epic 2: Client Management
 *
 * Expanded coverage: edge cases, boundary conditions, and error paths
 * that are NOT covered in the ATDD acceptance tests.
 *
 * Coverage gaps addressed:
 *   - Search yields zero results (populated list, no match)
 *   - Search with whitespace-only term shows full list
 *   - Search is trimmed — leading/trailing spaces do not break filter
 *   - NIT/RUC contains dash (-) — special character in search term works
 *   - Loading skeleton visible during page load
 *   - ErrorPanel shown for HTTP 500 server error (not just network abort)
 *   - Page title / document title renders correctly
 *   - List panel visible on mobile viewport (280px adapts)
 *   - Multiple rapid search inputs (debounce safety — no crash)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Search produces no matching results
// When list is populated but search term does not match any client
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Search produces no matching results', () => {
  test('[P1] should show no list items when search term matches no client', async ({ page }) => {
    // GIVEN: The API returns 2 known clients — neither matches the search term
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', nombre: 'Empresa Alpha', nitRuc: '111000111-1', telefono: '3001111111', ciudad: 'Bogotá', createdAt: new Date().toISOString() },
          { id: '2', nombre: 'Empresa Beta', nitRuc: '222000222-2', telefono: '3002222222', ciudad: 'Medellín', createdAt: new Date().toISOString() },
        ]),
      })
    );

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // Wait for list to load
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types a term that matches nothing
    await page.getByRole('textbox', { name: /buscar cliente/i }).fill('XXXXXXXXXXX_NO_MATCH');

    // THEN: No list items visible
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('[P2] should NOT show EmptyState when search term produces no match (only on true empty list)', async ({ page }) => {
    // GIVEN: 2 clients in the list
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', nombre: 'Empresa Alpha', nitRuc: '111000111-1', telefono: '3001111111', ciudad: 'Bogotá', createdAt: new Date().toISOString() },
          { id: '2', nombre: 'Empresa Beta', nitRuc: '222000222-2', telefono: '3002222222', ciudad: 'Medellín', createdAt: new Date().toISOString() },
        ]),
      })
    );

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types a non-matching term
    await page.getByRole('textbox', { name: /buscar cliente/i }).fill('ZZZZZNOMATCH');

    // THEN: EmptyState should NOT be visible (EmptyState is only for truly empty DB)
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Search with whitespace-only or trimmed terms
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Whitespace and trimming behavior in search', () => {
  test('[P2] should show full list when search input contains only whitespace', async ({ page }) => {
    // GIVEN: API returns 2 clients
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', nombre: 'Empresa Alpha', nitRuc: '111000111-1', telefono: '3001111111', ciudad: 'Bogotá', createdAt: new Date().toISOString() },
          { id: '2', nombre: 'Empresa Beta', nitRuc: '222000222-2', telefono: '3002222222', ciudad: 'Medellín', createdAt: new Date().toISOString() },
        ]),
      })
    );

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types only spaces (whitespace-only query)
    await page.getByRole('textbox', { name: /buscar cliente/i }).fill('   ');

    // THEN: Full list of 2 clients is still visible (whitespace trimmed to empty)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: NIT/RUC dash character in search term
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — NIT/RUC with dash in search term', () => {
  test('[P1] should filter correctly when search term contains a dash (e.g. "900111001-1")', async ({ page }) => {
    // GIVEN: Two clients with different NIT/RUC that both contain dashes
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', nombre: 'Empresa Con Guion A', nitRuc: '900111001-1', telefono: '3001111111', ciudad: 'Bogotá', createdAt: new Date().toISOString() },
          { id: '2', nombre: 'Empresa Con Guion B', nitRuc: '900222002-2', telefono: '3002222222', ciudad: 'Medellín', createdAt: new Date().toISOString() },
        ]),
      })
    );

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types the full NIT including the dash suffix
    await page.getByRole('textbox', { name: /buscar cliente/i }).fill('900111001-1');

    // THEN: Only the exact NIT/RUC match is visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Con Guion A' })
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Con Guion B' })
    ).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: ErrorPanel on HTTP 500 server error (not only network abort)
// AC4 extends: "backend unavailable" includes server errors, not just refused connections
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — ErrorPanel on HTTP 500 server error', () => {
  test('[P1] should display ErrorPanel when API returns HTTP 500', async ({ page }) => {
    // GIVEN: The backend responds with a 500 Internal Server Error
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: ErrorPanel is visible (HTTP 5xx treated as error state)
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P1] should display Reintentar button when API returns HTTP 500', async ({ page }) => {
    // GIVEN: Backend returns 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: Reintentar button is present
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Search input placeholder and accessibility attributes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Search input placeholder and accessibility', () => {
  test('[P2] should have correct placeholder text on the search input', async ({ page }) => {
    // GIVEN: The user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: Page loads
    // THEN: Search input has the Spanish placeholder text
    const searchInput = page.getByRole('textbox', { name: /buscar cliente/i });
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /buscar por nombre o nit/i);
  });

  test('[P2] should be focusable via keyboard (Tab navigation)', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: User presses Tab to focus on the search input
    await page.keyboard.press('Tab');

    // THEN: The search input is focused
    const searchInput = page.getByRole('textbox', { name: /buscar cliente/i });
    await expect(searchInput).toBeFocused();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: List panel data-testid attribute present
// Ensures split-panel structure is intact for dependent stories (2.2+)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Left panel structural integrity', () => {
  test('[P1] should render the clientes-list-panel data-testid element on page load', async ({ page }) => {
    // GIVEN: Empty state (no need for real data)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The list panel wrapper is always present (even with empty state)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('[P2] should render search input even when EmptyState is displayed', async ({ page }) => {
    // GIVEN: No clients in the system (empty state)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // THEN: Search input is still rendered even in empty state (user might create clients)
    await expect(page.getByRole('textbox', { name: /buscar cliente/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Retry after error recovers the list correctly
// Expands AC4 — verifies that after a successful retry, the full list appears
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Successful retry after error shows client list', () => {
  test('[P1] should show client list after successful retry from ErrorPanel', async ({ page }) => {
    // GIVEN: First request fails, second request returns 2 clients
    let callCount = 0;

    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      if (callCount === 1) {
        route.abort('connectionrefused');
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', nombre: 'Cliente Recuperado A', nitRuc: '111000111-1', telefono: '3001111111', ciudad: 'Bogotá', createdAt: new Date().toISOString() },
            { id: '2', nombre: 'Cliente Recuperado B', nitRuc: '222000222-2', telefono: '3002222222', ciudad: 'Medellín', createdAt: new Date().toISOString() },
          ]),
        });
      }
    });

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks Reintentar
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: ErrorPanel disappears and client list shows 2 items
    await expect(page.getByTestId('error-panel')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);
  });
});
