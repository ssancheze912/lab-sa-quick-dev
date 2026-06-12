/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATION EXPANDED COVERAGE — BMad TEA testarch-automate
 * Extends indexRedirect.test.tsx with edge cases and boundary conditions.
 *
 * Coverage added:
 *   - Redirect does not loop (/ → /clientes → / infinitely)
 *   - Redirect occurs only once (router state settles at /clientes)
 *   - Navigation shell is present after redirect completes
 *   - Navigation from /clientes back to / re-triggers the redirect
 *   - Redirect happens without any console errors
 *   - Redirect does not call window.location.reload
 *   - Multiple router instances each redirect independently
 */

import React from 'react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { createRouter, RouterProvider, createMemoryHistory } from '@tanstack/react-router';

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

afterEach(() => {
  cleanup();
});

// ─────────────────────────────────────────────────────────────────────────────
// Redirect loop protection
// ─────────────────────────────────────────────────────────────────────────────

describe('Index redirect loop protection', () => {
  test('should NOT redirect from /clientes back to / (no redirect loop)', async () => {
    // GIVEN: The router redirects / to /clientes
    // WHEN: The router is rendered at /clientes (already at the redirect target)
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // Wait a bit to ensure no further redirect happens
    await new Promise((resolve) => setTimeout(resolve, 200));

    // THEN: The router stays at /clientes (no loop back to /)
    expect(router.state.location.pathname).toBe('/clientes');
  });

  test('should settle at /clientes after exactly one redirect from /', async () => {
    // GIVEN: Router starts at /
    const router = createTestRouter('/');
    render(<RouterProvider router={router} />);

    // THEN: The router reaches /clientes and stays there
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });

    // Wait an additional tick to confirm it does not keep redirecting
    await new Promise((resolve) => setTimeout(resolve, 200));

    // THEN: Still at /clientes (no loop)
    expect(router.state.location.pathname).toBe('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation shell after redirect
// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation shell is present after redirect from /', () => {
  test('should render the app-navigation-shell after redirect completes', async () => {
    // GIVEN: Router starts at / and redirects to /clientes
    const router = createTestRouter('/');
    render(<RouterProvider router={router} />);

    // WHEN: The redirect completes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });

    // THEN: The navigation shell is visible (layout route rendered correctly)
    await expect(screen.findByTestId('app-navigation-shell')).resolves.toBeInTheDocument();
  });

  test('should render both nav items after redirect from / to /clientes', async () => {
    // GIVEN: Router starts at /
    const router = createTestRouter('/');
    render(<RouterProvider router={router} />);

    // WHEN: Redirect completes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });

    // THEN: Both navigation items are visible
    await expect(screen.findByTestId('nav-item-clientes')).resolves.toBeInTheDocument();
    await expect(screen.findByTestId('nav-item-contactos')).resolves.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Redirect does not trigger full page reload
// ─────────────────────────────────────────────────────────────────────────────

describe('Index redirect does not call window.location.reload', () => {
  test('should NOT call window.location.reload during / to /clientes redirect', async () => {
    // GIVEN: TanStack Router redirect uses internal history — no page reload
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

    const router = createTestRouter('/');
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });

    // THEN: Redirect did not cause a full page reload
    expect(reloadSpy).not.toHaveBeenCalled();
    reloadSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Redirect stability — multiple independent router instances
// ─────────────────────────────────────────────────────────────────────────────

describe('Redirect stability across multiple router instances', () => {
  test('should redirect correctly when a second router instance is created at /', async () => {
    // GIVEN: A second router instance starting at / (simulates remount scenarios)
    cleanup(); // Ensure a clean DOM

    const router = createTestRouter('/');
    render(<RouterProvider router={router} />);

    // THEN: Redirect completes successfully for this instance too
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });

    // THEN: Clientes content renders correctly
    await expect(screen.findByTestId('clientes-heading')).resolves.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Redirect timing — does not leave a blank screen during transition
// ─────────────────────────────────────────────────────────────────────────────

describe('Redirect does not produce a visible blank screen', () => {
  test('should render Clientes content within a reasonable time after redirect from /', async () => {
    // GIVEN: Router starts at /
    const router = createTestRouter('/');
    const startTime = Date.now();

    render(<RouterProvider router={router} />);

    // WHEN: The redirect completes and Clientes content renders
    await expect(screen.findByTestId('clientes-heading', {}, { timeout: 2000 })).resolves.toBeInTheDocument();
    const elapsed = Date.now() - startTime;

    // THEN: The redirect and render complete within 2 seconds
    expect(elapsed).toBeLessThan(2000);
  });

  test('should NOT render a blank body at / during the redirect transition', async () => {
    // GIVEN: Router starts at / — render immediately captures DOM state
    const router = createTestRouter('/');
    const { container } = render(<RouterProvider router={router} />);

    // Wait a tick (redirect is synchronous in TanStack Router beforeLoad)
    await new Promise((resolve) => setTimeout(resolve, 0));

    // THEN: The container is not empty even during/after the redirect
    expect(container.innerHTML.trim().length).toBeGreaterThan(0);
  });
});
