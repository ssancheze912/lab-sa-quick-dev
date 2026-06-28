import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 3.3: Create Contact (RED phase)
 *
 * Tests fail until:
 *   - ContactoForm component renders with all four fields + data-testid attributes
 *   - "Nuevo contacto" button (data-testid="btn-nuevo-contacto") is wired in /contactos route
 *   - useCreateContacto mutation invalidates ['contactos'] query (FR27 — no page reload)
 *   - Toast "Contacto creado correctamente" is displayed on success
 *   - Inline validation errors appear on empty field submission (Zod client-side guard)
 *   - 409 conflict surfaces as inline error on Email field "El email ya está registrado"
 *
 * Test IDs:
 *   TC-E3-3-3-E2E-1 (P1) — Full create journey → toast + Nombre in list without page reload
 */

test.describe('Story 3.3 — Create Contact (E2E)', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1: "Nuevo contacto" button opens form with all four fields
  // ─────────────────────────────────────────────────────────────────────────

  test('AC-1: should open ContactoForm with four required fields when "Nuevo contacto" is clicked', async ({ page }) => {
    // GIVEN: CRITICAL — Intercept routes BEFORE navigation (network-first pattern)
    // Let the real API serve the contacts list
    await page.route('**/api/v1/contactos', (route) => route.continue());

    // GIVEN: User is on /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    // AND: "Nuevo contacto" button is visible
    await expect(page.getByTestId('btn-nuevo-contacto')).toBeVisible();

    // WHEN: User clicks "Nuevo contacto"
    await page.getByTestId('btn-nuevo-contacto').click();

    // THEN: ContactoForm opens
    await expect(page.getByTestId('contacto-form')).toBeVisible();

    // AND: All four required fields are visible (AC-1 / FR9)
    await expect(page.getByTestId('input-nombre')).toBeVisible();
    await expect(page.getByTestId('input-cargo')).toBeVisible();
    await expect(page.getByTestId('input-telefono')).toBeVisible();
    await expect(page.getByTestId('input-email')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-3-E2E-1 (P1) — Full create journey → toast + Nombre in list, no reload
  // Risk: R-002 (invalidateQueries FR27), R-010 (exact toast text)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-3-E2E-1: should show new contact Nombre in list immediately after creation without page reload', async ({ page }) => {
    const contactData = {
      nombre: 'María E2E López',
      cargo: 'Gerente Comercial',
      telefono: '3001234567',
      email: `e2e.create.${Date.now()}@empresa.co`,
    };

    // GIVEN: CRITICAL — Intercept POST BEFORE navigation (network-first pattern)
    // We use real backend for this P1 full-stack test.
    // The test verifies: form → POST → invalidateQueries(['contactos']) → list refetch (FR27 / R-002)

    // GIVEN: User is on /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    // AND: "Nuevo contacto" button is visible
    await expect(page.getByTestId('btn-nuevo-contacto')).toBeVisible();

    // WHEN: User clicks "Nuevo contacto"
    await page.getByTestId('btn-nuevo-contacto').click();

    // THEN: Form is visible with all four fields
    await expect(page.getByTestId('contacto-form')).toBeVisible();
    await expect(page.getByTestId('input-nombre')).toBeVisible();
    await expect(page.getByTestId('input-cargo')).toBeVisible();
    await expect(page.getByTestId('input-telefono')).toBeVisible();
    await expect(page.getByTestId('input-email')).toBeVisible();

    // WHEN: User fills all four required fields
    await page.getByTestId('input-nombre').fill(contactData.nombre);
    await page.getByTestId('input-cargo').fill(contactData.cargo);
    await page.getByTestId('input-telefono').fill(contactData.telefono);
    await page.getByTestId('input-email').fill(contactData.email);

    // WHEN: User clicks "Crear contacto"
    await page.getByTestId('btn-submit').click();

    // THEN: Success toast "Contacto creado correctamente" appears (R-010 exact text)
    await expect(page.getByText('Contacto creado correctamente')).toBeVisible({ timeout: 5000 });

    // AND: New contact Nombre appears in the list without page reload (FR27 / R-002)
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: contactData.nombre })
    ).toBeVisible({ timeout: 5000 });

    // Track for cleanup
    const createdContacto = await apiHelper.getContactos()
      .then((list: Array<{ id: string; nombre: string }>) =>
        list.find((c) => c.nombre === contactData.nombre)
      )
      .catch(() => null);
    if (createdContacto) createdIds.push(createdContacto.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3: Empty form submission shows inline validation errors, no POST sent
  // ─────────────────────────────────────────────────────────────────────────

  test('AC-3: should show inline validation errors and NOT call POST when form is submitted empty', async ({ page }) => {
    // GIVEN: CRITICAL — Intercept POST BEFORE navigation to assert it is never called
    let postCalled = false;
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User is on /contactos and opens the form
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');
    await page.getByTestId('btn-nuevo-contacto').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible();

    // WHEN: User clicks "Crear contacto" without filling any field
    await page.getByTestId('btn-submit').click();

    // THEN: At least one inline validation error appears (role="alert" — FR16)
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 3000 });

    // AND: POST to backend was NEVER called (Zod client-side guard)
    expect(postCalled).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC-4: 409 conflict → inline error on Email field "El email ya está registrado"
  // ─────────────────────────────────────────────────────────────────────────

  test('AC-4: should show "El email ya está registrado" inline error on Email field when backend returns 409', async ({ page }) => {
    // GIVEN: CRITICAL — Intercept POST BEFORE navigation, returning 409 for duplicate email
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflicto de datos',
            status: 409,
            detail: 'El email ya está registrado',
          }),
        });
      } else {
        route.continue();
      }
    });

    // GIVEN: User is on /contactos and opens the form
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');
    await page.getByTestId('btn-nuevo-contacto').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible();

    // WHEN: User fills all fields and submits (backend will return 409)
    await page.getByTestId('input-nombre').fill('María López');
    await page.getByTestId('input-cargo').fill('Gerente');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-email').fill('maria.lopez@empresa.co');
    await page.getByTestId('btn-submit').click();

    // THEN: Inline error "El email ya está registrado" is visible on Email field (NFR6 — no technical details)
    await expect(page.getByText('El email ya está registrado')).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Cancel button — E2E: form closes without creating contact
  // ─────────────────────────────────────────────────────────────────────────

  test('should close the form when "Cancelar" button is clicked without creating a contact', async ({ page }) => {
    // GIVEN: CRITICAL — Intercept POST BEFORE navigation (should not be called)
    let postCalled = false;
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User is on /contactos and opens the form
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');
    await page.getByTestId('btn-nuevo-contacto').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancel').click();

    // THEN: ContactoForm is no longer visible
    await expect(page.getByTestId('contacto-form')).not.toBeVisible({ timeout: 3000 });

    // AND: POST to backend was never called
    expect(postCalled).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1: "Nuevo contacto" button available on /contactos/:contactoId route
  // ─────────────────────────────────────────────────────────────────────────

  test('AC-1: should show "Nuevo contacto" button when a contact detail is open (contactos.$contactoId route)', async ({ page }) => {
    // GIVEN: A contact exists in the system
    const contacto = await apiHelper.createContacto({
      nombre: 'Contacto Para Detalle',
      cargo: 'Analista',
      telefono: '3101234567',
      email: `detalle.${Date.now()}@empresa.co`,
    });
    createdIds.push(contacto.id);

    // GIVEN: CRITICAL — Intercept routes BEFORE navigation (network-first)
    // No additional intercept needed — uses real API for navigation to /contactos/:id

    // WHEN: User navigates directly to the contact detail route
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}`);

    // THEN: "Nuevo contacto" button is still visible (available in detail route per AC-1)
    await expect(page.getByTestId('btn-nuevo-contacto')).toBeVisible({ timeout: 5000 });
  });
});
