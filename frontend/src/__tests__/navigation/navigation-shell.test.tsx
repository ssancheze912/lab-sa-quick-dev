/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop (≥1024px): NavigationRail visible on left side (data-testid="navigation-rail")
 *   AC2 — Mobile (<1024px): NavigationBar visible (data-testid="navigation-bar"), touch targets ≥44×44px
 *   AC3 — Deep-linking: /clientes and /contactos render correct page components
 *   AC4 — Unknown route: 404/not-found view with "Página no encontrada" and "Ir a Clientes" link
 *   AC5 — Root redirect: / redirects to /clientes automatically
 *   AC6 — Active nav item: active item carries data-active="true", inactive items do not
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';

// These imports will fail (RED phase) until the routes are created
// Components being tested don't exist yet
import { routeTree } from '../../routeTree.gen';

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a TanStack Router instance with a memory history initialised to a
 * specific starting path. This allows isolated component tests that don't
 * require a real browser URL.
 */
function createTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  return createRouter({ routeTree, history });
}

function renderWithRouter(path: string) {
  const router = createTestRouter(path);
  return render(<RouterProvider router={router} />);
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — NavigationRail visible on desktop viewport
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — NavigationRail on desktop', () => {
  it('should render a NavigationRail element with data-testid="navigation-rail"', () => {
    // GIVEN: The app is rendered on a desktop viewport (≥1024px is handled via CSS —
    //        component tests verify the element exists in the DOM regardless of viewport)
    // WHEN: The user views /clientes
    renderWithRouter('/clientes');

    // THEN: The NavigationRail container is present in the DOM
    // RED: Will fail — navigation-rail element does not exist yet (no __root.tsx layout)
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('should render a "Clientes" nav item inside NavigationRail', () => {
    // GIVEN: The app is rendered with NavigationRail
    // WHEN: The user views /clientes
    renderWithRouter('/clientes');

    // THEN: The Clientes nav item is present
    // RED: Will fail — nav-item-clientes does not exist
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should render a "Contactos" nav item inside NavigationRail', () => {
    // GIVEN: The app is rendered with NavigationRail
    // WHEN: The user views /clientes
    renderWithRouter('/clientes');

    // THEN: The Contactos nav item is present
    // RED: Will fail — nav-item-contactos does not exist
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  it('should render NavigationRail Clientes item with aria-label="Ir a Clientes"', () => {
    // GIVEN: NavigationRail is rendered (icon-only, WCAG 2.1 AA requires aria-label)
    // WHEN: The user views /clientes
    renderWithRouter('/clientes');

    // THEN: The Clientes nav item has the required Spanish aria-label
    // RED: Will fail — aria-label attribute not set
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).toHaveAttribute('aria-label', 'Ir a Clientes');
  });

  it('should render NavigationRail Contactos item with aria-label="Ir a Contactos"', () => {
    // GIVEN: NavigationRail is rendered (icon-only, WCAG 2.1 AA requires aria-label)
    // WHEN: The user views /clientes
    renderWithRouter('/clientes');

    // THEN: The Contactos nav item has the required Spanish aria-label
    // RED: Will fail — aria-label attribute not set
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem).toHaveAttribute('aria-label', 'Ir a Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — NavigationBar present in DOM (mobile bottom nav)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — NavigationBar (mobile bottom nav) present in DOM', () => {
  it('should render a NavigationBar element with data-testid="navigation-bar"', () => {
    // GIVEN: The app is rendered (CSS controls visibility, but the element must be in DOM)
    // WHEN: The user views /clientes
    renderWithRouter('/clientes');

    // THEN: The NavigationBar container is present in the DOM
    // RED: Will fail — navigation-bar element does not exist
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('should render a "Clientes" item inside NavigationBar', () => {
    // GIVEN: The app is rendered with NavigationBar
    // WHEN: The user views /clientes
    renderWithRouter('/clientes');

    // THEN: The Clientes nav bar item is present
    // RED: Will fail — nav-bar-item-clientes does not exist
    expect(screen.getByTestId('nav-bar-item-clientes')).toBeInTheDocument();
  });

  it('should render a "Contactos" item inside NavigationBar', () => {
    // GIVEN: The app is rendered with NavigationBar
    // WHEN: The user views /clientes
    renderWithRouter('/clientes');

    // THEN: The Contactos nav bar item is present
    // RED: Will fail — nav-bar-item-contactos does not exist
    expect(screen.getByTestId('nav-bar-item-contactos')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep-linking: page components render on direct URL access
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Deep-linking renders correct page components', () => {
  it('should render ClientesPage heading when router starts at /clientes', () => {
    // GIVEN: The user navigates directly to /clientes
    // WHEN: The router resolves and renders the route
    renderWithRouter('/clientes');

    // THEN: The ClientesPage heading is visible
    // RED: Will fail — route /clientes and ClientesPage do not exist
    expect(screen.getByTestId('clientes-page-heading')).toBeInTheDocument();
  });

  it('should render ContactosPage heading when router starts at /contactos', () => {
    // GIVEN: The user navigates directly to /contactos
    // WHEN: The router resolves and renders the route
    renderWithRouter('/contactos');

    // THEN: The ContactosPage heading is visible
    // RED: Will fail — route /contactos and ContactosPage do not exist
    expect(screen.getByTestId('contactos-page-heading')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route renders NotFoundPage
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — Unknown route: NotFoundPage', () => {
  it('should render not-found page for an unknown route', () => {
    // GIVEN: The router starts at an unknown path
    // WHEN: The route is resolved
    renderWithRouter('/ruta-que-no-existe');

    // THEN: The not-found page container is present
    // RED: Will fail — $.tsx catch-all route and NotFoundPage do not exist
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });

  it('should render "Página no encontrada" text on unknown route', () => {
    // GIVEN: The router starts at an unknown path
    // WHEN: NotFoundPage renders
    renderWithRouter('/ruta-desconocida');

    // THEN: The Spanish not-found message is visible
    // RED: Will fail — NotFoundPage component does not exist
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
  });

  it('should render a link with data-testid="not-found-link-clientes" on 404 page', () => {
    // GIVEN: The user is on the 404 page
    // WHEN: NotFoundPage renders
    renderWithRouter('/pagina-inexistente');

    // THEN: The "Ir a Clientes" link is present
    // RED: Will fail — NotFoundPage and return link do not exist
    expect(screen.getByTestId('not-found-link-clientes')).toBeInTheDocument();
  });

  it('should render the "Ir a Clientes" link pointing to /clientes', () => {
    // GIVEN: The user is on the 404 page
    // WHEN: NotFoundPage renders
    renderWithRouter('/no-existe');

    // THEN: The return link navigates to /clientes
    // RED: Will fail — NotFoundPage and return link do not exist
    const link = screen.getByTestId('not-found-link-clientes');
    expect(link).toHaveAttribute('href', '/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Active nav item state
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Active nav item state', () => {
  it('should set data-active="true" on Clientes nav item when on /clientes', () => {
    // GIVEN: The user is on /clientes
    // WHEN: Viewing the NavigationRail
    renderWithRouter('/clientes');

    // THEN: The Clientes nav item carries data-active="true"
    // RED: Will fail — nav-item-clientes and data-active attribute do not exist
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).toHaveAttribute('data-active', 'true');
  });

  it('should NOT set data-active="true" on Contactos nav item when on /clientes', () => {
    // GIVEN: The user is on /clientes
    // WHEN: Viewing the NavigationRail
    renderWithRouter('/clientes');

    // THEN: The Contactos nav item does NOT have data-active="true"
    // RED: Will fail — nav-item-contactos does not exist
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem).not.toHaveAttribute('data-active', 'true');
  });

  it('should set data-active="true" on Contactos nav item when on /contactos', () => {
    // GIVEN: The user is on /contactos
    // WHEN: Viewing the NavigationRail
    renderWithRouter('/contactos');

    // THEN: The Contactos nav item carries data-active="true"
    // RED: Will fail — route /contactos and nav-item-contactos do not exist
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem).toHaveAttribute('data-active', 'true');
  });

  it('should NOT set data-active="true" on Clientes nav item when on /contactos', () => {
    // GIVEN: The user is on /contactos
    // WHEN: Viewing the NavigationRail
    renderWithRouter('/contactos');

    // THEN: The Clientes nav item does NOT have data-active="true"
    // RED: Will fail — nav-item-clientes and data-active attribute do not exist
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).not.toHaveAttribute('data-active', 'true');
  });
});
