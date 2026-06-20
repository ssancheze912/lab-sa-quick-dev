/**
 * Unit Tests - Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Mode: BMad-Integrated — expands component ATDD tests with unit-level edge cases,
 * pure logic validation, and boundary conditions NOT covered in
 * NavigationShell.component.test.tsx.
 *
 * Coverage added by this file:
 *   - navigation.factory.ts: factory output shape validation
 *   - APP_ROUTES constants: completeness and type safety
 *   - createClientesNavItem / createContactosNavItem: override behavior
 *   - createAllNavItems: ordering and length
 *   - SHELL_TEST_IDS: all required keys present
 *   - DESKTOP_VIEWPORT / MOBILE_VIEWPORT: breakpoint boundary values
 *   - MIN_TOUCH_TARGET_PX: meets WCAG 2.1 AA minimum
 *
 * Framework: Vitest (pure unit tests, no DOM/RTL/Playwright needed)
 * Priority tags: [P1], [P2], [P3].
 *
 * References:
 * - Factory: e2e/support/factories/navigation.factory.ts
 * - ATDD component: e2e/component/story-1-2/NavigationShell.component.test.tsx
 * - Story: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md
 */

import { describe, it, expect } from 'vitest';
import {
  APP_ROUTES,
  DESKTOP_VIEWPORT,
  MOBILE_VIEWPORT,
  MIN_TOUCH_TARGET_PX,
  SHELL_TEST_IDS,
  createClientesNavItem,
  createContactosNavItem,
  createAllNavItems,
} from '../../support/factories/navigation.factory';

// ─────────────────────────────────────────────────────────────────────────────
// APP_ROUTES — Constants completeness and value correctness
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] APP_ROUTES — Route constants completeness', () => {
  it('[P1] should define a root route at "/"', () => {
    // GIVEN/WHEN: APP_ROUTES is imported
    // THEN: root is "/"
    expect(APP_ROUTES.root).toBe('/');
  });

  it('[P1] should define clientes route at "/clientes"', () => {
    expect(APP_ROUTES.clientes).toBe('/clientes');
  });

  it('[P1] should define contactos route at "/contactos"', () => {
    expect(APP_ROUTES.contactos).toBe('/contactos');
  });

  it('[P1] should define unknownPath as a path that does not match any real route', () => {
    // GIVEN: unknownPath is a sentinel value used to trigger 404
    // THEN: It must start with "/" and not match any valid route
    expect(APP_ROUTES.unknownPath).toMatch(/^\//);
    expect(APP_ROUTES.unknownPath).not.toBe(APP_ROUTES.root);
    expect(APP_ROUTES.unknownPath).not.toBe(APP_ROUTES.clientes);
    expect(APP_ROUTES.unknownPath).not.toBe(APP_ROUTES.contactos);
  });

  it('[P1] should have exactly 4 route constants (root, clientes, contactos, unknownPath)', () => {
    // GIVEN/WHEN: APP_ROUTES object is inspected
    // THEN: Exactly 4 keys (no accidental additions)
    expect(Object.keys(APP_ROUTES)).toHaveLength(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createClientesNavItem — Factory shape and override behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] createClientesNavItem — factory output and override behavior', () => {
  it('[P1] should return a nav item with testId "nav-item-clientes"', () => {
    // GIVEN: No overrides
    // WHEN: Factory is called
    const item = createClientesNavItem();

    // THEN: testId matches the agreed data-testid
    expect(item.testId).toBe('nav-item-clientes');
  });

  it('[P1] should return a nav item with label "Clientes" (Spanish)', () => {
    const item = createClientesNavItem();
    expect(item.label).toBe('Clientes');
  });

  it('[P1] should return a nav item with href "/clientes"', () => {
    const item = createClientesNavItem();
    expect(item.href).toBe('/clientes');
  });

  it('[P1] should return a nav item with ariaLabel "Clientes"', () => {
    const item = createClientesNavItem();
    expect(item.ariaLabel).toBe('Clientes');
  });

  it('[P1] should apply overrides correctly when provided', () => {
    // GIVEN: An override for ariaLabel
    // WHEN: Factory is called with the override
    const item = createClientesNavItem({ ariaLabel: 'Sección de Clientes' });

    // THEN: The overridden value is used; other fields keep defaults
    expect(item.ariaLabel).toBe('Sección de Clientes');
    expect(item.label).toBe('Clientes');
    expect(item.href).toBe('/clientes');
  });

  it('[P2] should allow overriding testId for special test scenarios', () => {
    // GIVEN: A test that needs a custom testId
    const item = createClientesNavItem({ testId: 'custom-test-id' });

    // THEN: The override is applied
    expect(item.testId).toBe('custom-test-id');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createContactosNavItem — Factory shape and override behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] createContactosNavItem — factory output and override behavior', () => {
  it('[P1] should return a nav item with testId "nav-item-contactos"', () => {
    const item = createContactosNavItem();
    expect(item.testId).toBe('nav-item-contactos');
  });

  it('[P1] should return a nav item with label "Contactos" (Spanish)', () => {
    const item = createContactosNavItem();
    expect(item.label).toBe('Contactos');
  });

  it('[P1] should return a nav item with href "/contactos"', () => {
    const item = createContactosNavItem();
    expect(item.href).toBe('/contactos');
  });

  it('[P1] should return a nav item with ariaLabel "Contactos"', () => {
    const item = createContactosNavItem();
    expect(item.ariaLabel).toBe('Contactos');
  });

  it('[P1] should apply overrides correctly when provided', () => {
    // GIVEN: An override for href (edge case: rerouted path)
    const item = createContactosNavItem({ href: '/contactos' });

    // THEN: Override applied, other fields unchanged
    expect(item.href).toBe('/contactos');
    expect(item.label).toBe('Contactos');
  });

  it('[P2] should produce a different object from createClientesNavItem', () => {
    // GIVEN: Both factories produce distinct nav items
    const clientes = createClientesNavItem();
    const contactos = createContactosNavItem();

    // THEN: They are not equal (different routes, labels, testIds)
    expect(clientes.testId).not.toBe(contactos.testId);
    expect(clientes.label).not.toBe(contactos.label);
    expect(clientes.href).not.toBe(contactos.href);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createAllNavItems — Ordering and completeness
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] createAllNavItems — collection ordering and completeness', () => {
  it('[P1] should return an array of exactly 2 nav items', () => {
    // GIVEN: The navigation has exactly Clientes and Contactos
    const items = createAllNavItems();

    // THEN: Array length is 2
    expect(items).toHaveLength(2);
  });

  it('[P1] should have Clientes as the first nav item (index 0)', () => {
    // GIVEN: Navigation order: Clientes first, Contactos second
    const items = createAllNavItems();

    // THEN: First item is Clientes
    expect(items[0].testId).toBe('nav-item-clientes');
    expect(items[0].href).toBe('/clientes');
  });

  it('[P1] should have Contactos as the second nav item (index 1)', () => {
    const items = createAllNavItems();

    // THEN: Second item is Contactos
    expect(items[1].testId).toBe('nav-item-contactos');
    expect(items[1].href).toBe('/contactos');
  });

  it('[P2] should return a new array on each call (no shared reference)', () => {
    // GIVEN: Factory is called twice
    const items1 = createAllNavItems();
    const items2 = createAllNavItems();

    // THEN: The arrays are different objects (not same reference)
    expect(items1).not.toBe(items2);
  });

  it('[P2] should have all items with non-empty labels', () => {
    // GIVEN: All nav items must have visible labels
    const items = createAllNavItems();

    // THEN: Every item has a non-empty label string
    items.forEach((item) => {
      expect(typeof item.label).toBe('string');
      expect(item.label.trim().length).toBeGreaterThan(0);
    });
  });

  it('[P2] should have all items with hrefs starting with "/"', () => {
    // GIVEN: All hrefs must be absolute paths (start with /)
    const items = createAllNavItems();

    // THEN: Each href starts with "/"
    items.forEach((item) => {
      expect(item.href).toMatch(/^\//);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SHELL_TEST_IDS — All required data-testid keys are present
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] SHELL_TEST_IDS — Required data-testid constants', () => {
  it('[P1] should define "navbar" testid', () => {
    expect(SHELL_TEST_IDS.navbar).toBe('navbar');
  });

  it('[P1] should define "navigation-rail" testid', () => {
    expect(SHELL_TEST_IDS.navigationRail).toBe('navigation-rail');
  });

  it('[P1] should define "navigation-bar" testid (mobile)', () => {
    expect(SHELL_TEST_IDS.navigationBar).toBe('navigation-bar');
  });

  it('[P1] should define "layout-content" testid', () => {
    expect(SHELL_TEST_IDS.layoutContent).toBe('layout-content');
  });

  it('[P1] should define "nav-item-clientes" testid', () => {
    expect(SHELL_TEST_IDS.navItemClientes).toBe('nav-item-clientes');
  });

  it('[P1] should define "nav-item-contactos" testid', () => {
    expect(SHELL_TEST_IDS.navItemContactos).toBe('nav-item-contactos');
  });

  it('[P1] should define "clientes-view" testid', () => {
    expect(SHELL_TEST_IDS.clientesView).toBe('clientes-view');
  });

  it('[P1] should define "contactos-view" testid', () => {
    expect(SHELL_TEST_IDS.contactosView).toBe('contactos-view');
  });

  it('[P1] should define "not-found-view" testid', () => {
    expect(SHELL_TEST_IDS.notFoundView).toBe('not-found-view');
  });

  it('[P1] should define "not-found-heading" testid', () => {
    expect(SHELL_TEST_IDS.notFoundHeading).toBe('not-found-heading');
  });

  it('[P1] should define "not-found-back-link" testid', () => {
    expect(SHELL_TEST_IDS.notFoundBackLink).toBe('not-found-back-link');
  });

  it('[P1] should have exactly 11 required testid constants', () => {
    // THEN: The factory provides all the testids needed by both ATDD and edge specs
    expect(Object.keys(SHELL_TEST_IDS)).toHaveLength(11);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VIEWPORT CONSTANTS — Breakpoint boundary values
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] Viewport constants — breakpoint boundary values', () => {
  it('[P2] should define DESKTOP_VIEWPORT width as ≥ 1024px (NavigationRail threshold)', () => {
    // GIVEN: NavigationRail is shown at ≥ 1024px per AC4
    // THEN: DESKTOP_VIEWPORT width must be at or above the breakpoint
    expect(DESKTOP_VIEWPORT.width).toBeGreaterThanOrEqual(1024);
  });

  it('[P2] should define MOBILE_VIEWPORT width as < 1024px (NavigationBar threshold)', () => {
    // GIVEN: NavigationBar replaces NavigationRail below 1024px per AC4
    // THEN: MOBILE_VIEWPORT width must be below the breakpoint
    expect(MOBILE_VIEWPORT.width).toBeLessThan(1024);
  });

  it('[P2] should define DESKTOP_VIEWPORT height as a positive number', () => {
    expect(DESKTOP_VIEWPORT.height).toBeGreaterThan(0);
  });

  it('[P2] should define MOBILE_VIEWPORT height as a positive number', () => {
    expect(MOBILE_VIEWPORT.height).toBeGreaterThan(0);
  });

  it('[P2] DESKTOP_VIEWPORT and MOBILE_VIEWPORT should have different widths', () => {
    // GIVEN: They represent different responsive breakpoints
    expect(DESKTOP_VIEWPORT.width).not.toBe(MOBILE_VIEWPORT.width);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MIN_TOUCH_TARGET_PX — WCAG 2.1 AA compliance
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] MIN_TOUCH_TARGET_PX — WCAG 2.1 AA minimum touch target size', () => {
  it('[P1] should be exactly 44 (WCAG 2.1 AA minimum touch target in pixels)', () => {
    // GIVEN: WCAG 2.1 AA criterion 2.5.5 requires 44x44px touch targets
    // THEN: Constant matches WCAG specification
    expect(MIN_TOUCH_TARGET_PX).toBe(44);
  });

  it('[P1] should be a positive number', () => {
    expect(MIN_TOUCH_TARGET_PX).toBeGreaterThan(0);
  });

  it('[P2] should be less than or equal to MOBILE_VIEWPORT width (sanity check)', () => {
    // GIVEN: A touch target cannot be wider than the screen
    expect(MIN_TOUCH_TARGET_PX).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
  });
});
