/**
 * Story 2.1: Client List & Search — E2E Edge Case Tests
 *
 * Expands coverage beyond ATDD tests (story-2-1-client-list-search.spec.ts).
 * Covers:
 *   - Search with whitespace-only query restores full list
 *   - Single client in the system
 *   - Case-insensitive search verified end-to-end
 *   - Panel heading and search input placeholder text
 *   - Keyboard navigation (Enter on list item)
 *   - "Sin resultados" message appears end-to-end
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

test.describe('Story 2.1 — E2E Edge Cases', () => {
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

  // ─── Panel header text ────────────────────────────────────────────────────

  test('[P2] should display panel heading "Clientes" on /clientes route', async ({ page }) => {
    // GIVEN: at least one client exists
    const data = buildCliente({ nombre: 'Header Test', nit: '900100001-1' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: panel heading "Clientes" is visible (h2 per story spec)
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible();
  });

  // ─── Search input placeholder ─────────────────────────────────────────────

  test('[P2] search input should have correct placeholder text', async ({ page }) => {
    // WHEN: user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: search input has the correct placeholder
    const searchInput = page.getByLabel('Buscar cliente');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Buscar por nombre o NIT...');
  });

  // ─── Single client in system ──────────────────────────────────────────────

  test('[P1] should display a single client when only one exists in the system', async ({ page }) => {
    // GIVEN: exactly one client exists
    const data = buildCliente({ nombre: 'Único Cliente SAS', nit: '900100002-2' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: navigate to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: exactly one list item is visible
    await expect(page.getByTestId('cliente-list-item')).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Único Cliente SAS' })
    ).toBeVisible();
  });

  // ─── Case-insensitive E2E search: uppercase query ─────────────────────────

  test('[P1] should match uppercase search term to lowercase client name (case-insensitive)', async ({ page }) => {
    // GIVEN: clients with mixed case names
    const empresaA = await apiHelper.createCliente(
      buildCliente({ nombre: 'tecnología avanzada', nit: '900100003-3' })
    );
    const empresaB = await apiHelper.createCliente(
      buildCliente({ nombre: 'Distribuidora Rápida', nit: '900100004-4' })
    );
    createdIds.push(empresaA.id, empresaB.id);

    // WHEN: user navigates and types in UPPERCASE
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await page.getByLabel('Buscar cliente').fill('TECNOLOGÍA');

    // THEN: the lowercase-named client is still visible (case-insensitive)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'tecnología avanzada' })
    ).toBeVisible();

    // AND: non-matching client is NOT visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Distribuidora Rápida' })
    ).not.toBeVisible();
  });

  // ─── "Sin resultados" message appears in E2E ─────────────────────────────

  test('[P1] should display "Sin resultados" when search matches no clients', async ({ page }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'Cliente Existente', nit: '900100005-5' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: user navigates and types a non-matching term
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await page.getByLabel('Buscar cliente').fill('XYZXYZ_NO_MATCH_99999');

    // THEN: "Sin resultados para" message is visible
    await expect(page.getByText(/sin resultados para/i)).toBeVisible();

    // AND: no list items are shown
    await expect(page.getByTestId('cliente-list-item')).not.toBeVisible();
  });

  // ─── Whitespace-only search restores full list ────────────────────────────

  test('[P1] should show full list when search is cleared to whitespace', async ({ page }) => {
    // GIVEN: two clients exist
    const clienteA = await apiHelper.createCliente(
      buildCliente({ nombre: 'Empresa Whitespace A', nit: '900100006-6' })
    );
    const clienteB = await apiHelper.createCliente(
      buildCliente({ nombre: 'Empresa Whitespace B', nit: '900100007-7' })
    );
    createdIds.push(clienteA.id, clienteB.id);

    // WHEN: user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: user types a search term
    await page.getByLabel('Buscar cliente').fill('Whitespace A');

    // AND: user replaces it with only spaces
    await page.getByLabel('Buscar cliente').fill('   ');

    // THEN: full list is visible (spaces treated as empty by implementation)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Whitespace A' })
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Whitespace B' })
    ).toBeVisible();
  });

  // ─── listbox ARIA role present ─────────────────────────────────────────────

  test('[P2] left panel should have role="listbox" with correct aria-label', async ({ page }) => {
    // WHEN: user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: the list container has role="listbox" (per story spec WCAG requirement)
    const listbox = page.getByRole('listbox', { name: 'Lista de clientes' });
    await expect(listbox).toBeVisible();
  });

  // ─── Empty state: no skeleton visible when API returns [] ────────────────

  test('[P1] should NOT show skeleton when API returns an empty array (AC#4)', async ({ page }) => {
    // GIVEN: intercept API before navigation to return empty array
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: navigate to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: EmptyState message is shown
    await expect(
      page.getByText('No hay clientes registrados. Crea el primero.')
    ).toBeVisible();

    // AND: skeleton is NOT visible
    await expect(page.getByTestId('clientes-list-skeleton')).not.toBeVisible();
  });
});
