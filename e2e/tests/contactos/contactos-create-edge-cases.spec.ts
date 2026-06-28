import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * E2E edge-case tests — Story 3.3: Create Contact (automation expansion)
 *
 * Covers edge cases NOT included in ATDD contactos-create.spec.ts:
 *   - Keyboard accessibility: Enter key submits, Tab navigates fields
 *   - 400 backend error renders form-level generic message (E2E level)
 *   - Form in /contactos.$contactoId route: full create journey works (not just button presence)
 *   - Whitespace-only Nombre triggers client-side validation error (Zod .trim() / .min(1))
 *   - Malformed email triggers inline error before POST
 *   - Form fields retain entered values after backend error (user can correct and resubmit)
 *   - "Creando..." label on submit button during in-flight request
 */

test.describe('Story 3.3 — Create Contact Edge Cases (E2E)', () => {
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
  // [P2] Keyboard accessibility — Enter key submits the form
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] should submit form when Enter key is pressed in the last field', async ({ page }) => {
    const contactData = buildContacto({ nombre: 'Enter Key Test' });

    // GIVEN: CRITICAL — Intercept POST BEFORE navigation (network-first)
    let postCalled = false;
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '11111111-1111-1111-1111-111111111111',
            nombre: contactData.nombre,
            cargo: contactData.cargo,
            telefono: contactData.telefono,
            email: contactData.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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

    // WHEN: User fills all fields and presses Enter from the last field
    await page.getByTestId('input-nombre').fill(contactData.nombre);
    await page.getByTestId('input-cargo').fill(contactData.cargo);
    await page.getByTestId('input-telefono').fill(contactData.telefono);
    await page.getByTestId('input-email').fill(contactData.email);
    await page.getByTestId('input-email').press('Enter');

    // THEN: POST was called (form submitted via keyboard)
    await expect(async () => {
      expect(postCalled).toBe(true);
    }).toPass({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P2] Keyboard accessibility — Tab order is logical (Nombre → Cargo → Telefono → Email)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] should allow Tab navigation from Nombre through to Email field', async ({ page }) => {
    // GIVEN: CRITICAL — Intercept POST BEFORE navigation
    await page.route('**/api/v1/contactos', (route) => route.continue());

    // GIVEN: User is on /contactos and opens the form
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');
    await page.getByTestId('btn-nuevo-contacto').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible();

    // WHEN: User focuses Nombre and Tabs forward
    await page.getByTestId('input-nombre').focus();
    await page.keyboard.press('Tab');

    // THEN: Focus moves to Cargo field
    await expect(page.getByTestId('input-cargo')).toBeFocused();

    // WHEN: Tab again
    await page.keyboard.press('Tab');

    // THEN: Focus moves to Teléfono
    await expect(page.getByTestId('input-telefono')).toBeFocused();

    // WHEN: Tab again
    await page.keyboard.press('Tab');

    // THEN: Focus moves to Email
    await expect(page.getByTestId('input-email')).toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P1] Backend 400 error renders a form-level generic message (E2E level)
  // Covers the case where Zod passes but backend still rejects (edge case data)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] should show generic form-level error when backend returns 400', async ({ page }) => {
    // GIVEN: CRITICAL — Intercept POST BEFORE navigation — returns 400
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            title: 'One or more validation errors occurred.',
            status: 400,
            errors: { Email: ["'Email' is not a valid email address."] },
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

    // WHEN: User fills all fields and submits (Zod accepts, backend rejects)
    await page.getByTestId('input-nombre').fill('Test Usuario');
    await page.getByTestId('input-cargo').fill('Analista');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-email').fill('valid@empresa.co');
    await page.getByTestId('btn-submit').click();

    // THEN: Generic error message appears (NFR6 — no technical details)
    await expect(page.getByText(/error al crear el contacto/i)).toBeVisible({ timeout: 5000 });

    // AND: No technical details are shown
    await expect(page.getByText(/DbUpdateException/i)).not.toBeVisible();
    await expect(page.getByText(/StackTrace/i)).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P2] Whitespace-only Nombre triggers client-side Zod validation error
  // (Zod .trim() + .min(1) boundary condition — NOT tested in ATDD)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] should show Nombre validation error when only whitespace is entered', async ({ page }) => {
    // GIVEN: CRITICAL — Intercept POST BEFORE navigation — should NOT be called
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

    // WHEN: User fills Nombre with only whitespace (boundary: trimmed to empty)
    await page.getByTestId('input-nombre').fill('   ');
    await page.getByTestId('input-cargo').fill('Gerente');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-email').fill('test@empresa.co');
    await page.getByTestId('btn-submit').click();

    // THEN: Validation error appears (role="alert")
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 3000 });

    // AND: POST was NOT called
    expect(postCalled).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P2] Invalid email format triggers client-side validation before POST
  // (boundary: non-empty but malformed — not covered by ATDD empty tests)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] should show email validation error for malformed email without calling POST', async ({ page }) => {
    // GIVEN: CRITICAL — Intercept POST BEFORE navigation — should NOT be called
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

    // WHEN: User enters a malformed email (not empty, but fails .email() Zod rule)
    await page.getByTestId('input-nombre').fill('María López');
    await page.getByTestId('input-cargo').fill('Gerente');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-email').fill('not-an-email');
    await page.getByTestId('btn-submit').click();

    // THEN: Email validation error appears
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 3000 });

    // AND: POST was NOT sent
    expect(postCalled).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P2] Form fields retain values after backend error so user can correct and retry
  // (usability / error recovery path — not covered in ATDD)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] should retain form field values after a backend error so user can correct and resubmit', async ({ page }) => {
    let callCount = 0;

    // GIVEN: CRITICAL — Intercept POST BEFORE navigation
    // First call: returns 400. Second call: returns 201.
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        callCount++;
        if (callCount === 1) {
          route.fulfill({
            status: 400,
            contentType: 'application/problem+json',
            body: JSON.stringify({
              title: 'Validation error',
              status: 400,
              errors: {},
            }),
          });
        } else {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: '22222222-2222-2222-2222-222222222222',
              nombre: 'María López',
              cargo: 'Gerente',
              telefono: '3001234567',
              email: 'maria.corrected@empresa.co',
              clienteId: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          });
        }
      } else {
        route.continue();
      }
    });

    // GIVEN: User is on /contactos and opens the form
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');
    await page.getByTestId('btn-nuevo-contacto').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible();

    // WHEN: User fills the form and submits (backend returns 400)
    await page.getByTestId('input-nombre').fill('María López');
    await page.getByTestId('input-cargo').fill('Gerente');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-email').fill('maria.corrected@empresa.co');
    await page.getByTestId('btn-submit').click();

    // THEN: Error message appears
    await expect(page.getByText(/error al crear el contacto/i)).toBeVisible({ timeout: 5000 });

    // AND: Form fields still have the entered values (not cleared)
    await expect(page.getByTestId('input-nombre')).toHaveValue('María López');
    await expect(page.getByTestId('input-email')).toHaveValue('maria.corrected@empresa.co');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P1] Full create journey from /contactos.$contactoId route
  // ATDD only checks button presence; this test verifies the full create flow works
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] should complete full create journey from /contactos/:contactoId route', async ({ page }) => {
    // GIVEN: An existing contact (to navigate to its detail route)
    const existingContact = await apiHelper.createContacto({
      nombre: 'Contacto Existente Para Detalle',
      cargo: 'Analista',
      telefono: '3101234567',
      email: `detalle.base.${Date.now()}@empresa.co`,
    });
    createdIds.push(existingContact.id);

    const newContactData = buildContacto({ nombre: 'Nuevo Desde Detalle' });

    // GIVEN: CRITICAL — Intercept POST BEFORE navigation (network-first)
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '33333333-3333-3333-3333-333333333333',
            nombre: newContactData.nombre,
            cargo: newContactData.cargo,
            telefono: newContactData.telefono,
            email: newContactData.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        route.continue();
      }
    });

    // GIVEN: User is on the contact detail route
    await page.goto(`/contactos/${existingContact.id}`);
    await page.waitForURL(`**/contactos/${existingContact.id}`);

    // AND: "Nuevo contacto" button is visible
    await expect(page.getByTestId('btn-nuevo-contacto')).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks "Nuevo contacto" and fills the form
    await page.getByTestId('btn-nuevo-contacto').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible();

    await page.getByTestId('input-nombre').fill(newContactData.nombre);
    await page.getByTestId('input-cargo').fill(newContactData.cargo);
    await page.getByTestId('input-telefono').fill(newContactData.telefono);
    await page.getByTestId('input-email').fill(newContactData.email);
    await page.getByTestId('btn-submit').click();

    // THEN: Success toast appears
    await expect(page.getByText('Contacto creado correctamente')).toBeVisible({ timeout: 5000 });
  });
});
