/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase
 * These E2E tests intentionally FAIL until Story 2.1 is implemented.
 *
 * Acceptance Criteria covered here (see story 2.1):
 *   AC1 — 280px left panel (data-testid="clientes-list-panel") renders on /clientes
 *         with header "Clientes", search Input (aria-label="Buscar clientes"),
 *         and vertical scrollable list of ClientListItem showing Nombre + NIT/RUC.
 *   AC2 — Real-time client-side filter matches Nombre OR NIT (case-insensitive).
 *   AC3 — Empty search result shows EmptyState variant "search-empty".
 *   AC4 — Zero clients backend shows EmptyState variant "no-clients" + CTA.
 *   AC5 — Backend error shows ErrorPanel (role="alert", data-testid="clientes-error-panel")
 *         with "Reintentar" button that refetches.
 *   AC6 — Loading state shows skeletons and aria-busy="true"; search input disabled.
 *   AC7 — Spanish UI, WCAG 2.1 AA (aria-label on input, touch target 44px min).
 *
 * Mapped test cases from _bmad-output/test-design-epic-2.md:
 *   P1#1 — GET /clientes list             — covered here + api spec
 *   P1#4 — Real-time filter Nombre/NIT    — covered here
 *   P1#5 — EmptyState variant no-clients  — covered here
 *   P1#6 — ErrorPanel + Reintentar        — covered here
 *   P0#6 — Search under 1s @ 500 records  — covered by frontend perf component test (Task 14)
 *
 * Network-first pattern: all `page.route()` intercepts are registered BEFORE the
 * navigation call so the SPA's initial GET /api/v1/clientes hits the mock.
 * Selectors use `data-testid` (never CSS classes) — resilient to markup churn.
 */

import { test, expect, type Route } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures / factories (local to Story 2.1 ATDD suite)
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

const now = '2026-07-01T12:00:00Z';

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

/** Intercepts GET /api/v1/clientes with a JSON body. */
async function mockClientesList(
  page: import('@playwright/test').Page,
  body: ClienteDto[],
) {
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

/** Intercepts GET /api/v1/clientes with a 500 error. */
async function mockClientesError(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/clientes', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Server error',
          status: 500,
        }),
      });
      return;
    }
    await route.continue();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — [TC-Story-2.1-Panel] 280px left panel with header + search + list
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Left panel (280px) renders list of clientes', () => {
  test('[TC-Story-2.1-Panel] should render clientes-list-panel with header, search input, and one item per cliente', async ({
    page,
  }) => {
    // GIVEN: The backend returns three clients
    await mockClientesList(page, seedClientes);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The left panel is visible
    const panel = page.getByTestId('clientes-list-panel');
    await expect(panel).toBeVisible();

    // AND: A header shows the title "Clientes"
    await expect(panel.getByRole('heading', { name: /clientes/i })).toBeVisible();

    // AND: The search input is present with the expected aria-label + placeholder
    const searchInput = page.getByTestId('clientes-search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('aria-label', 'Buscar clientes');
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      'Buscar por nombre o NIT...',
    );

    // AND: One list item per cliente is rendered
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(seedClientes.length);
  });

  test('[TC-Story-2.1-Panel-Item] should display Nombre and NIT for each cliente', async ({
    page,
  }) => {
    // GIVEN: The backend returns one cliente with known Nombre + NIT
    await mockClientesList(page, [seedClientes[0]]);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The item renders Acme Corp with its NIT
    const item = page.getByTestId('cliente-list-item').first();
    await expect(item).toContainText('Acme Corp');
    await expect(item).toContainText('900123456-7');
  });

  test('[TC-Story-2.1-Panel-Width] should mark the panel with the 280px width class on desktop', async ({
    page,
  }) => {
    // GIVEN: The backend returns clients
    await mockClientesList(page, seedClientes);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The panel root has the Tailwind lg:w-[280px] class (proxy assertion — jsdom-safe)
    const panel = page.getByTestId('clientes-list-panel');
    await expect(panel).toHaveClass(/lg:w-\[280px\]/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — [TC-Story-2.1-Filter] Real-time filter by Nombre OR NIT (case-insensitive)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Client-side real-time search filter', () => {
  test('[TC-Story-2.1-Filter-Nombre] should filter list by Nombre in real time (case-insensitive)', async ({
    page,
  }) => {
    // GIVEN: The list is loaded with three clientes
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);

    // WHEN: The user types "acme" (lowercase) into the search box
    await page.getByTestId('clientes-search-input').fill('acme');

    // THEN: Only the matching cliente remains visible
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Acme Corp');
  });

  test('[TC-Story-2.1-Filter-NIT] should filter list by NIT substring', async ({
    page,
  }) => {
    // GIVEN: The list is loaded with three clientes
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');

    // WHEN: The user types a partial NIT
    await page.getByTestId('clientes-search-input').fill('800987');

    // THEN: Only the cliente whose NIT contains "800987" remains
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Beta Distribuciones');
  });

  test('[TC-Story-2.1-Filter-NoExtraFetch] should NOT trigger an additional GET /clientes when typing', async ({
    page,
  }) => {
    // GIVEN: We count GET /api/v1/clientes calls made by the SPA
    let getCount = 0;
    await page.route('**/api/v1/clientes', async (route: Route) => {
      if (route.request().method() === 'GET') {
        getCount += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(seedClientes),
        });
        return;
      }
      await route.continue();
    });
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
    const initialGetCount = getCount;

    // WHEN: The user types repeatedly in the search box
    await page.getByTestId('clientes-search-input').fill('acme');
    await page.getByTestId('clientes-search-input').fill('beta');
    await page.getByTestId('clientes-search-input').fill('gamma');

    // THEN: No new backend calls were issued (client-side filter over TanStack cache)
    expect(getCount).toBe(initialGetCount);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — [TC-Story-2.1-Search-Empty] EmptyState "search-empty"
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Search returns no matches', () => {
  test('[TC-Story-2.1-Search-Empty] should render EmptyState variant "search-empty" when filter matches nothing', async ({
    page,
  }) => {
    // GIVEN: The list is loaded
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);

    // WHEN: The user searches for a string not present in any Nombre or NIT
    await page.getByTestId('clientes-search-input').fill('zzz-no-match-zzz');

    // THEN: The list is empty and the search-empty EmptyState is shown
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
    const emptyState = page.getByTestId('empty-state-search-empty');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No se encontró ningún cliente');
    await expect(emptyState).toContainText('Intenta con otro nombre o NIT');
  });

  test('[TC-Story-2.1-Search-Empty-InputVisible] should keep search input visible with the current query', async ({
    page,
  }) => {
    // GIVEN: The search filter produces no matches
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');
    await page.getByTestId('clientes-search-input').fill('zzz-no-match-zzz');

    // WHEN: The empty state is displayed
    // THEN: The search input remains visible with the typed value
    const input = page.getByTestId('clientes-search-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('zzz-no-match-zzz');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — [TC-Story-2.1-No-Clients] EmptyState "no-clients"
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Zero clientes registered', () => {
  test('[TC-Story-2.1-No-Clients] should render EmptyState variant "no-clients" with CTA "Nuevo cliente"', async ({
    page,
  }) => {
    // GIVEN: The backend returns an empty array
    await mockClientesList(page, []);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The EmptyState no-clients is displayed
    const emptyState = page.getByTestId('empty-state-no-clients');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No hay clientes registrados');
    await expect(emptyState).toContainText('Crea el primer cliente del sistema');

    // AND: The "Nuevo cliente" CTA button is visible
    await expect(
      emptyState.getByRole('button', { name: /nuevo cliente/i }),
    ).toBeVisible();
  });

  test('[TC-Story-2.1-No-Clients-InputDisabled] should disable the search input when the list is empty', async ({
    page,
  }) => {
    // GIVEN: The backend returns []
    await mockClientesList(page, []);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The search input is disabled
    await expect(page.getByTestId('clientes-search-input')).toBeDisabled();
  });

  test('[TC-Story-2.1-No-Clients-AriaLive] should mark the empty state with aria-live="polite"', async ({
    page,
  }) => {
    // GIVEN: The backend returns []
    await mockClientesList(page, []);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The empty state exposes aria-live="polite" for assistive tech
    const emptyState = page.getByTestId('empty-state-no-clients');
    await expect(emptyState).toHaveAttribute('aria-live', 'polite');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — [TC-Story-2.1-Error] ErrorPanel with Reintentar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Backend error on initial fetch', () => {
  test('[TC-Story-2.1-Error] should render ErrorPanel with "Reintentar" when the fetch fails', async ({
    page,
  }) => {
    // GIVEN: The backend returns 500 on the initial fetch
    await mockClientesError(page);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The error panel is rendered (role="alert" for a11y)
    const errorPanel = page.getByTestId('clientes-error-panel');
    await expect(errorPanel).toBeVisible();
    await expect(errorPanel).toHaveAttribute('role', 'alert');
    await expect(errorPanel).toContainText('No se pudo cargar');
    await expect(errorPanel).toContainText(
      'Verifica tu conexión e intenta de nuevo.',
    );

    // AND: The Reintentar button is available
    await expect(
      errorPanel.getByRole('button', { name: /reintentar/i }),
    ).toBeVisible();
  });

  test('[TC-Story-2.1-Error-NoList] should NOT render the list or empty state while errored', async ({
    page,
  }) => {
    // GIVEN: Backend errors
    await mockClientesError(page);
    await page.goto('/clientes');

    // WHEN: The error panel is shown
    await expect(page.getByTestId('clientes-error-panel')).toBeVisible();

    // THEN: No cliente list items or empty states are rendered simultaneously
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
    await expect(page.getByTestId('empty-state-no-clients')).toHaveCount(0);
    await expect(page.getByTestId('empty-state-search-empty')).toHaveCount(0);
  });

  test('[TC-Story-2.1-Error-Reintentar] should refetch /api/v1/clientes when Reintentar is clicked', async ({
    page,
  }) => {
    // GIVEN: The first GET fails with 500 but subsequent GETs succeed
    let getCount = 0;
    await page.route('**/api/v1/clientes', async (route: Route) => {
      if (route.request().method() === 'GET') {
        getCount += 1;
        if (getCount === 1) {
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
          body: JSON.stringify(seedClientes),
        });
        return;
      }
      await route.continue();
    });
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-error-panel')).toBeVisible();
    expect(getCount).toBe(1);

    // WHEN: The user clicks Reintentar
    await page
      .getByTestId('clientes-error-panel')
      .getByRole('button', { name: /reintentar/i })
      .click();

    // THEN: A second GET is issued and the list is rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
    expect(getCount).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — [TC-Story-2.1-Loading] Skeleton + aria-busy during initial load
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Loading state while data is fetching', () => {
  test('[TC-Story-2.1-Loading] should render skeleton with aria-busy="true" while fetching', async ({
    page,
  }) => {
    // GIVEN: The backend response is deliberately delayed
    await page.route('**/api/v1/clientes', async (route: Route) => {
      if (route.request().method() === 'GET') {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(seedClientes),
        });
        return;
      }
      await route.continue();
    });

    // WHEN: The user navigates to /clientes (don't wait for network idle)
    await page.goto('/clientes', { waitUntil: 'commit' });

    // THEN: The loading skeleton container is visible with aria-busy="true"
    const skeleton = page.getByTestId('clientes-list-skeleton');
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  test('[TC-Story-2.1-Loading-InputDisabled] should disable the search input during loading', async ({
    page,
  }) => {
    // GIVEN: The backend response is delayed
    await page.route('**/api/v1/clientes', async (route: Route) => {
      if (route.request().method() === 'GET') {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(seedClientes),
        });
        return;
      }
      await route.continue();
    });

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes', { waitUntil: 'commit' });

    // THEN: The search input is present but disabled during loading
    const input = page.getByTestId('clientes-search-input');
    await expect(input).toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — [TC-Story-2.1-Spanish-A11y] Spanish UI + WCAG 2.1 AA basics
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Spanish UI and accessibility', () => {
  test('[TC-Story-2.1-Spanish-A11y] should render all user-facing text in Spanish (es-CO)', async ({
    page,
  }) => {
    // GIVEN: The backend returns clients
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');

    // WHEN: The panel renders
    // THEN: All labels/placeholders are in Spanish
    const searchInput = page.getByTestId('clientes-search-input');
    await expect(searchInput).toHaveAttribute('aria-label', 'Buscar clientes');
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      'Buscar por nombre o NIT...',
    );

    // AND: The header title is "Clientes"
    await expect(
      page.getByTestId('clientes-list-panel').getByRole('heading', {
        name: /clientes/i,
      }),
    ).toBeVisible();
  });

  test('[TC-Story-2.1-A11y-TouchTarget] cliente list items should meet 44px minimum height for touch targets', async ({
    page,
  }) => {
    // GIVEN: The backend returns clients
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');

    // WHEN: The first item is measured
    const item = page.getByTestId('cliente-list-item').first();
    await expect(item).toBeVisible();
    const box = await item.boundingBox();

    // THEN: Its height is >= 44px (WCAG 2.1 AA touch target)
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
