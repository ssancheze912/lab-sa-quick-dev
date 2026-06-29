import { test, expect } from '../../fixtures/base.fixture';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto, buildCliente } from '../../helpers/data.helper';

/**
 * E2E tests: Orphan Contacts Filter — Story 4.5
 *
 * Covers:
 *   AC#1  Activating "Sin cliente" filter shows only contacts with clienteId=null
 *   AC#2  Count of orphan contacts is visible when filter is active
 *   AC#3  EmptyState with "Todos los contactos tienen un cliente asignado" when no orphans
 *   AC#4  Deactivating the toggle restores the full contact list
 *   AC#5  Filter state is reflected as ?sinCliente=true in the URL (deep-linking)
 *   AC#6  Navigating directly to /contactos?sinCliente=true pre-activates the filter
 *   AC#7  Loading skeleton shown during fetch (not a spinner)
 *   AC#8  ErrorPanel with "Reintentar" button when backend unavailable
 *   AC#9  Filter toggle is keyboard-accessible (focusable, WCAG 2.1 AA)
 *
 * RED phase — filter toggle (data-testid="filtro-sin-cliente") does not exist yet.
 * Expected RED failures:
 *   - data-testid="filtro-sin-cliente" not found
 *   - URL does not include ?sinCliente=true after toggle click
 *   - EmptyState message "Todos los contactos tienen un cliente asignado" not implemented
 *   - GET /api/v1/contactos?sinCliente=true not yet handled by backend
 */

test.describe('Story 4.5 — Orphan Contacts Filter', () => {
  let contactosPage: ContactosPage;
  let apiHelper: ApiHelper;
  const createdContactoIds: string[] = [];
  const createdClienteIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    contactosPage = new ContactosPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    // Cleanup contacts
    for (const id of createdContactoIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    createdContactoIds.length = 0;

    // Cleanup clientes
    for (const id of createdClienteIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdClienteIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // AC#1 — Activating "Sin cliente" filter shows only orphan contacts
  // ---------------------------------------------------------------------------

  test('AC#1 — debe mostrar solo contactos sin cliente al activar el filtro "Sin cliente"', async ({ page }) => {
    // GIVEN: Network-first interception: override GET /api/v1/contactos?sinCliente=true
    // This ensures the filter returns only the orphan contact
    const orphanData = buildContacto({ nombre: 'Contacto Huerfano AC1 Filtro' });
    const orphan = await apiHelper.createContacto(orphanData);
    createdContactoIds.push(orphan.id);

    // GIVEN: A contact with a client (assigned) — should NOT appear in filtered list
    const clienteData = { nombre: `Cliente AC1 ${Date.now()}`, nit: `${Date.now()}`.slice(-9) };
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const assignedData = buildContacto({ nombre: 'Contacto Asignado AC1' });
    const assigned = await apiHelper.createContacto(assignedData);
    createdContactoIds.push(assigned.id);

    await apiHelper.asignarClienteAContacto(assigned.id, cliente.id);

    // GIVEN: Intercept sinCliente=true before navigation to ensure deterministic behavior
    await page.route('**/api/v1/contactos?sinCliente=true', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: orphan.id,
            nombre: 'Contacto Huerfano AC1 Filtro',
            cargo: orphanData.cargo ?? 'Analista',
            telefono: orphanData.telefono ?? '3100000001',
            email: orphanData.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // WHEN: User navigates to /contactos
    await contactosPage.goto();
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Contacto Huerfano AC1 Filtro' })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User activates the "Sin cliente" filter toggle
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('filtro-sin-cliente').click();

    // THEN: Only orphan contacts are shown
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Contacto Huerfano AC1 Filtro' })
    ).toBeVisible({ timeout: 5000 });

    // THEN: Assigned contact is NOT visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Contacto Asignado AC1' })
    ).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC#2 — Count of orphan contacts visible when filter is active
  // ---------------------------------------------------------------------------

  test('AC#2 — debe mostrar el conteo de contactos sin cliente cuando el filtro está activo', async ({ page }) => {
    // GIVEN: Two orphan contacts
    const orphan1 = await apiHelper.createContacto(
      buildContacto({ nombre: 'Huerfano Count 1' })
    );
    const orphan2 = await apiHelper.createContacto(
      buildContacto({ nombre: 'Huerfano Count 2' })
    );
    createdContactoIds.push(orphan1.id, orphan2.id);

    // GIVEN: Intercept to return controlled orphan list
    await page.route('**/api/v1/contactos?sinCliente=true', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: orphan1.id,
            nombre: 'Huerfano Count 1',
            cargo: 'Analista',
            telefono: '3100000001',
            email: orphan1.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
          {
            id: orphan2.id,
            nombre: 'Huerfano Count 2',
            cargo: 'Analista',
            telefono: '3100000002',
            email: orphan2.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // WHEN: User navigates and activates the filter
    await contactosPage.goto();
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('filtro-sin-cliente').click();

    // THEN: Count badge "contador-sin-cliente" is visible and shows the count
    await expect(page.getByTestId('contador-sin-cliente')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('contador-sin-cliente')).toContainText(/2/);
    await expect(page.getByTestId('contador-sin-cliente')).toContainText(/sin cliente/i);
  });

  // ---------------------------------------------------------------------------
  // AC#3 — EmptyState when all contacts have clients
  // ---------------------------------------------------------------------------

  test('AC#3 — debe mostrar EmptyState con mensaje específico cuando no hay contactos sin cliente', async ({ page }) => {
    // GIVEN: sinCliente=true returns empty array (no orphans exist)
    await page.route('**/api/v1/contactos?sinCliente=true', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // GIVEN: Normal list has contacts (so default EmptyState is not triggered)
    const assigned = await apiHelper.createContacto(
      buildContacto({ nombre: 'Contacto Con Cliente AC3' })
    );
    createdContactoIds.push(assigned.id);

    // WHEN: User navigates to /contactos and activates sinCliente filter
    await contactosPage.goto();
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('filtro-sin-cliente').click();

    // THEN: EmptyState with specific Spanish message is shown
    await expect(
      page.getByText('Todos los contactos tienen un cliente asignado')
    ).toBeVisible({ timeout: 5000 });
  });

  // ---------------------------------------------------------------------------
  // AC#4 — Deactivating the toggle restores the full contact list
  // ---------------------------------------------------------------------------

  test('AC#4 — debe restaurar la lista completa al desactivar el filtro "Sin cliente"', async ({ page }) => {
    // GIVEN: One orphan and one assigned contact
    const orphan = await apiHelper.createContacto(
      buildContacto({ nombre: 'Huerfano AC4 Restaurar' })
    );
    createdContactoIds.push(orphan.id);

    const clienteData = { nombre: `Cliente AC4 ${Date.now()}`, nit: `${Date.now()}`.slice(-9) };
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const assigned = await apiHelper.createContacto(
      buildContacto({ nombre: 'Asignado AC4 Restaurar' })
    );
    createdContactoIds.push(assigned.id);
    await apiHelper.asignarClienteAContacto(assigned.id, cliente.id);

    // GIVEN: Intercept sinCliente=true to return only orphan
    await page.route('**/api/v1/contactos?sinCliente=true', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: orphan.id,
            nombre: 'Huerfano AC4 Restaurar',
            cargo: 'Analista',
            telefono: '3100000001',
            email: orphan.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // WHEN: User navigates and activates the filter
    await contactosPage.goto();
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('filtro-sin-cliente').click();

    // Verify filter is active — assigned contact hidden
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Asignado AC4 Restaurar' })
    ).not.toBeVisible({ timeout: 5000 });

    // WHEN: User deactivates the toggle by clicking again
    await page.getByTestId('filtro-sin-cliente').click();

    // THEN: Full list is restored — both contacts visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Huerfano AC4 Restaurar' })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Asignado AC4 Restaurar' })
    ).toBeVisible({ timeout: 5000 });
  });

  // ---------------------------------------------------------------------------
  // AC#5 — Filter state reflected in URL as ?sinCliente=true
  // ---------------------------------------------------------------------------

  test('AC#5 — debe reflejar el estado del filtro en la URL como ?sinCliente=true', async ({ page }) => {
    // GIVEN: ContactoListView renders at /contactos (no sinCliente param)
    await page.route('**/api/v1/contactos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await contactosPage.goto();
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });

    // Verify URL does NOT have sinCliente initially
    expect(page.url()).not.toContain('sinCliente');

    // WHEN: User activates the filter
    await page.getByTestId('filtro-sin-cliente').click();

    // THEN: URL reflects sinCliente=true (deep-linking / FR29)
    await expect(page).toHaveURL(/sinCliente=true/, { timeout: 3000 });
  });

  test('AC#5 — debe eliminar ?sinCliente=true de la URL al desactivar el filtro', async ({ page }) => {
    // GIVEN: Filter is active (URL has ?sinCliente=true)
    await page.route('**/api/v1/contactos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/contactos?sinCliente=true');
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });

    // WHEN: User deactivates the filter
    await page.getByTestId('filtro-sin-cliente').click();

    // THEN: sinCliente is removed from the URL (clean URL)
    await expect(page).not.toHaveURL(/sinCliente=true/, { timeout: 3000 });
  });

  // ---------------------------------------------------------------------------
  // AC#6 — Navigating directly to /contactos?sinCliente=true pre-activates filter
  // ---------------------------------------------------------------------------

  test('AC#6 — debe pre-activar el filtro al navegar directamente a /contactos?sinCliente=true', async ({ page }) => {
    // GIVEN: Network-first intercept — intercept sinCliente=true BEFORE navigation
    const orphan = await apiHelper.createContacto(
      buildContacto({ nombre: 'Huerfano AC6 DeepLink' })
    );
    createdContactoIds.push(orphan.id);

    await page.route('**/api/v1/contactos?sinCliente=true', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: orphan.id,
            nombre: 'Huerfano AC6 DeepLink',
            cargo: 'Analista',
            telefono: '3100000001',
            email: orphan.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // WHEN: User navigates directly to /contactos?sinCliente=true
    await page.goto('/contactos?sinCliente=true');

    // THEN: Filter is pre-activated — toggle shows active state
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });

    // THEN: Only orphan contacts are shown (filter applied automatically)
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Huerfano AC6 DeepLink' })
    ).toBeVisible({ timeout: 5000 });
  });

  test('AC#6 — el filtro pre-activado vía URL tiene estado visual "activo"', async ({ page }) => {
    // GIVEN: Intercept before navigation
    await page.route('**/api/v1/contactos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: Direct navigation to /contactos?sinCliente=true
    await page.goto('/contactos?sinCliente=true');

    // THEN: filtro-sin-cliente toggle renders with active visual indication
    // (aria-pressed="true" or a specific active CSS class)
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });

    const toggle = page.getByTestId('filtro-sin-cliente');

    // Toggle should be in an "active" state — checked via aria-pressed or data attribute
    const isActive =
      (await toggle.getAttribute('aria-pressed')) === 'true' ||
      (await toggle.getAttribute('data-active')) === 'true' ||
      (await toggle.getAttribute('data-state')) === 'on';

    expect(isActive).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // AC#7 — Loading skeleton shown during fetch (not spinner)
  // ---------------------------------------------------------------------------

  test('AC#7 — debe mostrar skeleton de carga (no spinner) mientras se carga la lista', async ({ page }) => {
    // GIVEN: Network-first intercept that delays response
    await page.route('**/api/v1/contactos**', async (route) => {
      // Delay the response to ensure skeleton is captured
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Skeleton placeholder is shown (not a spinner)
    await expect(page.getByTestId('contactos-list-skeleton')).toBeVisible({ timeout: 2000 });

    // THEN: No spinner element visible
    await expect(page.getByRole('progressbar')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC#8 — ErrorPanel with "Reintentar" when backend unavailable
  // ---------------------------------------------------------------------------

  test('AC#8 — debe mostrar ErrorPanel con botón "Reintentar" cuando el backend falla', async ({ page }) => {
    // GIVEN: Network-first intercept — backend unavailable (500) before navigation
    await page.route('**/api/v1/contactos**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 500,
          title: 'Internal Server Error',
          detail: 'Service temporarily unavailable',
        }),
      });
    });

    // WHEN: User navigates to /contactos
    await contactosPage.goto();

    // THEN: ErrorPanel is shown (not a raw error message)
    await expect(page.getByTestId('contactos-error-panel')).toBeVisible({ timeout: 5000 });

    // THEN: "Reintentar" button is present
    await expect(page.getByTestId('contactos-retry-button')).toBeVisible();
    await expect(page.getByTestId('contactos-retry-button')).toContainText(/reintentar/i);
  });

  test('AC#8 — ErrorPanel con Reintentar también aplica cuando sinCliente fetch falla', async ({ page }) => {
    // GIVEN: All contactos requests fail with 500
    await page.route('**/api/v1/contactos**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      });
    });

    // WHEN: User navigates directly to /contactos?sinCliente=true
    await page.goto('/contactos?sinCliente=true');

    // THEN: ErrorPanel is shown, never a raw error
    await expect(page.getByTestId('contactos-error-panel')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('contactos-retry-button')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC#9 — Filter toggle is keyboard-accessible (WCAG 2.1 AA)
  // ---------------------------------------------------------------------------

  test('AC#9 — el toggle "Sin cliente" debe ser accesible por teclado (WCAG 2.1 AA)', async ({ page }) => {
    // GIVEN: Network-first intercept before navigation
    await page.route('**/api/v1/contactos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /contactos
    await contactosPage.goto();
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });

    // THEN: Toggle can receive keyboard focus via Tab
    await page.keyboard.press('Tab');

    // Navigate via Tab until filtro-sin-cliente is focused
    // Try up to 10 tabs to find the toggle
    let focused = false;
    for (let i = 0; i < 10; i++) {
      const focusedEl = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      if (focusedEl === 'filtro-sin-cliente') {
        focused = true;
        break;
      }
      await page.keyboard.press('Tab');
    }

    expect(focused).toBe(true);
  });

  test('AC#9 — el toggle "Sin cliente" se puede activar con Enter (accesibilidad de teclado)', async ({ page }) => {
    // GIVEN: Intercept before navigation
    let sinClienteCalled = false;
    await page.route('**/api/v1/contactos**', async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('sinCliente') === 'true') {
        sinClienteCalled = true;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await contactosPage.goto();
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });

    // WHEN: User focuses the toggle and presses Enter
    await page.getByTestId('filtro-sin-cliente').focus();
    await page.keyboard.press('Enter');

    // THEN: Filter is activated (URL changes or API is called with sinCliente=true)
    await expect(page).toHaveURL(/sinCliente=true/, { timeout: 3000 });
  });

  test('AC#9 — el toggle "Sin cliente" se puede activar con Space (accesibilidad de teclado)', async ({ page }) => {
    // GIVEN: Intercept before navigation
    await page.route('**/api/v1/contactos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await contactosPage.goto();
    await expect(page.getByTestId('filtro-sin-cliente')).toBeVisible({ timeout: 5000 });

    // WHEN: User focuses toggle and presses Space
    await page.getByTestId('filtro-sin-cliente').focus();
    await page.keyboard.press('Space');

    // THEN: Filter is activated
    await expect(page).toHaveURL(/sinCliente=true/, { timeout: 3000 });
  });
});
