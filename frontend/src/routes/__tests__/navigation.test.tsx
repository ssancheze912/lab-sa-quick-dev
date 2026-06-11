/**
 * Story 1.2: Frontend Navigation Shell — Component Tests
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Component Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Framework: Vitest + React Testing Library + axe
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop with "Clientes" and "Contactos"; clicking navigates
 *          without full page reload (FR28)
 *   AC2 — NavigationBar displayed at bottom on mobile viewport < 1024px; items tappable (FR29)
 *   AC3 — Direct URL access to /clientes and /contactos renders the correct view and highlights
 *          the active nav entry (FR30)
 *   AC4 — Unknown route renders a 404 view in Spanish
 *   AC5 — Root URL / redirects automatically to /clientes
 *   AC6 — Active route is visually distinguished from inactive routes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// ─────────────────────────────────────────────────────────────────────────────
// Test stubs: These will fail (RED) until implementation files exist
// ─────────────────────────────────────────────────────────────────────────────
// NOTE: These imports intentionally reference files that do not yet exist.
// They will cause compile/runtime failures until the implementation is complete.
// import { AppLayout } from '../_app';
// import { ClientesRoute } from '../_app/clientes';
// import { ContactosRoute } from '../_app/contactos';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  window.dispatchEvent(new Event('resize'));
}

function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
  window.dispatchEvent(new Event('resize'));
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail visible with Clientes and Contactos (FR28)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Desktop NavigationRail with Clientes and Contactos', () => {
  beforeEach(() => {
    setDesktopViewport();
  });

  it('should display the NavigationRail on desktop (viewport >= 1024px)', () => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // The component under test does not yet exist — this test is in RED phase
    // WHEN: The user views the app
    // (Implementation will render _app.tsx layout with NavigationRail)

    // THEN: The NavigationRail is visible on the left side
    // This will fail until frontend/src/routes/_app.tsx is implemented
    const navigationRail = document.querySelector('[data-testid="navigation-rail"]');
    expect(navigationRail).toBeTruthy();
  });

  it('should display "Clientes" navigation entry in the NavigationRail', () => {
    // GIVEN: The application is loaded on a desktop browser
    // WHEN: The user views the app

    // THEN: The NavigationRail contains a visible "Clientes" entry
    const clientesItem = document.querySelector('[data-testid="nav-item-clientes"]');
    expect(clientesItem).toBeTruthy();
    expect(clientesItem?.textContent).toContain('Clientes');
  });

  it('should display "Contactos" navigation entry in the NavigationRail', () => {
    // GIVEN: The application is loaded on a desktop browser
    // WHEN: The user views the app

    // THEN: The NavigationRail contains a visible "Contactos" entry
    const contactosItem = document.querySelector('[data-testid="nav-item-contactos"]');
    expect(contactosItem).toBeTruthy();
    expect(contactosItem?.textContent).toContain('Contactos');
  });

  it('should NOT display the NavigationBar on desktop viewport', () => {
    // GIVEN: The viewport is desktop (>= 1024px)
    // WHEN: The user views the app

    // THEN: The NavigationBar is not visible (CSS hidden lg:hidden)
    const navigationBar = document.querySelector('[data-testid="navigation-bar"]');
    // On desktop, navigationBar should not be rendered or should be hidden
    if (navigationBar) {
      const style = window.getComputedStyle(navigationBar);
      expect(style.display).toBe('none');
    } else {
      // Element not present at all — acceptable
      expect(navigationBar).toBeNull();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile: NavigationBar displayed at bottom (FR29)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Mobile NavigationBar at bottom (viewport < 1024px)', () => {
  beforeEach(() => {
    setMobileViewport();
  });

  afterEach(() => {
    setDesktopViewport();
  });

  it('should display the NavigationBar at the bottom on mobile viewport', () => {
    // GIVEN: The application is loaded on a mobile browser viewport (width < 1024px)
    // (innerWidth is mocked to 375)

    // WHEN: The user views the app
    // THEN: The NavigationBar component is displayed at the bottom
    const navigationBar = document.querySelector('[data-testid="navigation-bar"]');
    expect(navigationBar).toBeTruthy();
  });

  it('should NOT display the NavigationRail on mobile viewport', () => {
    // GIVEN: The viewport is mobile (< 1024px)
    // WHEN: The user views the app

    // THEN: The NavigationRail is hidden (CSS flex lg:hidden)
    const navigationRail = document.querySelector('[data-testid="navigation-rail"]');
    if (navigationRail) {
      const style = window.getComputedStyle(navigationRail);
      expect(style.display).toBe('none');
    } else {
      expect(navigationRail).toBeNull();
    }
  });

  it('should display tappable Clientes navigation item in the NavigationBar on mobile', () => {
    // GIVEN: The application is loaded on a mobile viewport
    // WHEN: The user views the app

    // THEN: The NavigationBar contains a tappable "Clientes" entry
    const clientesItem = document.querySelector('[data-testid="nav-item-clientes"]');
    expect(clientesItem).toBeTruthy();
    expect(clientesItem?.textContent).toContain('Clientes');
  });

  it('should display tappable Contactos navigation item in the NavigationBar on mobile', () => {
    // GIVEN: The application is loaded on a mobile viewport
    // WHEN: The user views the app

    // THEN: The NavigationBar contains a tappable "Contactos" entry
    const contactosItem = document.querySelector('[data-testid="nav-item-contactos"]');
    expect(contactosItem).toBeTruthy();
    expect(contactosItem?.textContent).toContain('Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Active route highlighted for direct URL access (FR30)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Active route is highlighted for direct URL access', () => {
  it('should highlight the Clientes nav entry as active when /clientes is the current route', () => {
    // GIVEN: The current route is /clientes (simulated via router mock)
    // WHEN: The component renders with /clientes as the active path

    // THEN: The Clientes nav item has data-active="true"
    const clientesItem = document.querySelector('[data-testid="nav-item-clientes"]');
    expect(clientesItem).toBeTruthy();
    expect(clientesItem?.getAttribute('data-active')).toBe('true');
  });

  it('should highlight the Contactos nav entry as active when /contactos is the current route', () => {
    // GIVEN: The current route is /contactos
    // WHEN: The component renders with /contactos as the active path

    // THEN: The Contactos nav item has data-active="true"
    const contactosItem = document.querySelector('[data-testid="nav-item-contactos"]');
    expect(contactosItem).toBeTruthy();
    expect(contactosItem?.getAttribute('data-active')).toBe('true');
  });

  it('should render the Clientes placeholder view when route is /clientes', () => {
    // GIVEN: The user navigates to /clientes
    // WHEN: The route component renders

    // THEN: The Clientes view is visible
    const clientesView = document.querySelector('[data-testid="clientes-view"]');
    expect(clientesView).toBeTruthy();
  });

  it('should render the Contactos placeholder view when route is /contactos', () => {
    // GIVEN: The user navigates to /contactos
    // WHEN: The route component renders

    // THEN: The Contactos view is visible
    const contactosView = document.querySelector('[data-testid="contactos-view"]');
    expect(contactosView).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route renders a 404 view in Spanish
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — Unknown route displays 404 in Spanish', () => {
  it('should render a not-found view when an unknown route is accessed', () => {
    // GIVEN: The user navigates to an unknown route (e.g., /pagina-inexistente)
    // WHEN: The notFoundComponent in __root.tsx renders

    // THEN: The not-found view is displayed
    const notFoundView = document.querySelector('[data-testid="not-found-view"]');
    expect(notFoundView).toBeTruthy();
  });

  it('should display "Página no encontrada" in the 404 view', () => {
    // GIVEN: An unknown route is accessed
    // WHEN: The notFoundComponent renders

    // THEN: The Spanish 404 message is shown
    const notFoundMessage = document.querySelector('[data-testid="not-found-message"]');
    expect(notFoundMessage).toBeTruthy();
    expect(notFoundMessage?.textContent).toContain('Página no encontrada');
  });

  it('should provide a link back to /clientes from the 404 view', () => {
    // GIVEN: The user lands on a 404 not-found page
    // WHEN: The notFoundComponent renders

    // THEN: A link back to /clientes is visible
    const backLink = document.querySelector('[data-testid="not-found-back-link"]');
    expect(backLink).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root URL / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Root URL / redirects to /clientes', () => {
  it('should redirect from / to /clientes when index route is accessed', () => {
    // GIVEN: The user accesses the root URL /
    // WHEN: TanStack Router processes the / route (index.tsx with redirect)

    // THEN: The URL changes to /clientes (redirect is configured)
    // This test verifies the redirect behavior is configured in index.tsx
    // It will fail until index.tsx uses TanStack Router `redirect` to /clientes
    const clientes = window.location.pathname;
    // After redirect, pathname must be /clientes
    expect(clientes).toBe('/clientes');
  });

  it('should render the Clientes view after the redirect from /', () => {
    // GIVEN: The user accesses / and is redirected to /clientes
    // WHEN: The Clientes route component renders

    // THEN: The Clientes view placeholder is visible
    const clientesView = document.querySelector('[data-testid="clientes-view"]');
    expect(clientesView).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Active route visually distinguished from inactive routes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Active route distinguished from inactive routes', () => {
  it('should mark Clientes as active and Contactos as inactive when on /clientes', () => {
    // GIVEN: The current route is /clientes
    // WHEN: Both navigation items are rendered

    // THEN: Clientes is active, Contactos is inactive
    const clientesItem = document.querySelector('[data-testid="nav-item-clientes"]');
    const contactosItem = document.querySelector('[data-testid="nav-item-contactos"]');

    expect(clientesItem?.getAttribute('data-active')).toBe('true');
    expect(contactosItem?.getAttribute('data-active')).toBe('false');
  });

  it('should mark Contactos as active and Clientes as inactive when on /contactos', () => {
    // GIVEN: The current route is /contactos
    // WHEN: Both navigation items are rendered

    // THEN: Contactos is active, Clientes is inactive
    const clientesItem = document.querySelector('[data-testid="nav-item-clientes"]');
    const contactosItem = document.querySelector('[data-testid="nav-item-contactos"]');

    expect(contactosItem?.getAttribute('data-active')).toBe('true');
    expect(clientesItem?.getAttribute('data-active')).toBe('false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility: WCAG 2.1 AA compliance via axe
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility — WCAG 2.1 AA compliance (axe)', () => {
  it('should have no accessibility violations in the NavigationRail on desktop', async () => {
    // GIVEN: The NavigationRail is rendered on desktop
    setDesktopViewport();

    // WHEN: axe analyzes the navigation rail
    const navigationRail = document.querySelector('[data-testid="navigation-rail"]') as Element;

    // THEN: No axe violations are found
    // This will fail until the component exists and meets WCAG 2.1 AA
    expect(navigationRail).toBeTruthy();
    if (navigationRail) {
      const results = await axe(navigationRail);
      expect(results).toHaveNoViolations();
    }
  });

  it('should have no accessibility violations in the NavigationBar on mobile', async () => {
    // GIVEN: The NavigationBar is rendered on mobile
    setMobileViewport();

    // WHEN: axe analyzes the navigation bar
    const navigationBar = document.querySelector('[data-testid="navigation-bar"]') as Element;

    // THEN: No axe violations are found
    expect(navigationBar).toBeTruthy();
    if (navigationBar) {
      const results = await axe(navigationBar);
      expect(results).toHaveNoViolations();
    }
  });

  it('should have a navigation landmark role on the NavigationRail', () => {
    // GIVEN: The NavigationRail is rendered
    setDesktopViewport();

    // WHEN: The navigation rail element is inspected
    const navigationRail = document.querySelector('[data-testid="navigation-rail"]');

    // THEN: It has role="navigation" or is a <nav> element (ARIA landmark)
    expect(navigationRail).toBeTruthy();
    if (navigationRail) {
      const isNavElement = navigationRail.tagName.toLowerCase() === 'nav';
      const hasNavRole = navigationRail.getAttribute('role') === 'navigation';
      expect(isNavElement || hasNavRole).toBe(true);
    }
  });
});
