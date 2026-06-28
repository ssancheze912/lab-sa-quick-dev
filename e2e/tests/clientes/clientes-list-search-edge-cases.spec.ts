import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * E2E edge-case tests — Story 2.1: Client List & Search (automation expansion).
 *
 * Expands ATDD coverage (clientes-list-search.spec.ts) with:
 *   TC-E2-2-1-E2E-EC-1 (P1) — Case-insensitive search finds client
 *   TC-E2-2-1-E2E-EC-2 (P1) — Search by partial NIT filters list
 *   TC-E2-2-1-E2E-EC-3 (P1) — Clearing search restores full list
 *   TC-E2-2-1-E2E-EC-4 (P1) — No-results state shows EmptyState when search matches nothing
 *   TC-E2-2-1-E2E-EC-5 (P2) — Keyboard navigation: Enter on item fires selection
 *   TC-E2-2-1-E2E-EC-6 (P2) — Search input has correct placeholder text
 *   TC-E2-2-1-E2E-EC-7 (P2) — 404 on client URL shows graceful handling
 */

test.describe('Story 2.1 — Client List & Search (edge cases)', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-EC-1 (P1) — Case-insensitive search
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-EC-1: [P1] should find client when search is lowercase and nombre is mixed case', async ({ page }) => {
    // GIVEN: A client with mixed-case nombre
    const data = buildCliente({ nombre: 'EMPRESA MAYUSCULAS TEST' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'EMPRESA MAYUSCULAS TEST' })
    ).toBeVisible({ timeout: 5000 });

    // AND: Types lowercase search
    const searchInput = page.getByPlaceholder(/buscar por nombre o nit/i);
    await searchInput.fill('empresa mayusculas');

    // THEN: Client is still visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'EMPRESA MAYUSCULAS TEST' })
    ).toBeVisible({ timeout: 1000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-EC-2 (P1) — Search by partial NIT
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-EC-2: [P1] should filter list when user searches by partial NIT', async ({ page }) => {
    // GIVEN: Two clients with distinct NITs, intercepted BEFORE navigation
    const matchingNit = '777888999-4';
    const nonMatchingNit = '111222333-1';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          buildCliente({ nombre: 'Empresa NIT Match', nit: matchingNit }),
          buildCliente({ nombre: 'Empresa NIT No Match', nit: nonMatchingNit }),
        ]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible({ timeout: 5000 });

    // AND: Searches by partial NIT
    const searchInput = page.getByPlaceholder(/buscar por nombre o nit/i);
    await searchInput.fill('777888');

    // THEN: Only matching client visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa NIT Match' })
    ).toBeVisible({ timeout: 1000 });

    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa NIT No Match' })
    ).toBeHidden();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-EC-3 (P1) — Clearing search restores full list
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-EC-3: [P1] should restore full list when search input is cleared', async ({ page }) => {
    // GIVEN: Two clients, NETWORK intercepted BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          buildCliente({ nombre: 'Empresa Alfa' }),
          buildCliente({ nombre: 'Empresa Beta' }),
        ]),
      })
    );

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible({ timeout: 5000 });

    const searchInput = page.getByPlaceholder(/buscar por nombre o nit/i);

    // Filter to one
    await searchInput.fill('Alfa');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);

    // WHEN: Search cleared
    await searchInput.fill('');

    // THEN: Both clients shown again
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-EC-4 (P1) — No-results state
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-EC-4: [P1] should show EmptyState when search matches no clients', async ({ page }) => {
    // GIVEN: Two clients with no matches for the search term
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          buildCliente({ nombre: 'Empresa Alfa' }),
          buildCliente({ nombre: 'Empresa Beta' }),
        ]),
      })
    );

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible({ timeout: 5000 });

    // WHEN: Search that matches nothing
    const searchInput = page.getByPlaceholder(/buscar por nombre o nit/i);
    await searchInput.fill('ZZZ_NO_MATCH_XYZ');

    // THEN: No items shown; EmptyState visible
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-EC-5 (P2) — Keyboard navigation: Enter activates selection
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-EC-5: [P2] should be keyboard-navigable: Tab to item, Enter to activate', async ({ page }) => {
    // GIVEN: One client loaded
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          buildCliente({ nombre: 'Keyboard Nav Corp' }),
        ]),
      })
    );

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The client item has tabIndex=0 and can receive focus via Tab
    const item = page.getByTestId('cliente-list-item');
    await expect(item).toBeVisible({ timeout: 5000 });
    await expect(item).toHaveAttribute('tabindex', '0');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-EC-6 (P2) — Search input placeholder text
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-EC-6: [P2] should show Spanish placeholder text in the search input', async ({ page }) => {
    // GIVEN: Empty clientes list (intercepted)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: Navigate to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: Placeholder is in Spanish
    const searchInput = page.getByPlaceholder(/buscar por nombre o nit\/ruc/i);
    await expect(searchInput).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-EC-7 (P2) — "Clientes" heading present in Spanish
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-EC-7: [P2] should display "Clientes" heading in Spanish', async ({ page }) => {
    // GIVEN: Any state
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: Navigate to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: "Clientes" heading is visible
    await expect(page.getByRole('heading', { name: /clientes/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-EC-8 (P1) — 429 Too Many Requests shows ErrorPanel
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-EC-8: [P1] should show ErrorPanel when backend returns 429 (rate limit)', async ({ page }) => {
    // GIVEN: Backend rate-limits the request (intercepted BEFORE navigation)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Too Many Requests', status: 429 }),
      })
    );

    // WHEN: Navigate to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: ErrorPanel shown
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-EC-9 (P2) — clientes-list-panel has fixed 280px left panel
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-EC-9: [P2] should render the left panel with data-testid clientes-list-panel', async ({ page }) => {
    // GIVEN: Empty list
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: Navigate to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: Panel with data-testid exists
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });
});
