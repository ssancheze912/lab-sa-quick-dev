/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Automate-phase EDGE tests — expand on top of ATDD (spa-navigation.spec.ts)
 * without duplicating the happy-path coverage.
 *
 * Edges covered:
 *   - Browser back/forward preserves SPA mode + active-state sync (AC #1, #6).
 *   - Round-trip navigation /clientes -> /contactos -> /clientes flips active
 *     marker correctly without a full reload (AC #1, #6).
 *   - Mobile bar advertises active state on deep link (AC #2, #6).
 *   - Mobile tap from /contactos to /clientes flips active marker (AC #2, #6).
 *   - Re-tapping the currently active item is a no-op (no JS error, URL stays).
 *
 * Sandbox infra: chromium-only (Story 1.1 — Firefox unavailable).
 *   Run with: `pnpm exec playwright test --project=chromium e2e/tests/foundation`
 */
import { test, expect } from '@playwright/test';

test.describe('AC #1 + #6 — Desktop SPA edges (back/forward + active flip)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] browser back after SPA navigation does NOT trigger a full page reload', async ({
    page,
  }) => {
    // GIVEN: the user lands on /clientes and a window-scoped sentinel is set
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await page.evaluate(() => {
      (window as unknown as { __spaEdgeSentinel: number }).__spaEdgeSentinel = 99;
    });

    // WHEN: user clicks Contactos in the rail, then presses browser back
    await page
      .locator('[data-testid="app-shell-desktop"]')
      .getByText('Contactos', { exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/contactos$/);
    await page.goBack();

    // THEN: URL returned to /clientes and the sentinel survived
    await expect(page).toHaveURL(/\/clientes$/);
    const sentinel = await page.evaluate(
      () => (window as unknown as { __spaEdgeSentinel?: number }).__spaEdgeSentinel,
    );
    expect(sentinel).toBe(99);
  });

  test('[P1] active marker flips on round-trip /clientes -> /contactos -> /clientes', async ({
    page,
  }) => {
    // GIVEN: user is on /clientes
    await page.goto('/clientes');
    const desktop = page.locator('[data-testid="app-shell-desktop"]');

    // WHEN: navigate to /contactos via the rail
    await desktop.getByText('Contactos', { exact: true }).first().click();
    await expect(page).toHaveURL(/\/contactos$/);

    // THEN: Contactos is now active and Clientes is not
    const contactosBtn = desktop
      .locator('button, a, [role="menuitem"]')
      .filter({ hasText: /^Contactos$/ })
      .first();
    const clientesBtn = desktop
      .locator('button, a, [role="menuitem"]')
      .filter({ hasText: /^Clientes$/ })
      .first();
    await expect(contactosBtn).toHaveAttribute('aria-current', 'page');
    await expect(clientesBtn).not.toHaveAttribute('aria-current', 'page');

    // WHEN: navigate back to /clientes via the rail
    await desktop.getByText('Clientes', { exact: true }).first().click();
    await expect(page).toHaveURL(/\/clientes$/);

    // THEN: Clientes is now active and Contactos is not
    await expect(clientesBtn).toHaveAttribute('aria-current', 'page');
    await expect(contactosBtn).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P2] clicking the already-active Clientes entry stays on /clientes (no error)', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // GIVEN: user is on /clientes
    await page.goto('/clientes');
    const desktop = page.locator('[data-testid="app-shell-desktop"]');

    // WHEN: user clicks the active Clientes entry again
    await desktop.getByText('Clientes', { exact: true }).first().click();

    // THEN: URL stays at /clientes, view remains rendered, no JS errors thrown
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe('AC #2 + #6 — Mobile SPA edges (active state + round-trip)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('[P1] mobile bar exposes aria-current on Contactos when deep-linking to /contactos', async ({
    page,
  }) => {
    // GIVEN: user deep-links to /contactos on a mobile viewport
    await page.goto('/contactos');

    // WHEN: the mobile shell mounts
    const mobile = page.locator('[data-testid="app-shell-mobile"]');

    // THEN: the Contactos entry is marked as active
    const contactosBtn = mobile
      .locator('button, a, [role="menuitem"]')
      .filter({ hasText: /^Contactos$/ })
      .first();
    const clientesBtn = mobile
      .locator('button, a, [role="menuitem"]')
      .filter({ hasText: /^Clientes$/ })
      .first();
    await expect(contactosBtn).toHaveAttribute('aria-current', 'page');
    await expect(clientesBtn).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P1] tapping Clientes from /contactos navigates and flips active marker', async ({
    page,
  }) => {
    // GIVEN: user starts on /contactos on mobile
    await page.goto('/contactos');
    const mobile = page.locator('[data-testid="app-shell-mobile"]');

    // WHEN: tap Clientes entry
    await mobile.getByText('Clientes', { exact: true }).first().click();

    // THEN: URL changed and active flipped
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    const clientesBtn = mobile
      .locator('button, a, [role="menuitem"]')
      .filter({ hasText: /^Clientes$/ })
      .first();
    await expect(clientesBtn).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('AC #5 — Index redirect edges', () => {
  test('[P2] navigating to / and then pressing browser forward after a SPA nav does not loop', async ({
    page,
  }) => {
    // GIVEN: user enters root, lands on /clientes
    await page.goto('/');
    await expect(page).toHaveURL(/\/clientes$/);

    // WHEN: SPA-navigate to /contactos and back, then forward
    await page
      .locator('[data-testid="app-shell-desktop"], [data-testid="app-shell-mobile"]')
      .first()
      .getByText('Contactos', { exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/contactos$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/clientes$/);
    await page.goForward();

    // THEN: forward lands on /contactos (no redirect loop, no unhandled error)
    await expect(page).toHaveURL(/\/contactos$/);
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });
});
