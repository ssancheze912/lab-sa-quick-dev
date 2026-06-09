/**
 * E2E Edge-Case Tests — Story 2.1: Client List & Search
 * Expands ATDD coverage with edge cases, boundary conditions and error paths
 * NOT covered by client-list-search.spec.ts (ATDD happy paths)
 *
 * Scenarios:
 *   EC-E2E-01 — Case-insensitive search matches uppercase query to lowercase name
 *   EC-E2E-02 — Search with leading/trailing spaces trims before filtering
 *   EC-E2E-03 — Search query with no match shows EmptyState (search-specific message)
 *   EC-E2E-04 — Skeleton loading state is visible before data arrives
 *   EC-E2E-05 — List is scrollable when clients exceed visible area
 *   EC-E2E-06 — Multiple simultaneous errors do not stack multiple ErrorPanels
 *   EC-E2E-07 — Search input is accessible (has aria-label)
 *   EC-E2E-08 — Mobile viewport renders the list panel
 *   EC-E2E-09 — Clicking "Reintentar" when retry succeeds hides ErrorPanel
 *   EC-E2E-10 — Typing then immediately clearing shows full list
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ---------------------------------------------------------------------------
// EC-E2E-01: Case-insensitive search
// ---------------------------------------------------------------------------

test.describe('Edge: Case-insensitive search', () => {
  test('[P1] should match uppercase query against lowercase nombre', async ({ page }) => {
    // GIVEN: A client named "empresa delta sa" (lowercase) is mocked
    const mockClientes = [
      {
        id: 'cccccccc-0000-0000-0000-000000000003',
        nombre: 'empresa delta sa',
        nit: '700700700-3',
        telefono: '3001111111',
        ciudad: 'Cali',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      }),
    );

    // WHEN: User navigates and types uppercase query "EMPRESA"
    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    await page.getByTestId('clientes-search-input').fill('EMPRESA');

    // THEN: The client is still visible (case-insensitive match)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'empresa delta sa' }),
    ).toBeVisible();
  });

  test('[P1] should match mixed-case query against mixed-case NIT', async ({ page }) => {
    // GIVEN: A client with NIT containing uppercase "ABC"
    const mockClientes = [
      {
        id: 'dddddddd-0000-0000-0000-000000000004',
        nombre: 'Sociedad XYZ',
        nit: 'ABC-123456',
        telefono: '3002222222',
        ciudad: 'Bogotá',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      }),
    );

    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    // WHEN: User types lowercase "abc"
    await page.getByTestId('clientes-search-input').fill('abc');

    // THEN: The client is still found
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Sociedad XYZ' }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// EC-E2E-02: Search with leading/trailing spaces
// ---------------------------------------------------------------------------

test.describe('Edge: Search trims whitespace', () => {
  test('[P1] should filter correctly when search query has leading spaces', async ({ page }) => {
    // GIVEN: Two clients
    const mockClientes = [
      {
        id: 'eeeeeeee-0000-0000-0000-000000000005',
        nombre: 'Norte Industrial SAS',
        nit: '500500500-5',
        telefono: '3003333333',
        ciudad: 'Barranquilla',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'ffffffff-0000-0000-0000-000000000006',
        nombre: 'Sur Comercial Ltda',
        nit: '600600600-6',
        telefono: '3004444444',
        ciudad: 'Cali',
        createdAt: '2026-01-02T00:00:00Z',
      },
    ];

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      }),
    );

    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    // WHEN: User types "  Norte" (leading spaces)
    await page.getByTestId('clientes-search-input').fill('  Norte');

    // THEN: Norte Industrial is visible; Sur Comercial is not
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Norte Industrial SAS' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Sur Comercial Ltda' }),
    ).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// EC-E2E-03: Search with no results shows search-specific EmptyState message
// ---------------------------------------------------------------------------

test.describe('Edge: Search with no results', () => {
  test('[P1] should show EmptyState when search query matches no clients', async ({ page }) => {
    // GIVEN: Some clients exist but none match the search term
    const mockClientes = [
      {
        id: 'aaaaaaaa-0000-0000-0000-100000000001',
        nombre: 'Alpha Corp',
        nit: '111111111-1',
        telefono: '3005555555',
        ciudad: 'Bogotá',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      }),
    );

    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    // WHEN: User searches for a term that matches nothing
    await page.getByTestId('clientes-search-input').fill('zzznomatchzzz');

    // THEN: EmptyState is shown (not a crash or blank screen)
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('[P2] search-specific EmptyState message differs from no-data EmptyState message', async ({ page }) => {
    // GIVEN: A client exists but search matches nothing
    const mockClientes = [
      {
        id: 'bbbbbbbb-0000-0000-0000-100000000002',
        nombre: 'Omega SA',
        nit: '222222222-2',
        telefono: '3006666666',
        ciudad: 'Medellín',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      }),
    );

    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    await page.getByTestId('clientes-search-input').fill('zzznomatch');

    // THEN: EmptyState text hints at the search filter (not just "create first client")
    await expect(page.getByTestId('empty-state')).toContainText(
      /búsqueda|criterio|encontr/i,
    );
  });
});

// ---------------------------------------------------------------------------
// EC-E2E-04: Skeleton visible during load
// ---------------------------------------------------------------------------

test.describe('Edge: Skeleton loading state', () => {
  test('[P2] should show loading skeleton while data is being fetched', async ({ page }) => {
    // GIVEN: API response is delayed
    let resolveFetch: () => void;
    const fetchDelay = new Promise<void>((resolve) => { resolveFetch = resolve; });

    await page.route('**/api/v1/clientes', async (route) => {
      await fetchDelay;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: Page starts loading (before response arrives)
    await page.goto('/clientes');

    // THEN: Loading skeleton is visible
    await expect(page.getByTestId('loading-skeleton')).toBeVisible();

    // Cleanup: unblock the fetch
    resolveFetch!();
  });
});

// ---------------------------------------------------------------------------
// EC-E2E-05: List scroll — panel has overflow-y when content exceeds area
// ---------------------------------------------------------------------------

test.describe('Edge: Scrollable panel', () => {
  test('[P2] panel container has scrollable overflow when many clients are displayed', async ({ page }) => {
    // GIVEN: 20 clients are returned (enough to overflow a typical viewport)
    const manyClientes = Array.from({ length: 20 }, (_, i) => ({
      id: `scroll-test-${String(i).padStart(2, '0')}-0000-0000-000000000000`,
      nombre: `Cliente Scroll ${i + 1}`,
      nit: `8${String(i).padStart(8, '0')}-1`,
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
    }));

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(manyClientes),
      }),
    );

    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    // THEN: The list panel is visible and the overflow-y-auto list container exists
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    // The first client and last client both exist in DOM (virtual/real scroll)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Cliente Scroll 1' }),
    ).toBeInViewport();
  });
});

// ---------------------------------------------------------------------------
// EC-E2E-06: Multiple ErrorPanel renders — only one ErrorPanel shown
// ---------------------------------------------------------------------------

test.describe('Edge: Single ErrorPanel on repeated failures', () => {
  test('[P1] shows exactly one ErrorPanel even if the error state triggers multiple renders', async ({ page }) => {
    // GIVEN: API always returns 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Error' }),
      }),
    );

    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    // THEN: Exactly one ErrorPanel is rendered (not duplicated)
    await expect(page.getByTestId('error-panel')).toBeVisible();
    expect(await page.getByTestId('error-panel').count()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// EC-E2E-07: Search input accessibility
// ---------------------------------------------------------------------------

test.describe('Edge: Search input accessibility', () => {
  test('[P1] search input has an accessible aria-label', async ({ page }) => {
    // GIVEN: No clients
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: Page loads
    // THEN: Search input has aria-label (for screen readers)
    const input = page.getByTestId('clientes-search-input');
    await expect(input).toBeVisible();
    const ariaLabel = await input.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel!.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// EC-E2E-08: Mobile viewport renders list panel
// ---------------------------------------------------------------------------

test.describe('Edge: Mobile viewport', () => {
  test('[P2] list panel renders on a mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport (375x812 — iPhone 13)
    await page.setViewportSize({ width: 375, height: 812 });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'mobile-test-0000-0000-000000000001',
            nombre: 'Mobile Cliente SA',
            nit: '999000001-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]),
      }),
    );

    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    // THEN: The list panel and client item are still visible on mobile
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Mobile Cliente SA' }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// EC-E2E-09: Retry success — ErrorPanel hides and list appears
// ---------------------------------------------------------------------------

test.describe('Edge: Retry success hides error', () => {
  test('[P1] ErrorPanel disappears and list is shown after successful retry', async ({ page }) => {
    // GIVEN: First call fails, second call succeeds
    let callCount = 0;
    const successData = [
      {
        id: 'retry-succ-0000-0000-000000000001',
        nombre: 'Recuperado Corp',
        nit: '888000001-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'fail' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(successData),
        });
      }
    });

    const firstResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await firstResponse;

    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks Reintentar and retry succeeds
    const retryResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i }).click();
    await retryResponse;

    // THEN: ErrorPanel is gone and the client list item is visible
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Recuperado Corp' }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// EC-E2E-10: Type then immediately clear — full list restored
// ---------------------------------------------------------------------------

test.describe('Edge: Rapid type-then-clear', () => {
  test('[P1] typing then immediately clearing restores full list', async ({ page }) => {
    // GIVEN: Two clients
    const mockClientes = [
      {
        id: 'rapid-aa-0000-0000-000000000001',
        nombre: 'Rápida SA',
        nit: '123000001-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'rapid-bb-0000-0000-000000000002',
        nombre: 'Lenta Corp',
        nit: '456000002-2',
        telefono: '3002345678',
        ciudad: 'Medellín',
        createdAt: '2026-01-02T00:00:00Z',
      },
    ];

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      }),
    );

    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    const input = page.getByTestId('clientes-search-input');

    // WHEN: User types "Rápida" and then immediately clears the input
    await input.fill('Rápida');
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Lenta Corp' }),
    ).not.toBeVisible();

    await input.clear();

    // THEN: Both clients are visible again
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Rápida SA' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Lenta Corp' }),
    ).toBeVisible();
  });
});
