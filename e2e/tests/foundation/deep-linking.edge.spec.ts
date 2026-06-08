/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Automate-phase EDGE tests for deep linking and the NotFound view —
 * complements the ATDD baseline (deep-linking.spec.ts) without duplicating
 * the happy-path TC-E1-P1-02/03/04.
 *
 * Edges covered:
 *   - Deep link with query string preserves view (AC #3).
 *   - Deep link with hash fragment preserves view (AC #3).
 *   - Multi-segment unknown route resolves to NotFound (AC #4).
 *   - Similar-but-wrong route (`/clientes-fake`) resolves to NotFound, NOT
 *     the Clientes view (AC #4 — no accidental partial-match leak).
 *   - 404 CTA navigates back to /clientes via SPA (no full page reload, AC #4+#1).
 *   - 404 view exposes the persistent shell on mobile too (AC #2+#4).
 *
 * Sandbox infra: chromium-only.
 */
import { test, expect } from '@playwright/test';

test.describe('AC #3 — Deep-link edges (query, hash, partial-match isolation)', () => {
  test('[P2] deep link /clientes?foo=bar still renders the Clientes view', async ({ page }) => {
    // GIVEN/WHEN: user opens /clientes with a query string
    await page.goto('/clientes?foo=bar');

    // THEN: the Clientes view is rendered (router ignores the query for matching)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await expect(page).toHaveURL(/\/clientes(\?.*)?$/);
  });

  test('[P2] deep link /contactos#section still renders the Contactos view', async ({ page }) => {
    // GIVEN/WHEN: user opens /contactos with a hash fragment
    await page.goto('/contactos#tab=top');

    // THEN: the Contactos view is rendered
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
    await expect(page).toHaveURL(/\/contactos(#.*)?$/);
  });

  test('[P1] deep link /clientes-fake does NOT match /clientes; shows NotFound (AC #4)', async ({
    page,
  }) => {
    // GIVEN/WHEN: user opens a route that LOOKS like /clientes but is unknown
    await page.goto('/clientes-fake');

    // THEN: the NotFoundView renders (no accidental partial match)
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="clientes-view"]')).toBeHidden();
  });

  test('[P2] multi-segment unknown path /foo/bar/baz also resolves to NotFound (AC #4)', async ({
    page,
  }) => {
    // GIVEN/WHEN: user opens a multi-segment unknown route
    await page.goto('/foo/bar/baz');

    // THEN: NotFound view is rendered inside the shell
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });
});

test.describe('AC #4 + #1 — NotFound CTA + persistent shell edges', () => {
  test('[P0] CTA "Ir a Clientes" navigates back to /clientes WITHOUT a full reload', async ({
    page,
  }) => {
    // GIVEN: user is on an unknown route
    await page.goto('/ruta-completamente-invalida');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // AND: install a sentinel to detect a hard reload
    await page.evaluate(() => {
      (window as unknown as { __notFoundSentinel: number }).__notFoundSentinel = 7;
    });

    // WHEN: user clicks the Spanish CTA back to /clientes
    await page.getByRole('link', { name: 'Ir a Clientes' }).click();

    // THEN: URL is /clientes and the Clientes view rendered
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();

    // AND: sentinel survived → no full reload occurred (FR28)
    const sentinel = await page.evaluate(
      () => (window as unknown as { __notFoundSentinel?: number }).__notFoundSentinel,
    );
    expect(sentinel).toBe(7);
  });

  test('[P2] NotFound view also keeps the shell visible on mobile viewport (AC #2 + #4)', async ({
    page,
  }) => {
    // GIVEN: a mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // WHEN: user deep-links to an unknown route
    await page.goto('/no-existe-en-mobile');

    // THEN: the NotFound view renders AND the mobile shell wrapper is visible
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-shell-mobile"]')).toBeVisible();
  });

  test('[P2] NotFound for path with special characters (encoded segments)', async ({ page }) => {
    // GIVEN/WHEN: a path with URL-encoded characters that does not match any route
    await page.goto('/algo%20raro%20y%20largo');

    // THEN: gracefully shows NotFound (no 500, no blank page)
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });
});
