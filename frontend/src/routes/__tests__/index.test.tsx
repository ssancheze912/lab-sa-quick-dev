/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — RED Phase (Vitest + React Testing Library)
 *
 * Tests for root index route and deep linking:
 *   - Root path "/" redirects to "/clientes" (AC5)
 *   - Navigating directly to /clientes renders the Clientes view (AC3 deep linking)
 *   - Navigating directly to /contactos renders the Contactos view (AC3 deep linking)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

describe('Root Redirect — AC5', () => {
  it('should redirect "/" to "/clientes" automatically', async () => {
    // GIVEN: User accesses the root path "/"
    const router = createTestRouter('/');

    // WHEN: The page loads
    render(<RouterProvider router={router} />);

    // THEN: The user is redirected to /clientes (clientes-view is rendered)
    // RED: Will fail until index.tsx implements redirect({ to: '/clientes' })
    expect(await screen.findByTestId('clientes-view')).toBeInTheDocument();
  });

  it('should show /clientes URL after root redirect (no home screen shown)', async () => {
    // GIVEN: User accesses "/"
    const router = createTestRouter('/');

    // WHEN: The page loads
    render(<RouterProvider router={router} />);

    // THEN: Router state resolves to /clientes (not staying at /)
    // RED: Will fail until redirect is implemented — router will stay at /
    await screen.findByTestId('clientes-view');
    expect(router.state.location.pathname).toBe('/clientes');
  });
});

describe('Deep Linking — AC3', () => {
  it('should render clientes-view when navigating directly to /clientes', async () => {
    // GIVEN: User types "/clientes" directly in the browser URL bar
    const router = createTestRouter('/clientes');

    // WHEN: The page loads
    render(<RouterProvider router={router} />);

    // THEN: ClientesView is rendered (no redirection to home)
    // RED: Will fail until _app/clientes.tsx creates route with data-testid="clientes-view"
    expect(await screen.findByTestId('clientes-view')).toBeInTheDocument();
  });

  it('should render contactos-view when navigating directly to /contactos', async () => {
    // GIVEN: User types "/contactos" directly in the browser URL bar
    const router = createTestRouter('/contactos');

    // WHEN: The page loads
    render(<RouterProvider router={router} />);

    // THEN: ContactosView is rendered (no redirection to home)
    // RED: Will fail until _app/contactos.tsx creates route with data-testid="contactos-view"
    expect(await screen.findByTestId('contactos-view')).toBeInTheDocument();
  });

  it('should NOT show clientes-view when on /contactos (correct route isolation)', async () => {
    // GIVEN: User navigates directly to /contactos
    const router = createTestRouter('/contactos');

    // WHEN: The page loads
    render(<RouterProvider router={router} />);

    // THEN: Only contactos-view is rendered, not clientes-view
    await screen.findByTestId('contactos-view');
    expect(screen.queryByTestId('clientes-view')).not.toBeInTheDocument();
  });

  it('should NOT show contactos-view when on /clientes (correct route isolation)', async () => {
    // GIVEN: User navigates directly to /clientes
    const router = createTestRouter('/clientes');

    // WHEN: The page loads
    render(<RouterProvider router={router} />);

    // THEN: Only clientes-view is rendered, not contactos-view
    await screen.findByTestId('clientes-view');
    expect(screen.queryByTestId('contactos-view')).not.toBeInTheDocument();
  });
});
