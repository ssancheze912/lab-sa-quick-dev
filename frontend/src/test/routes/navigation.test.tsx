/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * TC-E1-P1-01 — SPA Navigation: No Full Page Reload Between Routes
 *
 * Level: Component (Vitest + RTL)
 * Requirement: AC-E1.2 (navigate between Clientes and Contactos without full page reloads), FR28
 *
 * RED Phase — Tests intentionally fail until implementation is complete.
 * These tests define expected behavior BEFORE implementation exists.
 */

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRouter, RouterProvider, createMemoryHistory } from '@tanstack/react-router';

// Imports that will fail in RED phase — implementation does not exist yet
// The router configuration, routeTree, and AppShellLayout are defined in Story 1.2 implementation
import { routeTree } from '../../routes/__root';

// ─────────────────────────────────────────────────────────────────────────────
// Test Setup Helper
// Creates a RouterProvider with an in-memory history starting at a given path
// ─────────────────────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string = '/clientes') {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({
    routeTree,
    history: memoryHistory,
  });
  return router;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P1-01a: Click "Clientes" nav item → URL is /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E1-P1-01 — SPA Navigation: no full page reload between routes', () => {
  test(
    // GIVEN: TanStack Router is configured with /clientes and /contactos routes
    // GIVEN: Root layout with NavigationRail rendered
    'should navigate to /clientes when user clicks the Clientes nav item',
    async () => {
      // GIVEN: The app is rendered at /contactos
      const router = createTestRouter('/contactos');
      render(<RouterProvider router={router} />);

      // WHEN: The user clicks the Clientes nav item
      // Implementation must add data-testid="nav-item-clientes" to the nav item
      const clientesNavItem = await screen.findByTestId('nav-item-clientes');
      await userEvent.click(clientesNavItem);

      // THEN: The URL becomes /clientes
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/clientes');
      });
    }
  );

  test(
    // GIVEN: TanStack Router is configured with /clientes and /contactos routes
    'should navigate to /contactos when user clicks the Contactos nav item',
    async () => {
      // GIVEN: The app is rendered at /clientes
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // WHEN: The user clicks the Contactos nav item
      // Implementation must add data-testid="nav-item-contactos" to the nav item
      const contactosNavItem = await screen.findByTestId('nav-item-contactos');
      await userEvent.click(contactosNavItem);

      // THEN: The URL becomes /contactos
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/contactos');
      });
    }
  );

  test(
    // GIVEN: TanStack Router client-side navigation does NOT call window.location.reload
    'should NOT call window.location.reload when navigating via nav items',
    async () => {
      // GIVEN: The app is rendered at /clientes
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // WHEN: The user clicks the Contactos nav item
      const contactosNavItem = await screen.findByTestId('nav-item-contactos');
      await userEvent.click(contactosNavItem);

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/contactos');
      });

      // THEN: window.location.reload was NOT called (SPA navigation confirmed)
      expect(reloadSpy).not.toHaveBeenCalled();

      reloadSpy.mockRestore();
    }
  );

  test(
    // GIVEN: The pathless layout route _app.tsx wraps both /clientes and /contactos
    'should keep the navigation shell mounted when navigating from /clientes to /contactos',
    async () => {
      // GIVEN: The app is rendered at /clientes
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // GIVEN: Navigation shell is visible at /clientes
      // Implementation must add data-testid="app-navigation-shell" to the AppShellLayout
      const shell = await screen.findByTestId('app-navigation-shell');
      expect(shell).toBeInTheDocument();

      // WHEN: The user clicks the Contactos nav item
      const contactosNavItem = await screen.findByTestId('nav-item-contactos');
      await userEvent.click(contactosNavItem);

      // THEN: The navigation shell is still mounted after route transition
      await waitFor(() => {
        expect(screen.getByTestId('app-navigation-shell')).toBeInTheDocument();
      });
    }
  );

  test(
    // GIVEN: The /clientes view renders the ClientesPlaceholder component
    'should render Clientes view content at /clientes',
    async () => {
      // GIVEN: The app is rendered at /clientes
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: The Clientes heading is visible
      // Implementation must add data-testid="clientes-heading" to ClientesPlaceholder
      await expect(screen.findByTestId('clientes-heading')).resolves.toBeInTheDocument();
    }
  );

  test(
    // GIVEN: The /contactos view renders the ContactosPlaceholder component
    'should render Contactos view content at /contactos',
    async () => {
      // GIVEN: The app is rendered at /contactos
      const router = createTestRouter('/contactos');
      render(<RouterProvider router={router} />);

      // THEN: The Contactos heading is visible
      // Implementation must add data-testid="contactos-heading" to ContactosPlaceholder
      await expect(screen.findByTestId('contactos-heading')).resolves.toBeInTheDocument();
    }
  );

  test(
    // GIVEN: Navigation items are labeled in Spanish per company standard
    'should display nav items labeled "Clientes" and "Contactos" in Spanish',
    async () => {
      // GIVEN: The app is rendered at /clientes
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: Both navigation items are present with correct Spanish labels
      const clientesItem = await screen.findByTestId('nav-item-clientes');
      const contactosItem = await screen.findByTestId('nav-item-contactos');

      expect(clientesItem).toHaveTextContent('Clientes');
      expect(contactosItem).toHaveTextContent('Contactos');
    }
  );
});
