/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase
 * These E2E tests intentionally FAIL until Story 2.2 is implemented.
 *
 * Acceptance Criteria covered here (see story 2.2):
 *   AC1 — Clicking a ClientListItem navigates to /clientes/:id (SPA — no page reload),
 *         the right panel (`data-testid="cliente-detail-panel"`, `role="region"`) renders
 *         ClienteDetailView with Nombre (heading), NIT/RUC, Teléfono, Ciudad; the item
 *         is visually marked as selected (`aria-pressed="true"`).
 *   AC2 — Switching from cliente X to cliente Y updates the URL and re-renders the
 *         detail without unmounting the list; the list GET is not re-fetched.
 *   AC3 — Deep-linking to /clientes/:id directly loads the detail with the list still
 *         mounted; the correct list item is marked as selected.
 *   AC4 — During `isLoading`, a skeleton (`data-testid="cliente-detail-skeleton"`,
 *         `aria-busy="true"`) with at least 4 lines is shown.
 *   AC5 — On 404 from GET /api/v1/clientes/:id, the panel shows NotFoundClientePanel
 *         (`data-testid="cliente-not-found"`, `role="alert"`) with title
 *         "Cliente no encontrado", subtitle, and CTA "Volver a Clientes". No stack
 *         traces exposed to the UI. Ni el detail panel ni un mensaje genérico se
 *         muestran simultáneamente.
 *   AC6 — On 5xx from GET /api/v1/clientes/:id, the ErrorPanel
 *         (`data-testid="cliente-detail-error-panel"`, `role="alert"`) is rendered with
 *         a "Reintentar" button that triggers refetch.
 *   AC7 — On /clientes (index, sin `:clienteId`), the right panel shows the placeholder
 *         "Selecciona un cliente para ver el detalle" (`data-testid="cliente-detail-empty"`).
 *
 * Mapped test cases from _bmad-output/test-design-epic-2.md:
 *   P1#2  — GET /clientes/{id} returns 404 for non-existent id (backend + frontend)
 *   P1#3  — Deep link /clientes/:clienteId with unknown id shows not-found gracefully
 *   P1#12 — URL updates to /clientes/:clienteId on selection (FR30 deep linking)
 *   R-010 — Deep link with non-existent id shows graceful not-found (mitigation)
 *
 * Network-first pattern: all `page.route()` intercepts are registered BEFORE the
 * navigation call so the SPA's initial GETs (list + detail) hit the mocks.
 * Selectors use `data-testid` (never CSS classes) — resilient to markup churn.
 */

import { test, expect, type Route, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures / factories (local to Story 2.2 ATDD suite)
// ─────────────────────────────────────────────────────────────────────────────

type ClienteDto = {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
};

const now = '2026-07-02T12:00:00Z';

const seedClientes: ClienteDto[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Acme Corp',
    nit: '900123456-7',
    telefono: '+57 300 111 1111',
    ciudad: 'Cali',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Beta Distribuciones',
    nit: '800987654-3',
    telefono: '+57 301 222 2222',
    ciudad: 'Bogotá',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'Gamma Industrial',
    nit: '901234567-8',
    telefono: '+57 302 333 3333',
    ciudad: 'Medellín',
    createdAt: now,
    updatedAt: now,
  },
];

/** GET /api/v1/clientes → JSON array of the given seed. */
async function mockClientesList(page: Page, body: ClienteDto[]) {
  await page.route('**/api/v1/clientes', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
      return;
    }
    await route.continue();
  });
}

/** GET /api/v1/clientes/:id → 200 with the matching seed cliente, else 404 Problem Details. */
async function mockClientesDetailFromSeed(page: Page) {
  await page.route('**/api/v1/clientes/*', async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const url = new URL(route.request().url());
    const id = url.pathname.split('/').pop() ?? '';
    const found = seedClientes.find((c) => c.id === id);
    if (!found) {
      await route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
          title: 'Cliente no encontrado',
          status: 404,
          detail: `No existe ningún cliente con id ${id}.`,
          instance: url.pathname,
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(found),
    });
  });
}

/** GET /api/v1/clientes/:id → 404 Problem Details always. */
async function mockClientesDetailAlwaysNotFound(page: Page) {
  await page.route('**/api/v1/clientes/*', async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const url = new URL(route.request().url());
    await route.fulfill({
      status: 404,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
        title: 'Cliente no encontrado',
        status: 404,
        detail: 'No existe ningún cliente con ese id.',
        instance: url.pathname,
      }),
    });
  });
}

/** GET /api/v1/clientes/:id → 500 Problem Details. */
async function mockClientesDetailError(page: Page) {
  await page.route('**/api/v1/clientes/*', async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Server error',
        status: 500,
      }),
    });
  });
}

// A UUID that does NOT belong to any seed cliente — used for deep-link + 404 flows.
const UNKNOWN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — [TC-Story-2.2-Select] Click on a list item navigates to /clientes/:id
//        and renders the detail panel with the 4 fields; item is marked selected.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Clicking a ClientListItem opens the detail panel', () => {
  test('[TC-Story-2.2-Select] should navigate to /clientes/:id and render Nombre, NIT/RUC, Teléfono, Ciudad', async ({
    page,
  }) => {
    // GIVEN: The list is loaded with three clientes and detail endpoint is wired
    await mockClientesList(page, seedClientes);
    await mockClientesDetailFromSeed(page);
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);

    // WHEN: The user clicks on the first list item (Acme Corp)
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Corp' }).click();

    // THEN: The URL is now /clientes/<acme-id> (SPA — no page reload)
    await expect(page).toHaveURL(new RegExp(`/clientes/${seedClientes[0].id}$`));

    // AND: The detail panel is rendered with the four cliente fields
    const detail = page.getByTestId('cliente-detail-panel');
    await expect(detail).toBeVisible();
    await expect(detail).toHaveAttribute('role', 'region');
    await expect(detail.getByRole('heading', { name: 'Acme Corp' })).toBeVisible();
    await expect(page.getByTestId('cliente-detail-nit')).toHaveText('900123456-7');
    await expect(page.getByTestId('cliente-detail-telefono')).toHaveText('+57 300 111 1111');
    await expect(page.getByTestId('cliente-detail-ciudad')).toHaveText('Cali');
  });

  test('[TC-Story-2.2-Selected-Style] the clicked item should carry aria-pressed="true"', async ({
    page,
  }) => {
    // GIVEN: The list is loaded and detail endpoint is wired
    await mockClientesList(page, seedClientes);
    await mockClientesDetailFromSeed(page);
    await page.goto('/clientes');

    // WHEN: The user clicks on Beta Distribuciones
    const betaItem = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Beta Distribuciones' });
    await betaItem.click();

    // THEN: The Beta item is aria-pressed=true (visually marked as selected)
    await expect(betaItem).toHaveAttribute('aria-pressed', 'true');

    // AND: The unselected items are aria-pressed=false
    const acmeItem = page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Corp' });
    await expect(acmeItem).toHaveAttribute('aria-pressed', 'false');
  });

  test('[TC-Story-2.2-Select-NoReload] navigation to /clientes/:id must be SPA (no full-page reload)', async ({
    page,
  }) => {
    // GIVEN: The list is loaded; we plant a marker on window to detect a reload
    await mockClientesList(page, seedClientes);
    await mockClientesDetailFromSeed(page);
    await page.goto('/clientes');
    await page.evaluate(() => {
      (window as unknown as { __spaMarker__: boolean }).__spaMarker__ = true;
    });

    // WHEN: The user clicks the first item
    await page.getByTestId('cliente-list-item').first().click();
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // THEN: The marker is still set on window → no full reload happened (FR28 SPA)
    const stillHasMarker = await page.evaluate(
      () => (window as unknown as { __spaMarker__?: boolean }).__spaMarker__ === true,
    );
    expect(stillHasMarker).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — [TC-Story-2.2-Switch] Switching between items updates the panel
//        without unmounting the list, and does NOT re-fetch the list.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Switching selection swaps detail without unmounting the list', () => {
  test('[TC-Story-2.2-Switch] should update URL and detail when switching from X to Y', async ({
    page,
  }) => {
    // GIVEN: The list is loaded and detail endpoint is wired
    await mockClientesList(page, seedClientes);
    await mockClientesDetailFromSeed(page);
    await page.goto('/clientes');

    // WHEN: The user selects Acme first, then switches to Gamma
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Corp' }).click();
    await expect(page.getByRole('heading', { name: 'Acme Corp' })).toBeVisible();
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Gamma Industrial' }).click();

    // THEN: The URL changed to Gamma's id and the detail panel now shows Gamma
    await expect(page).toHaveURL(new RegExp(`/clientes/${seedClientes[2].id}$`));
    await expect(page.getByRole('heading', { name: 'Gamma Industrial' })).toBeVisible();
    await expect(page.getByTestId('cliente-detail-ciudad')).toHaveText('Medellín');

    // AND: The list is still mounted (list items remain present)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  });

  test('[TC-Story-2.2-Switch-NoRefetchList] switching selection should NOT refetch GET /api/v1/clientes', async ({
    page,
  }) => {
    // GIVEN: We count exact-path GETs to /api/v1/clientes (list) separately from detail
    let listGetCount = 0;
    await page.route('**/api/v1/clientes', async (route: Route) => {
      if (route.request().method() === 'GET') {
        listGetCount += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(seedClientes),
        });
        return;
      }
      await route.continue();
    });
    await mockClientesDetailFromSeed(page);
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
    const initialListGets = listGetCount;

    // WHEN: The user selects Acme, then Beta, then Gamma
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Corp' }).click();
    await expect(page.getByRole('heading', { name: 'Acme Corp' })).toBeVisible();
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Beta Distribuciones' }).click();
    await expect(page.getByRole('heading', { name: 'Beta Distribuciones' })).toBeVisible();
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Gamma Industrial' }).click();
    await expect(page.getByRole('heading', { name: 'Gamma Industrial' })).toBeVisible();

    // THEN: The list query was NOT refetched (still same count as before)
    expect(listGetCount).toBe(initialListGets);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — [TC-Story-2.2-DeepLink] Direct navigation to /clientes/:id
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep link /clientes/:id loads the detail directly', () => {
  test('[TC-Story-2.2-DeepLink] should render the detail when the URL is opened directly', async ({
    page,
  }) => {
    // GIVEN: List + detail endpoints are wired
    await mockClientesList(page, seedClientes);
    await mockClientesDetailFromSeed(page);

    // WHEN: The user opens /clientes/:id directly (paste in address bar)
    await page.goto(`/clientes/${seedClientes[1].id}`);

    // THEN: The detail panel shows Beta Distribuciones data
    const detail = page.getByTestId('cliente-detail-panel');
    await expect(detail).toBeVisible();
    await expect(detail.getByRole('heading', { name: 'Beta Distribuciones' })).toBeVisible();
    await expect(page.getByTestId('cliente-detail-nit')).toHaveText('800987654-3');
    await expect(page.getByTestId('cliente-detail-ciudad')).toHaveText('Bogotá');

    // AND: The list is still mounted with three items (split-panel preserved)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  });

  test('[TC-Story-2.2-DeepLink-Selected] the deep-linked cliente should be marked as selected in the list', async ({
    page,
  }) => {
    // GIVEN: List + detail endpoints are wired
    await mockClientesList(page, seedClientes);
    await mockClientesDetailFromSeed(page);

    // WHEN: The user opens /clientes/:id directly for Gamma
    await page.goto(`/clientes/${seedClientes[2].id}`);
    await expect(
      page.getByTestId('cliente-detail-panel').getByRole('heading', {
        name: 'Gamma Industrial',
      }),
    ).toBeVisible();

    // THEN: The corresponding list item carries aria-pressed=true
    const gammaItem = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Gamma Industrial' });
    await expect(gammaItem).toHaveAttribute('aria-pressed', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — [TC-Story-2.2-Skeleton] Loading skeleton with aria-busy
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Skeleton renders during initial detail fetch', () => {
  test('[TC-Story-2.2-Skeleton] should render cliente-detail-skeleton with aria-busy="true" while fetching', async ({
    page,
  }) => {
    // GIVEN: List returns immediately; detail response is deliberately delayed
    await mockClientesList(page, seedClientes);
    await page.route('**/api/v1/clientes/*', async (route: Route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const url = new URL(route.request().url());
      const id = url.pathname.split('/').pop() ?? '';
      const found = seedClientes.find((c) => c.id === id);
      if (!found) {
        await route.fulfill({ status: 404, body: '{}' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(found),
      });
    });

    // WHEN: The user opens the deep link (don't wait for network idle)
    await page.goto(`/clientes/${seedClientes[0].id}`, { waitUntil: 'commit' });

    // THEN: The skeleton is visible with aria-busy="true"
    const skeleton = page.getByTestId('cliente-detail-skeleton');
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — [TC-Story-2.2-NotFound] 404 → NotFoundClientePanel
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — 404 on GET /clientes/:id renders NotFoundClientePanel', () => {
  test('[TC-Story-2.2-NotFound] should render cliente-not-found panel with title, subtitle, and CTA', async ({
    page,
  }) => {
    // GIVEN: List returns clientes; detail endpoint always returns 404
    await mockClientesList(page, seedClientes);
    await mockClientesDetailAlwaysNotFound(page);

    // WHEN: The user deep-links to /clientes/<unknown-id>
    await page.goto(`/clientes/${UNKNOWN_ID}`);

    // THEN: The NotFoundClientePanel is visible with the expected copy
    const notFound = page.getByTestId('cliente-not-found');
    await expect(notFound).toBeVisible();
    await expect(notFound).toHaveAttribute('role', 'alert');
    await expect(notFound).toContainText('Cliente no encontrado');
    await expect(notFound).toContainText('El cliente que buscas no existe o fue eliminado.');

    // AND: The CTA "Volver a Clientes" is visible
    await expect(
      notFound.getByRole('button', { name: /volver a clientes/i }),
    ).toBeVisible();
  });

  test('[TC-Story-2.2-NotFound-NoDetail] the detail panel and generic error must NOT be rendered simultaneously', async ({
    page,
  }) => {
    // GIVEN: 404 flow is wired
    await mockClientesList(page, seedClientes);
    await mockClientesDetailAlwaysNotFound(page);

    // WHEN: The user deep-links to /clientes/<unknown-id>
    await page.goto(`/clientes/${UNKNOWN_ID}`);
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // THEN: The detail panel is NOT rendered and the generic error panel is NOT rendered
    await expect(page.getByTestId('cliente-detail-panel')).toHaveCount(0);
    await expect(page.getByTestId('cliente-detail-error-panel')).toHaveCount(0);
  });

  test('[TC-Story-2.2-NotFound-BackButton] clicking "Volver a Clientes" should navigate to /clientes', async ({
    page,
  }) => {
    // GIVEN: 404 flow is wired
    await mockClientesList(page, seedClientes);
    await mockClientesDetailAlwaysNotFound(page);
    await page.goto(`/clientes/${UNKNOWN_ID}`);
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // WHEN: The user clicks the CTA
    await page
      .getByTestId('cliente-not-found')
      .getByRole('button', { name: /volver a clientes/i })
      .click();

    // THEN: The URL is now exactly /clientes (SPA navigation)
    await expect(page).toHaveURL(/\/clientes\/?$/);
  });

  test('[TC-Story-2.2-NotFound-NoStackTrace] the not-found UI must NOT expose stack traces (NFR6)', async ({
    page,
  }) => {
    // GIVEN: 404 flow is wired
    await mockClientesList(page, seedClientes);
    await mockClientesDetailAlwaysNotFound(page);
    await page.goto(`/clientes/${UNKNOWN_ID}`);
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // WHEN: The panel is rendered
    const html = await page.content();

    // THEN: No C# / EF Core stack-trace signals appear in the DOM
    expect(html).not.toMatch(/System\.[A-Za-z]+Exception/);
    expect(html).not.toMatch(/Microsoft\.EntityFrameworkCore/);
    expect(html).not.toMatch(/\.cs:line \d+/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — [TC-Story-2.2-Error] 5xx → ErrorPanel with Reintentar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — 5xx on GET /clientes/:id renders ErrorPanel with retry', () => {
  test('[TC-Story-2.2-Error] should render cliente-detail-error-panel with Reintentar button on 500', async ({
    page,
  }) => {
    // GIVEN: List OK; detail returns 500
    await mockClientesList(page, seedClientes);
    await mockClientesDetailError(page);

    // WHEN: The user deep-links to a cliente
    await page.goto(`/clientes/${seedClientes[0].id}`);

    // THEN: The error panel is visible with role="alert" and CTA
    const errorPanel = page.getByTestId('cliente-detail-error-panel');
    await expect(errorPanel).toBeVisible();
    await expect(errorPanel).toHaveAttribute('role', 'alert');
    await expect(errorPanel.getByRole('button', { name: /reintentar/i })).toBeVisible();

    // AND: The not-found panel is NOT rendered (5xx is not 404)
    await expect(page.getByTestId('cliente-not-found')).toHaveCount(0);
  });

  test('[TC-Story-2.2-Error-Retry] clicking Reintentar should refetch and render the detail on success', async ({
    page,
  }) => {
    // GIVEN: First GET /clientes/:id fails with 500; subsequent calls succeed
    await mockClientesList(page, seedClientes);
    let detailGetCount = 0;
    await page.route('**/api/v1/clientes/*', async (route: Route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      detailGetCount += 1;
      if (detailGetCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ title: 'Server error', status: 500 }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedClientes[0]),
      });
    });

    await page.goto(`/clientes/${seedClientes[0].id}`);
    await expect(page.getByTestId('cliente-detail-error-panel')).toBeVisible();
    expect(detailGetCount).toBe(1);

    // WHEN: The user clicks Reintentar
    await page
      .getByTestId('cliente-detail-error-panel')
      .getByRole('button', { name: /reintentar/i })
      .click();

    // THEN: A second GET is issued and the detail is now rendered
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Acme Corp' })).toBeVisible();
    expect(detailGetCount).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — [TC-Story-2.2-Empty-Placeholder] Placeholder on /clientes index
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Placeholder on /clientes when no cliente is selected', () => {
  test('[TC-Story-2.2-Empty-Placeholder] should render cliente-detail-empty on /clientes (no :id)', async ({
    page,
  }) => {
    // GIVEN: The list endpoint returns clientes
    await mockClientesList(page, seedClientes);
    await mockClientesDetailFromSeed(page);

    // WHEN: The user navigates to /clientes without a :clienteId
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);

    // THEN: The empty-detail placeholder is rendered
    const empty = page.getByTestId('cliente-detail-empty');
    await expect(empty).toBeVisible();
    await expect(empty).toContainText('Selecciona un cliente para ver el detalle');

    // AND: The detail panel is NOT rendered
    await expect(page.getByTestId('cliente-detail-panel')).toHaveCount(0);
  });
});
