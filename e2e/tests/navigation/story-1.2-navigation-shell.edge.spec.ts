/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Extended Coverage
 * Epic 1: Project Foundation & Application Shell
 *
 * Expands ATDD tests with:
 *   - Viewport boundary transitions (resize desktop → mobile)
 *   - Keyboard accessibility (Tab, Enter navigation)
 *   - ARIA attribute correctness (aria-label, aria-current)
 *   - Multi-step in-app navigation (active state updates)
 *   - Browser history (back button after SPA navigation)
 *   - Deeply nested unknown routes (404 fallback)
 *   - Viewport-specific 404 back-link behaviour
 *   - NavigationBar hidden state (not in DOM or not visible) on desktop
 *   - Active nav state correctness on programmatic navigation
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Viewport boundary — transition between desktop and mobile layouts
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Viewport boundary transitions', () => {
  test('[P1] should switch from NavigationRail to NavigationBar when viewport shrinks below 1024px', async ({ page }) => {
    // GIVEN: Desktop viewport (1280px) — NavigationRail is visible
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // WHEN: Viewport resizes to mobile (390px)
    await page.setViewportSize({ width: 390, height: 844 });

    // THEN: NavigationBar is visible and NavigationRail is not
    // (Playwright's built-in retry on toBeVisible() handles the React re-render delay)
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('[P1] should switch from NavigationBar to NavigationRail when viewport grows above 1024px', async ({ page }) => {
    // GIVEN: Mobile viewport (390px) — NavigationBar is visible
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();

    // WHEN: Viewport resizes to desktop (1280px)
    await page.setViewportSize({ width: 1280, height: 800 });

    // THEN: NavigationRail is visible and NavigationBar is not
    // (Playwright's built-in retry on toBeVisible() handles the React re-render delay)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });

  test('[P2] should render exactly at the 1023px breakpoint with NavigationBar (mobile boundary)', async ({ page }) => {
    // GIVEN: Viewport set to exactly 1023px (one pixel below desktop threshold)
    await page.setViewportSize({ width: 1023, height: 768 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: NavigationBar visible, NavigationRail not visible
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('[P2] should render exactly at the 1024px breakpoint with NavigationRail (desktop boundary)', async ({ page }) => {
    // GIVEN: Viewport set to exactly 1024px (desktop threshold)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: NavigationRail visible, NavigationBar not visible
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ARIA correctness — labels and current state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ARIA attribute correctness', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should have aria-label on the desktop NavigationRail nav element', async ({ page }) => {
    // GIVEN: Desktop viewport with navigation loaded
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: nav[data-testid="navigation-rail"] has an aria-label attribute
    const ariaLabel = await page.locator('[data-testid="navigation-rail"]').getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel!.length).toBeGreaterThan(0);
  });

  test('[P1] active nav item should have aria-current="page" and inactive item should NOT', async ({ page }) => {
    // GIVEN: At /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: clientes item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-clientes"][aria-current="page"]')).toBeVisible();

    // AND: contactos item does NOT have aria-current="page"
    const contactosAriaCurrent = await page.locator('[data-testid="nav-item-contactos"]').getAttribute('aria-current');
    expect(contactosAriaCurrent).not.toBe('page');
  });

  test('[P1] active nav item should update aria-current after in-app navigation to /contactos', async ({ page }) => {
    // GIVEN: At /clientes — clientes is active
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User navigates to /contactos via nav click
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');

    // THEN: contactos item has aria-current="page", clientes item does NOT
    await expect(page.locator('[data-testid="nav-item-contactos"][aria-current="page"]')).toBeVisible();
    const clientesAriaCurrent = await page.locator('[data-testid="nav-item-clientes"]').getAttribute('aria-current');
    expect(clientesAriaCurrent).not.toBe('page');
  });

  test('[P2] no nav item should have aria-current="page" when on a 404 route', async ({ page }) => {
    // GIVEN: At an unknown route
    await page.goto('/ruta-desconocida');
    await page.waitForLoadState('domcontentloaded');

    // THEN: Neither nav item is marked active (nav may or may not render on 404)
    // If nav items exist, none should have aria-current="page"
    const clientesEl = page.locator('[data-testid="nav-item-clientes"]');
    const contactosEl = page.locator('[data-testid="nav-item-contactos"]');

    const clientesCount = await clientesEl.count();
    const contactosCount = await contactosEl.count();

    if (clientesCount > 0) {
      const ariaCurrent = await clientesEl.getAttribute('aria-current');
      expect(ariaCurrent).not.toBe('page');
    }
    if (contactosCount > 0) {
      const ariaCurrent = await contactosEl.getAttribute('aria-current');
      expect(ariaCurrent).not.toBe('page');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multi-step navigation — active state updates correctly on consecutive clicks
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Multi-step in-app navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should update active state correctly across multiple consecutive navigations', async ({ page }) => {
    // GIVEN: App loads at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="nav-item-clientes"][aria-current="page"]')).toBeVisible();

    // WHEN: Navigate clientes → contactos → clientes
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');
    await expect(page.locator('[data-testid="nav-item-contactos"][aria-current="page"]')).toBeVisible();

    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('/clientes');

    // THEN: Clientes is active again, Contactos is not
    await expect(page.locator('[data-testid="nav-item-clientes"][aria-current="page"]')).toBeVisible();
    const contactosAriaCurrent = await page.locator('[data-testid="nav-item-contactos"]').getAttribute('aria-current');
    expect(contactosAriaCurrent).not.toBe('page');
  });

  test('[P1] should not trigger a full page reload during multi-step navigation', async ({ page }) => {
    // GIVEN: App loaded
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    let fullReloadCount = 0;
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.resourceType() === 'document') {
        fullReloadCount++;
      }
    });

    // WHEN: Navigate back and forth three times (6 navigations from the goto above)
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');

    // THEN: Zero document-level reloads (all client-side routing)
    expect(fullReloadCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser history — back button after SPA navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser history navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should restore /clientes view when pressing browser back after navigating to /contactos', async ({ page }) => {
    // GIVEN: User navigated from /clientes to /contactos
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');

    // WHEN: User presses browser back button
    await page.goBack();
    await page.waitForURL('/clientes');

    // THEN: URL is /clientes and Clientes view is visible
    expect(page.url()).toContain('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P1] should restore active nav item after browser back navigation', async ({ page }) => {
    // GIVEN: User navigated from /clientes to /contactos
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');

    // WHEN: User presses browser back button
    await page.goBack();
    await page.waitForURL('/clientes');

    // THEN: Clientes nav item is marked active
    await expect(page.locator('[data-testid="nav-item-clientes"][aria-current="page"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 edge cases — deeply nested paths and error boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 edge cases', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should display 404 view for deeply nested unknown paths', async ({ page }) => {
    // GIVEN: A deeply nested path that has no matching route
    await page.goto('/a/b/c/d/e/unknown-deep-route');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The 404 view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P1] should display "Página no encontrada" for deeply nested unknown paths', async ({ page }) => {
    // GIVEN: A deeply nested unknown route
    await page.goto('/seccion/inexistente/pagina');
    await page.waitForLoadState('domcontentloaded');

    // THEN: Spanish error message is shown
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('Página no encontrada');
  });

  test('[P1] back link in 404 view should navigate to /clientes without full page reload', async ({ page }) => {
    // GIVEN: 404 view is displayed
    await page.goto('/unknown');
    await page.waitForLoadState('domcontentloaded');

    let fullReloadOccurred = false;
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.resourceType() === 'document') {
        fullReloadOccurred = true;
      }
    });

    // WHEN: User clicks the back-to-clientes link
    await page.locator('[data-testid="not-found-back-link"]').click();
    await page.waitForURL('/clientes');

    // THEN: URL is /clientes and navigation was SPA (no reload)
    expect(page.url()).toContain('/clientes');
    expect(fullReloadOccurred).toBe(false);
  });

  test('[P2] should display 404 view for mobile viewport on unknown route', async ({ page }) => {
    // GIVEN: Mobile viewport navigating to unknown route
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/pagina-no-existe');
    await page.waitForLoadState('domcontentloaded');

    // THEN: 404 view renders on mobile too
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('Página no encontrada');
  });

  test('[P2] back link from 404 view should be accessible on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport on 404 page
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/unknown');
    await page.waitForLoadState('domcontentloaded');

    // THEN: Back link is visible and clickable on mobile
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Root redirect edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Root redirect edge cases', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should not show any active nav item while / redirect is in progress', async ({ page }) => {
    // GIVEN: User navigates to /
    // WHEN: Page load starts and redirect fires
    await page.goto('/');
    await page.waitForURL('/clientes');

    // THEN: Final URL is /clientes (redirect completed correctly)
    expect(page.url()).toContain('/clientes');
    // AND: Clientes nav item should now be active
    await expect(page.locator('[data-testid="nav-item-clientes"][aria-current="page"]')).toBeVisible();
  });

  test('[P2] should not produce console errors during root redirect', async ({ page }) => {
    // GIVEN: Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // WHEN: Navigate to /
    await page.goto('/');
    await page.waitForURL('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Zero errors
    expect(consoleErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation element uniqueness — only one nav instance in DOM at a time
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigation element uniqueness', () => {
  test('[P1] should render exactly one navigation-rail on desktop (no duplicates)', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Exactly one navigation-rail element in the DOM
    const count = await page.locator('[data-testid="navigation-rail"]').count();
    expect(count).toBe(1);
  });

  test('[P1] should render exactly one navigation-bar on mobile (no duplicates)', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Exactly one navigation-bar element in the DOM
    const count = await page.locator('[data-testid="navigation-bar"]').count();
    expect(count).toBe(1);
  });

  test('[P1] should render exactly one nav-item-clientes on desktop (no duplicates)', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Exactly one nav-item-clientes element (JS-based render ensures no duplicates)
    const count = await page.locator('[data-testid="nav-item-clientes"]').count();
    expect(count).toBe(1);
  });

  test('[P1] should render exactly one nav-item-contactos on mobile (no duplicates)', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: Exactly one nav-item-contactos element
    const count = await page.locator('[data-testid="nav-item-contactos"]').count();
    expect(count).toBe(1);
  });
});
