import { test, expect } from '@playwright/test';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * Edge Case Expansion — Story 3.5: Delete Contact
 *
 * BMad-Integrated Mode: expands the 4 GREEN ATDD E2E tests (E2E-CT-23 to E2E-CT-26)
 * and API-CT-06 with boundary conditions, error paths, and UX guards not covered
 * by the ATDD suite.
 *
 * E2E Edge Cases:
 *   E2E-CT-DEL-EC-01  P1  — ESC key closes dialog WITHOUT firing DELETE (while not isPending)
 *   E2E-CT-DEL-EC-02  P1  — "Confirmar" shows "Eliminando..." and is disabled while DELETE is in-flight
 *   E2E-CT-DEL-EC-03  P1  — "Cancelar" is also disabled while DELETE is in-flight (isPending guard)
 *   E2E-CT-DEL-EC-04  P1  — Network error during DELETE shows error toast; contact still in list
 *   E2E-CT-DEL-EC-05  P2  — Rapid double-click on "Confirmar" fires DELETE only once (single mutation call)
 *   E2E-CT-DEL-EC-06  P2  — Dialog has role="alertdialog" and WCAG aria attributes
 *
 * API Edge Cases:
 *   API-CT-DEL-EDGE-01  P1  — DELETE with non-UUID segment returns 400 or 404, never 500
 *   API-CT-DEL-EDGE-02  P0  — DELETE same ID twice: second call returns 404 Problem Details
 *   API-CT-DEL-EDGE-03  P0  — DELETE non-existent UUID returns 404 Problem Details (no stackTrace)
 *   API-CT-DEL-EDGE-04  P1  — DELETE /api/v1/contactos/:id response body is empty on 204
 *   API-CT-DEL-EDGE-05  P2  — DELETE does not mutate GET /api/v1/contactos response for other contacts
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// =============================================================================
// E2E Edge Cases
// =============================================================================

test.describe('Story 3.5 edge cases — Eliminar contacto (E2E)', () => {
  let contactosPage: ContactosPage;
  let apiHelper: ApiHelper;
  const createdContactoIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    contactosPage = new ContactosPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdContactoIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    createdContactoIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DEL-EC-01 (P1)
  // Given the confirmation dialog is open (and DELETE is NOT in-flight)
  // When the user presses the Escape key
  // Then the dialog closes WITHOUT firing any DELETE request
  //
  // Design spec: onOpenChange guard allows close when !isPending.
  // R6 mitigation: cancel must never invoke the mutation.
  // ---------------------------------------------------------------------------
  test('E2E-CT-DEL-EC-01 — [P1] ESC cierra el diálogo sin disparar DELETE (cuando no está pendiente)', async ({ page }) => {
    // GIVEN — a contact exists
    const contactoData = buildContacto({ nombre: 'Contacto ESC EC-01' });
    const created = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(created.id);

    // GIVEN — intercept BEFORE navigation; track DELETE calls (network-first)
    let deleteFired = false;
    await page.route('**/api/v1/contactos/**', (route) => {
      if (route.request().method() === 'DELETE') deleteFired = true;
      route.continue();
    });

    await contactosPage.goto();
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();

    // WHEN — open the confirmation dialog
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-contacto-dialog')).toBeVisible();

    // AND — user presses Escape
    await page.keyboard.press('Escape');

    // THEN — dialog is closed
    await expect(page.getByTestId('delete-contacto-dialog')).toBeHidden();

    // AND — no DELETE was fired (R6: ESC is equivalent to cancel)
    expect(deleteFired).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DEL-EC-02 (P1)
  // Given the user clicks "Confirmar"
  // While the DELETE request is in-flight (slow route held)
  // Then the "Confirmar" button text changes to "Eliminando..." and is disabled
  //
  // Design spec: button shows isPending loading state.
  // ---------------------------------------------------------------------------
  test('E2E-CT-DEL-EC-02 — [P1] "Confirmar" muestra "Eliminando..." y está disabled mientras DELETE está en vuelo', async ({ page }) => {
    // GIVEN — a contact exists
    const contactoData = buildContacto({ nombre: 'Contacto Pending EC-02' });
    const created = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(created.id);

    // GIVEN — hold the DELETE response to observe the pending state (network-first)
    let resolveDelete!: () => void;
    const deleteHold = new Promise<void>((resolve) => { resolveDelete = resolve; });

    await page.route('**/api/v1/contactos/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        await deleteHold;
        route.continue();
      } else {
        route.continue();
      }
    });

    await contactosPage.goto();
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-contacto-dialog')).toBeVisible();

    // WHEN — click Confirmar (DELETE is now held in-flight)
    await page.getByTestId('btn-confirmar-eliminar').click();

    // THEN — "Confirmar" button shows pending text
    await expect(page.getByTestId('btn-confirmar-eliminar')).toHaveText(/eliminando/i);

    // AND — "Confirmar" button is disabled
    await expect(page.getByTestId('btn-confirmar-eliminar')).toBeDisabled();

    // Release the held DELETE to let cleanup proceed
    resolveDelete();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DEL-EC-03 (P1)
  // Given the user clicks "Confirmar" and DELETE is in-flight
  // Then the "Cancelar" button is also disabled (prevents accidental close)
  //
  // Design spec: onOpenChange guard prevents close during isPending.
  // ---------------------------------------------------------------------------
  test('E2E-CT-DEL-EC-03 — [P1] "Cancelar" está disabled mientras DELETE está en vuelo (isPending guard)', async ({ page }) => {
    // GIVEN — a contact exists
    const contactoData = buildContacto({ nombre: 'Contacto Cancel Pending EC-03' });
    const created = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(created.id);

    // GIVEN — hold the DELETE response (network-first)
    let resolveDelete!: () => void;
    const deleteHold = new Promise<void>((resolve) => { resolveDelete = resolve; });

    await page.route('**/api/v1/contactos/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        await deleteHold;
        route.continue();
      } else {
        route.continue();
      }
    });

    await contactosPage.goto();
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-contacto-dialog')).toBeVisible();

    // WHEN — click Confirmar (DELETE held in-flight)
    await page.getByTestId('btn-confirmar-eliminar').click();

    // THEN — "Cancelar" is disabled (prevents accidental close while pending)
    await expect(page.getByTestId('btn-cancelar-eliminar')).toBeDisabled();

    // Release the held DELETE
    resolveDelete();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DEL-EC-04 (P1)
  // Given the user confirms deletion
  // When the DELETE /api/v1/contactos/:id returns a network/server error (500)
  // Then the error toast "No se pudo eliminar. Intenta de nuevo." is shown
  //   AND the dialog closes (mutation's onError fires, dialog may close or stay open)
  //   AND the contact is still accessible (no optimistic deletion)
  //
  // Design spec: onError calls toast.error('No se pudo eliminar. Intenta de nuevo.').
  // ---------------------------------------------------------------------------
  test('E2E-CT-DEL-EC-04 — [P1] error 500 en DELETE muestra toast de error; el contacto permanece', async ({ page }) => {
    // GIVEN — a contact exists
    const contactoData = buildContacto({ nombre: 'Contacto Error EC-04' });
    const created = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(created.id);

    // GIVEN — intercept DELETE and return 500 (network-first)
    await page.route('**/api/v1/contactos/**', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
        });
      } else {
        route.continue();
      }
    });

    await contactosPage.goto();
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-contacto-dialog')).toBeVisible();

    // WHEN — confirm deletion (will trigger 500)
    await page.getByTestId('btn-confirmar-eliminar').click();

    // THEN — error toast is visible with the expected Spanish message
    await expect(
      page.getByText(/no se pudo eliminar|intenta de nuevo/i)
    ).toBeVisible();

    // AND — the contact is still present in the list (no optimistic deletion)
    await expect(
      contactosPage.contactoRows.filter({ hasText: contactoData.nombre })
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DEL-EC-05 (P2)
  // Given the confirmation dialog is open
  // When the user rapidly double-clicks "Confirmar"
  // Then DELETE is fired at most once (useMutation guards against concurrent calls)
  //
  // Design spec: useMutation tracks isPending — the button is disabled on first click.
  // ---------------------------------------------------------------------------
  test('E2E-CT-DEL-EC-05 — [P2] doble clic en "Confirmar" dispara DELETE una sola vez', async ({ page }) => {
    // GIVEN — a contact exists
    const contactoData = buildContacto({ nombre: 'Contacto Double Click EC-05' });
    const created = await apiHelper.createContacto(contactoData);
    // No cleanup push — test deletes the contact itself

    // GIVEN — count DELETE calls; hold first to allow the double-click race (network-first)
    let deleteCallCount = 0;
    let resolveFirst!: () => void;
    const firstHold = new Promise<void>((resolve) => { resolveFirst = resolve; });
    let firstResolved = false;

    await page.route('**/api/v1/contactos/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCallCount++;
        if (!firstResolved) {
          firstResolved = true;
          await firstHold;
        }
        route.continue();
      } else {
        route.continue();
      }
    });

    await contactosPage.goto();
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-contacto-dialog')).toBeVisible();

    // WHEN — double-click Confirmar rapidly (first click triggers isPending → button disabled)
    await page.getByTestId('btn-confirmar-eliminar').dblclick();

    // Release the held DELETE
    resolveFirst();

    // THEN — DELETE was fired at most once (isPending guard on second click)
    await expect(page.getByTestId('delete-contacto-dialog')).toBeHidden();
    expect(deleteCallCount).toBeLessThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DEL-EC-06 (P2)
  // Given the confirmation dialog is open
  // Then the dialog has role="alertdialog" (WCAG 2.1 AA — Story spec requirement)
  //   AND has a non-empty aria-labelledby attribute
  //   AND has a non-empty aria-describedby attribute
  //
  // Design spec: DeleteContactoDialog uses role="alertdialog" with
  // aria-labelledby="delete-contacto-dialog-title" and
  // aria-describedby="delete-contacto-dialog-description".
  // ---------------------------------------------------------------------------
  test('E2E-CT-DEL-EC-06 — [P2] el diálogo tiene role="alertdialog" y atributos ARIA (WCAG 2.1 AA)', async ({ page }) => {
    // GIVEN — a contact exists
    const contactoData = buildContacto({ nombre: 'Contacto ARIA EC-06' });
    const created = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(created.id);

    await page.route('**/api/v1/contactos**', (route) => route.continue());

    await contactosPage.goto();
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();

    // THEN — dialog is visible
    const dialog = page.getByTestId('delete-contacto-dialog');
    await expect(dialog).toBeVisible();

    // AND — role is alertdialog (WCAG 2.1 AA)
    await expect(dialog).toHaveAttribute('role', 'alertdialog');

    // AND — aria-labelledby is a non-empty string
    const labelledBy = await dialog.getAttribute('aria-labelledby');
    expect(typeof labelledBy).toBe('string');
    expect((labelledBy ?? '').length).toBeGreaterThan(0);

    // AND — aria-describedby is a non-empty string
    const describedBy = await dialog.getAttribute('aria-describedby');
    expect(typeof describedBy).toBe('string');
    expect((describedBy ?? '').length).toBeGreaterThan(0);
  });
});

// =============================================================================
// API Edge Cases — DELETE /api/v1/contactos/:id
// =============================================================================

test.describe('Story 3.5 — API Edge Cases: DELETE /api/v1/contactos/:id', () => {
  // ---------------------------------------------------------------------------
  // API-CT-DEL-EDGE-01 (P1)
  // Given a path segment that is NOT a valid UUID (e.g. "not-a-uuid", "12345")
  // When DELETE /api/v1/contactos/:id is called
  // Then the response is 400 Bad Request or 404 Not Found — never 500
  //
  // NFR: server must not crash or expose internal errors on malformed input.
  // ---------------------------------------------------------------------------
  test('API-CT-DEL-EDGE-01 — [P1] DELETE con segmento no-UUID retorna 400 o 404, nunca 500', async ({ request }) => {
    // GIVEN — invalid (non-UUID) path segments
    const invalidSegments = ['not-a-uuid', '12345', 'null', 'undefined'];

    for (const segment of invalidSegments) {
      // WHEN — DELETE with invalid ID format
      const response = await request.delete(`${API_BASE_URL}/api/v1/contactos/${segment}`);

      // THEN — response is 400 or 404 (not 500 — NFR: no unhandled exceptions)
      expect([400, 404]).toContain(response.status());
    }
  });

  // ---------------------------------------------------------------------------
  // API-CT-DEL-EDGE-02 (P0)
  // Given a contact that has already been deleted
  // When DELETE /api/v1/contactos/:id is called a second time with the same ID
  // Then the response is 404 Not Found with Problem Details (RFC 7807)
  //   AND no stackTrace is exposed (NFR6)
  //
  // Design spec: DeleteContactoCommandHandler throws KeyNotFoundException →
  // ExceptionHandlingMiddleware maps to 404 Problem Details.
  // ---------------------------------------------------------------------------
  test('API-CT-DEL-EDGE-02 — [P0] DELETE del mismo ID dos veces: segunda llamada retorna 404 Problem Details', async ({ request }) => {
    // GIVEN — a contact is created
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto Doble Delete EDGE-02',
        cargo: 'Analista',
        telefono: '+57 1 234 5671',
        email: `api.del.edge.02.${Date.now()}@empresa.co`,
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    // WHEN — first DELETE (should succeed)
    const firstDelete = await request.delete(`${API_BASE_URL}/api/v1/contactos/${created.id}`);
    expect(firstDelete.status()).toBe(204);

    // AND — second DELETE (contact no longer exists)
    const secondDelete = await request.delete(`${API_BASE_URL}/api/v1/contactos/${created.id}`);

    // THEN — second DELETE returns 404 Not Found
    expect(secondDelete.status()).toBe(404);

    // AND — body is Problem Details (RFC 7807)
    const body = await secondDelete.json();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(body.status).toBe(404);
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);

    // AND — no stackTrace exposed (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).stack_trace).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // API-CT-DEL-EDGE-03 (P0)
  // Given a valid UUID that does NOT exist in the database
  // When DELETE /api/v1/contactos/:id is called
  // Then the response is 404 Not Found with Problem Details (RFC 7807)
  //   AND no stackTrace is exposed (NFR6)
  //
  // Boundary: valid UUID shape but non-existent record — not a malformed request.
  // ---------------------------------------------------------------------------
  test('API-CT-DEL-EDGE-03 — [P0] DELETE con UUID inexistente retorna 404 Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — a UUID that does not correspond to any existing contact
    const nonExistentId = '00000000-0000-4000-8000-000000000088';

    // WHEN — DELETE /api/v1/contactos/:id
    const response = await request.delete(`${API_BASE_URL}/api/v1/contactos/${nonExistentId}`);

    // THEN — status is 404 Not Found
    expect(response.status()).toBe(404);

    // AND — body is Problem Details (RFC 7807)
    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(body.status).toBe(404);
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);

    // AND — no stackTrace exposed (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).stack_trace).toBeUndefined();

    // AND — no internal stack trace text in serialised body (belt-and-suspenders)
    const bodyText = JSON.stringify(body);
    expect(bodyText).not.toMatch(/at SiesaAgents/i);
  });

  // ---------------------------------------------------------------------------
  // API-CT-DEL-EDGE-04 (P1)
  // Given a valid contactoId that exists
  // When DELETE /api/v1/contactos/:id is called
  // Then the response status is 204
  //   AND the response body is truly empty (no JSON, no text, no bytes)
  //
  // Boundary: 204 responses must have no body — some clients choke on body+204.
  // ---------------------------------------------------------------------------
  test('API-CT-DEL-EDGE-04 — [P1] DELETE exitoso retorna 204 con cuerpo vacío (sin JSON)', async ({ request }) => {
    // GIVEN — a contact is created
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto Empty Body EDGE-04',
        cargo: 'Técnico',
        telefono: '+57 1 234 5672',
        email: `api.del.edge.04.${Date.now()}@empresa.co`,
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    // WHEN — DELETE the contact
    const response = await request.delete(`${API_BASE_URL}/api/v1/contactos/${created.id}`);

    // THEN — response is 204 No Content
    expect(response.status()).toBe(204);

    // AND — response body is empty (no JSON body on 204)
    const bodyText = await response.text();
    expect(bodyText).toBe('');
  });

  // ---------------------------------------------------------------------------
  // API-CT-DEL-EDGE-05 (P2)
  // Given two contacts exist
  // When DELETE /api/v1/contactos/:id is called for one of them
  // Then GET /api/v1/contactos still returns the OTHER contact
  //   AND the deleted contact is absent from that list
  //
  // Boundary: DELETE must not cascade to or corrupt unrelated contact records.
  // ---------------------------------------------------------------------------
  test('API-CT-DEL-EDGE-05 — [P2] DELETE de un contacto no afecta a otros contactos en la lista', async ({ request }) => {
    // GIVEN — two contacts are created
    const ts = Date.now();
    const createA = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: `Contacto A EDGE-05 ${ts}`,
        cargo: 'Gerente',
        telefono: '+57 1 234 5673',
        email: `api.del.edge.05a.${ts}@empresa.co`,
      },
    });
    expect(createA.status()).toBe(201);
    const contactoA = await createA.json();

    const createB = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: `Contacto B EDGE-05 ${ts}`,
        cargo: 'Analista',
        telefono: '+57 1 234 5674',
        email: `api.del.edge.05b.${ts}@empresa.co`,
      },
    });
    expect(createB.status()).toBe(201);
    const contactoB = await createB.json();

    // WHEN — delete contactoA
    const deleteResponse = await request.delete(`${API_BASE_URL}/api/v1/contactos/${contactoA.id}`);
    expect(deleteResponse.status()).toBe(204);

    // THEN — contactoB is still retrievable via GET list
    const listResponse = await request.get(`${API_BASE_URL}/api/v1/contactos`);
    expect(listResponse.status()).toBe(200);
    const list = await listResponse.json();
    expect(Array.isArray(list)).toBe(true);

    const idsInList = (list as Array<{ id: string }>).map((c) => c.id);
    expect(idsInList).toContain(contactoB.id);

    // AND — contactoA is no longer in the list
    expect(idsInList).not.toContain(contactoA.id);

    // Cleanup — delete contactoB
    await request.delete(`${API_BASE_URL}/api/v1/contactos/${contactoB.id}`).catch(() => null);
  });
});
