import { test, expect } from '@playwright/test';
import { NavigationPage } from '../../pages/navigation.page';

// ────────────────────────────────────────────────────────────────────────
// EDGE CASES — Navigation Shell
// Expands ATDD coverage with boundary, error-path and interaction scenarios
// NOT covered by navigation-shell.spec.ts (ATDD happy paths)
// ────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────
// Breakpoint Boundary (1024px exact) — Tailwind `lg:` threshold
// ────────────────────────────────────────────────────────────────────────
test.describe('[P1] Breakpoint boundary — 1024px exact viewport width', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('[P1] Given viewport is exactly 1024px wide, When app renders, Then NavigationRail (desktop) is visible', async ({ page }) => {
    // GIVEN: Viewport at exact Tailwind lg: breakpoint
    const nav = new NavigationPage(page);

    // WHEN: App loads at the breakpoint boundary
    await nav.goto('/clientes');

    // THEN: NavigationRail should be visible (lg: applies at ≥ 1024px)
    await expect(nav.navigationRail).toBeVisible();
  });

  test('[P1] Given viewport is exactly 1024px wide, When app renders, Then NavigationBar (mobile) is NOT visible', async ({ page }) => {
    // GIVEN: Viewport at exact lg: threshold
    const nav = new NavigationPage(page);

    // WHEN: App loads
    await nav.goto('/clientes');

    // THEN: Mobile bottom bar should be hidden
    await expect(nav.navigationBar).not.toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Breakpoint Boundary (1023px — just below lg:)
// ────────────────────────────────────────────────────────────────────────
test.describe('[P1] Breakpoint boundary — 1023px viewport (just below lg:)', () => {
  test.use({ viewport: { width: 1023, height: 768 } });

  test('[P1] Given viewport is 1023px wide, When app renders, Then NavigationBar (mobile) is visible', async ({ page }) => {
    // GIVEN: Viewport just below lg: breakpoint
    const nav = new NavigationPage(page);

    // WHEN: App loads
    await nav.goto('/clientes');

    // THEN: Mobile bottom nav should show
    await expect(nav.navigationBar).toBeVisible();
  });

  test('[P1] Given viewport is 1023px wide, When app renders, Then NavigationRail (desktop) is NOT visible', async ({ page }) => {
    // GIVEN: Viewport just below lg: breakpoint
    const nav = new NavigationPage(page);

    // WHEN: App loads
    await nav.goto('/clientes');

    // THEN: Desktop rail should be hidden
    await expect(nav.navigationRail).not.toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Active state does NOT bleed — pathname prefix isolation
// e.g. /clientesextension must NOT activate "Clientes" item
// ────────────────────────────────────────────────────────────────────────
test.describe('[P1] Active state prefix isolation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] Given unknown route /clientesextension, When page loads, Then "Clientes" nav item is NOT marked active', async ({ page }) => {
    // GIVEN: A path that starts with "/clientes" but is NOT "/clientes"
    await page.goto('/clientesextension');

    // WHEN: 404 page renders (route not registered)
    // THEN: nav-item-clientes should not have aria-current="page"
    // (The not-found component renders without the _app layout, so nav-item may not exist)
    const notFound = page.getByTestId('not-found-page');
    await expect(notFound).toBeVisible();

    // If nav items are somehow present, none should be incorrectly active
    const clientesItems = page.getByTestId('nav-item-clientes');
    const count = await clientesItems.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(clientesItems.nth(i)).not.toHaveAttribute('aria-current', 'page');
      }
    }
  });
});

// ────────────────────────────────────────────────────────────────────────
// Browser history: back/forward navigation
// ────────────────────────────────────────────────────────────────────────
test.describe('[P1] Browser history — back/forward navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] Given user navigated from /clientes to /contactos, When pressing browser Back, Then URL returns to /clientes', async ({ page }) => {
    // GIVEN: User starts at /clientes and navigates to /contactos
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await nav.clickContactos();
    await expect(page).toHaveURL(/.*\/contactos/);

    // WHEN: Browser back button is triggered
    await page.goBack();

    // THEN: URL should return to /clientes
    await expect(page).toHaveURL(/.*\/clientes/);
    await expect(page.getByTestId('clientes-page')).toBeVisible();
  });

  test('[P1] Given user went back to /clientes from /contactos, When pressing browser Forward, Then URL advances to /contactos', async ({ page }) => {
    // GIVEN: User navigated forward then back
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await nav.clickContactos();
    await page.goBack();
    await expect(page).toHaveURL(/.*\/clientes/);

    // WHEN: Browser forward button is triggered
    await page.goForward();

    // THEN: URL should advance to /contactos
    await expect(page).toHaveURL(/.*\/contactos/);
    await expect(page.getByTestId('contactos-page')).toBeVisible();
  });

  test('[P1] Given user pressed Back to /clientes, When nav renders, Then Clientes item is marked active again', async ({ page }) => {
    // GIVEN: User navigated to /contactos then pressed back to /clientes
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');
    await nav.clickContactos();
    await page.goBack();
    await expect(page).toHaveURL(/.*\/clientes/);

    // THEN: Active state should be restored correctly
    await nav.expectClientesActive();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Rapid sequential navigation (no race condition)
// ────────────────────────────────────────────────────────────────────────
test.describe('[P2] Rapid sequential navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] Given user rapidly clicks Clientes then Contactos, When both clicks resolve, Then final URL is /contactos', async ({ page }) => {
    // GIVEN: App is on /clientes
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');

    // WHEN: Two navigation clicks fire in rapid succession
    await nav.navItemClientes.click();
    await nav.navItemContactos.click();

    // THEN: Final resolved URL should be /contactos (last click wins)
    await expect(page).toHaveURL(/.*\/contactos/);
    await expect(page.getByTestId('contactos-page')).toBeVisible();
  });

  test('[P2] Given user rapidly clicks Contactos then Clientes, When both clicks resolve, Then final URL is /clientes', async ({ page }) => {
    // GIVEN: App is on /contactos
    const nav = new NavigationPage(page);
    await nav.goto('/contactos');

    // WHEN: Two navigation clicks fire in rapid succession
    await nav.navItemContactos.click();
    await nav.navItemClientes.click();

    // THEN: Final resolved URL should be /clientes
    await expect(page).toHaveURL(/.*\/clientes/);
    await expect(page.getByTestId('clientes-page')).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Mobile: touch target WIDTH as well as height
// ────────────────────────────────────────────────────────────────────────
test.describe('[P1] Mobile touch targets — minimum dimensions', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('[P1] Given mobile viewport, When NavigationBar renders, Then Contactos item meets 44px minimum touch height', async ({ page }) => {
    // GIVEN: App is on mobile viewport
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');

    // WHEN: Measure the Contactos item bounding box
    const contactosItem = nav.navigationBar.getByTestId('nav-item-contactos');
    const box = await contactosItem.boundingBox();

    // THEN: Height should be at least 44px (WCAG 2.1 AA, FR29)
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('[P1] Given mobile viewport, When NavigationBar renders, Then Clientes item touch width is at least 44px', async ({ page }) => {
    // GIVEN: App is on mobile viewport
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');

    // WHEN: Measure Clientes item bounding box
    const clientesItem = nav.navigationBar.getByTestId('nav-item-clientes');
    const box = await clientesItem.boundingBox();

    // THEN: Width should also meet minimum for touch (44px)
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });

  test('[P1] Given mobile viewport, When Clientes is tapped in NavigationBar, Then Clientes item becomes active', async ({ page }) => {
    // GIVEN: App is on /contactos on mobile
    const nav = new NavigationPage(page);
    await nav.goto('/contactos');

    // WHEN: User taps Clientes
    await nav.tapClientes();

    // THEN: Active state updates to Clientes
    const clientesItem = nav.navigationBar.getByTestId('nav-item-clientes');
    await expect(clientesItem).toHaveAttribute('aria-current', 'page');
  });
});

// ────────────────────────────────────────────────────────────────────────
// 404 Edge cases — various unknown routes
// ────────────────────────────────────────────────────────────────────────
test.describe('[P1] 404 edge cases — various unknown route patterns', () => {

  test('[P1] Given route /api (reserved-looking path), When page loads, Then 404 view is shown gracefully', async ({ page }) => {
    // GIVEN: A path that looks like it could be an API route but is not registered
    await page.goto('/api');

    // WHEN: Page renders
    // THEN: Should show 404, NOT crash or hang
    await expect(page.getByTestId('not-found-page')).toBeVisible();
    await expect(page.getByText('Página no encontrada')).toBeVisible();
  });

  test('[P1] Given deeply nested unknown route /a/b/c/d, When page loads, Then 404 view is shown', async ({ page }) => {
    // GIVEN: A deeply nested path with no registered route
    await page.goto('/a/b/c/d');

    // WHEN: Page renders
    // THEN: 404 component is displayed
    await expect(page.getByTestId('not-found-page')).toBeVisible();
  });

  test('[P1] Given route with special characters /ruta%20con%20espacios, When page loads, Then 404 view is shown', async ({ page }) => {
    // GIVEN: URL-encoded path
    await page.goto('/ruta%20con%20espacios');

    // WHEN: Page renders
    // THEN: 404 component is displayed gracefully (no crash)
    await expect(page.getByTestId('not-found-page')).toBeVisible();
  });

  test('[P2] Given 404 page, When user clicks "Volver a Clientes" link, Then both Navbar and NavigationRail are visible after navigation', async ({ page }) => {
    // GIVEN: User is on 404 page
    await page.goto('/ruta-que-no-existe');
    await expect(page.getByTestId('not-found-page')).toBeVisible();

    // WHEN: User clicks the return link
    await page.getByTestId('not-found-back-link').click();
    await expect(page).toHaveURL(/.*\/clientes/);

    // THEN: Full navigation shell is restored
    const nav = new NavigationPage(page);
    await expect(nav.navbar).toBeVisible();
    await expect(nav.navigationRail).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────
// ARIA completeness — keyboard/screen-reader focused
// ────────────────────────────────────────────────────────────────────────
test.describe('[P1] ARIA completeness', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] Given desktop, When app renders, Then NavigationRail has role="navigation" and aria-label in Spanish', async ({ page }) => {
    // GIVEN: Desktop viewport
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');

    // WHEN: NavigationRail is present
    // THEN: It should have correct role and aria-label
    await expect(nav.navigationRail).toHaveAttribute('role', 'navigation');
    await expect(nav.navigationRail).toHaveAttribute('aria-label', 'Navegación principal');
  });

  test('[P1] Given mobile, When app renders, Then NavigationBar has role="navigation" and aria-label in Spanish', async ({ page }) => {
    // GIVEN: Mobile viewport
    test.use({ viewport: { width: 375, height: 812 } });
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');

    // WHEN: NavigationBar is present
    // THEN: Correct role and aria-label
    await expect(nav.navigationBar).toHaveAttribute('role', 'navigation');
    await expect(nav.navigationBar).toHaveAttribute('aria-label', 'Navegación móvil');
  });

  test('[P1] Given user is at /contactos, When nav renders on desktop, Then Contactos nav item has aria-label "Ir a Contactos"', async ({ page }) => {
    // GIVEN: Desktop viewport at /contactos
    const nav = new NavigationPage(page);
    await nav.goto('/contactos');

    // WHEN: Rail renders
    // THEN: Contactos item aria-label is in correct Spanish form
    await expect(nav.navItemContactos).toHaveAttribute('aria-label', 'Ir a Contactos');
  });

  test('[P1] Given user is at /clientes, When nav renders, Then exactly one nav item has aria-current="page" in the rail', async ({ page }) => {
    // GIVEN: Desktop viewport at /clientes
    const nav = new NavigationPage(page);
    await nav.goto('/clientes');

    // WHEN: NavigationRail renders
    // THEN: Only one item should have aria-current="page"
    const activeItems = await nav.navigationRail.locator('[aria-current="page"]').count();
    expect(activeItems).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────────────
// Root redirect edge cases
// ────────────────────────────────────────────────────────────────────────
test.describe('[P1] Root redirect edge cases', () => {

  test('[P1] Given user navigates to / after visiting /contactos, When redirect fires, Then navigation shell is visible at /clientes', async ({ page }) => {
    // GIVEN: User previously visited /contactos, then navigates to root
    await page.goto('/contactos');
    await expect(page).toHaveURL(/.*\/contactos/);
    await page.goto('/');

    // WHEN: Root redirect fires
    await expect(page).toHaveURL(/.*\/clientes/);

    // THEN: Navigation shell is fully visible
    const nav = new NavigationPage(page);
    await nav.expectNavbarVisible('Siesa Agents');
    await expect(nav.navigationRail).toBeVisible();
  });

  test('[P1] Given user refreshes at /clientes, When page reloads, Then stays at /clientes without redirect loop', async ({ page }) => {
    // GIVEN: User is at /clientes
    await page.goto('/clientes');
    await expect(page).toHaveURL(/.*\/clientes/);

    // WHEN: Page is refreshed (reload)
    await page.reload();

    // THEN: URL remains /clientes, no redirect back to / or any loop
    await expect(page).toHaveURL(/.*\/clientes/);
    await expect(page.getByTestId('clientes-page')).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Navbar product name rendering
// ────────────────────────────────────────────────────────────────────────
test.describe('[P2] Navbar product name visibility on all routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] Given user navigates to /contactos, When page renders, Then Navbar still shows "Siesa Agents"', async ({ page }) => {
    // GIVEN: User is at /contactos
    const nav = new NavigationPage(page);
    await nav.goto('/contactos');

    // WHEN: Navbar is checked
    // THEN: Product name is always "Siesa Agents" regardless of route
    await nav.expectNavbarVisible('Siesa Agents');
  });

  test('[P2] Given 404 route, When page renders, Then Navbar with "Siesa Agents" is NOT present (404 has no shell)', async ({ page }) => {
    // GIVEN: User lands on a 404 page
    await page.goto('/ruta-inexistente-404');

    // WHEN: 404 component renders (no _app layout wrapper)
    // THEN: notFoundPage is rendered, the shell navbar wrapping the layout may not be present
    await expect(page.getByTestId('not-found-page')).toBeVisible();
    // The navbar inside _app layout should NOT be present on 404 (notFoundComponent renders at root level)
    const navbarCount = await page.getByTestId('navbar').count();
    expect(navbarCount).toBe(0);
  });
});
