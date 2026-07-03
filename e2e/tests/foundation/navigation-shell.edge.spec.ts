/**
 * Story 1.2: Frontend Navigation Shell — E2E EDGE CASE tests
 * Epic 1: Project Foundation & Application Shell
 *
 * BMad-Integrated Automation Expansion (post-ATDD)
 * ─────────────────────────────────────────────────
 * Complements the ATDD baseline in `navigation-shell.spec.ts` with edge
 * cases, negative paths and boundary conditions that live in the browser:
 *   AC #1 — Back/forward history, hard reload preservation, query-string routes,
 *           idempotent nav clicks, 404 → recovery.
 *   AC #2 — Mobile back button + full-list tap targets.
 *   AC #3 — Deep link with query params/hash preserves route resolution.
 *   AC #4 — Nested unknown route falls through to 404 (shell persists).
 *   AC #5 — Reload on `/contactos` does NOT re-trigger the index redirect.
 *
 * Selector policy: `data-testid` first, then accessible-name fallbacks.
 * No hard waits (`waitForTimeout`) — event-based / element-state waits only.
 * Priority tags: [P1] critical edge, [P2] common edge, [P3] boundary/robustness.
 *
 * Note: These specs assume Playwright can launch a browser. In sandboxes where
 * `pnpm exec playwright install chromium` was blocked by a proxy 403 (see
 * Story 1.1 completion note #7), the specs are authored but execution is
 * deferred to a CI environment where browsers are available.
 */

import { test, expect } from '@playwright/test';

const isMobileProject = (projectName: string) => projectName === 'mobile-chrome';

// ─────────────────────────────────────────────────────────────────────────────
// AC #1 — Desktop history & idempotent navigation edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #1 edge — Desktop history & idempotent nav', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(isMobileProject(testInfo.project.name), 'Desktop-only ACs');
  });

  test('[P1] should restore /clientes when using the browser back button after in-app nav', async ({ page }) => {
    // GIVEN: The user starts at /clientes and clicks Contactos
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await page
      .getByRole('link', { name: /contactos/i })
      .or(page.getByRole('button', { name: /contactos/i }))
      .first()
      .click();
    await expect(page).toHaveURL(/\/contactos$/);

    // WHEN: The user presses the browser back button
    await page.goBack();

    // THEN: The URL and view return to /clientes (SPA history preserved)
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P2] should restore /contactos when using the forward button after a back', async ({ page }) => {
    // GIVEN: The user has navigated clientes → contactos → back
    await page.goto('/clientes');
    await page
      .getByRole('link', { name: /contactos/i })
      .or(page.getByRole('button', { name: /contactos/i }))
      .first()
      .click();
    await expect(page).toHaveURL(/\/contactos$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/clientes$/);

    // WHEN: The user presses forward
    await page.goForward();

    // THEN: The user is back on /contactos
    await expect(page).toHaveURL(/\/contactos$/);
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('[P2] should preserve /contactos across a full page reload (hard refresh)', async ({ page }) => {
    // GIVEN: The user is on /contactos via deep link
    await page.goto('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();

    // WHEN: The browser performs a full page reload
    await page.reload();

    // THEN: The route is preserved — no automatic redirect to /clientes
    await expect(page).toHaveURL(/\/contactos$/);
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('[P2] should stay on /clientes when clicking the already-active Clientes entry', async ({ page }) => {
    // GIVEN: The user is on /clientes with a sentinel installed
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await page.evaluate(() => {
      // @ts-expect-error — test-only sentinel
      window.__idempotentClickSentinel = 'preserved';
    });

    // WHEN: The user clicks the Clientes entry (already active)
    await page
      .getByRole('link', { name: /clientes/i })
      .or(page.getByRole('button', { name: /clientes/i }))
      .first()
      .click();

    // THEN: URL is unchanged AND no full reload occurred (sentinel survives)
    await expect(page).toHaveURL(/\/clientes$/);
    const sentinel = await page.evaluate(() => {
      // @ts-expect-error — test-only sentinel
      return window.__idempotentClickSentinel;
    });
    expect(sentinel).toBe('preserved');
  });

  test('[P2] should render clientes-view when the URL carries a query string', async ({ page }) => {
    // GIVEN: The user opens /clientes?foo=bar directly
    await page.goto('/clientes?foo=bar');

    // WHEN: The router resolves
    // THEN: The Clientes view renders (query params must not trigger 404 or redirect)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await expect(page).toHaveURL(/\/clientes\?foo=bar$/);
  });

  test('[P3] should render contactos-view when the URL carries a hash fragment', async ({ page }) => {
    // GIVEN: The user opens /contactos#section
    await page.goto('/contactos#section');

    // WHEN: The router resolves
    // THEN: The Contactos view renders (hash fragments must not break routing)
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
    await expect(page).toHaveURL(/\/contactos#section$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC #4 edge — 404 recovery & nested unknown routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #4 edge — 404 recovery & nested unknown routes', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(isMobileProject(testInfo.project.name), 'Desktop-only ACs');
  });

  test('[P1] should recover from a 404 by clicking the "Ir a Clientes" CTA', async ({ page }) => {
    // GIVEN: The user landed on the 404 view (unknown route)
    await page.goto('/ruta-que-no-existe');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // WHEN: The user clicks the recovery link
    await page
      .locator('[data-testid="not-found-view"]')
      .getByRole('link', { name: /ir a clientes/i })
      .or(
        page
          .locator('[data-testid="not-found-view"]')
          .getByRole('button', { name: /ir a clientes/i }),
      )
      .first()
      .click();

    // THEN: The router resolves to /clientes and the placeholder view renders
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P2] should render 404 for a nested unknown segment (/clientes/algo)', async ({ page }) => {
    // GIVEN: An extra segment beneath a known route (no matching child route)
    // WHEN: The user navigates to /clientes/algo
    await page.goto('/clientes/algo');

    // THEN: The not-found view is rendered inside the persistent shell
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('[P2] should render 404 for /contactos/algo (nested under the other known route)', async ({ page }) => {
    // GIVEN: An extra segment beneath /contactos
    // WHEN: The user navigates to /contactos/xyz
    await page.goto('/contactos/xyz');

    // THEN: The not-found view is rendered and the shell persists
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('[P2] should NOT display the clientes-view when on /clientes/algo (guards against ghost renders)', async ({ page }) => {
    // GIVEN: A nested unknown route
    await page.goto('/clientes/algo');

    // WHEN: The 404 is rendered
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // THEN: The clientes-view (real route content) is NOT visible
    await expect(page.locator('[data-testid="clientes-view"]')).toHaveCount(0);
  });

  test('[P3] should handle URL-encoded unknown routes without crashing', async ({ page }) => {
    // GIVEN: An unknown route containing URL-encoded characters
    // WHEN: The user navigates to /ruta%20con%20espacios
    await page.goto('/ruta%20con%20espacios');

    // THEN: The 404 view renders (no server error, no client crash)
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC #5 edge — Index redirect boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #5 edge — Index redirect boundary conditions', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(isMobileProject(testInfo.project.name), 'Desktop-only ACs');
  });

  test('[P2] should NOT re-trigger the redirect when reloading on /contactos', async ({ page }) => {
    // GIVEN: The user landed on /contactos (either via redirect or deep link)
    await page.goto('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();

    // WHEN: The browser hard-reloads
    await page.reload();

    // THEN: The URL stays at /contactos — the index route's redirect must NOT
    // fire on non-`/` paths
    await expect(page).toHaveURL(/\/contactos$/);
  });

  test('[P2] should redirect / with a trailing hash (#) to /clientes', async ({ page }) => {
    // GIVEN: The user visits the root with an empty hash fragment
    // WHEN: The router mounts at `/#`
    await page.goto('/#');

    // THEN: The redirect fires and the clientes-view renders
    await expect(page).toHaveURL(/\/clientes/);
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC #2 edge — Mobile history & tap-target coverage
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #2 edge — Mobile history & full tap-target coverage', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!isMobileProject(testInfo.project.name), 'Mobile-only ACs (Pixel 5 project)');
  });

  test('[P1] should restore /clientes with the browser back button (mobile)', async ({ page }) => {
    // GIVEN: The user starts at /clientes on mobile and taps Contactos
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await page
      .locator('[data-testid="nav-bar"]')
      .getByRole('link', { name: /contactos/i })
      .or(page.locator('[data-testid="nav-bar"]').getByRole('button', { name: /contactos/i }))
      .first()
      .click();
    await expect(page).toHaveURL(/\/contactos$/);

    // WHEN: The user presses the mobile back button
    await page.goBack();

    // THEN: The URL and view return to /clientes
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P2] should enforce a 44px minimum tap target on ALL NavigationBar items', async ({ page }) => {
    // GIVEN: WCAG 2.1 AA minimum tap target = 44px, applies to every interactive item
    await page.goto('/clientes');
    const bar = page.locator('[data-testid="nav-bar"]');
    await bar.waitFor({ state: 'visible' });

    // WHEN: We enumerate every button/link inside the NavigationBar
    const items = bar.locator('a, button');
    const count = await items.count();
    expect(count, 'NavigationBar must expose at least 2 tappable items').toBeGreaterThanOrEqual(2);

    // THEN: Every item has a rendered height ≥ 44px
    for (let i = 0; i < count; i++) {
      const box = await items.nth(i).boundingBox();
      expect(box, `NavigationBar item ${i} must produce a bounding box`).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('[P2] should show the NotFoundView with mobile shell for unknown routes', async ({ page }) => {
    // GIVEN: A mobile viewport (Pixel 5) with an unknown route
    // WHEN: The user navigates to /pagina-inexistente
    await page.goto('/pagina-inexistente');

    // THEN: The 404 view renders AND the mobile navigation bar is still visible
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
  });

  test('[P2] should preserve /contactos across a hard reload on mobile', async ({ page }) => {
    // GIVEN: The user is on /contactos (mobile)
    await page.goto('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();

    // WHEN: The browser reloads
    await page.reload();

    // THEN: The route is preserved
    await expect(page).toHaveURL(/\/contactos$/);
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('[P3] should render the mobile navigation bar as position:fixed at the bottom', async ({ page }) => {
    // GIVEN: The AppShell mounts the NavigationBar in a fixed-bottom wrapper
    await page.goto('/clientes');
    const bar = page.locator('[data-testid="nav-bar"]');
    await bar.waitFor({ state: 'visible' });

    // WHEN: We inspect the wrapper that carries the fixed positioning
    // (AppShell mobile branch wraps NavigationBar in a `fixed inset-x-0 bottom-0` container)
    const fixedWrapper = bar.locator(':scope div.fixed').first();

    // THEN: The wrapper has computed style position: fixed
    const position = await fixedWrapper.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });
});
