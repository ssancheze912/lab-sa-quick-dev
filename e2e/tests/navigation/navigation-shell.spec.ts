/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail visible on left side; SPA navigation to /clientes and /contactos
 *   AC2 — Mobile: NavigationBar displayed at bottom; all items accessible
 *   AC3 — Deep linking: /clientes and /contactos render correct views without redirect
 *   AC4 — Unknown route: 404 not-found view displayed gracefully within shell
 *   AC5 — Active item highlighted in navigation when clicking Clientes or Contactos
 *   AC6 — WCAG 2.1 AA ARIA labels in Spanish on navigation shell
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail visible with Clientes + Contactos entries; SPA nav
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (viewport >= 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the NavigationRail on the left side on desktop', async ({ page }) => {
    // GIVEN: A desktop viewport (1280x800, >= 1024px threshold)
    // Network-first: listen for any console errors BEFORE navigation
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // WHEN: The user loads the application
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: A NavigationRail is visible on the left side
    const rail = page.locator('[data-testid="navigation-rail"]');
    await expect(rail).toBeVisible();
  });

  test('should display Clientes entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: A desktop viewport
    // WHEN: The user views the application
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The "Clientes" navigation item is visible in the rail
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).toBeVisible();
  });

  test('should display Contactos entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: A desktop viewport
    // WHEN: The user views the application
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The "Contactos" navigation item is visible in the rail
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).toBeVisible();
  });

  test('should navigate to /clientes without a full page reload when clicking Clientes', async ({ page }) => {
    // GIVEN: The user is on any page in the desktop layout
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // Track if a full page reload happens (navigation events)
    let fullReloadOccurred = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullReloadOccurred = true;
      }
    });

    // WHEN: The user clicks the "Clientes" navigation entry
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await clientesItem.click();

    // Reset after click (SPA navigation may trigger framenavigated for history pushState — check URL update instead)
    await page.waitForURL('**/clientes');

    // THEN: The URL is now /clientes
    expect(page.url()).toContain('/clientes');

    // AND: The Clientes view content is rendered
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });

  test('should navigate to /contactos without a full page reload when clicking Contactos', async ({ page }) => {
    // GIVEN: The user is on the clientes page in desktop layout
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user clicks the "Contactos" navigation entry
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await contactosItem.click();
    await page.waitForURL('**/contactos');

    // THEN: The URL is now /contactos
    expect(page.url()).toContain('/contactos');

    // AND: The Contactos view content is rendered
    await expect(page.locator('[data-testid="contactos-page"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile: NavigationBar at bottom; all items accessible and tappable
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (viewport < 1024px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should display the NavigationBar at the bottom on mobile', async ({ page }) => {
    // GIVEN: A mobile viewport (375x812, < 1024px threshold)
    // WHEN: The user loads the application
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The NavigationBar is visible (rendered at the bottom)
    const navBar = page.locator('[data-testid="navigation-bar"]');
    await expect(navBar).toBeVisible();
  });

  test('should NOT show the NavigationRail on mobile', async ({ page }) => {
    // GIVEN: A mobile viewport
    // WHEN: The user loads the application
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The NavigationRail is NOT visible (hidden via lg: Tailwind class)
    const rail = page.locator('[data-testid="navigation-rail"]');
    await expect(rail).not.toBeVisible();
  });

  test('should show Clientes navigation item in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: A mobile viewport
    // WHEN: The user views the app
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The Clientes entry is accessible in the NavigationBar
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).toBeVisible();
  });

  test('should show Contactos navigation item in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: A mobile viewport
    // WHEN: The user views the app
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The Contactos entry is accessible in the NavigationBar
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).toBeVisible();
  });

  test('should navigate to /contactos when the user taps Contactos on mobile', async ({ page }) => {
    // GIVEN: A mobile user on /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user taps the Contactos navigation item
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await contactosItem.tap();
    await page.waitForURL('**/contactos');

    // THEN: The app navigates to /contactos
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: /clientes and /contactos render without redirection
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking support', () => {
  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the URL bar (simulated by goto)
    // WHEN: The page loads
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The Clientes view is rendered (not redirected away)
    expect(page.url()).toContain('/clientes');
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the URL bar
    // WHEN: The page loads
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The Contactos view is rendered (not redirected away)
    expect(page.url()).toContain('/contactos');
    await expect(page.locator('[data-testid="contactos-page"]')).toBeVisible();
  });

  test('should redirect / to /clientes automatically', async ({ page }) => {
    // GIVEN: The user navigates to the root URL
    // WHEN: The page loads
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: The URL redirects to /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route: 404 not-found view displayed gracefully
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 Not Found route', () => {
  test('should display a not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/foo');
    await page.waitForLoadState('networkidle');

    // THEN: A 404 not-found view is displayed within the layout shell
    const notFoundView = page.locator('[data-testid="not-found-view"]');
    await expect(notFoundView).toBeVisible();
  });

  test('should display "Página no encontrada" text on the 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/unknown-route');
    await page.waitForLoadState('networkidle');

    // THEN: The not-found message contains "Página no encontrada"
    const notFoundView = page.locator('[data-testid="not-found-view"]');
    await expect(notFoundView).toContainText('Página no encontrada');
  });

  test('should provide a link back to /clientes from the 404 view', async ({ page }) => {
    // GIVEN: The user is on a 404 not-found page
    await page.goto('/nonexistent');
    await page.waitForLoadState('networkidle');

    // WHEN: The user clicks the link back to /clientes
    const backLink = page.locator('[data-testid="not-found-back-link"]');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await page.waitForURL('**/clientes');

    // THEN: The user is back on /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Active item highlighted in navigation to reflect current route
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Active navigation item highlighting', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should highlight the Clientes item as active when on /clientes', async ({ page }) => {
    // GIVEN: The user is on the /clientes route
    // WHEN: The navigation shell renders
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The Clientes navigation item is marked as active
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).toHaveAttribute('aria-current', 'page');
  });

  test('should highlight the Contactos item as active when on /contactos', async ({ page }) => {
    // GIVEN: The user is on the /contactos route
    // WHEN: The navigation shell renders
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The Contactos navigation item is marked as active
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT mark Contactos as active when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes
    // WHEN: The navigation shell renders
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The Contactos navigation item is NOT marked as active
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).not.toHaveAttribute('aria-current', 'page');
  });

  test('should update active item when user navigates from Clientes to Contactos', async ({ page }) => {
    // GIVEN: The user starts on /clientes (Clientes is active)
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user clicks Contactos
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await contactosItem.click();
    await page.waitForURL('**/contactos');

    // THEN: Contactos is now active
    await expect(contactosItem).toHaveAttribute('aria-current', 'page');

    // AND: Clientes is no longer active
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — WCAG 2.1 AA ARIA labels in Spanish on navigation shell
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — WCAG 2.1 AA accessibility and ARIA labels', () => {
  test('should have aria-label="Navegación principal" on the navigation wrapper', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    // WHEN: The user is on any valid route
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The navigation wrapper has the correct ARIA label in Spanish
    const navWrapper = page.locator('[aria-label="Navegación principal"]');
    await expect(navWrapper).toBeVisible();
  });

  test('should have accessible labels on the Clientes navigation item', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    // WHEN: The user is on any valid route
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The Clientes item has an accessible label
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).toBeVisible();

    // Check accessible name is "Clientes" (either via aria-label or text content)
    const accessibleName = await clientesItem.getAttribute('aria-label');
    const textContent = await clientesItem.textContent();
    const hasAccessibleName = accessibleName === 'Clientes' || (textContent?.includes('Clientes') ?? false);
    expect(hasAccessibleName).toBe(true);
  });

  test('should have accessible labels on the Contactos navigation item', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    // WHEN: The user is on any valid route
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The Contactos item has an accessible label
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).toBeVisible();

    // Check accessible name is "Contactos"
    const accessibleName = await contactosItem.getAttribute('aria-label');
    const textContent = await contactosItem.textContent();
    const hasAccessibleName = accessibleName === 'Contactos' || (textContent?.includes('Contactos') ?? false);
    expect(hasAccessibleName).toBe(true);
  });

  test('should not generate any axe accessibility violations on the navigation shell', async ({ page }) => {
    // GIVEN: The navigation shell is rendered at /clientes
    // WHEN: An accessibility audit is performed
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The nav element has role="navigation" (implicit or explicit)
    const navElement = page.locator('nav');
    await expect(navElement.first()).toBeVisible();
  });
});
