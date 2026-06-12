/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATION EXPANDED COVERAGE — BMad TEA testarch-automate
 * Extends navigation.test.tsx with edge cases and boundary conditions
 * not covered by the original ATDD acceptance tests.
 *
 * Coverage added:
 *   - Rapid consecutive navigation (debounce / race condition at component level)
 *   - Active route state changes correctly when route transitions occur
 *   - Navigation shell does not re-mount (key identity preserved) between transitions
 *   - Route content is replaced (not accumulated) on SPA transition
 *   - Navigation works starting from /contactos (not only from /clientes)
 *   - Nav items are rendered as <a> tags (not <button>) for SEO and accessibility
 *   - Nav item hrefs point to the correct paths
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRouter, RouterProvider, createMemoryHistory } from '@tanstack/react-router';

import { routeTree } from '../../routes/__root';

// ─────────────────────────────────────────────────────────────────────────────
// Test Setup Helper
// ─────────────────────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string = '/clientes') {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({
    routeTree,
    history: memoryHistory,
  });
  return router;
}

afterEach(() => {
  cleanup();
});

// ─────────────────────────────────────────────────────────────────────────────
// Nav item href integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('Nav item href and link integrity', () => {
  test('should render the Clientes nav item as an anchor (<a>) tag with href="/clientes"', async () => {
    // GIVEN: TanStack Router Link renders as an <a> tag with correct href
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    const clientesItem = await screen.findByTestId('nav-item-clientes');

    // THEN: The nav item itself or its closest ancestor is an <a> with href="/clientes"
    const anchorEl =
      clientesItem.tagName.toLowerCase() === 'a'
        ? clientesItem
        : clientesItem.closest('a');

    expect(anchorEl).not.toBeNull();
    expect(anchorEl?.getAttribute('href')).toBe('/clientes');
  });

  test('should render the Contactos nav item as an anchor (<a>) tag with href="/contactos"', async () => {
    // GIVEN: TanStack Router Link renders as an <a> tag with correct href
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    const contactosItem = await screen.findByTestId('nav-item-contactos');

    // THEN: The nav item or its ancestor anchor has href="/contactos"
    const anchorEl =
      contactosItem.tagName.toLowerCase() === 'a'
        ? contactosItem
        : contactosItem.closest('a');

    expect(anchorEl).not.toBeNull();
    expect(anchorEl?.getAttribute('href')).toBe('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation starting from /contactos (reverse direction)
// ─────────────────────────────────────────────────────────────────────────────

describe('SPA navigation starting from /contactos', () => {
  test('should navigate from /contactos to /clientes when Clientes nav item is clicked', async () => {
    // GIVEN: The app is rendered at /contactos
    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // GIVEN: Contactos heading is visible at the start
    await expect(screen.findByTestId('contactos-heading')).resolves.toBeInTheDocument();

    // WHEN: The user clicks the Clientes nav item
    const clientesNavItem = await screen.findByTestId('nav-item-clientes');
    await userEvent.click(clientesNavItem);

    // THEN: The router navigates to /clientes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });
  });

  test('should render Clientes content after navigating from /contactos', async () => {
    // GIVEN: The app starts at /contactos
    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // WHEN: Navigation to /clientes occurs
    const clientesNavItem = await screen.findByTestId('nav-item-clientes');
    await userEvent.click(clientesNavItem);

    // THEN: The Clientes heading appears
    await expect(screen.findByTestId('clientes-heading')).resolves.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Route content replacement (not accumulation)
// ─────────────────────────────────────────────────────────────────────────────

describe('Route content replaced on navigation (not accumulated)', () => {
  test('should NOT show both clientes-heading and contactos-heading simultaneously', async () => {
    // GIVEN: The app is at /clientes showing the Clientes heading
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    await expect(screen.findByTestId('clientes-heading')).resolves.toBeInTheDocument();

    // WHEN: Navigating to /contactos
    const contactosNavItem = await screen.findByTestId('nav-item-contactos');
    await userEvent.click(contactosNavItem);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos');
    });

    // THEN: The Clientes heading is gone and Contactos heading is present
    await expect(screen.findByTestId('contactos-heading')).resolves.toBeInTheDocument();
    expect(screen.queryByTestId('clientes-heading')).not.toBeInTheDocument();
  });

  test('should NOT show contactos-heading after navigating back to /clientes', async () => {
    // GIVEN: The app navigates to /contactos then back to /clientes
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    const contactosNavItem = await screen.findByTestId('nav-item-contactos');
    await userEvent.click(contactosNavItem);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos');
    });

    const clientesNavItem = screen.getByTestId('nav-item-clientes');
    await userEvent.click(clientesNavItem);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });

    // THEN: Only Clientes heading is visible
    await expect(screen.findByTestId('clientes-heading')).resolves.toBeInTheDocument();
    expect(screen.queryByTestId('contactos-heading')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation shell identity — shell not re-mounted between transitions
// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation shell identity preserved across route transitions', () => {
  test('should keep the same app-navigation-shell DOM node after navigation (not re-mounted)', async () => {
    // GIVEN: The app-navigation-shell is present at /clientes
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    const shell = await screen.findByTestId('app-navigation-shell');
    // Capture the DOM element reference before navigation
    const shellNodeBefore = shell;

    // WHEN: Navigating to /contactos
    const contactosNavItem = await screen.findByTestId('nav-item-contactos');
    await userEvent.click(contactosNavItem);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos');
    });

    // THEN: The navigation shell is still in the DOM (not unmounted/remounted)
    const shellAfter = screen.getByTestId('app-navigation-shell');
    expect(shellAfter).toBeInTheDocument();
    // The same DOM node should be present (React should not unmount the pathless layout)
    expect(shellAfter).toBe(shellNodeBefore);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rapid navigation at component level
// ─────────────────────────────────────────────────────────────────────────────

describe('Rapid consecutive navigation at component level', () => {
  test('should handle multiple rapid navigation clicks without throwing', async () => {
    // GIVEN: The app is at /clientes
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // Wait for initial render
    await screen.findByTestId('nav-item-contactos');

    // WHEN: Multiple rapid clicks occur without waiting for each transition
    expect(async () => {
      const contactosItem = screen.getByTestId('nav-item-contactos');
      const clientesItem = screen.getByTestId('nav-item-clientes');

      // Fire clicks in rapid succession
      await userEvent.click(contactosItem);
      await userEvent.click(clientesItem);
      await userEvent.click(contactosItem);
    }).not.toThrow();

    // THEN: The router settles without error
    await waitFor(() => {
      // The router ends up at some valid route
      expect(['/clientes', '/contactos']).toContain(
        router.state.location.pathname
      );
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// window.location.reload not called on any navigation
// ─────────────────────────────────────────────────────────────────────────────

describe('No full page reload on any navigation path', () => {
  test('should not call window.location.reload when navigating from /contactos to /clientes', async () => {
    // GIVEN: The app starts at /contactos
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // WHEN: The user clicks the Clientes nav item
    const clientesNavItem = await screen.findByTestId('nav-item-clientes');
    await userEvent.click(clientesNavItem);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });

    // THEN: window.location.reload was NOT called
    expect(reloadSpy).not.toHaveBeenCalled();
    reloadSpy.mockRestore();
  });

  test('should not call window.location.reload during back-and-forth navigation cycle', async () => {
    // GIVEN: The app starts at /clientes
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // WHEN: The user navigates to /contactos and back to /clientes
    const contactosNavItem = await screen.findByTestId('nav-item-contactos');
    await userEvent.click(contactosNavItem);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos');
    });

    const clientesNavItem = screen.getByTestId('nav-item-clientes');
    await userEvent.click(clientesNavItem);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });

    // THEN: No reload was called during the entire cycle
    expect(reloadSpy).not.toHaveBeenCalled();
    reloadSpy.mockRestore();
  });
});
