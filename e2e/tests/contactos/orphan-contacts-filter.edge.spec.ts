import { test, expect } from '../../fixtures/base.fixture';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto, buildCliente } from '../../helpers/data.helper';

/**
 * E2E edge-case tests: Orphan Contacts Filter — Story 4.5
 * testarch-automate expansion
 *
 * Complements orphan-contacts-filter.spec.ts (ATDD baseline, 14 tests).
 * Covers edge cases NOT in ATDD:
 *   EDGE-01  URL persistence on browser reload — filter stays active after F5
 *   EDGE-02  Concurrent sinCliente + text search — both compose correctly
 *   EDGE-03  Text search clears when sinCliente filter is toggled off (optional — validates UX)
 *   EDGE-04  Empty search on sinCliente=true shows all orphan contacts
 *   EDGE-05  toggle active visual state — has correct data-state="on" after activation
 *   EDGE-06  toggle inactive visual state — has data-state="off" before any interaction
 *   EDGE-07  sinCliente=true deep-link + text search compose (URL has sinCliente; add search)
 *   EDGE-08  Direct navigation to /contactos?sinCliente=true shows filtro toggle in active state
 *   EDGE-09  ErrorPanel "Reintentar" retry button triggers re-fetch and recovers on success
 *   EDGE-10  Single orphan contact — list shows exactly 1 row and counter shows 1
 */

test.describe('Story 4.5 — Orphan Contacts Filter (Edge Cases)', () => {
  let contactosPage: ContactosPage;
  let apiHelper: ApiHelper;
  const createdContactoIds: string[] = [];
  const createdClienteIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    contactosPage = new ContactosPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdContactoIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    createdContactoIds.length = 0;

    for (const id of createdClienteIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdClienteIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // EDGE-01: URL persistence on browser reload
  // ---------------------------------------------------------------------------

  test('EDGE-01 — filter state persists after browser reload when URL has ?sinCliente=true', async ({ page }) => {
    // GIVEN: An orphan contact exists
    const orphan = await apiHelper.createContacto(
      buildContacto({ nombre: 'Persistencia Recarga Orphan' })
    );
    createdContactoIds.push(orphan.id);

    // GIVEN: Intercept sinCliente=true to return deterministic result
    await page.route('**/api/v1/contactos?sinCliente=true', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: orphan.id,
            nombre: 'Persistencia Recarga Orphan',
            cargo: orphan.cargo ?? 'Analista',
            telefono: orphan.telefono ?? '3100000001',
            email: orphan.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // WHEN: Navigate directly to /contactos?sinCliente=true
    await page.goto('/contactos?sinCliente=true');
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });

    // WHEN: User reloads the page (F5 / browser reload)
    await page.reload();

    // THEN: After reload, URL still has ?sinCliente=true
    await expect(page).toHaveURL(/sinCliente=true/, { timeout: 5000 });

    // THEN: Filter toggle is still in active state after reload
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });
    const toggle = page.getByTestId('filtro-sin-cliente');

    const isActive =
      (await toggle.getAttribute('aria-pressed')) === 'true' ||
      (await toggle.getAttribute('data-active')) === 'true' ||
      (await toggle.getAttribute('data-state')) === 'on';

    expect(isActive).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // EDGE-02: Concurrent sinCliente + text search
  // ---------------------------------------------------------------------------

  test('EDGE-02 — text search composes with sinCliente filter to narrow results', async ({ page }) => {
    // GIVEN: Two orphan contacts with different names
    const orphan1 = await apiHelper.createContacto(
      buildContacto({ nombre: 'Composicion Alpha Huerfano' })
    );
    const orphan2 = await apiHelper.createContacto(
      buildContacto({ nombre: 'Composicion Beta Huerfano' })
    );
    createdContactoIds.push(orphan1.id, orphan2.id);

    // GIVEN: Intercept sinCliente=true to return both orphans
    await page.route('**/api/v1/contactos?sinCliente=true', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: orphan1.id,
            nombre: 'Composicion Alpha Huerfano',
            cargo: 'Analista',
            telefono: '3100000001',
            email: orphan1.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
          {
            id: orphan2.id,
            nombre: 'Composicion Beta Huerfano',
            cargo: 'Analista',
            telefono: '3100000002',
            email: orphan2.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // WHEN: Navigate to /contactos?sinCliente=true (filter pre-activated)
    await page.goto('/contactos?sinCliente=true');

    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'Composicion Alpha Huerfano' })
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'Composicion Beta Huerfano' })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User types "Alpha" in the search box (client-side search on top of server filter)
    await page.getByTestId('contactos-search-input').fill('Alpha');

    // THEN: Only Alpha orphan is visible; Beta is hidden
    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'Composicion Alpha Huerfano' })
    ).toBeVisible({ timeout: 3000 });

    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'Composicion Beta Huerfano' })
    ).not.toBeVisible();

    // THEN: sinCliente filter is still active (URL unchanged)
    expect(page.url()).toContain('sinCliente=true');
  });

  // ---------------------------------------------------------------------------
  // EDGE-04: Empty search on sinCliente=true shows all orphans
  // ---------------------------------------------------------------------------

  test('EDGE-04 — clearing text search on sinCliente=true shows all orphan contacts again', async ({ page }) => {
    // GIVEN: Two orphan contacts
    const orphan1 = await apiHelper.createContacto(
      buildContacto({ nombre: 'Empty Search Orphan 1' })
    );
    const orphan2 = await apiHelper.createContacto(
      buildContacto({ nombre: 'Empty Search Orphan 2' })
    );
    createdContactoIds.push(orphan1.id, orphan2.id);

    await page.route('**/api/v1/contactos?sinCliente=true', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: orphan1.id,
            nombre: 'Empty Search Orphan 1',
            cargo: 'Analista',
            telefono: '3100000001',
            email: orphan1.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
          {
            id: orphan2.id,
            nombre: 'Empty Search Orphan 2',
            cargo: 'Analista',
            telefono: '3100000002',
            email: orphan2.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // WHEN: Filter active, search narrows to Orphan 1
    await page.goto('/contactos?sinCliente=true');

    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'Empty Search Orphan 1' })
    ).toBeVisible({ timeout: 5000 });

    await page.getByTestId('contactos-search-input').fill('Orphan 1');

    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'Empty Search Orphan 2' })
    ).not.toBeVisible({ timeout: 3000 });

    // WHEN: User clears the search
    await page.getByTestId('contactos-search-input').fill('');

    // THEN: Both orphans are visible again
    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'Empty Search Orphan 1' })
    ).toBeVisible({ timeout: 3000 });

    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'Empty Search Orphan 2' })
    ).toBeVisible({ timeout: 3000 });
  });

  // ---------------------------------------------------------------------------
  // EDGE-05: Toggle active visual state (data-state="on")
  // ---------------------------------------------------------------------------

  test('EDGE-05 — toggle has data-state="on" after activation', async ({ page }) => {
    // GIVEN: Network intercept before navigation
    await page.route('**/api/v1/contactos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await contactosPage.goto();
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });

    // WHEN: User activates the toggle
    await page.getByTestId('filtro-sin-cliente').click();
    await expect(page).toHaveURL(/sinCliente=true/, { timeout: 3000 });

    // THEN: data-state is "on"
    const toggle = page.getByTestId('filtro-sin-cliente');
    const dataState = await toggle.getAttribute('data-state');
    expect(dataState).toBe('on');
  });

  // ---------------------------------------------------------------------------
  // EDGE-06: Toggle inactive visual state (data-state="off")
  // ---------------------------------------------------------------------------

  test('EDGE-06 — toggle has data-state="off" before any interaction', async ({ page }) => {
    // GIVEN: Normal navigation (no sinCliente param)
    await page.route('**/api/v1/contactos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await contactosPage.goto();
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });

    // THEN: Before any click, data-state is "off"
    const toggle = page.getByTestId('filtro-sin-cliente');
    const dataState = await toggle.getAttribute('data-state');
    expect(dataState).toBe('off');
  });

  // ---------------------------------------------------------------------------
  // EDGE-07: Deep-link + text search compose (sinCliente in URL + search query)
  // ---------------------------------------------------------------------------

  test('EDGE-07 — sinCliente=true deep-link + text search compose simultaneously', async ({ page }) => {
    // GIVEN: Two orphan contacts intercepted
    await page.route('**/api/v1/contactos?sinCliente=true', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'id-deeplink-001',
            nombre: 'DeepLink Primer Orphan',
            cargo: 'Analista',
            telefono: '3100000001',
            email: 'deeplink1@test.com',
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'id-deeplink-002',
            nombre: 'DeepLink Segundo Orphan',
            cargo: 'Gerente',
            telefono: '3100000002',
            email: 'deeplink2@test.com',
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // WHEN: Navigate directly to /contactos?sinCliente=true
    await page.goto('/contactos?sinCliente=true');

    // WHEN: Both orphans are visible
    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'DeepLink Primer Orphan' })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User types additional search to narrow further
    await page.getByTestId('contactos-search-input').fill('Segundo');

    // THEN: Only "Segundo" orphan is visible
    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'DeepLink Segundo Orphan' })
    ).toBeVisible({ timeout: 3000 });

    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'DeepLink Primer Orphan' })
    ).not.toBeVisible();

    // THEN: URL still has sinCliente=true (not removed by search)
    expect(page.url()).toContain('sinCliente=true');
  });

  // ---------------------------------------------------------------------------
  // EDGE-08: Direct navigation shows filtro in active state (redundant with AC#6 but via data-state)
  // ---------------------------------------------------------------------------

  test('EDGE-08 — direct navigation to ?sinCliente=true shows toggle with data-state="on"', async ({ page }) => {
    // GIVEN: Intercept before navigation
    await page.route('**/api/v1/contactos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: Direct navigation
    await page.goto('/contactos?sinCliente=true');
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });

    // THEN: data-state="on" (active visual state)
    const dataState = await page.getByTestId('filtro-sin-cliente').getAttribute('data-state');
    expect(dataState).toBe('on');
  });

  // ---------------------------------------------------------------------------
  // EDGE-09: ErrorPanel Reintentar button triggers re-fetch and recovers
  // ---------------------------------------------------------------------------

  test('EDGE-09 — clicking Reintentar re-fetches and shows data after initial error', async ({ page }) => {
    // GIVEN: First request fails, second succeeds
    let requestCount = 0;

    await page.route('**/api/v1/contactos**', async (route) => {
      requestCount++;

      if (requestCount === 1) {
        // First fetch fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
        });
      } else {
        // Subsequent fetches succeed
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'retry-orphan-001',
              nombre: 'Orphan After Retry',
              cargo: 'Analista',
              telefono: '3100000001',
              email: 'retry.orphan@test.com',
              clienteId: null,
              createdAt: new Date().toISOString(),
            },
          ]),
        });
      }
    });

    // WHEN: Navigate to /contactos (first request fails)
    await contactosPage.goto();

    // THEN: ErrorPanel appears
    await expect(page.getByTestId('contactos-error-panel')).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks Reintentar
    await page.getByTestId('contactos-retry-button').click();

    // THEN: ErrorPanel disappears and contact data appears
    await expect(page.getByTestId('contactos-error-panel')).not.toBeVisible({ timeout: 5000 });
    await expect(
      page.getByTestId('contacto-row').filter({ hasText: 'Orphan After Retry' })
    ).toBeVisible({ timeout: 5000 });
  });

  // ---------------------------------------------------------------------------
  // EDGE-10: Single orphan contact — list shows exactly 1 row and counter shows 1
  // ---------------------------------------------------------------------------

  test('EDGE-10 — single orphan contact renders correctly with count badge showing 1', async ({ page }) => {
    // GIVEN: Exactly 1 orphan contact
    const orphan = await apiHelper.createContacto(
      buildContacto({ nombre: 'Un Solo Huerfano Edge' })
    );
    createdContactoIds.push(orphan.id);

    await page.route('**/api/v1/contactos?sinCliente=true', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: orphan.id,
            nombre: 'Un Solo Huerfano Edge',
            cargo: orphan.cargo ?? 'Analista',
            telefono: orphan.telefono ?? '3100000001',
            email: orphan.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // WHEN: Navigate to /contactos?sinCliente=true (single orphan)
    await page.goto('/contactos?sinCliente=true');

    // THEN: Exactly 1 row visible
    await expect(page.getByTestId('contacto-row')).toHaveCount(1, { timeout: 5000 });

    // THEN: Counter badge shows "1" and "sin cliente"
    await expect(page.getByTestId('contador-sin-cliente')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('contador-sin-cliente')).toContainText(/1/);
    await expect(page.getByTestId('contador-sin-cliente')).toContainText(/sin cliente/i);
  });
});
