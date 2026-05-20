import { test, expect } from '@playwright/test';
import { NavigationShellPage } from '../../pages/navigation.page';

/**
 * Story 1.2 — Frontend Navigation Shell — Edge Cases & Boundary Conditions
 * Epic 1 — Project Foundation & Application Shell
 *
 * BMad-Integrated expansion of ATDD GREEN tests.
 * Covers edge cases, error paths, and boundary conditions not in base ATDD suite.
 *
 * Test IDs: E2E-EC-01 through E2E-EC-18
 *
 * Complements:
 *   - navigation-shell.spec.ts        (E2E-F-01..F-08  — 9 desktop tests GREEN)
 *   - navigation-shell-mobile.spec.ts (E2E-F-06..F-07d — 5 mobile tests GREEN)
 */

// ---------------------------------------------------------------------------
// Active State & Navigation State
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — Active state on nav items (desktop)', () => {
  /**
   * E2E-EC-01 (P1 — AC1)
   * Given the user is on /clientes
   * When the NavigationRail is visible
   * Then the Clientes item has aria-current="page" and Contactos does not
   */
  test('E2E-EC-01 — Clientes item tiene aria-current=page cuando la ruta es /clientes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // GIVEN + WHEN: navigate to /clientes
    await page.goto('/clientes');

    // THEN: Clientes link is aria-current="page"
    const clientesLink = page.getByRole('link', { name: /clientes/i });
    await expect(clientesLink).toHaveAttribute('aria-current', 'page');

    // AND: Contactos link does NOT have aria-current="page"
    const contactosLink = page.getByRole('link', { name: /contactos/i });
    await expect(contactosLink).not.toHaveAttribute('aria-current', 'page');
  });

  /**
   * E2E-EC-02 (P1 — AC1)
   * Given the user is on /contactos
   * When the NavigationRail is visible
   * Then the Contactos item has aria-current="page" and Clientes does not
   */
  test('E2E-EC-02 — Contactos item tiene aria-current=page cuando la ruta es /contactos', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // GIVEN + WHEN: navigate to /contactos
    await page.goto('/contactos');

    // THEN: Contactos link is aria-current="page"
    const contactosLink = page.getByRole('link', { name: /contactos/i });
    await expect(contactosLink).toHaveAttribute('aria-current', 'page');

    // AND: Clientes link does NOT have aria-current="page"
    const clientesLink = page.getByRole('link', { name: /clientes/i });
    await expect(clientesLink).not.toHaveAttribute('aria-current', 'page');
  });

  /**
   * E2E-EC-03 (P1 — AC1)
   * Given the user navigates from /clientes to /contactos
   * When the navigation completes
   * Then the active item transitions from Clientes to Contactos
   */
  test('E2E-EC-03 — El estado activo cambia al navegar de Clientes a Contactos', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');

    // GIVEN: Clientes is active
    const clientesLink = page.getByRole('link', { name: /clientes/i });
    const contactosLink = page.getByRole('link', { name: /contactos/i });
    await expect(clientesLink).toHaveAttribute('aria-current', 'page');

    // WHEN: user navigates to /contactos
    await contactosLink.click();
    await expect(page).toHaveURL(/\/contactos/);

    // THEN: Contactos becomes active, Clientes is no longer active
    await expect(contactosLink).toHaveAttribute('aria-current', 'page');
    await expect(clientesLink).not.toHaveAttribute('aria-current', 'page');
  });
});

// ---------------------------------------------------------------------------
// Root redirect behavior (AC1 + index route)
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — Root redirect (/ → /clientes)', () => {
  /**
   * E2E-EC-04 (P0 — AC1 + AC3)
   * Given the user navigates to the root path /
   * When the page loads
   * Then the user is immediately redirected to /clientes
   */
  test('E2E-EC-04 — Ruta raíz / redirige a /clientes automáticamente', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // GIVEN + WHEN: navigate to root
    await page.goto('/');

    // THEN: URL is /clientes (redirect happened via beforeLoad)
    await expect(page).toHaveURL(/\/clientes$/);

    // AND: Clientes view is visible (not a blank or error page)
    await expect(page.getByTestId('clientes-view')).toBeVisible();
  });

  /**
   * E2E-EC-05 (P1 — AC1)
   * Given the user is redirected from / to /clientes
   * When the NavigationRail renders
   * Then the navigation shell is fully visible with Clientes active
   */
  test('E2E-EC-05 — Después del redirect a /clientes el shell completo es visible con Clientes activo', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const nav = new NavigationShellPage(page);
    await nav.goto();

    // THEN: NavigationRail is visible
    await expect(nav.navigationRail).toBeVisible();

    // AND: Clientes is active after redirect
    const clientesLink = page.getByRole('link', { name: /clientes/i });
    await expect(clientesLink).toHaveAttribute('aria-current', 'page');
  });
});

// ---------------------------------------------------------------------------
// ARIA accessibility (AC1, AC2)
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — Accesibilidad ARIA', () => {
  /**
   * E2E-EC-06 (P1 — AC1)
   * Given the desktop app is loaded
   * When the NavigationRail renders
   * Then it has the correct ARIA label "Navegación principal"
   */
  test('E2E-EC-06 — NavigationRail tiene aria-label="Navegación principal" en desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');

    const navRail = page.getByTestId('navigation-rail');
    await expect(navRail).toHaveAttribute('aria-label', 'Navegación principal');
  });

  /**
   * E2E-EC-07 (P1 — AC2)
   * Given the mobile app is loaded
   * When the NavigationBar renders
   * Then it has the correct ARIA label "Menú de navegación"
   */
  test('E2E-EC-07 — NavigationBar tiene aria-label="Menú de navegación" en móvil', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/clientes');

    const navBar = page.getByTestId('navigation-bar');
    await expect(navBar).toHaveAttribute('aria-label', 'Menú de navegación');
  });

  /**
   * E2E-EC-08 (P2 — AC1)
   * Given the desktop app is loaded
   * When keyboard Tab is pressed from the page
   * Then navigation links are reachable via keyboard (focusable)
   */
  test('E2E-EC-08 — Los ítems de navegación son accesibles por teclado', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // At least one nav link gets focus (either Clientes or Contactos)
    const focusedEl = await page.evaluate(() => document.activeElement?.textContent?.trim());
    const navLabels = ['Clientes', 'Contactos'];
    expect(navLabels.some((label) => focusedEl?.includes(label))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 404 view edge cases (AC4)
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — Vista 404 edge cases (AC4)', () => {
  /**
   * E2E-EC-09 (P1 — AC4)
   * Given the user is on the 404 page
   * When they click "Ir a Clientes"
   * Then they are navigated to /clientes (SPA navigation — no full reload)
   */
  test('E2E-EC-09 — Clic en "Ir a Clientes" desde 404 navega a /clientes sin recarga', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    let reloadCount = 0;
    page.on('load', () => { reloadCount++; });

    await page.goto('/ruta-inexistente');
    reloadCount = 0; // reset after initial load

    // WHEN: click "Ir a Clientes" link
    await page.getByRole('link', { name: /ir a clientes/i }).click();

    // THEN: navigated to /clientes
    await expect(page).toHaveURL(/\/clientes$/);
    expect(reloadCount).toBe(0);
  });

  /**
   * E2E-EC-10 (P2 — AC4)
   * Given the user navigates to a deeply nested unknown route
   * When the page loads
   * Then the 404 view is shown (not a JS crash)
   */
  test('E2E-EC-10 — Ruta desconocida profunda /a/b/c muestra vista 404', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/a/b/c');

    await expect(page.getByTestId('not-found-view')).toBeVisible();
    await expect(page.getByText('Página no encontrada')).toBeVisible();
  });

  /**
   * E2E-EC-11 (P2 — AC4)
   * Given the user navigates to a URL with special characters
   * When the page loads
   * Then the 404 view is displayed (no unhandled error)
   */
  test('E2E-EC-11 — Ruta con caracteres especiales muestra vista 404', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/ruta-especial-123_test');

    await expect(page.getByTestId('not-found-view')).toBeVisible();
  });

  /**
   * E2E-EC-12 (P2 — AC4)
   * Given the 404 page is shown
   * When the page is inspected
   * Then the secondary Spanish message "La ruta solicitada no existe." is also visible
   */
  test('E2E-EC-12 — Mensaje secundario "La ruta solicitada no existe." visible en 404', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/no-encontrado');

    await expect(page.getByText('La ruta solicitada no existe.')).toBeVisible();
  });

  /**
   * E2E-EC-13 (P2 — AC4)
   * Given the 404 page is shown
   * When the page is inspected
   * Then the numeric "404" heading is visible
   */
  test('E2E-EC-13 — Heading numérico "404" visible en vista not-found', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/no-encontrado');

    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });
});

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
