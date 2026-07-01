import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';

/**
 * E2E tests: Story 2.1 — Client List & Search
 *
 * Covers the AC #3/#4/#5 states (empty dataset, zero search results,
 * backend failure + retry) that are NOT exercised by the broader
 * `clientes-crud.spec.ts` suite (which uses real seeded data for FR1/FR2/FR4/FR7/FR8).
 *
 * Network-first: every route is intercepted BEFORE `clientesPage.goto()`
 * navigates, per network-first.md ("intercept before navigate").
 *
 * RED PHASE: ClienteListView, EmptyState ('no-clients' / 'search-empty'
 * variants) and ErrorPanel do not exist yet (Story 2.1, Tasks 3-4).
 */

const CLIENTES_API_PATTERN = '**/api/v1/clientes**';

test.describe('Story 2.1 — Client List & Search (states)', () => {
  test('AC #3 — should show the no-clients EmptyState when the dataset is empty', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // GIVEN: the backend has zero clients (network-first: mock registered before navigation)
    await page.route(CLIENTES_API_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    // WHEN: the user navigates to /clientes
    await clientesPage.goto();

    // THEN: the no-clients EmptyState renders instead of any list rows
    await expect(page.getByTestId('empty-state-no-clients')).toBeVisible();
    await expect(clientesPage.clienteItems).toHaveCount(0);
  });

  test('AC #4 — should show a distinct search-empty state when a search matches no clients', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // GIVEN: the backend returns a non-empty client list
    await page.route(CLIENTES_API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'e2e-1', nombre: 'Comercial Andina', nit: '900111222', telefono: '3000000000', ciudad: 'Cali', createdAt: new Date().toISOString() },
        ]),
      }),
    );
    await clientesPage.goto();
    await expect(clientesPage.clienteItems).toHaveCount(1);

    // WHEN: the user searches for a term that matches nothing
    await clientesPage.buscar('ningún-cliente-coincide-zzz');

    // THEN: the search-empty state (not no-clients) renders, and the search input retains its value
    await expect(page.getByTestId('empty-state-search-empty')).toBeVisible();
    await expect(page.getByTestId('empty-state-no-clients')).not.toBeVisible();
    await expect(clientesPage.searchInput).toHaveValue('ningún-cliente-coincide-zzz');
  });

  test('AC #5 — should show ErrorPanel with Reintentar when the backend is unavailable, then load the list on retry success', async ({ page }) => {
    const clientesPage = new ClientesPage(page);
    let attempt = 0;

    // GIVEN: the first request fails, a retry would succeed (network-first: registered before navigation)
    await page.route(CLIENTES_API_PATTERN, (route) => {
      attempt += 1;
      if (attempt === 1) {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'e2e-2', nombre: 'Retry Exitoso SAS', nit: '900333444', telefono: '3001112233', ciudad: 'Medellín', createdAt: new Date().toISOString() },
        ]),
      });
    });

    // WHEN: the user navigates to /clientes and the initial fetch fails
    await clientesPage.goto();
    const errorPanel = page.getByTestId('error-panel');
    await expect(errorPanel).toBeVisible();

    // WHEN: the user clicks "Reintentar"
    await errorPanel.getByRole('button', { name: /reintentar/i }).click();

    // THEN: the list renders normally on the successful retry
    await expect(errorPanel).not.toBeVisible();
    await expect(clientesPage.clienteItems.filter({ hasText: 'Retry Exitoso SAS' })).toBeVisible();
  });
});
