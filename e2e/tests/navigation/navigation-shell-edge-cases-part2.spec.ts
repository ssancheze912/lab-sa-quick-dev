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
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/clientes');

    const nav = new NavigationShellPage(page);
    await expect(nav.navigationRail).toBeVisible();
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
    await page.setViewportSize({ width: 1023, height: 768 });
    await page.goto('/clientes');

    const nav = new NavigationShellPage(page);
    await expect(nav.navigationBar).toBeVisible();
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
    await page.setViewportSize({ width: 1280, height: 800 });
    const nav = new NavigationShellPage(page);
    await nav.goto();

    // Clientes → Contactos
    await nav.contactosLink.click();
    await expect(page).toHaveURL(/\/contactos/);
    await expect(nav.navigationRail).toBeVisible();

    // Contactos → Clientes
    await nav.clientesLink.click();
    await expect(page).toHaveURL(/\/clientes/);
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
    await page.setViewportSize({ width: 393, height: 851 });
    const nav = new NavigationShellPage(page);
    await nav.goto();

    // Clientes → Contactos
    await nav.contactosLink.click();
    await expect(page).toHaveURL(/\/contactos/);
    await expect(nav.navigationBar).toBeVisible();

    // Contactos → Clientes
    await nav.clientesLink.click();
    await expect(page).toHaveURL(/\/clientes/);
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
    await page.setViewportSize({ width: 1280, height: 800 });
    const nav = new NavigationShellPage(page);
    await nav.goto();

    // Navigate to /contactos
    await nav.contactosLink.click();
    await expect(page).toHaveURL(/\/contactos/);

    // Use browser back
    await page.goBack();
    await expect(page).toHaveURL(/\/clientes/);

    // Shell still intact
    await expect(nav.navigationRail).toBeVisible();
  });
});
