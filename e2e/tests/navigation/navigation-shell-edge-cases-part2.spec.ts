import { test, expect } from '@playwright/test';
import { NavigationShellPage } from '../../pages/navigation.page';

/**
 * Story 1.2 — Frontend Navigation Shell — Edge Cases Part 2 (Breakpoint & Persistence)
 * Epic 1 — Project Foundation & Application Shell
 *
 * BMad-Integrated expansion of ATDD GREEN tests.
 * Covers viewport breakpoint boundaries and shell persistence across navigation.
 *
 * Test IDs: E2E-EC-14 through E2E-EC-18
 *
 * Complements:
 *   - navigation-shell.spec.ts              (E2E-F-01..F-08  — 9 desktop tests GREEN)
 *   - navigation-shell-mobile.spec.ts       (E2E-F-06..F-07d — 5 mobile tests GREEN)
 *   - navigation-shell-edge-cases.spec.ts   (E2E-EC-01..13   — active state, ARIA, 404)
 */

// ---------------------------------------------------------------------------
// Viewport boundary — exactly at breakpoint (1023 vs 1024)
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — Breakpoint boundary (1023px / 1024px)', () => {
  /**
   * E2E-EC-14 (P1 — AC1/AC2)
   * Given viewport is exactly 1024px wide (boundary desktop)
   * When the app loads
   * Then NavigationRail is visible and NavigationBar is not visible
   */
  test('E2E-EC-14 — Viewport exacto 1024px muestra NavigationRail (no NavigationBar)', async ({
    page,
  }) => {
    // GIVEN: viewport is exactly 1024px wide (Tailwind lg: breakpoint boundary)
    await page.setViewportSize({ width: 1024, height: 768 });

    // WHEN: the app loads at /clientes
    await page.goto('/clientes');

    const nav = new NavigationShellPage(page);

    // THEN: NavigationRail is visible (desktop mode)
    await expect(nav.navigationRail).toBeVisible();

    // AND: NavigationBar is not visible (mobile nav hidden at desktop breakpoint)
    await expect(nav.navigationBar).not.toBeVisible();
  });

  /**
   * E2E-EC-15 (P1 — AC1/AC2)
   * Given viewport is exactly 1023px wide (boundary mobile)
   * When the app loads
   * Then NavigationBar is visible and NavigationRail is not visible
   */
  test('E2E-EC-15 — Viewport exacto 1023px muestra NavigationBar (no NavigationRail)', async ({
    page,
  }) => {
    // GIVEN: viewport is exactly 1023px wide (one pixel below Tailwind lg: breakpoint)
    await page.setViewportSize({ width: 1023, height: 768 });

    // WHEN: the app loads at /clientes
    await page.goto('/clientes');

    const nav = new NavigationShellPage(page);

    // THEN: NavigationBar is visible (mobile mode)
    await expect(nav.navigationBar).toBeVisible();

    // AND: NavigationRail is not visible (desktop nav hidden below lg: breakpoint)
    await expect(nav.navigationRail).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigation shell persistence across routes
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — Persistencia del shell de navegación', () => {
  /**
   * E2E-EC-16 (P1 — AC1)
   * Given the user is on /clientes
   * When they navigate to /contactos and back to /clientes
   * Then the NavigationRail remains visible throughout (shell is persistent)
   */
  test('E2E-EC-16 — NavigationRail persiste al navegar entre rutas en desktop', async ({
    page,
  }) => {
    // GIVEN: desktop viewport, app loaded at /clientes
    await page.setViewportSize({ width: 1280, height: 800 });
    const nav = new NavigationShellPage(page);
    await nav.goto();

    // WHEN: user navigates Clientes → Contactos
    await nav.contactosLink.click();
    await expect(page).toHaveURL(/\/contactos/);

    // THEN: NavigationRail remains visible after navigation
    await expect(nav.navigationRail).toBeVisible();

    // WHEN: user navigates Contactos → Clientes
    await nav.clientesLink.click();
    await expect(page).toHaveURL(/\/clientes/);

    // THEN: NavigationRail still visible (shell is persistent across routes)
    await expect(nav.navigationRail).toBeVisible();
  });

  /**
   * E2E-EC-17 (P1 — AC2)
   * Given the user is on /clientes on mobile
   * When they tap to /contactos and back to /clientes
   * Then the NavigationBar remains visible throughout (shell is persistent on mobile)
   */
  test('E2E-EC-17 — NavigationBar persiste al navegar entre rutas en móvil', async ({
    page,
  }) => {
    // GIVEN: mobile viewport (Pixel 5 equivalent), app loaded at /clientes
    await page.setViewportSize({ width: 393, height: 851 });
    const nav = new NavigationShellPage(page);
    await nav.goto();

    // WHEN: user navigates Clientes → Contactos
    await nav.contactosLink.click();
    await expect(page).toHaveURL(/\/contactos/);

    // THEN: NavigationBar remains visible after navigation
    await expect(nav.navigationBar).toBeVisible();

    // WHEN: user navigates Contactos → Clientes
    await nav.clientesLink.click();
    await expect(page).toHaveURL(/\/clientes/);

    // THEN: NavigationBar still visible (shell is persistent on mobile)
    await expect(nav.navigationBar).toBeVisible();
  });

  /**
   * E2E-EC-18 (P2 — AC1)
   * Given the user is on /clientes on desktop
   * When they use the browser back button after navigating to /contactos
   * Then the URL returns to /clientes and the shell remains intact
   */
  test('E2E-EC-18 — Botón Atrás del navegador funciona correctamente con el shell', async ({
    page,
  }) => {
    // GIVEN: desktop viewport, user has navigated to /clientes then /contactos
    await page.setViewportSize({ width: 1280, height: 800 });
    const nav = new NavigationShellPage(page);
    await nav.goto();

    // Navigate to /contactos to create history entry
    await nav.contactosLink.click();
    await expect(page).toHaveURL(/\/contactos/);

    // WHEN: user presses the browser back button
    await page.goBack();

    // THEN: URL returns to /clientes
    await expect(page).toHaveURL(/\/clientes/);

    // AND: NavigationRail shell is still intact (not a full reload)
    await expect(nav.navigationRail).toBeVisible();
  });
});
