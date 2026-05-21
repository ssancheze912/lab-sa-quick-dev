import { test, expect } from '@playwright/test';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * Edge-case expansion for Story 3.3: Create Contact
 * BMad-Integrated: covers paths not in the 7 GREEN ATDD tests (E2E-CT-11..E2E-CT-17).
 *
 * E2E Edge Cases:
 *   E2E-CT-EC-01  P1  AC1   — "Guardar" button is disabled and shows "Guardando..." while POST is in-flight
 *   E2E-CT-EC-02  P1  AC1   — "Cancelar" closes dialog without firing POST
 *   E2E-CT-EC-03  P1  AC3   — Inline errors disappear after filling fields and re-submitting
 *   E2E-CT-EC-04  P1  AC4   — Backend 400 shows generic error, dialog stays open (NFR6)
 *   E2E-CT-EC-05  P1  AC1   — Dialog title "Nuevo contacto" is visible when open
 *   E2E-CT-EC-06  P1  AC2   — Form fields reset after successful create (dialog can reopen clean)
 *   E2E-CT-EC-07  P2  AC3   — Submitting with only whitespace in nombre shows required error
 *
 * API Edge Cases:
 *   API-CT-EC-01  P0  AC3   — POST empty body {} → 400 Problem Details (no stackTrace)
 *   API-CT-EC-02  P0  AC3   — POST missing telefono → 400 Problem Details
 *   API-CT-EC-03  P1  AC2   — POST with extra unknown fields → 201 (server ignores extras)
 *   API-CT-EC-04  P1  AC2   — POST successful response Content-Type is application/json
 *   API-CT-EC-05  P1  AC4   — POST telefono at 51 chars → 400 (max 50) without stackTrace
 *   API-CT-EC-06  P1  AC4   — POST nombre at 201 chars → 400 (max 200) without stackTrace
 *   API-CT-EC-07  P1  AC4   — Second POST with same email but valid data → 201 (email not unique at backend level)
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// E2E Edge Cases
// ---------------------------------------------------------------------------

test.describe('Story 3.3 — Edge Cases E2E: Crear contacto', () => {
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

  // -------------------------------------------------------------------------
  // E2E-CT-EC-01 (P1 · AC1)
  // Given the user fills all required fields
  // When the user clicks "Guardar"
  // Then while the POST request is in-flight, the "Guardar" button is disabled
  //   AND shows "Guardando..." to prevent double-submission
  // -------------------------------------------------------------------------
  test('E2E-CT-EC-01 — btn-guardar está deshabilitado y muestra "Guardando..." durante el envío', async ({ page }) => {
    // GIVEN — intercept POST and pause it to observe loading state
    let resolvePost!: () => void;
    await page.route('**/api/v1/contactos', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise<void>((resolve) => { resolvePost = resolve; });
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await contactosPage.goto();

    const data = buildContacto({ nombre: 'Contacto Loading E2E-CT-EC-01' });
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-cargo').fill(data.cargo);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-email').fill(data.email);

    // WHEN — click "Guardar" without waiting for completion
    await page.getByTestId('btn-guardar').click();

    // THEN — button is disabled while POST is pending
    await expect(page.getByTestId('btn-guardar')).toBeDisabled();
    await expect(page.getByTestId('btn-guardar')).toHaveText('Guardando...');

    // Resume the POST and wait for dialog to close
    resolvePost();
    await expect(contactosPage.form).toBeHidden({ timeout: 5000 });

    // Cleanup
    const contactos = await apiHelper.getContactos();
    const created = contactos.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-EC-02 (P1 · AC1)
  // Given the user opens the form and partially fills it
  // When the user clicks "Cancelar"
  // Then the dialog closes without sending a POST request
  //   AND no contact is created in the backend
  // -------------------------------------------------------------------------
  test('E2E-CT-EC-02 — "Cancelar" cierra el formulario sin disparar POST', async ({ page }) => {
    // GIVEN — intercept to detect any unwanted POST
    let postFired = false;
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        postFired = true;
        route.abort();
      } else {
        route.continue();
      }
    });

    await contactosPage.goto();

    // WHEN — user opens form, partially fills it
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill('Contacto Cancelado EC-02');

    // AND — clicks Cancelar
    await page.getByTestId('btn-cancelar').click();

    // THEN — dialog closes
    await expect(contactosPage.form).toBeHidden();

    // AND — no POST was fired
    expect(postFired).toBe(false);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-EC-03 (P1 · AC3)
  // Given the user submits an empty form (errors shown),
  // When the user fills in all required fields and submits again
  // Then the inline errors disappear and the form submits successfully
  // -------------------------------------------------------------------------
  test('E2E-CT-EC-03 — errores inline desaparecen al rellenar los campos y reenviar', async ({ page }) => {
    // GIVEN — allow POST to continue
    await page.route('**/api/v1/contactos', (route) => route.continue());
    await contactosPage.goto();

    const data = buildContacto({ nombre: 'Contacto Corrige EC-03' });

    // WHEN — submit empty form first to trigger errors
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();
    await page.getByTestId('btn-guardar').click();

    // THEN — at least one error is visible
    await expect(page.getByTestId('error-nombre')).toBeVisible();

    // WHEN — fill all required fields and resubmit
    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-cargo').fill(data.cargo);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-email').fill(data.email);
    await page.getByTestId('btn-guardar').click();

    // THEN — dialog closes (submission succeeded, no errors)
    await expect(contactosPage.form).toBeHidden();

    // Cleanup
    const contactos = await apiHelper.getContactos();
    const created = contactos.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-EC-04 (P1 · AC4)
  // Given the backend returns a 400 validation error
  // When the form is submitted
  // Then a generic user-friendly error message is displayed (NFR6)
  //   AND the dialog remains open (user can correct the data)
  //   AND no technical details (stack trace, error codes) are shown
  // -------------------------------------------------------------------------
  test('E2E-CT-EC-04 — error 400 del backend muestra mensaje genérico sin detalles técnicos, formulario permanece abierto', async ({ page }) => {
    // GIVEN — intercept POST and return a 400 with Problem Details
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Validation Error',
            status: 400,
            errors: {
              Nombre: ['El nombre es requerido'],
            },
          }),
        });
      } else {
        route.continue();
      }
    });

    await contactosPage.goto();

    const data = buildContacto({ nombre: 'Contacto 400 EC-04' });
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-cargo').fill(data.cargo);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-email').fill(data.email);
    await page.getByTestId('btn-guardar').click();

    // THEN — dialog remains open
    await expect(contactosPage.form).toBeVisible();

    // AND — a generic error message is visible (no stack trace shown to user)
    await expect(
      page.getByText(/no se pudo crear el contacto|intenta nuevamente/i)
    ).toBeVisible();

    // AND — no technical error details are visible
    await expect(page.getByText(/stackTrace|StackTrace|stack_trace/i)).not.toBeVisible();
    await expect(page.getByText(/System\.|Microsoft\./i)).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-CT-EC-05 (P1 · AC1)
  // Given the dialog opens
  // When the user views the dialog
  // Then the dialog title "Nuevo contacto" is visible
  // -------------------------------------------------------------------------
  test('E2E-CT-EC-05 — el título "Nuevo contacto" es visible en el formulario abierto', async ({ page }) => {
    // GIVEN
    await page.route('**/api/v1/contactos', (route) => route.continue());
    await contactosPage.goto();

    // WHEN — user opens the form
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    // THEN — dialog title is visible
    await expect(page.getByText('Nuevo contacto')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-CT-EC-06 (P1 · AC2)
  // Given a successful create that closes the dialog
  // When the user clicks "Nuevo contacto" again
  // Then the form opens with all fields empty (form was reset after success)
  // -------------------------------------------------------------------------
  test('E2E-CT-EC-06 — el formulario se abre limpio al reabrirse después de una creación exitosa', async ({ page }) => {
    // GIVEN — allow POST to continue
    await page.route('**/api/v1/contactos', (route) => route.continue());
    await contactosPage.goto();

    const data = buildContacto({ nombre: 'Contacto Reopen EC-06' });

    // WHEN — create a contact successfully
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();
    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-cargo').fill(data.cargo);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-email').fill(data.email);
    await page.getByTestId('btn-guardar').click();

    // Wait for dialog to close
    await expect(contactosPage.form).toBeHidden();

    // WHEN — reopen the form
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    // THEN — all fields are empty (form was reset)
    await expect(page.getByTestId('input-nombre')).toHaveValue('');
    await expect(page.getByTestId('input-cargo')).toHaveValue('');
    await expect(page.getByTestId('input-telefono')).toHaveValue('');
    await expect(page.getByTestId('input-email')).toHaveValue('');

    // Close dialog
    await page.getByTestId('btn-cancelar').click();

    // Cleanup
    const contactos = await apiHelper.getContactos();
    const created = contactos.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-EC-07 (P2 · AC3)
  // Note: Zod min(1) does NOT reject whitespace-only strings. Backend FluentValidation
  // does reject them (NotEmpty). This test documents the frontend behavior gap.
  // Marked as fixme: frontend schema should add .trim() to enforce empty-after-trim.
  // -------------------------------------------------------------------------
  test.fixme('E2E-CT-EC-07 — nombre con solo espacios muestra error de validación (requiere schema .trim())', async ({ page }) => {
    // FIXME: contactoSchema uses z.string().min(1) which allows whitespace-only strings
    // at frontend level (space characters count as length 1+). To fix this, the schema
    // needs z.string().trim().min(1) — this would be a Story 3.3 follow-up schema change.
    let postFired = false;
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        postFired = true;
        route.abort();
      } else {
        route.continue();
      }
    });

    await contactosPage.goto();
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill('   ');
    await page.getByTestId('input-cargo').fill('Analista');
    await page.getByTestId('input-telefono').fill('3100000000');
    await page.getByTestId('input-email').fill('test@empresa.com');
    await page.getByTestId('btn-guardar').click();

    // THEN — nombre error visible (requires .trim().min(1) in schema)
    await expect(page.getByTestId('error-nombre')).toBeVisible();
    expect(postFired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// API Integration Edge Cases
// ---------------------------------------------------------------------------

test.describe('Story 3.3 — Edge Cases API: POST /api/v1/contactos', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/contactos/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // -------------------------------------------------------------------------
  // API-CT-EC-01 (P0 · AC3)
  // POST with empty body {} → 400 Bad Request + Problem Details (all required fields missing)
  // -------------------------------------------------------------------------
  test('API-CT-EC-01 — POST con body vacío devuelve 400 + Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — empty body
    const response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {},
    });

    // THEN — 400 Bad Request
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(body.status).toBe(400);
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);

    // AND — no stack trace exposed (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).stack_trace).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-CT-EC-02 (P0 · AC3)
  // POST missing telefono field → 400 Bad Request + Problem Details
  // -------------------------------------------------------------------------
  test('API-CT-EC-02 — POST sin telefono devuelve 400 + Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — payload missing telefono
    const response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'María García EC-02',
        cargo: 'Analista',
        // telefono intentionally omitted
        email: 'm.garcia.ec02@empresa.com',
      },
    });

    // THEN — 400 Bad Request
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(body.status).toBe(400);

    // AND — no stack trace
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).stack_trace).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-CT-EC-03 (P1 · AC2)
  // POST with extra unknown fields → 201 (server must ignore extra properties)
  // Boundary: robustness — extra fields should not cause 400 or 500
  // -------------------------------------------------------------------------
  test('API-CT-EC-03 — POST con campos adicionales desconocidos devuelve 201 (server ignora extras)', async ({ request }) => {
    // GIVEN — payload with all required fields plus extra unknown ones
    const response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto Extra Fields EC-03',
        cargo: 'Analista',
        telefono: '+57 310 999 0001',
        email: `extra.fields.ec03.${Date.now()}@empresa.com`,
        unknownField: 'should-be-ignored',
        clienteId: '550e8400-e29b-41d4-a716-446655440001', // should be ignored — Epic 3 scope
        createdAt: '2020-01-01T00:00:00Z',                  // should be ignored
      },
    });

    // THEN — server accepts request and ignores extra fields
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(typeof body.id).toBe('string');

    // AND — extra fields must NOT appear in response
    expect(body.unknownField).toBeUndefined();

    // AND — clienteId must be null (server does not accept it from input in Epic 3)
    expect(body.clienteId).toBeNull();

    createdIds.push(body.id);
  });

  // -------------------------------------------------------------------------
  // API-CT-EC-04 (P1 · AC2)
  // POST successful response Content-Type is application/json (not problem+json)
  // -------------------------------------------------------------------------
  test('API-CT-EC-04 — POST exitoso devuelve Content-Type application/json (no problem+json)', async ({ request }) => {
    // GIVEN — valid payload
    const response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto ContentType EC-04',
        cargo: 'Analista',
        telefono: '+57 310 999 0002',
        email: `content.type.ec04.${Date.now()}@empresa.com`,
      },
    });

    // THEN — 201 Created
    expect(response.status()).toBe(201);

    // AND — Content-Type is application/json (not problem+json for success responses)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
    expect(contentType).not.toContain('problem+json');

    const body = await response.json();
    createdIds.push(body.id);
  });

  // -------------------------------------------------------------------------
  // API-CT-EC-05 (P1 · AC4)
  // POST telefono exceeding max length (51 chars) → 400 Problem Details
  // Boundary: FluentValidation MaximumLength(50) must reject strings > 50 chars.
  // -------------------------------------------------------------------------
  test('API-CT-EC-05 — POST con telefono de 51 caracteres devuelve 400 Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — telefono at 51 chars (boundary violation: max is 50)
    const response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto Telefono Largo EC-05',
        cargo: 'Analista',
        telefono: '1'.repeat(51), // 51 chars — exceeds max 50
        email: 'ec05.telefono@empresa.com',
      },
    });

    // THEN — 400 Bad Request
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.status).toBe(400);

    // AND — no stack trace (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-CT-EC-06 (P1 · AC4)
  // POST nombre exceeding max length (201 chars) → 400 Problem Details
  // Boundary: FluentValidation MaximumLength(200) must reject strings > 200 chars.
  // -------------------------------------------------------------------------
  test('API-CT-EC-06 — POST con nombre de 201 caracteres devuelve 400 Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — nombre at 201 chars (boundary violation: max is 200)
    const response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'N'.repeat(201), // 201 chars — exceeds max 200
        cargo: 'Analista',
        telefono: '+57 310 999 0006',
        email: 'ec06.nombre.largo@empresa.com',
      },
    });

    // THEN — 400 Bad Request
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.status).toBe(400);

    // AND — no stack trace (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-CT-EC-07 (P1 · AC2)
  // POST with same email in two separate requests → both return 201
  // Documents that email is NOT unique at the backend level (no 409 conflict).
  // Architecture: contacts in Epic 3 do not enforce email uniqueness.
  // -------------------------------------------------------------------------
  test('API-CT-EC-07 — dos POST con el mismo email devuelven 201 (email no es único en contactos)', async ({ request }) => {
    const sharedEmail = `shared.email.ec07.${Date.now()}@empresa.com`;

    // GIVEN — first POST with the email
    const r1 = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto Email 1 EC-07',
        cargo: 'Analista',
        telefono: '+57 310 999 0007',
        email: sharedEmail,
      },
    });

    expect(r1.status()).toBe(201);
    const b1 = await r1.json();
    createdIds.push(b1.id);

    // WHEN — second POST with the same email but different nombre
    const r2 = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto Email 2 EC-07',
        cargo: 'Director',
        telefono: '+57 310 999 0008',
        email: sharedEmail,
      },
    });

    // THEN — second contact is also created (email not unique constraint)
    expect(r2.status()).toBe(201);
    const b2 = await r2.json();
    expect(b2.id).not.toBe(b1.id); // different entities
    createdIds.push(b2.id);
  });
});
