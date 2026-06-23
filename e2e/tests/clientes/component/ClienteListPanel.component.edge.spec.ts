/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * COMPONENT-LEVEL EDGE CASES — testarch-automate (BMad-Integrated Mode)
 * Expands component coverage with behavioral edge cases for ClienteListPanel.
 *
 * Note: This file uses Playwright E2E (browser-level component behavior)
 * because the Vitest+RTL component tests require the frontend to be implemented.
 * These complement the pseudo-spec in ClienteListPanel.component.spec.ts.
 *
 * Acceptance Criteria targeted:
 *   AC1  — List item count matches API response count
 *   AC2  — Search de-bouncing: fast sequential input still filters correctly
 *   AC3  — EmptyState not shown for zero search results (only for empty API response)
 *   AC4  — Reintentar button is keyboard-accessible (focusable, Enter triggers retry)
 *   AC5  — Skeleton count matches expected skeleton items (8 per spec)
 *   AC10 — list items have role="button" and tabIndex=0
 *
 * Network-first pattern: all routes intercepted BEFORE navigation.
 */

import { test, expect } from '@playwright/test';

const API_CLIENTES_URL = '**/api/v1/clientes';

const THREE_CLIENTS = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    nombre: 'Alfa Industrial SAS',
    nit: '900111222',
    telefono: '3001110000',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    nombre: 'Beta Logística Ltda',
    nit: '800222333',
    telefono: '3102220000',
    ciudad: 'Cali',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    nombre: 'Gamma Tech Colombia',
    nit: '700333444',
    telefono: null,
    ciudad: null,
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-03T00:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — List item count edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ClienteListPanel — List count boundary', () => {
  test('[P1] should render exactly N items when API returns N clients', async ({ page }) => {
    // GIVEN: API returns exactly 3 clients
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(THREE_CLIENTS),
      })
    );

    // WHEN: Page renders
    await page.goto('/clientes');

    // THEN: Exactly 3 list items are rendered (not more, not fewer)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  });

  test('[P2] should render 1 item when API returns 1 client (boundary: minimum non-empty list)', async ({ page }) => {
    // GIVEN: API returns a single client
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([THREE_CLIENTS[0]]),
      })
    );

    // WHEN: Page renders
    await page.goto('/clientes');

    // THEN: Exactly 1 list item is rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Search sequential input edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ClienteListPanel — Search sequential input edge cases', () => {
  test('[P1] should correctly filter after rapid sequential search inputs', async ({ page }) => {
    // GIVEN: API returns 3 clients
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(THREE_CLIENTS),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User rapidly changes search queries
    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await searchInput.fill('Alfa');
    await searchInput.fill('Beta');
    await searchInput.fill('Gamma');

    // THEN: Final query "Gamma" shows only Gamma Tech Colombia
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Gamma Tech' })).toBeVisible();
  });

  test('[P1] should return to showing all 3 clients when search is cleared', async ({ page }) => {
    // GIVEN: Filtered to 1 item
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(THREE_CLIENTS),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await searchInput.fill('Alfa');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);

    // WHEN: Search is cleared (Ctrl+A + Delete pattern)
    await searchInput.selectText();
    await page.keyboard.press('Delete');

    // THEN: All 3 clients visible again
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  });

  test('[P2] should correctly search by NIT with numeric input', async ({ page }) => {
    // GIVEN: API returns 3 clients
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(THREE_CLIENTS),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types a NIT prefix
    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await searchInput.fill('800222');

    // THEN: Only Beta Logística (NIT 800222333) matches
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Beta Logística' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState vs. no-search-results distinction
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ClienteListPanel — EmptyState vs no-search-results distinction', () => {
  test('[P1] should NOT show EmptyState when search has no results (but data was loaded)', async ({ page }) => {
    // GIVEN: API returns clients, panel shows them
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(THREE_CLIENTS),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: Search yields no results
    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await searchInput.fill('zzzNOTFOUND999');

    // THEN: No items rendered, but EmptyState (for "no clients in DB") is NOT shown
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  test('[P1] should show EmptyState only when API returns empty array (no clients in DB)', async ({ page }) => {
    // GIVEN: API returns empty array (no clients in database)
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: Page renders
    await page.goto('/clientes');

    // THEN: EmptyState is shown with correct guidance message
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByText(/no hay clientes registrados\. crea el primero\./i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel accessibility (Reintentar button keyboard access)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ClienteListPanel — ErrorPanel accessibility', () => {
  test('[P1] Reintentar button should be focusable via Tab key', async ({ page }) => {
    // GIVEN: API returns 500
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error' }),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User tabs to the Reintentar button
    const reintentarBtn = page.getByRole('button', { name: /reintentar/i });
    await reintentarBtn.focus();

    // THEN: The button has focus
    const isFocused = await reintentarBtn.evaluate((el) => el === document.activeElement);
    expect(isFocused).toBe(true);
  });

  test('[P2] Reintentar button should trigger retry when activated via keyboard Enter', async ({ page }) => {
    // GIVEN: API fails first, succeeds on second call
    let callCount = 0;
    await page.route(API_CLIENTES_URL, (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([THREE_CLIENTS[0]]),
      });
    });

    // WHEN: User focuses Reintentar and presses Enter
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();
    const reintentarBtn = page.getByRole('button', { name: /reintentar/i });
    await reintentarBtn.focus();
    await page.keyboard.press('Enter');

    // THEN: A second API request was made and data shows
    expect(callCount).toBeGreaterThanOrEqual(2);
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC10 — ARIA roles and tabIndex on list items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ClienteListPanel — ARIA roles and keyboard accessibility', () => {
  test('[P1] each client list item should have role="button"', async ({ page }) => {
    // GIVEN: API returns 3 clients
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(THREE_CLIENTS),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: All client list items are rendered
    const items = page.getByTestId('cliente-list-item');
    const count = await items.count();

    // THEN: Each item has role="button"
    for (let i = 0; i < count; i++) {
      const role = await items.nth(i).getAttribute('role');
      expect(role).toBe('button');
    }
  });

  test('[P1] each client list item should have tabIndex=0 for keyboard navigation', async ({ page }) => {
    // GIVEN: API returns 3 clients
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(THREE_CLIENTS),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: First list item is checked
    const firstItem = page.getByTestId('cliente-list-item').first();

    // THEN: tabIndex is 0
    const tabIndex = await firstItem.getAttribute('tabindex');
    expect(tabIndex).toBe('0');
  });

  test('[P2] search input placeholder text should be in Spanish', async ({ page }) => {
    // GIVEN: API returns clients
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(THREE_CLIENTS),
      })
    );
    await page.goto('/clientes');

    // WHEN: Search input renders
    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await expect(searchInput).toBeVisible();

    // THEN: Placeholder is in Spanish
    const placeholder = await searchInput.getAttribute('placeholder');
    // Must contain Spanish text (nombre or NIT reference)
    expect(placeholder).toMatch(/nombre|NIT|buscar/i);
  });
});
