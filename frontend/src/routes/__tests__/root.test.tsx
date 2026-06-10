/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — RED Phase (Vitest + React Testing Library)
 *
 * Tests for __root.tsx layout shell:
 *   - NavigationRail renders with correct nav items (AC1)
 *   - NavigationBar renders with correct nav items (AC2)
 *   - Active state applied to current route item (AC6)
 *   - data-testid attributes present for test stability
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';

// Helper: create router with a specific starting path
function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

describe('Root Layout Shell — NavigationRail (desktop)', () => {
  it('should render data-testid="navigation-rail" when app is loaded', async () => {
    // GIVEN: The router is initialized at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: The app renders
    render(<RouterProvider router={router} />);

    // THEN: NavigationRail wrapper is in the document
    // RED: Will fail until __root.tsx renders <NavigationRail data-testid="navigation-rail">
    expect(await screen.findByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('should render nav-item-clientes inside NavigationRail', async () => {
    // GIVEN: App loaded at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: Rendered
    render(<RouterProvider router={router} />);

    // THEN: Clientes nav item is present
    // RED: Will fail until nav item has data-testid="nav-item-clientes"
    expect(await screen.findByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should render nav-item-contactos inside NavigationRail', async () => {
    // GIVEN: App loaded at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: Rendered
    render(<RouterProvider router={router} />);

    // THEN: Contactos nav item is present
    // RED: Will fail until nav item has data-testid="nav-item-contactos"
    expect(await screen.findByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  it('should render nav-item-clientes with text "Clientes"', async () => {
    // GIVEN: App loaded
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Clientes label text is visible
    const clientesItem = await screen.findByTestId('nav-item-clientes');
    expect(clientesItem).toHaveTextContent('Clientes');
  });

  it('should render nav-item-contactos with text "Contactos"', async () => {
    // GIVEN: App loaded
    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // THEN: Contactos label text is visible
    const contactosItem = await screen.findByTestId('nav-item-contactos');
    expect(contactosItem).toHaveTextContent('Contactos');
  });
});

describe('Root Layout Shell — NavigationBar (mobile)', () => {
  it('should render data-testid="navigation-bar" in the document', async () => {
    // GIVEN: App rendered (NavigationBar is present for mobile, hidden via CSS on desktop)
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: NavigationBar element exists in DOM
    // RED: Will fail until __root.tsx renders <NavigationBar data-testid="navigation-bar">
    expect(await screen.findByTestId('navigation-bar')).toBeInTheDocument();
  });
});

describe('Root Layout Shell — Active state (AC6)', () => {
  it('should apply aria-current="page" to Clientes nav item when on /clientes', async () => {
    // GIVEN: Router initialized at /clientes
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Clientes nav item is marked as active
    // RED: Will fail until active state logic applies aria-current="page"
    const clientesItem = await screen.findByTestId('nav-item-clientes');
    expect(clientesItem).toHaveAttribute('aria-current', 'page');
  });

  it('should NOT apply aria-current="page" to Contactos nav item when on /clientes', async () => {
    // GIVEN: Router initialized at /clientes
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Contactos is NOT marked as active
    const contactosItem = await screen.findByTestId('nav-item-contactos');
    expect(contactosItem).not.toHaveAttribute('aria-current', 'page');
  });

  it('should apply aria-current="page" to Contactos nav item when on /contactos', async () => {
    // GIVEN: Router initialized at /contactos
    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // THEN: Contactos nav item is marked as active
    const contactosItem = await screen.findByTestId('nav-item-contactos');
    expect(contactosItem).toHaveAttribute('aria-current', 'page');
  });

  it('should NOT apply aria-current="page" to Clientes nav item when on /contactos', async () => {
    // GIVEN: Router initialized at /contactos
    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // THEN: Clientes is NOT marked as active
    const clientesItem = await screen.findByTestId('nav-item-clientes');
    expect(clientesItem).not.toHaveAttribute('aria-current', 'page');
  });
});

describe('Root Layout Shell — Accessibility', () => {
  it('should have aria-label on Clientes nav item', async () => {
    // GIVEN: App rendered
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Clientes nav item has an aria-label
    const clientesItem = await screen.findByTestId('nav-item-clientes');
    const label = clientesItem.getAttribute('aria-label');
    expect(label).toBeTruthy();
    expect(label).toMatch(/clientes/i);
  });

  it('should have aria-label on Contactos nav item', async () => {
    // GIVEN: App rendered
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Contactos nav item has an aria-label
    const contactosItem = await screen.findByTestId('nav-item-contactos');
    const label = contactosItem.getAttribute('aria-label');
    expect(label).toBeTruthy();
    expect(label).toMatch(/contactos/i);
  });
});
