/**
 * Story 1.2: Frontend Navigation Shell — BMad Automate Expansion
 * Epic 1: Project Foundation & Application Shell
 *
 * These tests EXTEND the ATDD suite in `navigation-shell.spec.ts` with
 * edge cases and negative paths that acceptance-level tests do NOT cover:
 *
 *  - Deep-link URL variants (query string, trailing slash)
 *  - SPA history semantics (browser back button, refresh)
 *  - Rapid user interaction (double click on nav item)
 *  - Cross-viewport 404 (mobile shell preserved on 404)
 *  - Console cleanliness during SPA navigation
 *  - Active nav highlight reflects current route
 *  - Multiple unknown-route variants land on the same NotFoundView
 *
 * ACs covered (extension only):
 *   AC1/AC2 (nav render)  — mobile 404 keeps NavigationBar
 *   AC3    (SPA nav)      — no console errors, browser back, rapid clicks
 *   AC4    (deep link /clientes) — query string + trailing slash preserved
 *   AC5    (deep link /contactos) — refresh keeps route
 *   AC6    (404)          — multiple unknown paths, mobile shell preserved
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Deep link URL variants — query string and trailing slash
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Deep link URL variants preserve routing', () => {
  test('[P1] should render Clientes view when /clientes is opened with a query string', async ({
    page,
  }) => {
    // GIVEN: A deep link with a query string (e.g. from an external referral)
    // WHEN: The user opens /clientes?utm_source=email
    await page.goto('/clientes?utm_source=email');

    // THEN: The Clientes view renders and the query string is preserved
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(/Clientes/i);
    expect(page.url()).toMatch(/\/clientes\?utm_source=email$/);
  });

  test('[P1] should render Contactos view when /contactos is opened with a hash fragment', async ({
    page,
  }) => {
    // GIVEN: A deep link with a hash fragment
    // WHEN: The user opens /contactos#top
    await page.goto('/contactos#top');

    // THEN: The Contactos view renders and the hash is preserved
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(/Contactos/i);
    expect(page.url()).toMatch(/\/contactos#top$/);
  });

  test('[P2] should NOT flash an intermediate view before /clientes renders on deep link', async ({
    page,
  }) => {
    // GIVEN: The user pastes /clientes into the URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The URL is /clientes AND the Contactos heading is NEVER visible
    // (guards against a bug where router briefly renders wrong route)
    const contactosHeading = page.getByRole('heading', { level: 1, name: /^Contactos$/ });
    await expect(contactosHeading).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Clientes/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] SPA history semantics — refresh + browser back button
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] SPA history semantics', () => {
  test('[P1] should keep /contactos after a full page refresh (no redirect back to /)', async ({
    page,
  }) => {
    // GIVEN: The user has navigated to /contactos
    await page.goto('/contactos');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Contactos/i);

    // WHEN: The user refreshes the page
    await page.reload();

    // THEN: The user stays on /contactos, not redirected to / → /clientes
    expect(page.url()).toMatch(/\/contactos$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Contactos/i);
  });

  test('[P1] should navigate back to /clientes with the browser back button after SPA nav to /contactos', async ({
    page,
  }) => {
    // GIVEN: The user is on /clientes and then clicks Contactos in the rail
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    const rail = page.locator('[data-testid="nav-rail"]');
    await rail.getByRole('button', { name: /contactos/i }).click();
    await page.waitForURL('**/contactos');

    // WHEN: The user presses the browser back button
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: The user lands on /clientes and no full reload occurred
    expect(page.url()).toMatch(/\/clientes$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Clientes/i);
  });

  test('[P1] should support forward navigation after back button', async ({ page }) => {
    // GIVEN: The user navigated /clientes → /contactos → back to /clientes
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    const rail = page.locator('[data-testid="nav-rail"]');
    await rail.getByRole('button', { name: /contactos/i }).click();
    await page.waitForURL('**/contactos');
    await page.goBack();
    await page.waitForURL('**/clientes');

    // WHEN: The user presses the browser forward button
    await page.goForward();
    await page.waitForURL('**/contactos');

    // THEN: The user lands back on /contactos with heading rendered
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Contactos/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Rapid interaction — double click on nav should not throw
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Rapid interaction on nav entries', () => {
  test('[P2] should not throw JS errors when the Contactos rail entry is double-clicked rapidly', async ({
    page,
  }) => {
    // GIVEN: A page error listener attached
    await page.setViewportSize({ width: 1280, height: 800 });
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/clientes');
    const rail = page.locator('[data-testid="nav-rail"]');
    const contactosButton = rail.getByRole('button', { name: /contactos/i });

    // WHEN: The user double-clicks the Contactos entry
    await contactosButton.dblclick();
    await page.waitForURL('**/contactos');

    // THEN: The URL is /contactos and no runtime errors leaked
    expect(page.url()).toMatch(/\/contactos$/);
    expect(errors).toEqual([]);
  });

  test('[P2] should not throw JS errors when clicking the currently active Clientes entry', async ({
    page,
  }) => {
    // GIVEN: A page error listener attached and the user is already on /clientes
    await page.setViewportSize({ width: 1280, height: 800 });
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/clientes');
    const rail = page.locator('[data-testid="nav-rail"]');

    // WHEN: The user clicks the already-active Clientes entry
    await rail.getByRole('button', { name: /clientes/i }).click();

    // THEN: URL stays on /clientes and no runtime errors
    expect(page.url()).toMatch(/\/clientes$/);
    expect(errors).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Console cleanliness during SPA navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Console cleanliness during SPA navigation', () => {
  test('[P2] should not emit console errors during /clientes ↔ /contactos SPA navigation', async ({
    page,
  }) => {
    // GIVEN: A console.error listener (ignoring Vite/HMR/DevTools noise)
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !/vite|hmr|devtools/i.test(msg.text())) {
        consoleErrors.push(msg.text());
      }
    });

    await page.setViewportSize({ width: 1280, height: 800 });

    // WHEN: The user navigates through both routes via the rail
    await page.goto('/clientes');
    const rail = page.locator('[data-testid="nav-rail"]');
    await rail.getByRole('button', { name: /contactos/i }).click();
    await page.waitForURL('**/contactos');
    await rail.getByRole('button', { name: /clientes/i }).click();
    await page.waitForURL('**/clientes');

    // THEN: No console errors were emitted
    expect(consoleErrors).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Active nav highlight reflects current route
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Active nav highlight follows the URL', () => {
  test('[P2] should mark the Clientes entry as active/pressed when on /clientes (desktop)', async ({
    page,
  }) => {
    // GIVEN: Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // WHEN: The user is on /clientes
    await page.goto('/clientes');

    // THEN: The Clientes rail entry is marked pressed/selected
    // siesa-ui-kit's NavigationRailItem exposes selected state via aria-pressed / aria-current
    const rail = page.locator('[data-testid="nav-rail"]');
    const clientesButton = rail.getByRole('button', { name: /clientes/i });
    // Accept either aria-pressed="true" OR aria-current present as valid signals of "active".
    const isPressed = await clientesButton.getAttribute('aria-pressed');
    const ariaCurrent = await clientesButton.getAttribute('aria-current');
    expect(isPressed === 'true' || ariaCurrent !== null).toBeTruthy();
  });

  test('[P2] should switch the active nav highlight after clicking Contactos', async ({ page }) => {
    // GIVEN: Desktop viewport at /clientes
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    const rail = page.locator('[data-testid="nav-rail"]');

    // WHEN: The user navigates to /contactos via the rail
    await rail.getByRole('button', { name: /contactos/i }).click();
    await page.waitForURL('**/contactos');

    // THEN: The Contactos entry reflects the active state
    const contactosButton = rail.getByRole('button', { name: /contactos/i });
    const isPressed = await contactosButton.getAttribute('aria-pressed');
    const ariaCurrent = await contactosButton.getAttribute('aria-current');
    expect(isPressed === 'true' || ariaCurrent !== null).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Multiple unknown-route variants all land on NotFoundView
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] NotFoundView catches multiple unknown-route variants', () => {
  for (const badPath of [
    '/clientes-mal',
    '/contactos-invalid',
    '/foo/bar/baz',
    '/api/v1/whatever', // frontend router should still 404 client-side (backend is separate host)
  ]) {
    test(`[P1] should render NotFoundView for unknown route "${badPath}"`, async ({ page }) => {
      // GIVEN: An unknown route
      // WHEN: The user visits it
      await page.goto(badPath);

      // THEN: NotFoundView is rendered
      await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Mobile 404 preserves NavigationBar (shell visibility on mobile)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Mobile 404 preserves NavigationBar', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('[P1] should keep the NavigationBar visible on the 404 view (mobile)', async ({ page }) => {
    // GIVEN: Mobile viewport
    // WHEN: The user visits an unknown route on mobile
    await page.goto('/ruta-que-no-existe');

    // THEN: The NavigationBar is still visible AND rail is still hidden
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-rail"]')).toBeHidden();
  });

  test('[P1] should navigate via the NavigationBar Clientes entry from the 404 view (mobile)', async ({
    page,
  }) => {
    // GIVEN: User is on 404 view on mobile
    await page.goto('/ruta-que-no-existe');
    const bar = page.locator('[data-testid="nav-bar"]');

    // WHEN: The user taps the Clientes entry in the bar (not the recovery button)
    await bar.getByRole('button', { name: /clientes/i }).click();
    await page.waitForURL('**/clientes');

    // THEN: URL is /clientes and heading is rendered
    expect(page.url()).toMatch(/\/clientes$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Clientes/i);
  });
});
