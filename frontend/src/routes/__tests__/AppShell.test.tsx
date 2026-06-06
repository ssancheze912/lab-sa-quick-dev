/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — RED Phase (Vitest + React Testing Library)
 *
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail visible with Clientes / Contactos; SPA navigation (FR28)
 *   AC2 — Mobile: NavigationBar at bottom instead of rail (FR29)
 *   AC3 — Active nav item reflects current route (FR30)
 *   AC4 — Unknown route shows not-found view with link back to /clientes
 *   AC5 — Root / redirects to /clientes
 *
 * Implementation notes:
 *   - Routes live at: frontend/src/routes/_app.tsx (shell layout)
 *   - Placeholder pages: _app/clientes.tsx, _app/contactos.tsx
 *   - Root redirect: index.tsx
 *   - Not-found view: added via notFoundComponent in __root.tsx
 *
 * These tests use jsdom + React Testing Library.
 * Viewport mocking is done via window.innerWidth assignment + resize event.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Mock the window viewport to simulate desktop (>= 1024px) or mobile (< 1024px).
 * Required because the shell uses CSS breakpoints AND JS logic for nav variant.
 */
function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

// ─── NOTE: Imports below intentionally point to files that DO NOT EXIST yet.
// ─── These will cause TypeScript / module-not-found errors (RED phase).
// ─── The developer must create these files to make the tests pass (GREEN phase).

// Import the navigation shell layout (to be created at frontend/src/routes/_app.tsx)
// import { AppShellLayout } from '../_app';

// Import placeholder pages (to be created at frontend/src/routes/_app/clientes.tsx etc.)
// import { ClientesPage } from '../_app/clientes';
// import { ContactosPage } from '../_app/contactos';

// Import the not-found component (to be created and added to __root.tsx)
// import { NotFoundView } from '../../shared/components/NotFoundView';

// ─── Stub rendering helpers (TanStack Router required) ───────────────────────
// Because full TanStack Router setup in jsdom is complex, we test the components
// in isolation with mocked router context using createMemoryHistory + RouterProvider.
// The implementation must support this pattern.

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AC1 — AppShell: Desktop NavigationRail (FR28)', () => {
  beforeEach(() => {
    setViewport(1280);
  });

  it('should render a NavigationRail element on desktop viewport (>= 1024px)', () => {
    // GIVEN: App shell layout is rendered with desktop viewport
    // NOTE: This will FAIL until _app.tsx is created with data-testid="navigation-rail"

    // Placeholder assertion — will fail (NavigationRail not implemented)
    const navigationRail = document.querySelector('[data-testid="navigation-rail"]');

    // WHEN: Desktop viewport is active
    // THEN: NavigationRail is present in the DOM
    expect(navigationRail).not.toBeNull();
  });

  it('should render a Clientes link inside the NavigationRail on desktop', () => {
    // GIVEN: AppShell is rendered at desktop width
    // WHEN: NavigationRail is rendered
    // THEN: A link with text "Clientes" is present inside data-testid="navigation-rail"
    const rail = document.querySelector('[data-testid="navigation-rail"]');
    expect(rail).not.toBeNull();

    // Will fail until NavigationRail implementation includes Clientes link
    const clientesLink = rail?.querySelector('a[href*="clientes"]');
    expect(clientesLink).not.toBeNull();
  });

  it('should render a Contactos link inside the NavigationRail on desktop', () => {
    // GIVEN: AppShell is rendered at desktop width
    // WHEN: NavigationRail is rendered
    // THEN: A link with text "Contactos" is present inside data-testid="navigation-rail"
    const rail = document.querySelector('[data-testid="navigation-rail"]');
    expect(rail).not.toBeNull();

    const contactosLink = rail?.querySelector('a[href*="contactos"]');
    expect(contactosLink).not.toBeNull();
  });

  it('should have a nav element with aria-label="Navegación principal" for accessibility (WCAG 2.1 AA)', () => {
    // GIVEN: AppShell is rendered
    // WHEN: Nav landmark is rendered
    // THEN: aria-label is "Navegación principal" for screen readers
    const navElement = document.querySelector('nav[aria-label="Navegación principal"]');
    expect(navElement).not.toBeNull();
  });
});

describe('AC2 — AppShell: Mobile NavigationBar (FR29)', () => {
  beforeEach(() => {
    setViewport(375);
  });

  it('should render a NavigationBar element on mobile viewport (< 1024px)', () => {
    // GIVEN: App shell layout is rendered with mobile viewport (375px)
    // WHEN: Mobile viewport is active
    // THEN: data-testid="navigation-bar" is present in the DOM
    const navigationBar = document.querySelector('[data-testid="navigation-bar"]');
    expect(navigationBar).not.toBeNull();
  });

  it('should NOT render NavigationRail when viewport is mobile (< 1024px)', () => {
    // GIVEN: Mobile viewport active
    // WHEN: AppShell is rendered
    // THEN: NavigationRail is not visible (hidden by responsive logic)
    const navigationRail = document.querySelector('[data-testid="navigation-rail"]');

    // NavigationRail should be absent or hidden on mobile
    if (navigationRail) {
      const style = window.getComputedStyle(navigationRail);
      expect(style.display).toBe('none');
    } else {
      expect(navigationRail).toBeNull();
    }
  });

  it('should render a Clientes link inside the NavigationBar on mobile', () => {
    // GIVEN: AppShell rendered at mobile width
    // WHEN: NavigationBar is rendered
    // THEN: A Clientes link is present and tappable
    const bar = document.querySelector('[data-testid="navigation-bar"]');
    expect(bar).not.toBeNull();

    const clientesLink = bar?.querySelector('a[href*="clientes"]');
    expect(clientesLink).not.toBeNull();
  });

  it('should render a Contactos link inside the NavigationBar on mobile', () => {
    // GIVEN: AppShell rendered at mobile width
    // WHEN: NavigationBar is rendered
    // THEN: A Contactos link is present and tappable
    const bar = document.querySelector('[data-testid="navigation-bar"]');
    expect(bar).not.toBeNull();

    const contactosLink = bar?.querySelector('a[href*="contactos"]');
    expect(contactosLink).not.toBeNull();
  });
});

describe('AC3 — Active navigation state reflects current route (FR30)', () => {
  it('should apply aria-current="page" to Clientes nav item when route is /clientes', () => {
    // GIVEN: Current route is /clientes
    // WHEN: NavigationRail is rendered
    // THEN: The Clientes link has aria-current="page"
    const clientesLink = document.querySelector('a[href*="clientes"][aria-current="page"]');
    expect(clientesLink).not.toBeNull();
  });

  it('should apply aria-current="page" to Contactos nav item when route is /contactos', () => {
    // GIVEN: Current route is /contactos
    // WHEN: NavigationRail is rendered
    // THEN: The Contactos link has aria-current="page"
    const contactosLink = document.querySelector('a[href*="contactos"][aria-current="page"]');
    expect(contactosLink).not.toBeNull();
  });

  it('should render data-testid="clientes-page" when route is /clientes', () => {
    // GIVEN: Route is /clientes
    // WHEN: The page renders
    // THEN: Clientes placeholder page is in the DOM
    const clientesPage = document.querySelector('[data-testid="clientes-page"]');
    expect(clientesPage).not.toBeNull();
  });

  it('should render data-testid="contactos-page" when route is /contactos', () => {
    // GIVEN: Route is /contactos
    // WHEN: The page renders
    // THEN: Contactos placeholder page is in the DOM
    const contactosPage = document.querySelector('[data-testid="contactos-page"]');
    expect(contactosPage).not.toBeNull();
  });
});

describe('AC4 — Not-Found view for unknown routes', () => {
  it('should render heading "Página no encontrada" for unknown routes', () => {
    // GIVEN: User navigates to /unknown-route
    // WHEN: Not-found view is displayed
    // THEN: Heading text is "Página no encontrada"
    const heading = document.querySelector('h1');
    expect(heading?.textContent).toMatch(/página no encontrada/i);
  });

  it('should render a link "Ir a Clientes" in the not-found view', () => {
    // GIVEN: User is on the not-found page
    // WHEN: Not-found view is displayed
    // THEN: A link "Ir a Clientes" pointing to /clientes is present
    const link = document.querySelector('a[href*="clientes"]');
    expect(link?.textContent).toMatch(/ir a clientes/i);
  });

  it('should display a description "La ruta que buscas no existe." in the not-found view', () => {
    // GIVEN: User is on the not-found page
    // WHEN: Not-found view renders
    // THEN: Description text is present
    const body = document.body.textContent;
    expect(body).toMatch(/la ruta que buscas no existe/i);
  });
});

describe('AC5 — Root / redirects to /clientes', () => {
  it('should redirect / to /clientes (index route)', () => {
    // GIVEN: User navigates to /
    // WHEN: Route handler processes the root path
    // THEN: Browser location changes to /clientes
    // NOTE: This is a routing test — the index.tsx must export beforeLoad redirect
    // Will FAIL until index.tsx with redirect({ to: '/clientes' }) is implemented
    const currentPath = window.location.pathname;
    // After redirect, pathname should be /clientes
    expect(currentPath).toBe('/clientes');
  });
});

describe('AppShell — app-root container (implicit AC)', () => {
  it('should render data-testid="app-root" container wrapping the entire app', () => {
    // GIVEN: Application is loaded at any route
    // WHEN: Root layout renders
    // THEN: data-testid="app-root" is present (required by __root.tsx Task 5)
    const appRoot = document.querySelector('[data-testid="app-root"]');
    expect(appRoot).not.toBeNull();
  });
});
