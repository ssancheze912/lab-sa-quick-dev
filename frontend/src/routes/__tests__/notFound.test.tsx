/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — RED Phase (Vitest + React Testing Library)
 *
 * Tests for 404 Not-Found route:
 *   - Unknown route renders not-found view (AC4)
 *   - Spanish-language message is displayed (AC4)
 *   - "Ir a Clientes" link points to /clientes (AC4)
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

describe('404 Not-Found Route — AC4', () => {
  it('should render data-testid="not-found-view" for an unknown route', async () => {
    // GIVEN: User navigates to an unknown route
    const router = createTestRouter('/desconocido');

    // WHEN: The page loads
    render(<RouterProvider router={router} />);

    // THEN: The not-found view is displayed
    // RED: Will fail until __root.tsx defines notFoundComponent rendering <div data-testid="not-found-view">
    expect(await screen.findByTestId('not-found-view')).toBeInTheDocument();
  });

  it('should display "Página no encontrada" message in Spanish', async () => {
    // GIVEN: User navigates to an unknown route
    const router = createTestRouter('/ruta-inexistente');

    // WHEN: The page loads
    render(<RouterProvider router={router} />);

    // THEN: Spanish-language not-found message is visible
    // RED: Will fail until NotFoundView renders Spanish heading
    expect(await screen.findByText(/página no encontrada/i)).toBeInTheDocument();
  });

  it('should render a link with text "Ir a Clientes" that points to /clientes', async () => {
    // GIVEN: User navigates to an unknown route
    const router = createTestRouter('/pagina-que-no-existe');

    // WHEN: The page loads
    render(<RouterProvider router={router} />);

    // THEN: A link "Ir a Clientes" pointing to /clientes is visible
    // RED: Will fail until NotFoundView renders <Link to="/clientes">... Ir a Clientes</Link>
    const link = await screen.findByRole('link', { name: /ir a clientes/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/clientes');
  });

  it('should not render clientes-view or contactos-view for an unknown route', async () => {
    // GIVEN: User navigates to an unknown route
    const router = createTestRouter('/no-existe');

    // WHEN: The page loads
    render(<RouterProvider router={router} />);

    // THEN: The not-found view is shown (not any valid route content)
    await screen.findByTestId('not-found-view');
    expect(screen.queryByTestId('clientes-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contactos-view')).not.toBeInTheDocument();
  });
});
