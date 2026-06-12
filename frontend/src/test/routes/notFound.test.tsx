/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * TC-E1-P1-04 — 404 Route: Unknown URL Shows Not-Found View
 *
 * Level: Component (Vitest + RTL)
 * Requirement: AC-1.2 (not-found view displayed gracefully)
 *
 * RED Phase — Tests intentionally fail until implementation is complete.
 * These tests define expected behavior BEFORE implementation exists.
 */

import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createRouter, RouterProvider, createMemoryHistory } from '@tanstack/react-router';

// Import that will fail in RED phase — implementation does not exist yet
import { routeTree } from '../../routes/__root';

// ─────────────────────────────────────────────────────────────────────────────
// Test Setup Helper
// ─────────────────────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({
    routeTree,
    history: memoryHistory,
  });
  return router;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P1-04: 404 route — unknown URL shows not-found view
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E1-P1-04 — Unknown route shows not-found view', () => {
  test(
    // GIVEN: The TanStack Router has notFoundComponent configured in __root.tsx
    // WHEN: The router is rendered at an unknown path
    'should render the NotFound component for an unknown route /ruta-que-no-existe',
    async () => {
      // GIVEN: Router is rendered at an unknown path
      const router = createTestRouter('/ruta-que-no-existe');
      render(<RouterProvider router={router} />);

      // THEN: A not-found component renders (not a blank screen or JS error)
      // Implementation must add data-testid="not-found-message" to NotFound component
      await expect(screen.findByTestId('not-found-message')).resolves.toBeInTheDocument();
    }
  );

  test(
    // GIVEN: The NotFound component renders a Spanish message per company standard
    // WHEN: The router renders an unknown route
    'should display "Página no encontrada" text in Spanish on unknown route',
    async () => {
      // GIVEN: Router is rendered at an unknown path
      const router = createTestRouter('/ruta-inexistente');
      render(<RouterProvider router={router} />);

      // THEN: The Spanish 404 message is present
      const notFoundMessage = await screen.findByTestId('not-found-message');
      expect(notFoundMessage).toHaveTextContent('Página no encontrada');
    }
  );

  test(
    // GIVEN: The NotFound component includes a link back to /clientes
    // WHEN: An unknown route is rendered
    'should display a "Volver a Clientes" link on the not-found view',
    async () => {
      // GIVEN: Router is rendered at an unknown path
      const router = createTestRouter('/pagina-desconocida');
      render(<RouterProvider router={router} />);

      // THEN: A link to /clientes is present with correct href
      // Implementation must add data-testid="not-found-back-link" to the Link component
      const backLink = await screen.findByTestId('not-found-back-link');
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/clientes');
    }
  );

  test(
    // GIVEN: The notFoundComponent is registered on the root route (not a child route)
    // The shell layout wraps child routes, but not-found is at root level
    // WHEN: An unknown route is accessed
    'should not throw a JavaScript error when rendering an unknown route',
    async () => {
      // GIVEN: Router is rendered at an unknown path
      const router = createTestRouter('/completamente-desconocido');

      // THEN: Rendering does not throw
      expect(() => {
        render(<RouterProvider router={router} />);
      }).not.toThrow();

      // THEN: A not-found message appears
      await expect(screen.findByTestId('not-found-message')).resolves.toBeInTheDocument();
    }
  );
});
