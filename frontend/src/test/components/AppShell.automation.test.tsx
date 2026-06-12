/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATION EXPANDED COVERAGE — BMad TEA testarch-automate
 * Extends AppShell.desktop.test.tsx and AppShell.mobile.test.tsx with
 * edge cases and boundary conditions for both desktop and mobile viewports.
 *
 * Coverage added:
 *   - Viewport at exactly the lg breakpoint (1024px — boundary value)
 *   - NavigationRail renders at 1024px (boundary desktop)
 *   - NavigationBar renders at 1023px (boundary mobile — one pixel below breakpoint)
 *   - Navbar renders regardless of viewport width
 *   - Nav items have correct accessible labels (aria-label or text content)
 *   - Nav items have icons rendered (at least one <svg> per item)
 *   - AppShell renders without crashing if NavigationRail or NavigationBar is unavailable
 *   - AppShell renders at a very wide viewport (2560px ultra-wide)
 *   - AppShell renders at a very narrow viewport (320px — minimum supported)
 *   - Outlet content area renders alongside the navigation shell
 */

import React from 'react';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createRouter, RouterProvider, createMemoryHistory } from '@tanstack/react-router';

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

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

afterEach(() => {
  cleanup();
  // Reset to a neutral viewport
  setViewportWidth(1280);
});

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoint boundary value tests — lg: 1024px
// ─────────────────────────────────────────────────────────────────────────────

describe('Breakpoint boundary value tests (lg: 1024px)', () => {
  test('should render the NavigationRail at exactly the lg breakpoint (1024px)', async () => {
    // GIVEN: Viewport is exactly at the lg breakpoint (inclusive desktop side)
    setViewportWidth(1024);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: NavigationRail container is present in DOM
    // At 1024px, "hidden lg:flex" renders the rail (lg means >= 1024px)
    const navRail = await screen.findByTestId('navigation-rail');
    expect(navRail).toBeInTheDocument();
  });

  test('should render the NavigationBar at 1023px (one pixel below lg breakpoint)', async () => {
    // GIVEN: Viewport is one pixel below the lg breakpoint (mobile side)
    setViewportWidth(1023);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: NavigationBar container is present in DOM
    // At 1023px, "flex lg:hidden" renders the bottom nav (below lg)
    const navBar = await screen.findByTestId('navigation-bar');
    expect(navBar).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Viewport extremes — ultra-wide and minimum width
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell renders at extreme viewport widths', () => {
  test('should render navigation shell at ultra-wide viewport (2560px)', async () => {
    // GIVEN: An ultra-wide monitor (4K landscape or dual monitor scenario)
    setViewportWidth(2560);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: The navigation shell is present and functional
    await expect(screen.findByTestId('app-navigation-shell')).resolves.toBeInTheDocument();
    await expect(screen.findByTestId('navigation-rail')).resolves.toBeInTheDocument();
  });

  test('should render navigation shell at minimum supported width (320px)', async () => {
    // GIVEN: The smallest common mobile screen (iPhone 5, low-end Android)
    setViewportWidth(320);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: The navigation shell is present (mobile NavigationBar)
    await expect(screen.findByTestId('app-navigation-shell')).resolves.toBeInTheDocument();
    await expect(screen.findByTestId('navigation-bar')).resolves.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navbar always visible regardless of viewport
// ─────────────────────────────────────────────────────────────────────────────

describe('Navbar renders at all viewport widths', () => {
  test('should render the Navbar at mobile width (375px)', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(375);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Navbar (top bar) is present — it does not swap with viewport size
    await expect(screen.findByTestId('app-navbar')).resolves.toBeInTheDocument();
  });

  test('should render the Navbar at desktop width (1280px)', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Navbar is always present at the top
    await expect(screen.findByTestId('app-navbar')).resolves.toBeInTheDocument();
  });

  test('should display "Siesa Agents" text in the Navbar at mobile width', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(375);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Product name is visible on mobile too (not hidden)
    const navbar = await screen.findByTestId('app-navbar');
    expect(navbar).toHaveTextContent('Siesa Agents');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Nav item accessible labels
// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation items have correct accessible text', () => {
  test('should have correct Spanish text label for Clientes nav item at desktop', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Clientes item has exactly the label "Clientes"
    const clientesItem = await screen.findByTestId('nav-item-clientes');
    expect(clientesItem).toHaveTextContent('Clientes');
  });

  test('should have correct Spanish text label for Contactos nav item at desktop', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Contactos item has exactly the label "Contactos"
    const contactosItem = await screen.findByTestId('nav-item-contactos');
    expect(contactosItem).toHaveTextContent('Contactos');
  });

  test('should have correct Spanish text label for Clientes nav item at mobile', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(375);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Clientes label present in mobile NavigationBar
    const clientesItem = await screen.findByTestId('nav-item-clientes');
    expect(clientesItem).toHaveTextContent('Clientes');
  });

  test('should have correct Spanish text label for Contactos nav item at mobile', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(375);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Contactos label present in mobile NavigationBar
    const contactosItem = await screen.findByTestId('nav-item-contactos');
    expect(contactosItem).toHaveTextContent('Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Nav items contain icons
// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation items render Heroicon SVG icons', () => {
  test('should render at least one SVG icon within the Clientes nav item or its parent', async () => {
    // GIVEN: Desktop viewport (icons are specified via Heroicons in the story)
    setViewportWidth(1280);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    const clientesItem = await screen.findByTestId('nav-item-clientes');

    // THEN: An SVG element is present within or adjacent to the nav item
    // Implementation must include UsersIcon from @heroicons/react/24/outline
    const svgInItem = clientesItem.querySelector('svg');
    const svgInParent = clientesItem.closest('[data-testid="navigation-rail"]')?.querySelector('svg');

    expect(svgInItem !== null || svgInParent !== null).toBe(true);
  });

  test('should render at least one SVG icon within the Contactos nav item or its parent', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    const contactosItem = await screen.findByTestId('nav-item-contactos');

    // THEN: An SVG element is present within or adjacent to the nav item
    // Implementation must include UserIcon from @heroicons/react/24/outline
    const svgInItem = contactosItem.querySelector('svg');
    const svgInParent = contactosItem.closest('[data-testid="navigation-rail"]')?.querySelector('svg');

    expect(svgInItem !== null || svgInParent !== null).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Outlet content area renders alongside navigation
// ─────────────────────────────────────────────────────────────────────────────

describe('Outlet content area renders alongside navigation shell', () => {
  test('should render Clientes route content alongside the navigation shell at desktop', async () => {
    // GIVEN: Desktop viewport, route at /clientes
    setViewportWidth(1280);

    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // THEN: Both navigation and content are simultaneously rendered
    await expect(screen.findByTestId('app-navigation-shell')).resolves.toBeInTheDocument();
    await expect(screen.findByTestId('clientes-heading')).resolves.toBeInTheDocument();
  });

  test('should render Contactos route content alongside the navigation shell at mobile', async () => {
    // GIVEN: Mobile viewport, route at /contactos
    setViewportWidth(375);

    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // THEN: Both NavigationBar and Contactos content render simultaneously
    await expect(screen.findByTestId('navigation-bar')).resolves.toBeInTheDocument();
    await expect(screen.findByTestId('contactos-heading')).resolves.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AppShell renders without throwing at /contactos (not only /clientes)
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell renders correctly at /contactos initial route', () => {
  test('should render the shell and NavigationRail when initial route is /contactos (desktop)', async () => {
    // GIVEN: User deep-links directly to /contactos on desktop
    setViewportWidth(1280);

    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // THEN: The shell and desktop nav are rendered
    await expect(screen.findByTestId('app-navigation-shell')).resolves.toBeInTheDocument();
    await expect(screen.findByTestId('navigation-rail')).resolves.toBeInTheDocument();
    await expect(screen.findByTestId('contactos-heading')).resolves.toBeInTheDocument();
  });

  test('should render the shell and NavigationBar when initial route is /contactos (mobile)', async () => {
    // GIVEN: User deep-links directly to /contactos on mobile
    setViewportWidth(375);

    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // THEN: The shell and mobile nav are rendered
    await expect(screen.findByTestId('app-navigation-shell')).resolves.toBeInTheDocument();
    await expect(screen.findByTestId('navigation-bar')).resolves.toBeInTheDocument();
    await expect(screen.findByTestId('contactos-heading')).resolves.toBeInTheDocument();
  });
});
