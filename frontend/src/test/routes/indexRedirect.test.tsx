/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * TC-E1-P2-03 — Index Route Redirects to /clientes
 *
 * Level: Component (Vitest + RTL)
 * Requirement: AC-1.2 (AC4 — root / redirects to /clientes automatically)
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
// TC-E1-P2-03: Index route / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E1-P2-03 — Index route / redirects to /clientes', () => {
  test(
    // GIVEN: The index route is configured with beforeLoad redirect to /clientes
    // WHEN: The router is rendered at / (root path)
    'should redirect from / to /clientes automatically',
    async () => {
      // GIVEN: Router is rendered at root /
      const router = createTestRouter('/');
      render(<RouterProvider router={router} />);

      // THEN: The pathname changes to /clientes
      // TanStack Router beforeLoad redirect executes synchronously
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/clientes');
      });
    }
  );

  test(
    // GIVEN: The router redirects / to /clientes
    // WHEN: The router renders at /
    'should render the Clientes view content (not a blank page) after root redirect',
    async () => {
      // GIVEN: Router is rendered at root /
      const router = createTestRouter('/');
      render(<RouterProvider router={router} />);

      // THEN: The Clientes view is rendered (not a blank page)
      // Implementation must add data-testid="clientes-heading" to ClientesPlaceholder
      await expect(screen.findByTestId('clientes-heading')).resolves.toBeInTheDocument();
    }
  );

  test(
    // GIVEN: The index route uses TanStack Router redirect in beforeLoad
    // WHEN: The router renders at /
    'should NOT render content specific to the index path (no double-render at /)',
    async () => {
      // GIVEN: Router is rendered at root /
      const router = createTestRouter('/');
      render(<RouterProvider router={router} />);

      // THEN: After redirect, pathname is /clientes (not /)
      await waitFor(() => {
        expect(router.state.location.pathname).not.toBe('/');
      });
    }
  );
});
