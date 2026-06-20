/**
 * Navigation Factory - Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Provides typed navigation item objects and route configuration data
 * used to validate navigation shell behavior in E2E and component tests.
 *
 * No domain entities exist in this story — factories produce navigation
 * configuration objects used to validate shell routing contracts.
 */

/** All known application routes as typed constants */
export const APP_ROUTES = {
  root: '/',
  clientes: '/clientes',
  contactos: '/contactos',
  unknownPath: '/unknown-path-that-does-not-exist',
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];

/** Navigation entry descriptor used by the NavigationRail and NavigationBar */
export interface NavItem {
  /** Unique testid identifier for the nav item element */
  testId: string;
  /** Displayed label text (in Spanish) */
  label: string;
  /** Route href this item navigates to */
  href: AppRoute;
  /** Expected aria-label attribute value for icon-only items */
  ariaLabel: string;
}

/** Creates a typed nav item for the Clientes section */
export function createClientesNavItem(overrides: Partial<NavItem> = {}): NavItem {
  return {
    testId: 'nav-item-clientes',
    label: 'Clientes',
    href: '/clientes',
    ariaLabel: 'Clientes',
    ...overrides,
  };
}

/** Creates a typed nav item for the Contactos section */
export function createContactosNavItem(overrides: Partial<NavItem> = {}): NavItem {
  return {
    testId: 'nav-item-contactos',
    label: 'Contactos',
    href: '/contactos',
    ariaLabel: 'Contactos',
    ...overrides,
  };
}

/** Returns all navigation items in display order */
export function createAllNavItems(): NavItem[] {
  return [createClientesNavItem(), createContactosNavItem()];
}

/** Desktop viewport configuration (≥ 1024px — NavigationRail visible) */
export const DESKTOP_VIEWPORT = { width: 1280, height: 800 } as const;

/** Mobile viewport configuration (< 1024px — NavigationBar visible) */
export const MOBILE_VIEWPORT = { width: 375, height: 812 } as const;

/** Minimum touch target size per WCAG 2.1 AA and AC4 */
export const MIN_TOUCH_TARGET_PX = 44;

/** Required data-testid attributes for all shell elements */
export const SHELL_TEST_IDS = {
  navbar: 'navbar',
  navigationRail: 'navigation-rail',
  navigationBar: 'navigation-bar',
  layoutContent: 'layout-content',
  navItemClientes: 'nav-item-clientes',
  navItemContactos: 'nav-item-contactos',
  clientesView: 'clientes-view',
  contactosView: 'contactos-view',
  notFoundView: 'not-found-view',
  notFoundHeading: 'not-found-heading',
  notFoundBackLink: 'not-found-back-link',
} as const;
