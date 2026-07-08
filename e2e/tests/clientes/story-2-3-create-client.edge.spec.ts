import { test, expect } from '../../fixtures/base.fixture';

/**
 * Story 2.3 — Automate (Edge Cases, E2E).
 *
 * Expands the ATDD E2E coverage of the Nuevo cliente flow with boundary
 * conditions the RED-phase spec skipped:
 *   - Cancel button closes the dialog AND fires NO POST request.
 *   - Escape key closes the dialog (shadcn Dialog focus-trap semantics).
 *   - Overlay click closes the dialog (shadcn Dialog default behaviour).
 *   - 500 error → top-of-form Alert appears; dialog stays open; toast NOT fired.
 *
 * Uses `page.route('**\/api/v1/clientes**', ...)` interception (network-first
 * pattern) so the tests are hermetic.
 *
 * All scenarios are [P1] — cancellation and error-surface edges are lower risk
 * than the P0 happy path (409 + 201) but still user-facing.
 */

const LIST_API = /\/api\/v1\/clientes(\?[^/]*)?$/;
const CREATE_API_METHOD = 'POST';

type ClienteDto = {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
};

function buildCliente(overrides: Partial<ClienteDto> = {}): ClienteDto {
  const suffix = `${Math.floor(Math.random() * 1_000_000_000)}`.padStart(9, '0');
  const now = new Date().toISOString();
  return {
    id: `00000000-0000-0000-0000-${suffix.padStart(12, '0')}`,
    nombre: `Cliente ${suffix}`,
    nit: `9${suffix}`,
    telefono: `300${suffix.slice(-7)}`,
    ciudad: 'Bogotá',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test.describe('Story 2.3 — Create Client (E2E Edge Cases)', () => {
  test('[P1] Cancelar button closes the dialog AND fires no POST', async ({ page }) => {
    const initial = buildCliente({ nombre: 'Existing Corp' });
    let postCalls = 0;

    await page.route(LIST_API, async (route) => {
      const method = route.request().method();
      if (method === CREATE_API_METHOD) {
        postCalls += 1;
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{}',
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([initial]),
      });
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill some fields to prove state is discarded.
    await page.getByLabel(/^Nombre$/).fill('Draft Client');
    await page.getByLabel(/NIT\/RUC/).fill('900XXXX');

    await page.getByRole('button', { name: /^cancelar$/i }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(postCalls).toBe(0);
  });

  test('[P1] Escape key closes the dialog AND fires no POST', async ({ page }) => {
    const initial = buildCliente({ nombre: 'Existing Corp' });
    let postCalls = 0;

    await page.route(LIST_API, async (route) => {
      const method = route.request().method();
      if (method === CREATE_API_METHOD) {
        postCalls += 1;
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{}',
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([initial]),
      });
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/^Nombre$/).fill('Draft');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(postCalls).toBe(0);
  });

  test('[P1] 500 error → top-of-form Alert appears; dialog stays open; toast NOT fired', async ({ page }) => {
    const initial = buildCliente({ nombre: 'Existing Corp' });

    await page.route(LIST_API, async (route) => {
      const method = route.request().method();
      if (method === CREATE_API_METHOD) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{}',
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([initial]),
      });
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/^Nombre$/).fill('Acme SAS');
    await page.getByLabel(/NIT\/RUC/).fill('900123456');
    await page.getByLabel(/Teléfono/).fill('3001234567');
    await page.getByLabel(/Ciudad/).fill('Cali');

    await page.getByRole('button', { name: /^guardar$/i }).click();

    // Top-of-form Alert appears with the exact Spanish copy.
    await expect(page.getByText('No se pudo guardar')).toBeVisible();
    await expect(page.getByText('Comprueba tu conexión e intenta nuevamente.')).toBeVisible();

    // Dialog stays open.
    await expect(page.getByRole('dialog')).toBeVisible();

    // Toast NOT visible.
    await expect(page.getByText('Cliente creado correctamente')).toHaveCount(0);
  });

  test('[P1] Guardar shows spinner + aria-busy while in flight (AC #8)', async ({ page }) => {
    const initial = buildCliente({ nombre: 'Existing Corp' });

    // Delay the POST response 400ms so the in-flight state is observable.
    await page.route(LIST_API, async (route) => {
      const method = route.request().method();
      if (method === CREATE_API_METHOD) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const created = buildCliente({ nombre: 'Acme SAS', nit: '900123456' });
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: { Location: `/api/v1/clientes/${created.id}` },
          body: JSON.stringify(created),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([initial]),
      });
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    await page.getByLabel(/^Nombre$/).fill('Acme SAS');
    await page.getByLabel(/NIT\/RUC/).fill('900123456');
    await page.getByLabel(/Teléfono/).fill('3001234567');
    await page.getByLabel(/Ciudad/).fill('Cali');

    const guardar = page.getByRole('button', { name: /^guardar$/i });
    await guardar.click();

    // While in flight — Guardar aria-busy="true" AND disabled.
    await expect(guardar).toHaveAttribute('aria-busy', 'true');
    await expect(guardar).toBeDisabled();

    // Eventually the 201 resolves and the dialog closes.
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
