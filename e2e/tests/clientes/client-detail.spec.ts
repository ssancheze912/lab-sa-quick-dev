/**
 * Story 2.2: Client Detail View — E2E Acceptance Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC1  — Clicking a client in the left panel populates the right panel with all 4 fields
 *   AC2  — URL updates to /clientes/:clienteId without a full page reload on item click
 *   AC3  — Direct navigation to /clientes/:clienteId loads correct client details (deep link)
 *   AC4  — Non-existent clienteId shows graceful "Cliente no encontrado." message
 *
 * Test scenarios from test-design-epic-2.md:
 *   TC-E2-P1-05 — Click client → right panel + URL update
 *   TC-E2-P1-06 — Deep link to known UUID → correct detail + list item highlighted
 *   TC-E2-P1-07 — Deep link to non-existent UUID → graceful not-found, no JS errors
 *
 * Test status: RED — all tests fail until implementation is complete.
 * Framework: Playwright
 *
 * Patterns:
 *   - Network-first: page.route() intercepts set BEFORE page.goto()
 *   - Selectors: data-testid and ARIA roles only
 *   - No hard waits: explicit expects with toBeVisible/toHaveURL
 *   - Given-When-Then structure
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-05 — Click client in list → right panel shows all 4 fields + URL
// AC1 + AC2
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E2-P1-05 — AC1+AC2: Click client → detail panel + URL update', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should render all four client fields in the right panel after clicking a list item', async ({ page, request }) => {
    // GIVEN: At least one client exists in the system
    apiHelper = new ApiHelper(request);
    const data = buildCliente({
      nombre: 'Empresa Vista SA',
      nit: '900777111-5',
      telefono: '+57 601 999 0000',
      ciudad: 'Medellín',
    });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // CRITICAL: Intercept route BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => route.continue());

    // Navigate to the list
    await page.goto('/clientes');

    // WHEN: The user clicks on the client item in the left panel
    await page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Empresa Vista SA' })
      .click();

    // THEN: The right panel shows Nombre
    await expect(
      page.getByTestId('cliente-detail-panel').getByText('Empresa Vista SA')
    ).toBeVisible();

    // AND: The right panel shows NIT/RUC
    await expect(
      page.getByTestId('cliente-detail-panel').getByText('900777111-5')
    ).toBeVisible();

    // AND: The right panel shows Teléfono
    await expect(
      page.getByTestId('cliente-detail-panel').getByText('+57 601 999 0000')
    ).toBeVisible();

    // AND: The right panel shows Ciudad
    await expect(
      page.getByTestId('cliente-detail-panel').getByText('Medellín')
    ).toBeVisible();
  });

  test('should update URL to /clientes/:clienteId after clicking a list item without full page reload', async ({ page, request }) => {
    // GIVEN: A client exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'URL Update Test SA' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => route.continue());

    await page.goto('/clientes');

    // Track navigation events to detect full page reloads
    let fullPageReload = false;
    page.on('load', () => { fullPageReload = true; });
    // Reset after the initial load
    await page.waitForLoadState('domcontentloaded');
    fullPageReload = false;

    // WHEN: The user clicks on the client item
    await page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'URL Update Test SA' })
      .click();

    // THEN: The URL updates to /clientes/:clienteId (FR30 deep linking)
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));

    // AND: No full page reload occurred (SPA navigation)
    expect(fullPageReload).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-06 — Deep link to known UUID → correct details + list item highlighted
// AC3
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E2-P1-06 — AC3: Deep link to known clienteId loads correct record', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should display the correct client details when navigating directly to /clientes/:clienteId', async ({ page, request }) => {
    // GIVEN: A client with a known ID exists in the system
    apiHelper = new ApiHelper(request);
    const data = buildCliente({
      nombre: 'Deep Link Corp',
      nit: '800444222-9',
      telefono: '+57 604 111 2222',
      ciudad: 'Cali',
    });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigation (network-first)
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => route.continue());

    // WHEN: The user navigates directly to /clientes/:clienteId (deep link)
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The right panel displays the correct Nombre
    await expect(
      page.getByTestId('cliente-detail-panel').getByText('Deep Link Corp')
    ).toBeVisible();

    // AND: NIT/RUC is correct
    await expect(
      page.getByTestId('cliente-detail-panel').getByText('800444222-9')
    ).toBeVisible();

    // AND: Teléfono is correct
    await expect(
      page.getByTestId('cliente-detail-panel').getByText('+57 604 111 2222')
    ).toBeVisible();

    // AND: Ciudad is correct
    await expect(
      page.getByTestId('cliente-detail-panel').getByText('Cali')
    ).toBeVisible();
  });

  test('should show the matching client item highlighted/selected in the left panel on deep link', async ({ page, request }) => {
    // GIVEN: A client exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Selected Highlight SA' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // CRITICAL: Network-first intercepts
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => route.continue());

    // WHEN: Navigate directly to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The matching list item in the left panel is visually selected
    // The selected item should have aria-current="true"
    const selectedItem = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Selected Highlight SA' });

    await expect(selectedItem).toBeVisible();
    await expect(selectedItem).toHaveAttribute('aria-current', 'true');
  });

  test('should NOT redirect to root /clientes when using a valid deep link', async ({ page, request }) => {
    // GIVEN: A valid deep link exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'No Redirect Test SA' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => route.continue());

    // WHEN: Navigate directly to the deep link
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: URL stays at /clientes/:clienteId (no redirect to /clientes)
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));

    // AND: No 404 or blank panel
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-07 — Deep link with non-existent ID → graceful not-found, no JS errors
// AC4 — Risk R-007 mitigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E2-P1-07 — AC4: Non-existent clienteId shows graceful not-found', () => {
  const NON_EXISTENT_ID = '00000000-0000-4000-8000-000000000000';

  test('should display "Cliente no encontrado." in the right panel for a non-existent ID', async ({ page }) => {
    // GIVEN: A non-existent UUID is used in the URL
    // CRITICAL: Intercept BEFORE navigation (network-first)
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, (route) => route.continue());

    // WHEN: User navigates directly to /clientes/:nonExistentId
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);

    // THEN: A graceful not-found message is shown in Spanish (AC4)
    await expect(
      page.getByText('Cliente no encontrado.')
    ).toBeVisible();
  });

  test('should NOT produce JavaScript console errors when clienteId does not exist (R-007)', async ({ page }) => {
    // GIVEN: A non-existent UUID
    const consoleErrors: string[] = [];

    // Monitor for JS console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // CRITICAL: Network-first intercepts
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, (route) => route.continue());

    // WHEN: User navigates to the non-existent deep link
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);

    // Wait for the not-found message to appear (ensures the component has fully rendered)
    await page.getByText('Cliente no encontrado.').waitFor({ state: 'visible' });

    // THEN: No JavaScript console errors occurred (R-007 mitigation)
    expect(consoleErrors).toHaveLength(0);
  });

  test('should still render the left panel (client list) when clienteId does not exist', async ({ page }) => {
    // GIVEN: A non-existent clienteId in the URL
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, (route) => route.continue());

    // WHEN: Navigate to the non-existent deep link
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);

    // THEN: The left panel is still rendered (not a blank/crashed page)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: The right panel shows the not-found message (not blank, not crashed)
    await expect(page.getByText('Cliente no encontrado.')).toBeVisible();
  });

  test('should NOT render the generic ErrorPanel for a 404 not-found response', async ({ page }) => {
    // GIVEN: The API returns 404 for a non-existent UUID
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, (route) => route.continue());

    // WHEN: User navigates to the non-existent deep link
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);
    await page.getByText('Cliente no encontrado.').waitFor({ state: 'visible' });

    // THEN: The generic error panel with "Reintentar" is NOT shown
    // (404 is a business not-found, not a system failure)
    await expect(page.getByRole('button', { name: /reintentar/i })).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 — Default empty state in right panel when no client is selected
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 — Default empty state when on /clientes without selection', () => {
  test('should render the default empty state in the right panel when no clienteId is in URL', async ({ page }) => {
    // GIVEN: No clienteId is present in the URL
    // CRITICAL: Network-first intercept
    await page.route('**/api/v1/clientes', (route) => route.continue());

    // WHEN: User navigates to /clientes (root, no :clienteId)
    await page.goto('/clientes');

    // THEN: The right panel shows the default empty state in Spanish
    await expect(
      page.getByText('Selecciona un cliente para ver sus detalles.')
    ).toBeVisible();
  });
});
