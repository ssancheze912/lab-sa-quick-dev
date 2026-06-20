/**
 * Component Tests - Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * RED PHASE: All tests FAIL until __root.tsx, index.tsx, _app.tsx and route files are created.
 *
 * Framework: Vitest + React Testing Library (RTL)
 * Note: These tests target the component layer — routing, rendering, accessibility attributes.
 *       Full E2E navigation flows are covered in e2e/story-1-2/navigation-shell.spec.ts.
 *
 * Given-When-Then pattern applied throughout.
 * data-testid selectors used exclusively for stability.
 *
 * References:
 * - Story: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md
 * - Dev notes: Vitest + RTL, configured in Story 1.1 (vitest.config.ts)
 */

import { render, screen } from '@testing-library/react';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { describe, it, expect } from 'vitest';

// ──────────────────────────────────────────────────────────────
// NOTE TO DEV: The import below will fail (RED) until the route
// tree is generated. This is intentional — it defines the contract.
// ──────────────────────────────────────────────────────────────
// @ts-expect-error — intentionally fails before routeTree.gen.ts exists
import { routeTree } from '../../../frontend/src/routeTree.gen';

/**
 * Helper: creates a test router pointing to a given initialPath.
 * Used to mount the full TanStack Router tree in a memory environment.
 */
function createTestRouter(initialPath: string = '/') {
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  return createRouter({ routeTree, history });
}

// ============================================================
// AC1 — LayoutBase shell renders Navbar and NavigationRail on desktop
// ============================================================

describe('AC1 — LayoutBase shell structure', () => {
  it('should render the Navbar element within the root layout', async () => {
    // GIVEN: A router starting at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: The RouterProvider is rendered
    render(<RouterProvider router={router} />);

    // THEN: The Navbar is present in the DOM
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('should render the NavigationRail on the root layout', async () => {
    // GIVEN: A router starting at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: The RouterProvider is rendered
    render(<RouterProvider router={router} />);

    // THEN: The NavigationRail is present
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('should render a nav item with label "Clientes" in the NavigationRail', async () => {
    // GIVEN: A router starting at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: The root layout is rendered
    render(<RouterProvider router={router} />);

    // THEN: A "Clientes" nav item is present
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should render a nav item with label "Contactos" in the NavigationRail', async () => {
    // GIVEN: A router starting at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: The root layout is rendered
    render(<RouterProvider router={router} />);

    // THEN: A "Contactos" nav item is present
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  it('should render the layout content outlet area', async () => {
    // GIVEN: A router starting at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: The root layout is rendered
    render(<RouterProvider router={router} />);

    // THEN: The main content area is present
    expect(screen.getByTestId('layout-content')).toBeInTheDocument();
  });
});

// ============================================================
// AC2 & AC3 — Nav links have correct href attributes
// ============================================================

describe('AC2/AC3 — Navigation links have correct href values', () => {
  it('should render the Clientes nav item linking to /clientes', async () => {
    // GIVEN: Router initialized at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: The root layout is rendered
    render(<RouterProvider router={router} />);

    // THEN: The Clientes nav item links to /clientes
    const navItem = screen.getByTestId('nav-item-clientes');
    expect(navItem.closest('a') || navItem).toHaveAttribute('href', '/clientes');
  });

  it('should render the Contactos nav item linking to /contactos', async () => {
    // GIVEN: Router initialized at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: The root layout is rendered
    render(<RouterProvider router={router} />);

    // THEN: The Contactos nav item links to /contactos
    const navItem = screen.getByTestId('nav-item-contactos');
    expect(navItem.closest('a') || navItem).toHaveAttribute('href', '/contactos');
  });
});

// ============================================================
// AC7 — 404 not-found component renders Spanish message and back link
// ============================================================

describe('AC7 — 404 NotFound page renders in Spanish with back link', () => {
  it('should display "Página no encontrada" heading when route does not exist', async () => {
    // GIVEN: User navigates to an unknown path
    const router = createTestRouter('/ruta-inexistente');

    // WHEN: The router renders the notFound component
    render(<RouterProvider router={router} />);

    // THEN: The Spanish 404 heading is visible
    expect(screen.getByTestId('not-found-heading')).toHaveTextContent('Página no encontrada');
  });

  it('should display the not-found view container for an unknown route', async () => {
    // GIVEN: User navigates to an unknown path
    const router = createTestRouter('/ruta-inexistente');

    // WHEN: The router renders the notFound component
    render(<RouterProvider router={router} />);

    // THEN: The not-found container is in the DOM
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
  });

  it('should display a link back to /clientes on the 404 page', async () => {
    // GIVEN: User navigates to an unknown path
    const router = createTestRouter('/ruta-inexistente');

    // WHEN: The not-found component is rendered
    render(<RouterProvider router={router} />);

    // THEN: A link with href="/clientes" is visible
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink).toHaveAttribute('href', '/clientes');
  });
});

// ============================================================
// AC8 — Root / redirects to /clientes
// ============================================================

describe('AC8 — Root route redirects to /clientes', () => {
  it('should redirect from / to /clientes so the Clientes view renders', async () => {
    // GIVEN: Router initialized at /
    const router = createTestRouter('/');
    await router.load();

    // WHEN: The redirect has resolved
    render(<RouterProvider router={router} />);

    // THEN: The router's current location is /clientes
    expect(router.state.location.pathname).toBe('/clientes');
  });
});

// ============================================================
// AC9 — Accessibility: aria-label on icon-only nav items
// ============================================================

describe('AC9 — WCAG 2.1 AA accessibility attributes on nav items', () => {
  it('should have aria-label="Clientes" on the Clientes nav icon item', async () => {
    // GIVEN: Router initialized at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: The NavigationRail is rendered with icon-only items
    render(<RouterProvider router={router} />);

    // THEN: The Clientes nav item carries aria-label for screen readers
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-label', 'Clientes');
  });

  it('should have aria-label="Contactos" on the Contactos nav icon item', async () => {
    // GIVEN: Router initialized at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: The NavigationRail is rendered with icon-only items
    render(<RouterProvider router={router} />);

    // THEN: The Contactos nav item carries aria-label for screen readers
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-label', 'Contactos');
  });
});
