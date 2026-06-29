/**
 * E2E Acceptance Tests — Create Contact (Story 3.3)
 * RED phase — ContactoForm.tsx and POST /api/v1/contactos endpoint do not exist yet.
 *
 * Acceptance Criteria covered:
 *   AC-1  Clicking "Nuevo contacto" opens form with fields: Nombre, Cargo, Teléfono, Email
 *   AC-2  Submitting valid form → POST /api/v1/contactos → new contact in list + success toast
 *   AC-3  Submitting empty fields → inline validation errors, form NOT submitted (Zod)
 *   AC-4  Invalid email → inline error "El email no tiene un formato válido", form NOT submitted
 *   AC-5  Backend returns 400 → error shown without stack trace
 *   AC-6  Clicking "Cancelar" closes form without mutation
 *   AC-7  onSuccess fires → queryClient.invalidateQueries(['contactos']) → list re-fetches
 *
 * Network-first: all page.route() intercepts MUST be set before page.goto() / navigation.
 *
 * Given-When-Then format per test.
 */

import { test, expect } from '@playwright/test';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

const API_BASE = 'http://localhost:5000';
const CONTACTOS_API = `${API_BASE}/api/v1/contactos`;

test.describe('Story 3.3 — Create Contact', () => {
  let contactosPage: ContactosPage;
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    contactosPage = new ContactosPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // AC-1: Clicking "Nuevo contacto" opens form with all 4 required fields
  // ---------------------------------------------------------------------------

  test('AC-1: should open form with Nombre, Cargo, Teléfono, Email fields when "Nuevo contacto" is clicked', async ({ page }) => {
    // GIVEN: User is on /contactos view (network-first: intercept before navigate)
    await page.route(`${CONTACTOS_API}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await contactosPage.goto();

    // WHEN: User clicks "Nuevo contacto"
    await contactosPage.btnNuevoContacto.click();

    // THEN: Form opens with all 4 input fields visible
    await expect(contactosPage.form).toBeVisible();
    await expect(contactosPage.inputNombre).toBeVisible();
    await expect(contactosPage.inputCargo).toBeVisible();
    await expect(contactosPage.inputTelefono).toBeVisible();
    await expect(contactosPage.inputEmail).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC-2: Fill all fields, submit → POST, list updated, toast shown
  // ---------------------------------------------------------------------------

  test('AC-2: should create contact via POST, show toast "Contacto creado correctamente", and display new contact in list', async ({ page }) => {
    // GIVEN: Prepare test data
    const newContacto = buildContacto();
    const createdDto = {
      id: '00000000-0000-0000-0000-000000000099',
      nombre: newContacto.nombre,
      cargo: newContacto.cargo,
      telefono: newContacto.telefono,
      email: newContacto.email,
      clienteId: null,
      createdAt: '2026-06-29T10:00:00Z',
    };

    // GIVEN: Network-first — intercept before navigation
    await page.route(`${CONTACTOS_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdDto),
        });
      } else {
        await route.continue();
      }
    });

    await contactosPage.goto();

    // WHEN: User opens form, fills all 4 fields, and clicks "Guardar"
    await contactosPage.abrirFormularioNuevo();
    await contactosPage.llenarFormulario(newContacto);

    // Re-route GET to return the new contact (simulates cache invalidation + re-fetch)
    await page.route(`${CONTACTOS_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([createdDto]),
        });
      } else {
        await route.continue();
      }
    });

    await contactosPage.btnGuardar.click();

    // THEN: Success toast is shown
    await expect(
      page.getByText(/contacto creado correctamente/i)
    ).toBeVisible();

    // THEN: Form closes after successful submit
    await expect(contactosPage.form).toBeHidden();

    // THEN: New contact appears in the list
    await expect(
      contactosPage.contactoRows.filter({ hasText: newContacto.nombre })
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC-3: Empty fields → inline errors, form NOT submitted to backend
  // ---------------------------------------------------------------------------

  test('AC-3: should show inline validation errors when submitting empty form and NOT call POST', async ({ page }) => {
    // GIVEN: Network-first intercept — POST would fail the test if called
    let postWasCalled = false;

    await page.route(`${CONTACTOS_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (route.request().method() === 'POST') {
        postWasCalled = true;
        await route.fulfill({ status: 201, body: '{}' });
      } else {
        await route.continue();
      }
    });

    await contactosPage.goto();

    // WHEN: User opens form and clicks "Guardar" without filling any field
    await contactosPage.abrirFormularioNuevo();
    await contactosPage.btnGuardar.click();

    // THEN: Form remains open (not submitted)
    await expect(contactosPage.form).toBeVisible();

    // THEN: At least one inline validation error is visible
    await expect(
      page.getByText(/requerido|obligatorio|campo requerido/i).first()
    ).toBeVisible();

    // THEN: POST was NOT called (Zod blocked submission)
    expect(postWasCalled).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // AC-4: Invalid email → "El email no tiene un formato válido", form NOT submitted
  // ---------------------------------------------------------------------------

  test('AC-4: should show email format error and NOT call POST when email is invalid', async ({ page }) => {
    // GIVEN: Network-first intercept — POST would fail the test if called
    let postWasCalled = false;

    await page.route(`${CONTACTOS_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (route.request().method() === 'POST') {
        postWasCalled = true;
        await route.fulfill({ status: 201, body: '{}' });
      } else {
        await route.continue();
      }
    });

    await contactosPage.goto();

    // WHEN: User opens form, fills all fields but with invalid email, and submits
    await contactosPage.abrirFormularioNuevo();
    await contactosPage.llenarFormulario({
      nombre: 'Juan Pérez',
      cargo: 'Analista',
      telefono: '3101234567',
      email: 'no-es-un-email-valido',
    });
    await contactosPage.btnGuardar.click();

    // THEN: Inline email error message is visible
    await expect(
      page.getByText(/el email no tiene un formato válido/i)
    ).toBeVisible();

    // THEN: Form remains open (not submitted)
    await expect(contactosPage.form).toBeVisible();

    // THEN: POST was NOT called
    expect(postWasCalled).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // AC-5: Backend returns 400 → error shown without stack trace
  // ---------------------------------------------------------------------------

  test('AC-5: should display error message without stack trace when backend returns 400', async ({ page }) => {
    // GIVEN: Network-first — intercept POST to return 400 Validation Error
    const validContacto = buildContacto();

    await page.route(`${CONTACTOS_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            status: 400,
            title: 'Validation Error',
            errors: {
              email: ['The Email field is not a valid email address.'],
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await contactosPage.goto();

    // WHEN: User fills form and submits — backend returns 400
    await contactosPage.abrirFormularioNuevo();
    await contactosPage.llenarFormulario(validContacto);
    await contactosPage.btnGuardar.click();

    // THEN: An error message is displayed (generic, no technical details)
    await expect(
      page.getByText(/error al crear el contacto/i)
    ).toBeVisible();

    // THEN: No stack trace or technical details shown in UI (NFR6)
    await expect(page.getByText(/stackTrace/i)).not.toBeVisible();
    await expect(page.getByText(/innerException/i)).not.toBeVisible();
    await expect(page.getByText(/exception/i)).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC-6: Clicking "Cancelar" closes form without any mutation
  // ---------------------------------------------------------------------------

  test('AC-6: should close form without POST when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Network-first — POST would fail the test if called
    let postWasCalled = false;

    await page.route(`${CONTACTOS_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (route.request().method() === 'POST') {
        postWasCalled = true;
        await route.fulfill({ status: 201, body: '{}' });
      } else {
        await route.continue();
      }
    });

    await contactosPage.goto();

    // WHEN: User opens form, partially fills it, then clicks "Cancelar"
    await contactosPage.abrirFormularioNuevo();
    await contactosPage.inputNombre.fill('Contacto Parcial');

    await contactosPage.btnCancelar.click();

    // THEN: Form closes
    await expect(contactosPage.form).toBeHidden();

    // THEN: POST was NOT called
    expect(postWasCalled).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // AC-7: After successful create, list re-fetches (cache invalidation via GET)
  // ---------------------------------------------------------------------------

  test('AC-7: should re-fetch contact list after successful creation (cache invalidation)', async ({ page }) => {
    // GIVEN: Network-first — track number of GET calls to verify re-fetch
    const newContacto = buildContacto();
    const createdDto = {
      id: '00000000-0000-0000-0000-000000000099',
      nombre: newContacto.nombre,
      cargo: newContacto.cargo,
      telefono: newContacto.telefono,
      email: newContacto.email,
      clienteId: null,
      createdAt: '2026-06-29T10:00:00Z',
    };

    let getCallCount = 0;

    await page.route(`${CONTACTOS_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        getCallCount++;
        if (getCallCount === 1) {
          // First GET: empty list on initial load
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        } else {
          // Subsequent GETs (after invalidation): return the new contact
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([createdDto]),
          });
        }
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdDto),
        });
      } else {
        await route.continue();
      }
    });

    await contactosPage.goto();

    // WHEN: User creates a new contact
    await contactosPage.abrirFormularioNuevo();
    await contactosPage.llenarFormulario(newContacto);
    await contactosPage.btnGuardar.click();

    // THEN: GET is called at least twice (initial + re-fetch after invalidation)
    await expect(
      contactosPage.contactoRows.filter({ hasText: newContacto.nombre })
    ).toBeVisible();

    expect(getCallCount).toBeGreaterThanOrEqual(2);
  });
});
