import { test, expect } from '@playwright/test';

/**
 * Story 1.2 — Frontend Navigation Shell — Mobile Active State Edge Cases
 * Epic 1 — Project Foundation & Application Shell
 *
 * BMad-Integrated expansion: covers active state (aria-current) on the
 * NavigationBar in mobile viewport. The desktop active state is covered by
 * E2E-EC-01..03 in navigation-shell-edge-cases.spec.ts.
 *
 * Gap filled: no prior E2E test verified aria-current on NavigationBar links
 * at mobile viewport (393px). The foundation/navigation-shell-edge-cases.spec.ts
 * tests for this scenario are marked test.fixme() because they relied on
 * data-testid="nav-item-*" and data-active="true", neither of which is in the
 * implementation. These tests use the correct selector (aria-current) instead.
 *
 * Test IDs: E2E-MOB-01 through E2E-MOB-06
 *
 * All tests set viewport explicitly at 393×851 (Pixel 5) — no mobile-chrome
 * project isMobile flag dependency.
 */

// ---------------------------------------------------------------------------
// Mobile active state on NavigationBar
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — NavigationBar active state (mobile viewport 393px)', () => {
  /**
   * E2E-MOB-01 (P1 — AC2)
   * Given a mobile viewport (393px) and the user is on /clientes
   * When the NavigationBar is visible
   * Then the Clientes link inside the NavigationBar has aria-current="page"
   */
  test('E2E-MOB-01 — Ítem Clientes en NavigationBar tiene aria-current=page en /clientes', async ({
    page,
  }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 393, height: 851 });

    // WHEN: Navigate to /clientes
    await page.goto('/clientes');

    const navBar = page.getByTestId('navigation-bar');
    await expect(navBar).toBeVisible();

    // THEN: Clientes link inside NavigationBar has aria-current="page"
    const clientesLinkInBar = navBar.getByRole('link', { name: /clientes/i });
    await expect(clientesLinkInBar).toHaveAttribute('aria-current', 'page');
  });

  /**
   * E2E-MOB-02 (P1 — AC2)
   * Given a mobile viewport (393px) and the user is on /contactos
   * When the NavigationBar is visible
   * Then the Contactos link inside the NavigationBar has aria-current="page"
   * AND the Clientes link does NOT have aria-current="page"
   */
  test('E2E-MOB-02 — Ítem Contactos en NavigationBar tiene aria-current=page en /contactos', async ({
    page,
  }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 393, height: 851 });

    // WHEN: Navigate to /contactos
    await page.goto('/contactos');

    const navBar = page.getByTestId('navigation-bar');
    await expect(navBar).toBeVisible();

    // THEN: Contactos link has aria-current="page"
    const contactosLinkInBar = navBar.getByRole('link', { name: /contactos/i });
    await expect(contactosLinkInBar).toHaveAttribute('aria-current', 'page');

    // AND: Clientes does NOT have aria-current="page"
    const clientesLinkInBar = navBar.getByRole('link', { name: /clientes/i });
    await expect(clientesLinkInBar).not.toHaveAttribute('aria-current', 'page');
  });

  /**
   * E2E-MOB-03 (P1 — AC2)
   * Given a mobile viewport and the user taps from /clientes to /contactos
   * When navigation completes
   * Then the active item in NavigationBar transitions from Clientes to Contactos
   */
  test('E2E-MOB-03 — El estado activo en NavigationBar cambia al navegar de Clientes a Contactos', async ({
    page,
  }) => {
    // GIVEN: Mobile viewport, starting at /clientes
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/clientes');

    const navBar = page.getByTestId('navigation-bar');
    await expect(navBar).toBeVisible();

    const clientesLinkInBar = navBar.getByRole('link', { name: /clientes/i });
    const contactosLinkInBar = navBar.getByRole('link', { name: /contactos/i });

    // Verify initial active state
    await expect(clientesLinkInBar).toHaveAttribute('aria-current', 'page');

    // WHEN: User taps Contactos
    await contactosLinkInBar.click();
    await expect(page).toHaveURL(/\/contactos/);

    // THEN: Contactos becomes active, Clientes is no longer active
    await expect(contactosLinkInBar).toHaveAttribute('aria-current', 'page');
    await expect(clientesLinkInBar).not.toHaveAttribute('aria-current', 'page');
  });
});

// ---------------------------------------------------------------------------
// Mobile SPA navigation — no full page reload on tap
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — SPA navigation no reload on mobile (AC2 + FR28)', () => {
  /**
   * E2E-MOB-04 (P1 — AC2 — FR28)
   * Given the app is loaded on mobile viewport
   * When the user taps "Contactos" in the NavigationBar
   * Then the URL changes to /contactos WITHOUT a full page reload
   */
  test('E2E-MOB-04 — Tap en Contactos en móvil navega sin recarga de página', async ({
    page,
  }) => {
    // GIVEN: Mobile viewport, app loaded
    await page.setViewportSize({ width: 393, height: 851 });
    let fullReloadOccurred = false;

    // GIVEN: Track reload events BEFORE initial navigation
    page.on('load', () => {
      fullReloadOccurred = true;
    });

    await page.goto('/');
    // Reset flag after initial load — only subsequent loads are failures
    fullReloadOccurred = false;

    const navBar = page.getByTestId('navigation-bar');
    await expect(navBar).toBeVisible();

    // WHEN: User taps Contactos
    await navBar.getByRole('link', { name: /contactos/i }).click();

    // THEN: URL is /contactos
    await expect(page).toHaveURL(/\/contactos$/);

    // AND: No full page reload occurred (SPA pushState, not full navigation)
    expect(fullReloadOccurred).toBe(false);
  });

  /**
   * E2E-MOB-05 (P1 — AC2 — FR28)
   * Given the app is on /contactos on mobile viewport
   * When the user taps "Clientes" in the NavigationBar
   * Then the URL changes to /clientes WITHOUT a full page reload
   */
  test('E2E-MOB-05 — Tap en Clientes en móvil navega sin recarga de página', async ({
    page,
  }) => {
    // GIVEN: Mobile viewport, app at /contactos
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/contactos');
    let fullReloadOccurred = false;

    page.on('load', () => {
      fullReloadOccurred = true;
    });

    const navBar = page.getByTestId('navigation-bar');
    await expect(navBar).toBeVisible();

    // Reset — page already loaded, track only subsequent events
    fullReloadOccurred = false;

    // WHEN: User taps Clientes
    await navBar.getByRole('link', { name: /clientes/i }).click();

    // THEN: URL is /clientes
    await expect(page).toHaveURL(/\/clientes$/);

    // AND: No full page reload
    expect(fullReloadOccurred).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 404 back-link data-testid in E2E context
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — Vista 404 back-link data-testid (AC4)', () => {
  /**
   * E2E-MOB-06 (P2 — AC4)
   * Given the user navigates to an unknown route
   * When the 404 view renders
   * Then the "Ir a Clientes" back-link is accessible via data-testid="not-found-back-link"
   * AND clicking it navigates to /clientes without a full page reload
   */
  test('E2E-MOB-06 — Vista 404 tiene back-link con data-testid "not-found-back-link" funcional', async ({
    page,
  }) => {
    // GIVEN: Navigate to an unknown route
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/caminho-inexistente');

    // THEN: 404 view is visible
    await expect(page.getByTestId('not-found-view')).toBeVisible();

    // AND: Back-link is accessible via data-testid (used by automation and monitoring)
    const backLink = page.getByTestId('not-found-back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/clientes');

    // WHEN: User clicks the back-link
    let reloadOccurred = false;
    page.on('load', () => { reloadOccurred = true; });
    reloadOccurred = false;

    await backLink.click();

    // THEN: Navigated to /clientes (SPA navigation, no full reload)
    await expect(page).toHaveURL(/\/clientes$/);
    expect(reloadOccurred).toBe(false);
  });
});
