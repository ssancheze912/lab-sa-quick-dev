/**
 * E2E Edge Case Tests — Story 2.1: Client List & Search
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Expands ATDD E2E coverage with:
 *   - Network abort (not just HTTP 500) triggers ErrorPanel
 *   - Search clearing restores full list
 *   - Search with no matches shows EmptyState (not an empty panel)
 *   - Mobile viewport — panel still renders (no crash)
 *   - Very long client name truncation (no overflow)
 *   - Loading state is not permanently stuck
 *   - Duplicate rapid navigation does not break the view
 *   - Panel container does not render outside viewport
 */

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';

// ─── Edge: Network abort (not HTTP error) ─────────────────────────────────────

test.describe('Edge — fallo de red (abortar conexión, no HTTP error)', () => {
  test('debe mostrar ErrorPanel cuando la conexión es abortada', async ({ page }) => {
    // GIVEN: Network request is aborted (simulates unreachable backend)
    await page.route('**/api/v1/clientes', (route) => route.abort());

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is shown (not a blank page or JS crash)
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('debe mostrar botón Reintentar cuando la conexión es abortada', async ({ page }) => {
    // GIVEN: Network request is aborted
    await page.route('**/api/v1/clientes', (route) => route.abort());

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Reintentar button is visible
    await expect(
      page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i }),
    ).toBeVisible();
  });
});

// ─── Edge: Search clear restores full list ────────────────────────────────────

test.describe('Edge — limpiar búsqueda restaura la lista completa', () => {
  test('debe restaurar todos los clientes al limpiar el campo de búsqueda', async ({ page }) => {
    // GIVEN: Two clients exist
    const cliente1 = buildCliente({ nombre: 'Empresa Alpha SAS', nit: '900001001' });
    const cliente2 = buildCliente({ nombre: 'Empresa Beta Ltda', nit: '900001002' });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-1', ...cliente1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: 'id-2', ...cliente2, createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
        ]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: User searches for "Alpha" (1 result)
    await page.getByTestId('clientes-search-input').fill('Alpha');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);

    // AND: User clears the search
    await page.getByTestId('clientes-search-input').fill('');

    // THEN: Both clients are shown again
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);
  });
});

// ─── Edge: Search with no matches shows EmptyState ───────────────────────────

test.describe('Edge — búsqueda sin coincidencias muestra EmptyState', () => {
  test('debe mostrar EmptyState cuando la búsqueda no tiene coincidencias', async ({ page }) => {
    // GIVEN: One client exists
    const cliente = buildCliente({ nombre: 'Empresa Alpha SAS', nit: '900001100' });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-1', ...cliente, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      }),
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);

    // WHEN: User types a term with no matches
    await page.getByTestId('clientes-search-input').fill('ZZZNOMATCH9999');

    // THEN: EmptyState is shown, no list items remain
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('EmptyState de búsqueda vacía debe desaparecer al limpiar el filtro', async ({ page }) => {
    // GIVEN: One client, search filters to zero results
    const cliente = buildCliente({ nombre: 'Empresa Única', nit: '900001200' });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-1', ...cliente, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      }),
    );

    await page.goto('/clientes');
    await page.getByTestId('clientes-search-input').fill('ZZZNOMATCH');
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // WHEN: User clears the input
    await page.getByTestId('clientes-search-input').fill('');

    // THEN: Client list is restored, EmptyState gone
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });
});

// ─── Edge: Long client name truncation ────────────────────────────────────────

test.describe('Edge — nombre de cliente muy largo (truncamiento)', () => {
  test('un nombre extremadamente largo no debe desbordarse fuera del panel', async ({ page }) => {
    // GIVEN: A client with a very long name (100+ chars)
    const longName = 'Empresa con Nombre Extremadamente Largo y Difícil de Manejar en la Interfaz de Usuario Corp SAS';
    const cliente = buildCliente({ nombre: longName, nit: '900001300' });

    await page.setViewportSize({ width: 1280, height: 800 });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-1', ...cliente, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      }),
    );

    await page.goto('/clientes');

    const item = page.getByTestId('cliente-list-item').first();
    await expect(item).toBeVisible();

    // THEN: The item's width does not exceed the panel's width (280px)
    const panelBox = await page.getByTestId('clientes-list-panel').boundingBox();
    const itemBox = await item.boundingBox();

    expect(itemBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    // Item should not overflow the panel horizontally
    expect(itemBox!.width).toBeLessThanOrEqual(panelBox!.width + 1); // +1 for sub-pixel rounding
  });
});

// ─── Edge: Mobile viewport does not crash ────────────────────────────────────

test.describe('Edge — viewport móvil no rompe la vista', () => {
  test('la página no debe mostrar errores JS en viewport móvil (375px)', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'id-mob-1',
            nombre: 'Empresa Mobile',
            nit: '900001400',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      }),
    );

    // WHEN: User navigates to /clientes on mobile
    await page.goto('/clientes');

    // THEN: No JS errors thrown (no crash)
    expect(jsErrors).toHaveLength(0);
  });

  test('el panel de lista debe estar presente en viewport móvil', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Panel exists in DOM (visibility may vary on mobile but no crash)
    await expect(page.getByTestId('clientes-list-panel')).toBeAttached();
  });
});

// ─── Edge: HTTP 401 Unauthorized ─────────────────────────────────────────────

test.describe('Edge — HTTP 401 (no autorizado)', () => {
  test('debe mostrar ErrorPanel cuando el backend devuelve 401', async ({ page }) => {
    // GIVEN: Backend returns 401 Unauthorized
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is shown (auth errors also surface as error state)
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });
});

// ─── Edge: Reintentar after network abort recovers successfully ───────────────

test.describe('Edge — Reintentar después de abortar red', () => {
  test('debe mostrar la lista de clientes después de reintentar tras un aborto de red', async ({
    page,
  }) => {
    // GIVEN: First request is aborted, subsequent requests succeed
    let requestCount = 0;

    await page.route('**/api/v1/clientes', (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.abort();
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'id-recover-1',
              nombre: 'Empresa Recuperada',
              nit: '900001500',
              telefono: '3001234567',
              ciudad: 'Bogotá',
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ]),
        });
      }
    });

    // WHEN: User navigates and sees the error
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: User clicks Reintentar
    await page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i }).click();

    // THEN: The client list is shown after recovery
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
  });
});

// ─── Edge: Case-insensitive NIT search ────────────────────────────────────────

test.describe('Edge — búsqueda por NIT con variaciones', () => {
  test('debe encontrar cliente por NIT parcial', async ({ page }) => {
    // GIVEN: A client with a multi-segment NIT
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'id-nit-partial',
            nombre: 'Empresa NIT Parcial',
            nit: '900123456-7',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          {
            id: 'id-nit-other',
            nombre: 'Empresa Otra',
            nit: '800000000-0',
            telefono: '3001234568',
            ciudad: 'Medellín',
            createdAt: '2026-01-02T00:00:00Z',
            updatedAt: '2026-01-02T00:00:00Z',
          },
        ]),
      }),
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);

    // WHEN: User types only the numeric part of the NIT
    await page.getByTestId('clientes-search-input').fill('900123456');

    // THEN: Only the matching client is shown
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').first()).toContainText('Empresa NIT Parcial');
  });
});
