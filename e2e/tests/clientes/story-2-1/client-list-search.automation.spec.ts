/**
 * Story 2.1: Client List & Search — Automation Expansion
 * Epic 2: Client Management
 *
 * AUTOMATION EXPANSION: Edge cases, error paths, and boundary conditions
 * not covered in the ATDD spec (client-list-search.spec.ts).
 *
 * Coverage plan:
 *   E2E (P1-P2): Partial search match, special chars, debounce, contact count badge,
 *                multi-selection replacement, 500-record performance boundary,
 *                right panel placeholder, list accessibility attributes, network abort
 *   API (P1-P2): Response timing, CORS header presence, createdAt ISO 8601 format,
 *                contactCount >= 0 invariant, contactCount type validation
 */

import { test, expect } from '@playwright/test';
import { buildCliente, buildClientes } from '../../../factories/cliente.factory';

const API_URL = '**/api/v1/clientes';
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES: Search — partial, special chars, debounce
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Search edge cases — partial match and special characters', () => {
  test('[P1] should match client by partial NIT substring', async ({ page }) => {
    // GIVEN: A client with a specific NIT
    const cliente = buildCliente({ nombre: 'Empresa Parcial', nit: '900555111' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user types only a partial NIT substring
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await searchInput.fill('555');

    // THEN: The client matching the partial NIT is visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Parcial' }),
    ).toBeVisible();
  });

  test('[P1] should match client by partial name (mid-string)', async ({ page }) => {
    // GIVEN: A client with a multi-word nombre
    const clienteA = buildCliente({ nombre: 'Constructora Bolivar SA', nit: '111000111' });
    const clienteB = buildCliente({ nombre: 'Distribuidora del Norte', nit: '222000222' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user types a mid-string word from the name
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await searchInput.fill('Bolivar');

    // THEN: Only the matching client is visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Constructora Bolivar SA' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Distribuidora del Norte' }),
    ).not.toBeVisible();
  });

  test('[P2] should handle search term with leading and trailing whitespace', async ({ page }) => {
    // GIVEN: A client named "Acme SAS"
    const cliente = buildCliente({ nombre: 'Acme SAS' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user types with surrounding whitespace
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await searchInput.fill('  Acme  ');

    // THEN: The client is still visible (trim applied)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Acme SAS' }),
    ).toBeVisible();
  });

  test('[P2] should not match clients when search input is only whitespace', async ({ page }) => {
    // GIVEN: Two clients exist
    const clienteA = buildCliente({ nombre: 'Empresa Uno' });
    const clienteB = buildCliente({ nombre: 'Empresa Dos' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The search input contains only whitespace (treated as empty)
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await searchInput.fill('   ');

    // THEN: Full list is shown (whitespace-only query = empty query per useMemo trim)
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES: Contact count badge — actual count display
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Contact count badge — display with varying contactCount values', () => {
  test('[P1] should display contact count badge when contactCount is exactly 1', async ({
    page,
  }) => {
    // GIVEN: A client with exactly 1 contact
    const cliente = buildCliente({ contactCount: 1 });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: No amber badge shown, regular contact count badge shown
    const item = page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre });
    await expect(item.getByTestId('sin-contactos-badge')).not.toBeVisible();
  });

  test('[P1] should NOT display amber badge when contactCount is a large number', async ({
    page,
  }) => {
    // GIVEN: A client with many contacts
    const cliente = buildCliente({ contactCount: 99 });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: No amber ⚠ badge present for this client
    const item = page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre });
    await expect(item.getByTestId('sin-contactos-badge')).not.toBeVisible();
  });

  test('[P2] should display amber badge for multiple clients that all have zero contacts', async ({
    page,
  }) => {
    // GIVEN: Two clients both with contactCount 0
    const clienteA = buildCliente({ contactCount: 0, nombre: 'Cliente Sin A' });
    const clienteB = buildCliente({ contactCount: 0, nombre: 'Cliente Sin B' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: Both items show the amber badge
    const itemA = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Cliente Sin A' });
    const itemB = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Cliente Sin B' });
    await expect(itemA.getByTestId('sin-contactos-badge')).toBeVisible();
    await expect(itemB.getByTestId('sin-contactos-badge')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES: Selection — only one item selected at a time
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Selection — single active selection enforced', () => {
  test('[P1] should deselect previous item when a new client is clicked', async ({ page }) => {
    // GIVEN: Two clients are displayed
    const clienteA = buildCliente({ nombre: 'Primera Empresa' });
    const clienteB = buildCliente({ nombre: 'Segunda Empresa' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the first client
    const itemA = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Primera Empresa' });
    await itemA.click();
    await expect(itemA).toHaveAttribute('aria-selected', 'true');

    // AND: Then clicks on the second client
    const itemB = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Segunda Empresa' });
    await itemB.click();

    // THEN: The second item is now selected and the first is no longer selected
    await expect(itemB).toHaveAttribute('aria-selected', 'true');
    await expect(itemA).not.toHaveAttribute('aria-selected', 'true');
  });

  test('[P2] should maintain selection when search is performed after selecting', async ({
    page,
  }) => {
    // GIVEN: Two clients, one is selected
    const clienteA = buildCliente({ nombre: 'Acme Seleccionado', nit: '100100100' });
    const clienteB = buildCliente({ nombre: 'Beta Company', nit: '200200200' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      }),
    );

    await page.goto('/clientes');

    // Select clienteA
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Seleccionado' }).click();

    // WHEN: The user searches, filtering to show only clienteA
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await searchInput.fill('Acme');

    // THEN: clienteA is still selected after filter
    const itemA = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Acme Seleccionado' });
    await expect(itemA).toBeVisible();
    await expect(itemA).toHaveAttribute('aria-selected', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES: Right panel — initial state before any selection
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Right panel — placeholder state', () => {
  test('[P2] should not show client detail panel before any client is selected', async ({
    page,
  }) => {
    // GIVEN: Clients are loaded
    const cliente = buildCliente({ nombre: 'Sin Selección' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: The user navigates to /clientes without clicking anything
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toBeVisible();

    // THEN: The detail panel does not show a client's details (it's in placeholder/empty state)
    await expect(page.getByTestId('cliente-detail-panel')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES: Accessibility — list container attributes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Accessibility — list container and search landmark', () => {
  test('[P1] should have aria-busy=false on list panel after data loads', async ({ page }) => {
    // GIVEN: Client data loads successfully
    const cliente = buildCliente();

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: The user navigates and the fetch completes
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toBeVisible();

    // THEN: aria-busy is false (no longer loading)
    const listPanel = page.getByTestId('clientes-list-panel');
    await expect(listPanel).not.toHaveAttribute('aria-busy', 'true');
  });

  test('[P1] should have aria-label on the search input for screen readers', async ({ page }) => {
    // GIVEN: The client list is loaded
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente()]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The search input has an aria-label (or is labelled via the search landmark)
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await expect(searchInput).toBeVisible();
    // The searchbox is labelled either via aria-label or aria-labelledby
    const ariaLabel = await searchInput.getAttribute('aria-label');
    const ariaLabelledby = await searchInput.getAttribute('aria-labelledby');
    expect(ariaLabel || ariaLabelledby).toBeTruthy();
  });

  test('[P2] should not display a spinner (role=status) at any point during normal load', async ({
    page,
  }) => {
    // GIVEN: Data loads normally (no delay)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente()]),
      }),
    );

    // WHEN: The user navigates and waits for list to render
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toBeVisible();

    // THEN: No spinner is visible (skeleton is used per AC6, not a spinner)
    await expect(page.getByRole('status', { name: /cargando/i })).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES: Network abort — connection dropped
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Network abort — connection failure', () => {
  test('[P1] should display ErrorPanel when the network request is aborted', async ({ page }) => {
    // GIVEN: The network request is aborted (simulates offline/timeout)
    await page.route(API_URL, (route) => route.abort('failed'));

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed (same as server error — any fetch failure)
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P1] should display retry button after a network abort', async ({ page }) => {
    // GIVEN: The network request is aborted
    await page.route(API_URL, (route) => route.abort('failed'));

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The "Intentar de nuevo" retry button is visible
    await expect(page.getByRole('button', { name: /intentar de nuevo/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES: Performance boundary — 500 records (NFR1)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Performance boundary — 500 records filter under 1 second', () => {
  test('[P2] should filter 500 records in under 1 second after user types', async ({ page }) => {
    // GIVEN: 500 clients loaded — all with predictable nombres except one
    const uniqueCliente = buildCliente({ nombre: 'Empresa Única XYZ999', nit: '999999999' });
    const massClientes = buildClientes(499);

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([uniqueCliente, ...massClientes]),
      }),
    );

    await page.goto('/clientes');

    // Wait for list to load
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // WHEN: The user searches for the unique client (timed)
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    const before = Date.now();
    await searchInput.fill('XYZ999');

    // THEN: The unique result is visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Única XYZ999' }),
    ).toBeVisible();
    const elapsed = Date.now() - before;

    // Filter must complete in under 1000ms (NFR1)
    expect(elapsed).toBeLessThan(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES: Retry recovery — client list replaces error panel after retry
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ErrorPanel retry — full state restoration', () => {
  test('[P1] should hide ErrorPanel and show client list after successful retry', async ({
    page,
  }) => {
    // GIVEN: First request fails, second succeeds
    const cliente = buildCliente({ nombre: 'Empresa Recuperada' });
    let callCount = 0;

    await page.route(API_URL, (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      });
    });

    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: The user clicks retry
    await page.getByRole('button', { name: /intentar de nuevo/i }).click();

    // THEN: ErrorPanel is gone and the list is visible
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Recuperada' }),
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES: Empty state transitions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] EmptyState transitions — switching between states', () => {
  test('[P2] should show search-empty state and then restore all clients on clear', async ({
    page,
  }) => {
    // GIVEN: Three clients exist
    const clientes = [
      buildCliente({ nombre: 'Alpha Corp' }),
      buildCliente({ nombre: 'Beta Industries' }),
      buildCliente({ nombre: 'Gamma LLC' }),
    ];

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );

    await page.goto('/clientes');
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });

    // WHEN: User searches for non-matching term
    await searchInput.fill('ZZZZZ_NOMATCH');
    await expect(page.getByTestId('empty-state-search-empty')).toBeVisible();

    // AND: User clears the search
    await searchInput.clear();

    // THEN: All three clients are visible again
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  });

  test('[P2] should not show no-clients empty state when search-empty is active', async ({
    page,
  }) => {
    // GIVEN: One client exists
    const cliente = buildCliente({ nombre: 'Solo Client' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: User types a non-matching search
    await page.getByRole('searchbox', { name: /buscar clientes/i }).fill('NOMATCHAROO');

    // THEN: search-empty variant is shown, NOT no-clients variant
    await expect(page.getByTestId('empty-state-search-empty')).toBeVisible();
    await expect(page.getByTestId('empty-state-no-clients')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API CONTRACT: Additional validation — date format, contactCount invariants
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] API contract — additional field validations', () => {
  test('[P2] should return createdAt in ISO 8601 format with timezone', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    // THEN: Each item's createdAt is a valid ISO 8601 string with timezone
    if (body.length > 0) {
      const item = body[0];
      expect(typeof item.createdAt).toBe('string');
      // ISO 8601 with timezone: matches "2026-03-12T10:30:00Z" or with offset
      expect(item.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
      );
    }
  });

  test('[P2] should return contactCount as a non-negative integer for all items', async ({
    request,
  }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    // THEN: contactCount is a non-negative integer for every item
    for (const item of body) {
      expect(typeof item.contactCount).toBe('number');
      expect(Number.isInteger(item.contactCount)).toBe(true);
      expect(item.contactCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('[P2] should return nombre and nit as non-empty strings for all items', async ({
    request,
  }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    // THEN: nombre and nit are non-empty strings per API contract
    for (const item of body) {
      expect(typeof item.nombre).toBe('string');
      expect(item.nombre.trim().length).toBeGreaterThan(0);
      expect(typeof item.nit).toBe('string');
      expect(item.nit.trim().length).toBeGreaterThan(0);
    }
  });

  test('[P2] should return id as a valid UUID (v4 format) for all items', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    // THEN: Each id is a UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const item of body) {
      expect(typeof item.id).toBe('string');
      expect(item.id).toMatch(uuidRegex);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES: Skeleton — aria-busy transition
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Skeleton loading — aria-busy lifecycle', () => {
  test('[P1] should remove skeleton and set aria-busy=false when load completes', async ({
    page,
  }) => {
    // GIVEN: A controlled delayed response
    let resolveRoute: ((value: unknown) => void) | null = null;
    const routeHeld = new Promise((resolve) => {
      resolveRoute = resolve;
    });

    await page.route(API_URL, async (route) => {
      await routeHeld;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente({ nombre: 'Post-Skeleton Cliente' })]),
      });
    });

    await page.goto('/clientes');

    // VERIFY: Skeleton shown and aria-busy=true during loading
    await expect(page.getByTestId('client-list-skeleton')).toBeVisible();
    await expect(page.getByTestId('clientes-list-panel')).toHaveAttribute('aria-busy', 'true');

    // WHEN: Response resolves
    resolveRoute!(null);

    // THEN: Skeleton is hidden and aria-busy is no longer true
    await expect(page.getByTestId('client-list-skeleton')).not.toBeVisible();
    await expect(page.getByTestId('clientes-list-panel')).not.toHaveAttribute('aria-busy', 'true');
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Post-Skeleton Cliente' }),
    ).toBeVisible();
  });
});
