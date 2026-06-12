/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * TC-E1-P2-02 — NavigationBar Visible on Mobile Viewport (<1024px)
 *
 * Level: Component (Vitest + RTL)
 * Requirement: AC-1.2 (mobile NavigationBar, FR29)
 * Risk covered: R7 — NavigationRail/NavigationBar renders incorrectly at responsive breakpoint
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

// Set jsdom window width to simulate a mobile viewport (<1024px lg breakpoint)
function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  });
  window.dispatchEvent(new Event('resize'));
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P2-02: NavigationBar visible on mobile viewport (<1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E1-P2-02 — NavigationBar visible on mobile viewport (375px)', () => {
  beforeEach(() => {
    // Set viewport to mobile width (375px < 1024px lg breakpoint)
    setMobileViewport();
  });

  afterEach(() => {
    cleanup();
  });

  test(
    // GIVEN: The app is rendered at viewport width 375px (mobile)
    // GIVEN: The AppShellLayout uses Tailwind classes "flex lg:hidden" for NavigationBar
    // WHEN: The AppShell component renders
    'should render the NavigationBar component in the DOM at mobile width (375px)',
    async () => {
      // GIVEN: Mobile viewport (375px)
      // Router rendered at /clientes
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: NavigationBar container is in the DOM
      // Implementation must add data-testid="navigation-bar" to the NavigationBar wrapper
      const navBar = await screen.findByTestId('navigation-bar');
      expect(navBar).toBeInTheDocument();
    }
  );

  test(
    // GIVEN: The NavigationBar contains the Clientes entry (accessible and tappable)
    // WHEN: Rendered at mobile width
    'should display the "Clientes" item in the NavigationBar at mobile width',
    async () => {
      // GIVEN: Mobile viewport (375px)
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: The NavigationBar contains the Clientes nav item (accessible)
      // Implementation must add data-testid="nav-item-clientes" to the nav item
      const clientesItem = await screen.findByTestId('nav-item-clientes');
      expect(clientesItem).toBeInTheDocument();
      expect(clientesItem).toHaveTextContent('Clientes');
    }
  );

  test(
    // GIVEN: The NavigationBar contains the Contactos entry (accessible and tappable)
    // WHEN: Rendered at mobile width
    'should display the "Contactos" item in the NavigationBar at mobile width',
    async () => {
      // GIVEN: Mobile viewport (375px)
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: The NavigationBar contains the Contactos nav item (accessible)
      const contactosItem = await screen.findByTestId('nav-item-contactos');
      expect(contactosItem).toBeInTheDocument();
      expect(contactosItem).toHaveTextContent('Contactos');
    }
  );

  test(
    // GIVEN: On mobile, the NavigationRail should NOT be displayed
    // The Tailwind class "hidden lg:flex" hides it below lg (1024px)
    // WHEN: Rendered at mobile width
    'should NOT render the NavigationRail at mobile viewport (375px)',
    async () => {
      // GIVEN: Mobile viewport (375px)
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // Wait for the render to settle
      await screen.findByTestId('navigation-bar');

      // THEN: NavigationRail is either absent from DOM or has display:none / hidden class
      // Implementation must add data-testid="navigation-rail" to the NavigationRail wrapper
      const navRail = screen.queryByTestId('navigation-rail');

      // NavigationRail either is not rendered, or is visually hidden
      // With Tailwind jsdom, CSS classes are not computed — we check for the "hidden" class
      if (navRail) {
        // If present, it must have the Tailwind hidden class (not visible)
        expect(navRail.className).toMatch(/hidden/);
      }
      // If not in DOM at all, test also passes (component-level conditional render)
    }
  );

  test(
    // GIVEN: Navigation items in NavigationBar must be accessible (tappable on mobile)
    // WHEN: Rendered at mobile width
    'should render navigation items as accessible interactive elements in NavigationBar',
    async () => {
      // GIVEN: Mobile viewport (375px)
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: Navigation items are interactive (have role=link or role=button)
      const clientesItem = await screen.findByTestId('nav-item-clientes');
      const contactosItem = screen.getByTestId('nav-item-contactos');

      // Items should be accessible: either an anchor (<a>) or a button
      const clientesTag = clientesItem.tagName.toLowerCase();
      const contactosTag = contactosItem.tagName.toLowerCase();

      expect(['a', 'button'].includes(clientesTag) || clientesItem.closest('a, button') !== null).toBe(true);
      expect(['a', 'button'].includes(contactosTag) || contactosItem.closest('a, button') !== null).toBe(true);
    }
  );

  test(
    // GIVEN: The app shell navigation-shell container wraps the NavigationBar
    // WHEN: The AppShell renders at mobile width
    'should render the app-navigation-shell container at mobile width',
    async () => {
      // GIVEN: Mobile viewport (375px)
      const router = createTestRouter('/clientes');
      render(<RouterProvider router={router} />);

      // THEN: The overall navigation shell container is in the DOM
      const shell = await screen.findByTestId('app-navigation-shell');
      expect(shell).toBeInTheDocument();
    }
  );
});
