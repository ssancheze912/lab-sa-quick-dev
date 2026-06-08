/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Playwright E2E — RED Phase
 * These tests are intentionally FAILING until the ClienteListView and the
 * /clientes/$clienteId route are implemented.
 *
 * Acceptance Criteria covered (E2E slice — happy path + network-first interception):
 *   AC #4  — Left panel renders all clients (280px desktop).
 *   AC #5  — Real-time search filter (client-side; no extra HTTP call on keystrokes).
 *   AC #6  — EmptyState `no-clients` when GET returns [].
 *   AC #7  — EmptyState `search-empty` when the filter yields no results.
 *   AC #8  — ErrorPanel + "Reintentar" on initial fetch failure.
 *   AC #10 — Clicking an item updates URL to /clientes/{id}.
 *   AC #11 — Spanish copy verbatim.
 *
 * Infra constraint:
 *   Sandbox infra has chromium only — run with
 *     `pnpm exec playwright test --project=chromium e2e/tests/clientes/list-and-search.spec.ts`
 *
 * Network strategy:
 *   `page.route()` is registered BEFORE `page.goto()` so the network responses
 *   are deterministic regardless of whether the .NET backend is actually live.
 *   The webServer entry in playwright.config.ts still spins up the backend
 *   (for non-mocked specs), but these tests fully intercept their own traffic.
 */

import { test, expect } from '@playwright/test';

const API_URL = '**/api/v1/clientes';

const SEED_CLIENTES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Acme Distribuciones',
    nit: '900100100-1',
    telefono: '3001112233',
    ciudad: 'Bogotá',
    createdAt: '2026-06-01T00:00:00+00:00',
    updatedAt: '2026-06-01T00:00:00+00:00',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Bavaria Holdings',
    nit: '900200200-2',
    telefono: '3002223344',
    ciudad: 'Medellín',
    createdAt: '2026-05-15T00:00:00+00:00',
    updatedAt: '2026-05-15T00:00:00+00:00',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'Coltabaco S.A.',
    nit: '900300300-3',
    telefono: '3003334455',
    ciudad: 'Cali',
    createdAt: '2026-05-01T00:00:00+00:00',
    updatedAt: '2026-05-01T00:00:00+00:00',
  },
];

test.describe('Story 2.1 — Client List & Search (E2E)', () => {
  test('AC #4 — left panel renders every seeded client (TC-E2-P1-01)', async ({ page }) => {
    // GIVEN: the API returns three seeded clients (network-first)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED_CLIENTES),
      }),
    );

    // WHEN: the user navigates to /clientes
    await page.goto('/clientes');

    // THEN: every seeded nombre is visible inside the panel
    await expect(page.getByTestId('cliente-list-view')).toBeVisible();
    for (const cliente of SEED_CLIENTES) {
      await expect(page.getByText(cliente.nombre)).toBeVisible();
    }
  });

  test('AC #5 — typing in the search input filters by nombre (TC-E2-P1-02)', async ({ page }) => {
    // GIVEN: the API returns three seeded clients (network-first)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED_CLIENTES),
      }),
    );

    // WHEN: the user navigates to /clientes
    await page.goto('/clientes');
    await expect(page.getByText('Acme Distribuciones')).toBeVisible();

    // AND: the user types "Bavaria" in the search input
    await page.getByPlaceholder('Buscar por nombre o NIT...').fill('Bavaria');

    // THEN: only the matching client remains visible
    await expect(page.getByText('Bavaria Holdings')).toBeVisible();
    await expect(page.getByText('Acme Distribuciones')).not.toBeVisible();
    await expect(page.getByText('Coltabaco S.A.')).not.toBeVisible();
  });

  test('AC #5 — search by nit also filters the list', async ({ page }) => {
    // GIVEN: seeded data (network-first)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED_CLIENTES),
      }),
    );

    // WHEN: the user navigates to /clientes and types the unique NIT prefix
    await page.goto('/clientes');
    await page.getByPlaceholder('Buscar por nombre o NIT...').fill('900300');

    // THEN: only the matching client (NIT 900300300-3) remains visible
    await expect(page.getByText('Coltabaco S.A.')).toBeVisible();
    await expect(page.getByText('Bavaria Holdings')).not.toBeVisible();
  });

  test('AC #6 — EmptyState (no-clients) shown when API returns [] (TC-E2-P1-03)', async ({
    page,
  }) => {
    // GIVEN: the API returns an empty list (network-first)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      }),
    );

    // WHEN: the user navigates to /clientes
    await page.goto('/clientes');

    // THEN: the no-clients EmptyState is rendered AND the search input is hidden
    const empty = page.getByTestId('empty-state');
    await expect(empty).toBeVisible();
    await expect(empty).toHaveAttribute('data-variant', 'no-clients');
    await expect(page.getByText('No hay clientes registrados')).toBeVisible();
    await expect(page.getByPlaceholder('Buscar por nombre o NIT...')).toHaveCount(0);
  });

  test('AC #7 — EmptyState (search-empty) when filter yields no results', async ({ page }) => {
    // GIVEN: seeded data (network-first)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED_CLIENTES),
      }),
    );

    // WHEN: the user navigates to /clientes and types a query that matches nothing
    await page.goto('/clientes');
    await page.getByPlaceholder('Buscar por nombre o NIT...').fill('ZZZZ-no-match');

    // THEN: the search-empty EmptyState is rendered AND the search input stays visible
    const empty = page.getByTestId('empty-state');
    await expect(empty).toBeVisible();
    await expect(empty).toHaveAttribute('data-variant', 'search-empty');
    await expect(page.getByText('No se encontró ningún cliente')).toBeVisible();
    await expect(page.getByPlaceholder('Buscar por nombre o NIT...')).toBeVisible();
  });

  test('AC #8 — ErrorPanel + Reintentar on initial fetch failure (TC-E2-P0-08)', async ({
    page,
  }) => {
    // GIVEN: the first GET fails with 500, the second succeeds
    let calls = 0;
    await page.route(API_URL, (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
            title: 'Internal Server Error',
            status: 500,
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED_CLIENTES),
      });
    });

    // WHEN: the user navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel renders with the verbatim Spanish copy + Reintentar button
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByText('No se pudo cargar')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();

    // WHEN: the user clicks Reintentar
    await page.getByRole('button', { name: 'Reintentar' }).click();

    // THEN: the list now renders (the second GET succeeded — TanStack Query refetch)
    await expect(page.getByText('Acme Distribuciones')).toBeVisible();
    await expect(page.getByTestId('error-panel')).toHaveCount(0);
  });

  test('AC #10 — clicking an item updates the URL to /clientes/{id} without reload', async ({
    page,
  }) => {
    // GIVEN: seeded data (network-first)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED_CLIENTES),
      }),
    );

    // WHEN: the user navigates to /clientes and clicks the first item
    await page.goto('/clientes');
    await expect(page.getByText('Acme Distribuciones')).toBeVisible();
    const firstItem = page.getByTestId('client-list-item').first();
    await firstItem.click();

    // THEN: the URL becomes /clientes/{first-id} (deep-linkable — FR30)
    await expect(page).toHaveURL(/\/clientes\/11111111-1111-1111-1111-111111111111$/);

    // AND: the clicked item carries aria-current="page" (visual + a11y selected state)
    await expect(firstItem).toHaveAttribute('aria-current', 'page');
  });

  test('AC #5 — search input does NOT trigger a new HTTP request per keystroke', async ({
    page,
  }) => {
    // GIVEN: count network calls to the endpoint (network-first)
    let calls = 0;
    await page.route(API_URL, (route) => {
      calls += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED_CLIENTES),
      });
    });

    // WHEN: the user navigates to /clientes and types in the search input
    await page.goto('/clientes');
    await expect(page.getByText('Acme Distribuciones')).toBeVisible();
    const callsAfterLoad = calls;

    await page.getByPlaceholder('Buscar por nombre o NIT...').fill('Bavaria');
    // JUSTIFIED HARD WAIT (TEA Review): Verifying ABSENCE of network event.
    // We must wait past the 150 ms debounce window to give the system the chance
    // to (incorrectly) trigger a refetch — only then can we assert the counter
    // did not increment. No deterministic signal exists for "no event will fire".
    // See test-quality.md (acceptable hard-wait scenarios) and network-first.md.
    await page.waitForTimeout(500);

    // THEN: the GET counter did NOT increment (filter is client-side)
    expect(calls).toBe(callsAfterLoad);
  });
});
