/**
 * Navigation Shell Test Fixtures
 * Story 1.2: Frontend Navigation Shell
 *
 * Provides extended Playwright test fixtures for navigation shell tests.
 * All fixtures perform auto-cleanup and follow the network-first pattern.
 */

import { test as base, expect } from '@playwright/test';

export type NavigationFixtures = {
  /** Sets desktop viewport (1280x800) and navigates to /clientes before test */
  desktopNav: { width: number; height: number };
  /** Sets mobile viewport (390x844) and navigates to /clientes before test */
  mobileNav: { width: number; height: number };
  /** Navigates to the clientes route (desktop viewport) */
  clientesDesktop: void;
  /** Navigates to the contactos route (desktop viewport) */
  contactosDesktop: void;
};

export const test = base.extend<NavigationFixtures>({
  desktopNav: async ({ page }, use) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await use({ width: 1280, height: 800 });
  },

  mobileNav: async ({ page }, use) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await use({ width: 390, height: 844 });
  },

  clientesDesktop: async ({ page }, use) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await use();
    // No server-side cleanup needed — this story has no API calls
  },

  contactosDesktop: async ({ page }, use) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');
    await use();
    // No server-side cleanup needed — this story has no API calls
  },
});

export { expect };
