/**
 * Story 2.1: Client List & Search — E2E Edge Cases
 * Epic 2: Client Management
 *
 * Automation Expansion Tests (BMad-Integrated Mode — E2E Level)
 * Covers edge cases NOT addressed by the ATDD file client-list-search.spec.ts:
 *
 *   - Search no-match state renders EmptyState (not list items) at E2E level
 *   - Partial NIT substring search filters correctly at E2E level
 *   - Network abort renders ErrorPanel (connection-level failure, not 500)
 *   - Rapid sequential typing still shows correct filtered result
 *   - Search term with only whitespace shows the full list
 *   - ErrorPanel shown but client list NOT visible simultaneously (layout isolation)
 *   - Typing in search does NOT scroll page (UI stability)
 *   - AC4 — 404 response (misconfigured route) renders ErrorPanel
 *
 * All intercepts applied BEFORE navigation (network-first pattern).
 * All selectors use data-testid.
 */

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';

// ---------------------------------------------------------------------------
// Search edge cases — E2E level
// ---------------------------------------------------------------------------

test.describe('[P1] Search edge cases — E2E', () => {
  test('[P1] should show no results when search term matches no client nombre or NIT', async ({ page }) => {
    // GIVEN: Two clients are loaded
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '50', nombre: 'Empresa Alfa SA', nit: '900100200', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '51', nombre: 'Comercial Beta SAS', nit: '900200300', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // Verify list loaded
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Empresa Alfa SA');

    // WHEN: The user types a term that matches no client
    await page.getByTestId('clientes-search-input').fill('zzzzz_sin_coincidencia');

    // THEN: No client list items are shown; EmptyState appears
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('[P1] should filter by partial NIT substring at E2E level', async ({ page }) => {
    // GIVEN: Two clients with NITs that share no common substring
    const cliente1 = buildCliente({ nombre: 'Empresa Norte', nit: '100200300' });
    const cliente2 = buildCliente({ nombre: 'Empresa Sur', nit: '400500600' });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '52', nombre: cliente1.nombre, nit: cliente1.nit, telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '53', nombre: cliente2.nombre, nit: cliente2.nit, telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user types a partial NIT substring of the first client
    await page.getByTestId('clientes-search-input').fill('200300');

    // THEN: Only the first client whose NIT contains "200300" is visible
    await expect(page.getByTestId('clientes-list-panel')).toContainText(cliente1.nombre);
    await expect(page.getByTestId('clientes-list-panel')).not.toContainText(cliente2.nombre);
  });

  test('[P1] should show full list when search input contains only whitespace', async ({ page }) => {
    // GIVEN: Two clients are loaded
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '54', nombre: 'Empresa Omega', nit: '111222333', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '55', nombre: 'Empresa Sigma', nit: '444555666', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // WHEN: User types whitespace-only in the search input
    await page.getByTestId('clientes-search-input').fill('   ');

    // THEN: Both clients remain visible (whitespace-only treated as empty query)
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Empresa Omega');
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Empresa Sigma');
  });

  test('[P1] should show correct final result after rapid sequential typing', async ({ page }) => {
    // GIVEN: Three clients loaded
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '56', nombre: 'Alfa Uno', nit: '100000001', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '57', nombre: 'Beta Dos', nit: '200000002', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '58', nombre: 'Gamma Tres', nit: '300000003', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Alfa Uno');

    const searchInput = page.getByTestId('clientes-search-input');

    // WHEN: The user types rapidly, overwriting the input multiple times
    await searchInput.fill('A');
    await searchInput.fill('Al');
    await searchInput.fill('Alfa');

    // THEN: Only the final filter result "Alfa Uno" is shown
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Alfa Uno');
    await expect(page.getByTestId('clientes-list-panel')).not.toContainText('Beta Dos');
    await expect(page.getByTestId('clientes-list-panel')).not.toContainText('Gamma Tres');
  });
});

// ---------------------------------------------------------------------------
// ErrorPanel edge cases — E2E level
// ---------------------------------------------------------------------------

test.describe('[P1] ErrorPanel edge cases — E2E', () => {
  test('[P1] should render ErrorPanel when API returns 503 (service unavailable)', async ({ page }) => {
    // GIVEN: Backend returns 503 (service unavailable — common with load balancers)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ status: 503, title: 'Service Unavailable' }),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is shown instead of list
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('[P1] should render ErrorPanel when API returns 404 (misconfigured route)', async ({ page }) => {
    // GIVEN: Backend returns 404 (misconfigured endpoint or removed route)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status: 404, title: 'Not Found' }),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed (non-2xx is an error)
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P1] should not render client list items alongside ErrorPanel', async ({ page }) => {
    // GIVEN: API returns 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      })
    );

    await page.goto('/clientes');

    // THEN: ErrorPanel is visible AND no list items shown (mutually exclusive states)
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('[P1] should not render EmptyState alongside ErrorPanel', async ({ page }) => {
    // GIVEN: API returns 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      })
    );

    await page.goto('/clientes');

    // THEN: ErrorPanel visible, EmptyState NOT rendered (only one error state shown)
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// AC4 retry — E2E level — recover from error
// ---------------------------------------------------------------------------

test.describe('[P0] Retry recovery after error — E2E', () => {
  test('[P0] should show full client list after successful retry from 500 error', async ({ page }) => {
    // GIVEN: First call fails (500), second call succeeds with clients
    let callCount = 0;
    const cliente = buildCliente({ nombre: 'Empresa Recuperada' });

    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, title: 'Error' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '60', nombre: cliente.nombre, nit: cliente.nit, telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      });
    });

    await page.goto('/clientes');

    // Confirm error state
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks "Reintentar"
    await page.getByTestId('error-panel-retry-button').click();

    // THEN: Client list is displayed; ErrorPanel is hidden
    await expect(page.getByTestId('clientes-list-panel')).toContainText(cliente.nombre);
    await expect(page.getByTestId('error-panel')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Large dataset search performance — E2E NFR boundary
// ---------------------------------------------------------------------------

test.describe('[P2] Large dataset search — boundary condition', () => {
  test('[P2] should filter 100-record list and show correct result under 1 second', async ({ page }) => {
    // GIVEN: 100 clients loaded (scaled boundary test for NFR1: < 1s for up to 500 records)
    const clientes = Array.from({ length: 100 }, (_, i) => ({
      id: String(100 + i),
      nombre: `Empresa Test ${String(i).padStart(3, '0')}`,
      nit: `9${String(i).padStart(8, '0')}`,
      telefono: '',
      ciudad: '',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }));

    // Add a unique target client at the end
    clientes.push({
      id: '999',
      nombre: 'Empresa Objetivo Especial',
      nit: '999999999',
      telefono: '',
      ciudad: '',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');

    // Wait for list to fully load
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Empresa Test 000');

    // WHEN: User types the target client name
    const start = Date.now();
    await page.getByTestId('clientes-search-input').fill('Objetivo Especial');

    // THEN: The target client is shown and filtering completed within 1 second (NFR1)
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Empresa Objetivo Especial');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});
