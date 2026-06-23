/**
 * Story 1.2: Frontend Navigation Shell — Component-level Playwright tests
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until the _app.tsx layout route is implemented.
 *
 * Acceptance Criteria covered (component/rendering focus):
 *   AC8  — Active state rendering within the navigation shell
 *   AC9  — ARIA roles and accessibility attributes on nav components
 *   AC10 — Runtime checks for unexpected errors (proxy for TypeScript compilation)
 *
 * These complement navigation-shell.spec.ts which covers full E2E user journeys.
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation shell structure — rendered DOM checks
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigation Shell — DOM structure', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render exactly two navigation items in the rail', async ({ page }) => {
    // GIVEN: Desktop viewport
    // WHEN: The app is loaded at /clientes
    await page.goto('/clientes');

    // THEN: Exactly 2 nav items exist (Clientes + Contactos)
    const navItems = page.locator('[data-testid^="nav-item-"]');
    await expect(navItems).toHaveCount(2);
  });

  test('should render the app shell layout with a main content area', async ({ page }) => {
    // GIVEN: App is loaded
    // WHEN: Desktop viewport
    await page.goto('/clientes');

    // THEN: A <main> content area exists alongside the navigation
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });

  test('should render the NavigationRail with a nav ARIA landmark', async ({ page }) => {
    // GIVEN: Desktop viewport
    // WHEN: The app is loaded
    await page.goto('/clientes');

    // THEN: The NavigationRail is contained within a <nav> landmark
    const navLandmark = page.locator('nav').filter({ has: page.locator('[data-testid="nav-item-clientes"]') });
    await expect(navLandmark).toBeVisible();
  });

  test('should display Clientes label text within the nav item', async ({ page }) => {
    // GIVEN: Desktop viewport
    // WHEN: The app is loaded
    await page.goto('/clientes');

    // THEN: The word "Clientes" is visible in the nav (Spanish label requirement)
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toContainText('Clientes');
  });

  test('should display Contactos label text within the nav item', async ({ page }) => {
    // GIVEN: Desktop viewport
    // WHEN: The app is loaded
    await page.goto('/clientes');

    // THEN: The word "Contactos" is visible in the nav (Spanish label requirement)
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toContainText('Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Active state CSS / attribute transitions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigation Shell — Active state rendering', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should apply active visual state class or attribute to Clientes on /clientes', async ({ page }) => {
    // GIVEN: User is on /clientes
    // WHEN: Navigation is rendered
    await page.goto('/clientes');

    // THEN: Clientes item has data-active="true" or aria-current="page"
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const dataActive = await clientesItem.getAttribute('data-active');
    const ariaCurrent = await clientesItem.getAttribute('aria-current');
    expect(dataActive === 'true' || ariaCurrent === 'page').toBe(true);
  });

  test('should apply active visual state to Contactos on /contactos', async ({ page }) => {
    // GIVEN: User is on /contactos
    // WHEN: Navigation is rendered
    await page.goto('/contactos');

    // THEN: Contactos item has data-active="true" or aria-current="page"
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    const dataActive = await contactosItem.getAttribute('data-active');
    const ariaCurrent = await contactosItem.getAttribute('aria-current');
    expect(dataActive === 'true' || ariaCurrent === 'page').toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC10: No runtime errors (proxy for TypeScript strict compilation)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC10 — No runtime errors on navigation routes', () => {
  const routes = ['/clientes', '/contactos'];

  for (const route of routes) {
    test(`should render ${route} without JavaScript runtime errors`, async ({ page }) => {
      // GIVEN: Route ${route} exists in the application
      const runtimeErrors: string[] = [];
      page.on('pageerror', (err) => {
        runtimeErrors.push(err.message);
      });
      page.on('console', (msg) => {
        if (msg.type() === 'error') runtimeErrors.push(msg.text());
      });

      // WHEN: The page loads
      await page.goto(route);

      // THEN: No runtime errors are thrown
      expect(runtimeErrors).toHaveLength(0);
    });
  }

  test('should render /desconocido (404) without JavaScript runtime errors', async ({ page }) => {
    // GIVEN: An unknown route
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    // WHEN: The page loads
    await page.goto('/desconocido');

    // THEN: No unhandled runtime errors
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile layout — DOM structure at < 1024px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigation Shell — Mobile layout DOM', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should position NavigationBar at the bottom of the viewport', async ({ page }) => {
    // GIVEN: Mobile viewport
    // WHEN: App is loaded
    await page.goto('/clientes');

    // THEN: NavigationBar element exists and is visible
    const navBar = page.locator('[data-testid="navigation-bar"]');
    await expect(navBar).toBeVisible();

    // NavigationBar should be positioned at the bottom (bottom CSS fixed or flex)
    // We verify by checking the bounding box Y position relative to viewport height
    const boundingBox = await navBar.boundingBox();
    const viewportSize = page.viewportSize();
    if (boundingBox && viewportSize) {
      // Bottom bar should be in the lower half of the screen
      expect(boundingBox.y).toBeGreaterThan(viewportSize.height / 2);
    }
  });

  test('should render exactly two nav items in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport
    // WHEN: App is loaded
    await page.goto('/clientes');

    // THEN: Exactly 2 nav items visible in the bar
    const navItems = page.locator('[data-testid^="nav-item-"]');
    await expect(navItems).toHaveCount(2);
  });
});
