/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * TC-E1-P2-01 — NavigationRail Visible on Desktop Viewport (≥1024px)
 *
 * Level: Component (Vitest + RTL)
 * Requirement: AC-1.2 (NavigationRail on desktop, siesa-ui-kit)
 *
 * RED Phase — Tests intentionally fail until implementation is complete.
 * These tests define expected behavior BEFORE implementation exists.
 */

import React from 'react';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createRouter, RouterProvider, createMemoryHistory } from '@tanstack/react-router';

// Import that will fail in RED phase — implementation does not exist yet
import { routeTree } from '../../routes/__root';

// ─────────────────────────────────────────────────────────────────────────────
// Test Setup Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string = '/clientes') {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({
    routeTree,
    history: memoryHistory,
  });
  return router;
}

// Set jsdom window width to simulate a desktop viewport
function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1280,
  });
  window.dispatchEvent(new Event('resize'));
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P2-01: NavigationRail visible on desktop viewport (≥1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E1-P2-01 — NavigationRail visible on desktop viewport (1280px)', () => {
  beforeEach(() => {
    // Set viewport to desktop width (1280px > 1024px lg breakpoint)
    setDesktopViewport();
  });

  afterEach(() => {
    cleanup();
  });

  test(
    // GIVEN: The app is rendered at viewport width 1280px
    // GIVEN: The AppShellLayout uses Tailwind classes "hidden lg:flex" for NavigationRail
    // WHEN: The AppShell component renders
    'should render the NavigationRail component in the DOM at desktop width (1280px)',
    async () => {
      // GIVEN: Desktop viewport (1280px)
      // Router rendered at /clientes
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: NavigationRail container is in the DOM
      // Implementation must add data-testid="navigation-rail" to the NavigationRail wrapper
      const navRail = await screen.findByTestId('navigation-rail');
      expect(navRail).toBeInTheDocument();
    }
  );

  test(
    // GIVEN: The NavigationRail contains the Clientes entry
    // WHEN: Rendered at desktop width
    'should display the "Clientes" entry inside the NavigationRail',
    async () => {
      // GIVEN: Desktop viewport (1280px)
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: The NavigationRail contains the Clientes nav item
      // Implementation must add data-testid="nav-item-clientes" to the nav item
      const clientesItem = await screen.findByTestId('nav-item-clientes');
      expect(clientesItem).toBeInTheDocument();
      expect(clientesItem).toHaveTextContent('Clientes');
    }
  );

  test(
    // GIVEN: The NavigationRail contains the Contactos entry
    // WHEN: Rendered at desktop width
    'should display the "Contactos" entry inside the NavigationRail',
    async () => {
      // GIVEN: Desktop viewport (1280px)
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: The NavigationRail contains the Contactos nav item
      const contactosItem = await screen.findByTestId('nav-item-contactos');
      expect(contactosItem).toBeInTheDocument();
      expect(contactosItem).toHaveTextContent('Contactos');
    }
  );

  test(
    // GIVEN: The Navbar is always rendered as the top bar (64px)
    // WHEN: The AppShell renders at any viewport
    'should display the Navbar with product name "Siesa Agents"',
    async () => {
      // GIVEN: Desktop viewport (1280px)
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: The Navbar is in the DOM with correct product name
      // Implementation must add data-testid="app-navbar" to the Navbar component
      const navbar = await screen.findByTestId('app-navbar');
      expect(navbar).toBeInTheDocument();
      expect(navbar).toHaveTextContent('Siesa Agents');
    }
  );

  test(
    // GIVEN: The app shell wraps all content via LayoutBase
    // WHEN: The AppShell renders at desktop width
    'should render the app-navigation-shell container at desktop width',
    async () => {
      // GIVEN: Desktop viewport (1280px)
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: The overall navigation shell container is in the DOM
      const shell = await screen.findByTestId('app-navigation-shell');
      expect(shell).toBeInTheDocument();
    }
  );
});
