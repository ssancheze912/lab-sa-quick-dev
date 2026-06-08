/**
 * Story 2.1: Client List & Search — Automate Phase
 * Epic 2: Client Management
 *
 * AUTOMATE expansion E2E (edge cases — NOT regenerated from ATDD)
 * Complements `list-and-search.spec.ts` with: clearing the search recovers
 * the full list, switching the active item moves aria-current, retry after
 * 500 → 500 → 200 (multi-failure recovery), and keyboard navigation parity.
 *
 * Sandbox infra:
 *   chromium only — run with
 *     `pnpm exec playwright test --project=chromium e2e/tests/clientes/list-and-search.edge.spec.ts`
 *
 * Network strategy:
 *   page.route() is registered BEFORE page.goto() — deterministic regardless of
 *   the .NET backend status (the webServer entry still spins it up for other specs).
 */

import { test, expect } from '@playwright/test';

const API_URL = '**/api/v1/clientes';

const SEED = [
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

test.describe('Story 2.1 — Client List & Search — Edge cases (E2E)', () => {
  test('[P1] clearing the search input restores every previously-filtered item (AC #5)', async ({ page }) => {
    // GIVEN: 3 seeded clients (network-first)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED),
      }),
    );

    // WHEN: the user navigates and filters to one item
    await page.goto('/clientes');
    const input = page.getByPlaceholder('Buscar por nombre o NIT...');
    await input.fill('Bavaria');
    await expect(page.getByText('Bavaria Holdings')).toBeVisible();
    await expect(page.getByText('Acme Distribuciones')).not.toBeVisible();

    // WHEN: the user clears the input
    await input.fill('');

    // THEN: every item is visible again
    await expect(page.getByText('Acme Distribuciones')).toBeVisible();
    await expect(page.getByText('Bavaria Holdings')).toBeVisible();
    await expect(page.getByText('Coltabaco S.A.')).toBeVisible();
  });

  test('[P1] selecting a different item moves aria-current to the new row (AC #10)', async ({ page }) => {
    // GIVEN: 3 seeded clients (network-first)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED),
      }),
    );

    // WHEN: the user navigates and selects the first item, then the second
    await page.goto('/clientes');
    const items = page.getByTestId('client-list-item');
    await items.nth(0).click();
    await expect(page).toHaveURL(/\/clientes\/11111111-1111-1111-1111-111111111111$/);
    await expect(items.nth(0)).toHaveAttribute('aria-current', 'page');

    await items.nth(1).click();
    await expect(page).toHaveURL(/\/clientes\/22222222-2222-2222-2222-222222222222$/);

    // THEN: aria-current has moved to the second row only
    await expect(items.nth(0)).not.toHaveAttribute('aria-current', 'page');
    await expect(items.nth(1)).toHaveAttribute('aria-current', 'page');
  });

  test('[P1] Reintentar after multiple consecutive failures eventually recovers (AC #8)', async ({ page }) => {
    // GIVEN: the first TWO GETs fail with 500, the third succeeds
    let calls = 0;
    await page.route(API_URL, (route) => {
      calls += 1;
      if (calls <= 2) {
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
        body: JSON.stringify(SEED),
      });
    });

    // WHEN: the user navigates → ErrorPanel renders
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: the user clicks Reintentar once (still failing)
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: the user clicks Reintentar again (third call returns 200)
    await page.getByRole('button', { name: 'Reintentar' }).click();

    // THEN: the list eventually renders and the ErrorPanel disappears
    await expect(page.getByText('Acme Distribuciones')).toBeVisible();
    await expect(page.getByTestId('error-panel')).toHaveCount(0);
  });

  test('[P2] keyboard activation: focusing an item with Tab + pressing Enter navigates (AC #10, #11)', async ({ page }) => {
    // GIVEN: 3 seeded clients (network-first)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED),
      }),
    );

    // WHEN: the user navigates and tabs onto the first list item, then presses Enter
    await page.goto('/clientes');
    const firstItem = page.getByTestId('client-list-item').first();
    await firstItem.focus();
    await page.keyboard.press('Enter');

    // THEN: navigation occurred (same effect as click) — URL reflects the first item id
    await expect(page).toHaveURL(/\/clientes\/11111111-1111-1111-1111-111111111111$/);
  });

  test('[P2] EmptyState (no-clients) is accessible: has role="status" + aria-live="polite" (AC #11)', async ({ page }) => {
    // GIVEN: empty list (network-first)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      }),
    );

    // WHEN: navigate to /clientes
    await page.goto('/clientes');
    const empty = page.getByTestId('empty-state');

    // THEN: AT attributes are present
    await expect(empty).toBeVisible();
    await expect(empty).toHaveAttribute('role', 'status');
    await expect(empty).toHaveAttribute('aria-live', 'polite');
  });

  test('[P2] ErrorPanel exposes role="alert" so screen readers announce the failure (AC #11)', async ({ page }) => {
    // GIVEN: the API fails on the first request
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Server Error', status: 500 }),
      }),
    );

    // WHEN: the user navigates
    await page.goto('/clientes');
    const panel = page.getByTestId('error-panel');

    // THEN: role="alert" is present (NFR — accessibility audit)
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('role', 'alert');
  });

  test('[P2] search by mixed-case query still matches data — case-insensitive contract (AC #5)', async ({ page }) => {
    // GIVEN: seeded data
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED),
      }),
    );

    // WHEN: the user types in mixed case
    await page.goto('/clientes');
    await page.getByPlaceholder('Buscar por nombre o NIT...').fill('bAvArIa');

    // THEN: the match still works (case-insensitive substring per matchesQuery contract)
    await expect(page.getByText('Bavaria Holdings')).toBeVisible();
    await expect(page.getByText('Acme Distribuciones')).not.toBeVisible();
  });

  test('[P2] reload after item selection preserves the active row from the URL (FR30 — URL is source of truth)', async ({ page }) => {
    // GIVEN: seeded data, network-first applied for all requests including the reload
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED),
      }),
    );

    // WHEN: the user deep-links into /clientes/{secondId}
    await page.goto('/clientes/22222222-2222-2222-2222-222222222222');

    // THEN: the second item is rendered AND carries aria-current="page" from the URL state
    const items = page.getByTestId('client-list-item');
    await expect(items.nth(1)).toHaveAttribute('aria-current', 'page');
    await expect(items.nth(0)).not.toHaveAttribute('aria-current', 'page');

    // WHEN: the page reloads (browser refresh)
    await page.reload();

    // THEN: the URL is preserved AND the active row is recomputed from the URL
    await expect(page).toHaveURL(/\/clientes\/22222222-2222-2222-2222-222222222222$/);
    await expect(page.getByTestId('client-list-item').nth(1)).toHaveAttribute('aria-current', 'page');
  });
});
