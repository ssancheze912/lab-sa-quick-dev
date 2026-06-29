import { test as base } from '@playwright/test';
import { NavigationPage } from '../pages/navigation.page';

/**
 * Extended test fixtures for navigation shell tests (Story 1.2).
 * Provides pre-configured page objects for desktop and mobile navigation scenarios.
 */

export type NavigationFixtures = {
  /** NavigationPage helper pre-loaded on /clientes (desktop viewport) */
  desktopNav: NavigationPage;
  /** NavigationPage helper pre-loaded on /clientes (mobile viewport, 390x844) */
  mobileNav: NavigationPage;
  /** NavigationPage helper at root, useful for redirect tests */
  rootNav: NavigationPage;
};

export const test = base.extend<NavigationFixtures>({
  desktopNav: async ({ page }, use) => {
    // Setup: navigate to /clientes on desktop-sized viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    const nav = new NavigationPage(page);
    await nav.gotoClientes();
    await use(nav);
    // No persistent state to clean up — URL-driven SPA
  },

  mobileNav: async ({ page }, use) => {
    // Setup: navigate to /clientes on mobile-sized viewport
    await page.setViewportSize({ width: 390, height: 844 });
    const nav = new NavigationPage(page);
    await nav.gotoClientes();
    await use(nav);
  },

  rootNav: async ({ page }, use) => {
    const nav = new NavigationPage(page);
    await nav.gotoRoot();
    await use(nav);
  },
});

export { expect } from '@playwright/test';
