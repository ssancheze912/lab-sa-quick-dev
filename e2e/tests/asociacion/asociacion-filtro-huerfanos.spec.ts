import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * ATDD — Story 4.5: Orphan Contacts Filter
 * E2E Tests — RED Phase
 *
 * Tests are intentionally failing until implementation is complete.
 *
 * Coverage:
 *   E2E-AC-16  P0  — "Sin cliente" filter shows only contacts with clienteId = null (AC1, FR25)
 *   E2E-AC-17  P0  — Orphan contact count badge is visible and correct when filter is active (AC1)
 *   E2E-AC-18  P1  — EmptyState shown when all contacts have a client and filter is active (AC2)
 *   E2E-AC-19  P1  — Deactivating "Sin cliente" filter restores the full contact list (AC3)
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.5 — E2E: Orphan Contacts Filter ("Sin cliente")', () => {
  let apiHelper: ApiHelper;
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdContactoIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    for (const id of createdClienteIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdContactoIds.length = 0;
    createdClienteIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-16 (P0 · AC1)
  // Given 2 contacts with a client AND 2 orphan contacts (clienteId = null) exist
  // When the user navigates to /contactos and clicks the "Sin cliente" filter toggle
  // Then the contact list shows ONLY the 2 orphan contacts
  //   AND the rows contain only the orphan contacts' nombres
  // ---------------------------------------------------------------------------
  test('E2E-AC-16 — "Sin cliente" filter muestra solo contactos con clienteId null', async ({ page }) => {
    // Capture JS errors during the test
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create a client to associate 2 contacts with
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    // Create 2 contacts WITH a client (should be hidden when filter active)
    const contactoConCliente1 = await apiHelper.createContacto(
      buildContacto({ nombre: `Con Cliente E2E-16 A`, clienteId: cliente.id })
    );
    createdContactoIds.push(contactoConCliente1.id);

    const contactoConCliente2 = await apiHelper.createContacto(
      buildContacto({ nombre: `Con Cliente E2E-16 B`, clienteId: cliente.id })
    );
    createdContactoIds.push(contactoConCliente2.id);

    // Create 2 orphan contacts (clienteId = null) — should be visible when filter active
    const huerfano1 = await apiHelper.createContacto(
      buildContacto({ nombre: `Huerfano E2E-16 A`, clienteId: null })
    );
    createdContactoIds.push(huerfano1.id);

    const huerfano2 = await apiHelper.createContacto(
      buildContacto({ nombre: `Huerfano E2E-16 B`, clienteId: null })
    );
    createdContactoIds.push(huerfano2.id);

    // Network-first: intercept before navigation
    await page.route('**/api/v1/contactos**', (route) => route.continue());

    // WHEN — Navigate to /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // AND — "Sin cliente" toggle is visible
    const filtroSinCliente = page.getByTestId('filtro-sin-cliente');
    await expect(filtroSinCliente).toBeVisible();

    // AND — Click the "Sin cliente" toggle to activate the filter
    await filtroSinCliente.click();

    // THEN — Only the 2 orphan contacts are displayed
    const contactoRows = page.getByTestId('contacto-row');
    await expect(contactoRows).toHaveCount(2);

    // AND — Rows contain only the orphan contacts' nombres
    await expect(page.getByTestId('contacto-row').filter({ hasText: huerfano1.nombre })).toBeVisible();
    await expect(page.getByTestId('contacto-row').filter({ hasText: huerfano2.nombre })).toBeVisible();

    // AND — Contacts with client are NOT visible
    await expect(page.getByTestId('contacto-row').filter({ hasText: contactoConCliente1.nombre })).toHaveCount(0);
    await expect(page.getByTestId('contacto-row').filter({ hasText: contactoConCliente2.nombre })).toHaveCount(0);

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-17 (P0 · AC1)
  // Given 2 contacts with a client AND 2 orphan contacts exist
  // When the user activates the "Sin cliente" filter
  // Then the orphan count badge is visible and matches "2 sin cliente"
  // ---------------------------------------------------------------------------
  test('E2E-AC-17 — Contador de contactos sin cliente es visible y correcto cuando el filtro está activo', async ({ page }) => {
    // Capture JS errors during the test
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create a client to associate 2 contacts with
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    // Create 2 contacts WITH a client
    const contactoConCliente1 = await apiHelper.createContacto(
      buildContacto({ nombre: `Con Cliente E2E-17 A`, clienteId: cliente.id })
    );
    createdContactoIds.push(contactoConCliente1.id);

    const contactoConCliente2 = await apiHelper.createContacto(
      buildContacto({ nombre: `Con Cliente E2E-17 B`, clienteId: cliente.id })
    );
    createdContactoIds.push(contactoConCliente2.id);

    // Create 2 orphan contacts (clienteId = null)
    const huerfano1 = await apiHelper.createContacto(
      buildContacto({ nombre: `Huerfano E2E-17 A`, clienteId: null })
    );
    createdContactoIds.push(huerfano1.id);

    const huerfano2 = await apiHelper.createContacto(
      buildContacto({ nombre: `Huerfano E2E-17 B`, clienteId: null })
    );
    createdContactoIds.push(huerfano2.id);

    // Network-first: intercept before navigation
    await page.route('**/api/v1/contactos**', (route) => route.continue());

    // WHEN — Navigate to /contactos and activate the filter
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    const filtroSinCliente = page.getByTestId('filtro-sin-cliente');
    await expect(filtroSinCliente).toBeVisible();
    await filtroSinCliente.click();

    // THEN — The orphan count badge is visible
    const orphanCount = page.getByTestId('orphan-count');
    await expect(orphanCount).toBeVisible();

    // AND — The count matches "2 sin cliente"
    await expect(orphanCount).toHaveText(/2 sin cliente/i);

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-18 (P1 · AC2)
  // Given all contacts have a client assigned (no orphans)
  // When the user navigates to /contactos and activates the "Sin cliente" filter
  // Then an EmptyState is displayed with title "Todos los contactos tienen cliente"
  // ---------------------------------------------------------------------------
  test('E2E-AC-18 — EmptyState aparece cuando todos los contactos tienen cliente y el filtro está activo', async ({ page }) => {
    // Capture JS errors during the test
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create a client and 2 contacts ALL with a client (no orphans)
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const contacto1 = await apiHelper.createContacto(
      buildContacto({ nombre: `Con Cliente E2E-18 A`, clienteId: cliente.id })
    );
    createdContactoIds.push(contacto1.id);

    const contacto2 = await apiHelper.createContacto(
      buildContacto({ nombre: `Con Cliente E2E-18 B`, clienteId: cliente.id })
    );
    createdContactoIds.push(contacto2.id);

    // Network-first: intercept before navigation
    await page.route('**/api/v1/contactos**', (route) => route.continue());

    // WHEN — Navigate to /contactos and activate the "Sin cliente" filter
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    const filtroSinCliente = page.getByTestId('filtro-sin-cliente');
    await expect(filtroSinCliente).toBeVisible();
    await filtroSinCliente.click();

    // THEN — EmptyState is visible with the correct message
    await expect(page.getByText(/todos los contactos tienen cliente/i)).toBeVisible();

    // AND — No contacto rows are visible
    await expect(page.getByTestId('contacto-row')).toHaveCount(0);

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-19 (P1 · AC3)
  // Given 2 contacts with a client AND 2 orphan contacts exist, and the filter is active
  // When the user deactivates the "Sin cliente" filter
  // Then all 4 contacts are visible in the list again
  // ---------------------------------------------------------------------------
  test('E2E-AC-19 — Desactivar el filtro "Sin cliente" restaura la lista completa de contactos', async ({ page }) => {
    // Capture JS errors during the test
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create a client to associate 2 contacts with
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    // Create 2 contacts WITH a client
    const contactoConCliente1 = await apiHelper.createContacto(
      buildContacto({ nombre: `Con Cliente E2E-19 A`, clienteId: cliente.id })
    );
    createdContactoIds.push(contactoConCliente1.id);

    const contactoConCliente2 = await apiHelper.createContacto(
      buildContacto({ nombre: `Con Cliente E2E-19 B`, clienteId: cliente.id })
    );
    createdContactoIds.push(contactoConCliente2.id);

    // Create 2 orphan contacts (clienteId = null)
    const huerfano1 = await apiHelper.createContacto(
      buildContacto({ nombre: `Huerfano E2E-19 A`, clienteId: null })
    );
    createdContactoIds.push(huerfano1.id);

    const huerfano2 = await apiHelper.createContacto(
      buildContacto({ nombre: `Huerfano E2E-19 B`, clienteId: null })
    );
    createdContactoIds.push(huerfano2.id);

    // Network-first: intercept before navigation
    await page.route('**/api/v1/contactos**', (route) => route.continue());

    // WHEN — Navigate to /contactos and activate the filter
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    const filtroSinCliente = page.getByTestId('filtro-sin-cliente');
    await expect(filtroSinCliente).toBeVisible();

    // Activate the filter (click 1)
    await filtroSinCliente.click();

    // Verify filter is active (only 2 orphan contacts visible)
    await expect(page.getByTestId('contacto-row')).toHaveCount(2);

    // AND — Deactivate the filter (click 2)
    await filtroSinCliente.click();

    // THEN — All 4 contacts are visible again
    const contactoRows = page.getByTestId('contacto-row');
    await expect(contactoRows).toHaveCount(4);

    // AND — All contacts are present regardless of clienteId
    await expect(page.getByTestId('contacto-row').filter({ hasText: contactoConCliente1.nombre })).toBeVisible();
    await expect(page.getByTestId('contacto-row').filter({ hasText: contactoConCliente2.nombre })).toBeVisible();
    await expect(page.getByTestId('contacto-row').filter({ hasText: huerfano1.nombre })).toBeVisible();
    await expect(page.getByTestId('contacto-row').filter({ hasText: huerfano2.nombre })).toBeVisible();

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });
});
