/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible on left with Clientes/Contactos entries (FR28)
 *   AC2 — Mobile NavigationBar at bottom on viewport < 1024px (FR29)
 *   AC3 — Deep linking: /clientes and /contactos load correct views, active item highlighted (FR30)
 *   AC4 — Unknown route displays 404 view with link to return home
 *   AC5 — SPA behavior: only content area re-renders, navigation shell stays mounted
 *   AC6 — Accessibility: focus indicators and correct ARIA labels in Spanish (WCAG 2.1 AA)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport >= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (>= 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (>= 1024px)
    // Network-first: intercept before navigation
    await page.route('**/*', (route) => route.continue());

    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: A NavigationRail is visible on the left side
    const navRail = page.locator('[data-testid="navigation-rail"]');
    await expect(navRail).toBeVisible();
  });

  test('should display "Clientes" entry in the desktop NavigationRail', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (>= 1024px)
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: The NavigationRail has a "Clientes" navigation entry
    const clientesLink = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesLink).toBeVisible();
  });

  test('should display "Contactos" entry in the desktop NavigationRail', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (>= 1024px)
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: The NavigationRail has a "Contactos" navigation entry
    const contactosLink = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosLink).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/');

    // Network-first: register navigation listener BEFORE click
    let fullPageReloadOccurred = false;
    page.on('load', () => {
      fullPageReloadOccurred = true;
    });

    // Reset the flag after initial load settles
    await page.waitForLoadState('networkidle');
    fullPageReloadOccurred = false;

    // WHEN: The user clicks the Clientes entry
    await page.click('[data-testid="nav-item-clientes"]');
    await page.waitForURL('/clientes');

    // THEN: The URL changes to /clientes without a full page reload
    expect(page.url()).toContain('/clientes');
    expect(fullPageReloadOccurred).toBe(false);
  });

  test('should navigate to /contactos without full page reload when clicking Contactos', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/clientes');

    let fullPageReloadOccurred = false;
    page.on('load', () => {
      fullPageReloadOccurred = true;
    });

    await page.waitForLoadState('networkidle');
    fullPageReloadOccurred = false;

    // WHEN: The user clicks the Contactos entry
    await page.click('[data-testid="nav-item-contactos"]');
    await page.waitForURL('/contactos');

    // THEN: The URL changes to /contactos without a full page reload (FR28)
    expect(page.url()).toContain('/contactos');
    expect(fullPageReloadOccurred).toBe(false);
  });

  test('should NOT show mobile NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport (>= 1024px)
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: The mobile NavigationBar is NOT visible (CSS hidden)
    const navBar = page.locator('[data-testid="navigation-bar"]');
    await expect(navBar).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (< 1024px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should render NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport (< 1024px)
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: A NavigationBar is displayed at the bottom
    const navBar = page.locator('[data-testid="navigation-bar"]');
    await expect(navBar).toBeVisible();
  });

  test('should NOT show desktop NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport (< 1024px)
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: The desktop NavigationRail is NOT visible (FR29)
    const navRail = page.locator('[data-testid="navigation-rail"]');
    await expect(navRail).not.toBeVisible();
  });

  test('should display "Clientes" item in mobile NavigationBar and be tappable', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport
    await page.goto('/contactos');

    // WHEN: The user views the NavigationBar
    const clientesItem = page.locator('[data-testid="nav-bar-item-clientes"]');
    await expect(clientesItem).toBeVisible();

    // THEN: Tapping the Clientes item navigates to /clientes (FR29)
    await clientesItem.tap();
    await expect(page).toHaveURL('/clientes');
  });

  test('should display "Contactos" item in mobile NavigationBar and be tappable', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport
    await page.goto('/clientes');

    // WHEN: The user views the NavigationBar
    const contactosItem = page.locator('[data-testid="nav-bar-item-contactos"]');
    await expect(contactosItem).toBeVisible();

    // THEN: Tapping the Contactos item navigates to /contactos (FR29)
    await contactosItem.tap();
    await expect(page).toHaveURL('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep Linking: direct URL access
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep Linking (FR30)', () => {
  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The correct view is rendered without redirection to a home screen
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The correct view is rendered (FR30)
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should highlight the Clientes nav item as active when on /clientes route', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    await page.goto('/clientes');

    // WHEN: The page loads
    // THEN: The Clientes navigation item is highlighted as active
    const clientesLink = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesLink).toHaveAttribute('aria-current', 'page');
  });

  test('should highlight the Contactos nav item as active when on /contactos route', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    await page.goto('/contactos');

    // WHEN: The page loads
    // THEN: The Contactos navigation item is highlighted as active (FR30)
    const contactosLink = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosLink).toHaveAttribute('aria-current', 'page');
  });

  test('should redirect / to /clientes', async ({ page }) => {
    // GIVEN: The user navigates to the root URL
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The URL redirects to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 Not Found route
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 Not Found graceful handling', () => {
  test('should display the 404 not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/foo');

    // THEN: A 404 / not-found view is displayed gracefully
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display a link to return home on the 404 page', async ({ page }) => {
    // GIVEN: The user is on an unknown route (404 page)
    await page.goto('/unknown-route-xyz');

    // WHEN: The user views the 404 page
    // THEN: A link to return home is present and visible
    const homeLink = page.locator('[data-testid="not-found-home-link"]');
    await expect(homeLink).toBeVisible();
  });

  test('should navigate back to /clientes when clicking the home link on the 404 page', async ({ page }) => {
    // GIVEN: The user is on the 404 page
    await page.goto('/this-does-not-exist');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // WHEN: The user clicks the link to return home
    await page.click('[data-testid="not-found-home-link"]');

    // THEN: The user is taken back to a valid route (home or /clientes)
    await expect(page).toHaveURL(/\/(clientes)?$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — SPA behavior: navigation shell stays mounted, no flicker
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — SPA behavior: navigation shell persists across route changes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should keep the navigation shell mounted when navigating between sections', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop viewport
    await page.goto('/clientes');
    const navRail = page.locator('[data-testid="navigation-rail"]');
    await expect(navRail).toBeVisible();

    // WHEN: The user navigates to Contactos
    await page.click('[data-testid="nav-item-contactos"]');
    await page.waitForURL('/contactos');

    // THEN: The navigation shell remains mounted without flickering
    await expect(navRail).toBeVisible();
  });

  test('should only re-render the content area when navigating between routes', async ({ page }) => {
    // GIVEN: The user is on the /clientes route
    await page.goto('/clientes');

    // Attach a MutationObserver to detect if the nav rail was removed/re-added
    const navRailReplaced = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const nav = document.querySelector('[data-testid="navigation-rail"]');
        if (!nav) {
          resolve(true); // Not found at all = test will fail naturally
          return;
        }
        let replaced = false;
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            mutation.removedNodes.forEach((node) => {
              if (node === nav) replaced = true;
            });
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(replaced);
        }, 2000);
      });
    });

    // WHEN: The user navigates to Contactos
    await page.click('[data-testid="nav-item-contactos"]');
    await page.waitForURL('/contactos');

    // THEN: The navigation rail element was NOT replaced (no full remount)
    expect(navRailReplaced).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Accessibility: ARIA labels in Spanish, visible focus indicators
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Accessibility (WCAG 2.1 AA)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have a nav element with aria-label "Navegación principal" on desktop', async ({ page }) => {
    // GIVEN: The navigation structure is rendered
    await page.goto('/clientes');

    // WHEN: Inspected with an accessibility tool
    // THEN: All navigation links have correct ARIA labels in Spanish (WCAG 2.1 AA)
    const nav = page.locator('nav[aria-label="Navegación principal"]');
    await expect(nav).toBeVisible();
  });

  test('should have aria-current="page" on the active Clientes link', async ({ page }) => {
    // GIVEN: The user is on the /clientes route
    await page.goto('/clientes');

    // WHEN: The navigation is rendered
    // THEN: The active Clientes link has aria-current="page"
    const activeLink = page.locator('[data-testid="nav-item-clientes"][aria-current="page"]');
    await expect(activeLink).toBeVisible();
  });

  test('should have aria-current="page" on the active Contactos link', async ({ page }) => {
    // GIVEN: The user is on the /contactos route
    await page.goto('/contactos');

    // WHEN: The navigation is rendered
    // THEN: The active Contactos link has aria-current="page" (WCAG 2.1 AA)
    const activeLink = page.locator('[data-testid="nav-item-contactos"][aria-current="page"]');
    await expect(activeLink).toBeVisible();
  });

  test('should display navigation text labels in Spanish', async ({ page }) => {
    // GIVEN: The navigation is rendered
    await page.goto('/clientes');

    // WHEN: Inspecting nav item labels
    // THEN: Text labels are in Spanish
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toContainText('Clientes');
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toContainText('Contactos');
  });

  test('should have visible focus indicator on nav links when focused via keyboard', async ({ page }) => {
    // GIVEN: The navigation is rendered
    await page.goto('/clientes');

    // WHEN: The user presses Tab to move focus to the navigation
    const clientesLink = page.locator('[data-testid="nav-item-clientes"]');
    await clientesLink.focus();

    // THEN: The focused link has a visible focus ring (focus-visible class)
    // The link must not have outline:none without a replacement focus indicator
    const outline = await clientesLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outlineWidth;
    });

    // Focus ring outline must be > 0px, or focus-visible class must be present
    const hasFocusVisible = await clientesLink.evaluate((el) =>
      el.classList.contains('focus-visible') ||
      el.matches(':focus-visible')
    );

    expect(outline !== '0px' || hasFocusVisible).toBe(true);
  });
});
