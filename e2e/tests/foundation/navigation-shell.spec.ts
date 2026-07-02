/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These E2E tests intentionally FAIL until the AppShell + routes are implemented.
 *
 * Acceptance Criteria covered here (see story 1.2):
 *   AC1 — Desktop viewport renders NavigationRail with Clientes + Contactos
 *   AC2 — Mobile viewport renders NavigationBar with Clientes + Contactos
 *   AC3 — SPA navigation between /clientes ↔ /contactos (no full page reload)
 *   AC4 — Deep link to /clientes renders the Clientes view without redirect
 *   AC5 — Deep link to /contactos renders the Contactos view without redirect
 *   AC6 — Unknown route renders NotFoundView (shell preserved)
 *   AC7 — Root path (/) redirects to /clientes
 *   AC8 — All user-facing text in Spanish
 *
 * Aligned with test cases from _bmad-output/implementation-artifacts/test-design-epic-1.md:
 *   TC-E1-P1-01 (navigation), TC-E1-P1-02 (deep-link /clientes),
 *   TC-E1-P1-03 (deep-link /contactos), TC-E1-P1-04 (404),
 *   TC-E1-P2-01 (nav-rail desktop), TC-E1-P2-02 (nav-bar mobile),
 *   TC-E1-P2-03 (/ redirects).
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — [TC-E1-P2-03] Root path redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Root path (/) redirects to /clientes', () => {
  test('[TC-E1-P2-03] should redirect from / to /clientes on load', async ({ page }) => {
    // GIVEN: The application is loaded and TanStack Router has a beforeLoad redirect on '/'
    // WHEN: The user visits the root URL
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: The final URL is /clientes (no flash of placeholder)
    expect(page.url()).toMatch(/\/clientes$/);
  });

  test('[TC-E1-P2-03] should NOT render the old "Siesa Agents CRM" placeholder heading at /', async ({
    page,
  }) => {
    // GIVEN: Story 1.2 removes the Story 1.1 placeholder home page
    // WHEN: The user visits /
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: The heading is "Clientes", not "Siesa Agents CRM"
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(/Clientes/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — [TC-E1-P1-02] Deep link to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Direct navigation to /clientes (deep link)', () => {
  test('[TC-E1-P1-02] should render the Clientes view with an <h1> "Clientes"', async ({ page }) => {
    // GIVEN: The user pastes /clientes into the address bar (no prior navigation)
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: An <h1> containing "Clientes" is visible (no redirect to /)
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(/Clientes/i);
  });

  test('[TC-E1-P1-02] should NOT redirect away from /clientes on deep link', async ({ page }) => {
    // GIVEN: /clientes is a real route in the router
    // WHEN: The user navigates directly
    await page.goto('/clientes');

    // THEN: The URL remains /clientes
    expect(page.url()).toMatch(/\/clientes$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — [TC-E1-P1-03] Deep link to /contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Direct navigation to /contactos (deep link)', () => {
  test('[TC-E1-P1-03] should render the Contactos view with an <h1> "Contactos"', async ({ page }) => {
    // GIVEN: The user pastes /contactos into the address bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: An <h1> containing "Contactos" is visible (no redirect, no blank page)
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(/Contactos/i);
  });

  test('[TC-E1-P1-03] should NOT redirect away from /contactos on deep link', async ({ page }) => {
    // GIVEN: /contactos is a real route in the router
    // WHEN: The user navigates directly
    await page.goto('/contactos');

    // THEN: The URL remains /contactos
    expect(page.url()).toMatch(/\/contactos$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — [TC-E1-P2-01] Desktop viewport renders NavigationRail
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop viewport (≥ 1024px) renders NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[TC-E1-P2-01] should render the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The viewport is desktop (1280×800)
    // WHEN: The user views any route in the app shell
    await page.goto('/clientes');

    // THEN: The NavigationRail is visible
    await expect(page.locator('[data-testid="nav-rail"]')).toBeVisible();
  });

  test('[TC-E1-P2-01] should NOT render the mobile NavigationBar on desktop', async ({ page }) => {
    // GIVEN: The viewport is desktop
    // WHEN: The user views any route
    await page.goto('/clientes');

    // THEN: The NavigationBar is hidden or absent from layout on desktop
    await expect(page.locator('[data-testid="nav-bar"]')).toBeHidden();
  });

  test('[TC-E1-P2-01] should show the "Clientes" entry inside the NavigationRail', async ({ page }) => {
    // GIVEN: The desktop shell is rendered
    // WHEN: The user inspects the rail
    await page.goto('/clientes');

    // THEN: An accessible "Clientes" nav entry is present in the rail
    const rail = page.locator('[data-testid="nav-rail"]');
    await expect(rail.getByRole('button', { name: /clientes/i })).toBeVisible();
  });

  test('[TC-E1-P2-01] should show the "Contactos" entry inside the NavigationRail', async ({ page }) => {
    // GIVEN: The desktop shell is rendered
    // WHEN: The user inspects the rail
    await page.goto('/clientes');

    // THEN: An accessible "Contactos" nav entry is present in the rail
    const rail = page.locator('[data-testid="nav-rail"]');
    await expect(rail.getByRole('button', { name: /contactos/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — [TC-E1-P2-02] Mobile viewport renders NavigationBar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile viewport (< 1024px) renders NavigationBar', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('[TC-E1-P2-02] should render the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The viewport is mobile (375×667)
    // WHEN: The user views any route in the shell
    await page.goto('/clientes');

    // THEN: The NavigationBar is visible
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
  });

  test('[TC-E1-P2-02] should NOT render the desktop NavigationRail on mobile', async ({ page }) => {
    // GIVEN: The viewport is mobile
    // WHEN: The user views any route
    await page.goto('/clientes');

    // THEN: The NavigationRail is hidden on mobile
    await expect(page.locator('[data-testid="nav-rail"]')).toBeHidden();
  });

  test('[TC-E1-P2-02] should show the "Clientes" entry inside the NavigationBar', async ({ page }) => {
    // GIVEN: The mobile shell is rendered
    // WHEN: The user inspects the bottom nav
    await page.goto('/clientes');

    // THEN: An accessible "Clientes" nav entry is present in the bar
    const bar = page.locator('[data-testid="nav-bar"]');
    await expect(bar.getByRole('button', { name: /clientes/i })).toBeVisible();
  });

  test('[TC-E1-P2-02] should show the "Contactos" entry inside the NavigationBar', async ({ page }) => {
    // GIVEN: The mobile shell is rendered
    // WHEN: The user inspects the bottom nav
    await page.goto('/clientes');

    // THEN: An accessible "Contactos" nav entry is present in the bar
    const bar = page.locator('[data-testid="nav-bar"]');
    await expect(bar.getByRole('button', { name: /contactos/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — [TC-E1-P1-01] SPA navigation between /clientes ↔ /contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — SPA navigation between sections (no full reload)', () => {
  test('[TC-E1-P1-01-e2e] should navigate from /clientes to /contactos without a full page reload', async ({
    page,
  }) => {
    // GIVEN: The user is on /clientes with the desktop shell
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

    // Sentinel: mark the DOM so we can detect a full reload (a reload wipes window state)
    await page.evaluate(() => {
      (window as unknown as { __atddSentinel?: boolean }).__atddSentinel = true;
    });

    // WHEN: The user clicks the Contactos nav item
    const rail = page.locator('[data-testid="nav-rail"]');
    await rail.getByRole('button', { name: /contactos/i }).click();
    await page.waitForURL('**/contactos');

    // THEN: URL is /contactos and no full reload happened (sentinel survives, app-root still mounted)
    expect(page.url()).toMatch(/\/contactos$/);
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
    const sentinel = await page.evaluate(
      () => (window as unknown as { __atddSentinel?: boolean }).__atddSentinel === true,
    );
    expect(sentinel).toBe(true);
  });

  test('[TC-E1-P1-01-e2e] should perform exactly one browser navigation entry (no full reload) after clicking Contactos', async ({
    page,
  }) => {
    // GIVEN: The user is on /clientes
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');

    // WHEN: The user clicks the Contactos nav item
    const rail = page.locator('[data-testid="nav-rail"]');
    await rail.getByRole('button', { name: /contactos/i }).click();
    await page.waitForURL('**/contactos');

    // THEN: window.performance recorded only one navigation entry (the initial goto)
    // A full page reload triggered by window.location would add a second entry.
    const navEntries = await page.evaluate(
      () => window.performance.getEntriesByType('navigation').length,
    );
    expect(navEntries).toBe(1);
  });

  test('[TC-E1-P1-01-e2e] should navigate back from /contactos to /clientes without a full page reload', async ({
    page,
  }) => {
    // GIVEN: The user is on /contactos
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/contactos');
    await page.evaluate(() => {
      (window as unknown as { __atddSentinel?: boolean }).__atddSentinel = true;
    });

    // WHEN: The user clicks the Clientes nav item
    const rail = page.locator('[data-testid="nav-rail"]');
    await rail.getByRole('button', { name: /clientes/i }).click();
    await page.waitForURL('**/clientes');

    // THEN: URL is /clientes and no full reload happened
    expect(page.url()).toMatch(/\/clientes$/);
    const sentinel = await page.evaluate(
      () => (window as unknown as { __atddSentinel?: boolean }).__atddSentinel === true,
    );
    expect(sentinel).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — [TC-E1-P1-04] Unknown route renders NotFoundView
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Unknown route renders NotFoundView (shell preserved)', () => {
  test('[TC-E1-P1-04] should render the NotFoundView with heading "Página no encontrada"', async ({
    page,
  }) => {
    // GIVEN: The user visits a non-existent route
    // WHEN: The page loads
    await page.goto('/ruta-que-no-existe');

    // THEN: The NotFoundView is rendered with the Spanish heading
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Página no encontrada/i);
  });

  test('[TC-E1-P1-04] should keep the NavigationRail visible on the 404 view (desktop)', async ({ page }) => {
    // GIVEN: The shell must remain visible on 404 (per AC #6)
    await page.setViewportSize({ width: 1280, height: 800 });

    // WHEN: The user visits a non-existent route on desktop
    await page.goto('/ruta-que-no-existe');

    // THEN: The NavigationRail is still visible
    await expect(page.locator('[data-testid="nav-rail"]')).toBeVisible();
  });

  test('[TC-E1-P1-04] should expose an "Ir a Clientes" button that navigates back to /clientes', async ({
    page,
  }) => {
    // GIVEN: The user is on the 404 view
    await page.goto('/ruta-que-no-existe');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // WHEN: The user clicks the recovery button
    await page.getByRole('button', { name: /ir a clientes/i }).click();
    await page.waitForURL('**/clientes');

    // THEN: The user lands on /clientes
    expect(page.url()).toMatch(/\/clientes$/);
  });

  test('[TC-E1-P1-04] should NOT throw a JS runtime error when rendering the NotFoundView', async ({
    page,
  }) => {
    // GIVEN: An empty error log before navigation
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    // WHEN: The user visits a non-existent route
    await page.goto('/ruta-que-no-existe');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // THEN: No JS runtime errors were thrown
    expect(runtimeErrors).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — User-facing text is in Spanish (es-CO)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — User-facing text is in Spanish', () => {
  test('should display the Clientes navigation label in Spanish on desktop', async ({ page }) => {
    // GIVEN: The desktop shell is rendered
    await page.setViewportSize({ width: 1280, height: 800 });

    // WHEN: The user views the rail
    await page.goto('/clientes');

    // THEN: The rail contains the Spanish text "Clientes" (exact word)
    const rail = page.locator('[data-testid="nav-rail"]');
    await expect(rail).toContainText('Clientes');
  });

  test('should display the Contactos navigation label in Spanish on desktop', async ({ page }) => {
    // GIVEN: The desktop shell is rendered
    await page.setViewportSize({ width: 1280, height: 800 });

    // WHEN: The user views the rail
    await page.goto('/clientes');

    // THEN: The rail contains the Spanish text "Contactos"
    const rail = page.locator('[data-testid="nav-rail"]');
    await expect(rail).toContainText('Contactos');
  });

  test('should display the recovery button label "Ir a Clientes" in Spanish on the 404 view', async ({
    page,
  }) => {
    // GIVEN: The user is on the 404 view
    // WHEN: The NotFoundView renders
    await page.goto('/ruta-que-no-existe');

    // THEN: The recovery button label is in Spanish
    await expect(page.getByRole('button', { name: 'Ir a Clientes' })).toBeVisible();
  });
});
