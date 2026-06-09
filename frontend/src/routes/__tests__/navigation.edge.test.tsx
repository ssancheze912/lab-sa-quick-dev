/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge Cases & Boundary Conditions (expansion of ATDD tests)
 *
 * Coverage focus:
 *   - Viewport boundary at exactly 1024px (breakpoint edge)
 *   - Navigation state when currentPath is root "/" or empty
 *   - Active-state logic for nested paths (e.g., /clientes/123)
 *   - Resize event transitions (desktop → mobile, mobile → desktop)
 *   - Multiple nav instances don't duplicate ARIA landmarks
 *   - NotFoundView renders without crashing when no router context
 *   - Back-link href value and Spanish link text exactness
 *   - Keyboard focus order and tab navigation
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { act } from 'react';
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
  createRootRoute,
} from '@tanstack/react-router';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AppLayout: React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let NotFoundView: React.ComponentType<any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function renderWithRouter(ui: React.ReactElement, { initialPath = '/' } = {}) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await router.load();
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

beforeEach(async () => {
  // @ts-expect-error – dynamic import for test isolation
  const appModule = await import('../_app');
  AppLayout = appModule.AppLayout ?? appModule.default;

  // @ts-expect-error – notfound re-export
  const rootModule = await import('../__root.notfound');
  NotFoundView = rootModule.NotFoundView ?? rootModule.default;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Exact breakpoint width = 1024px
// ─────────────────────────────────────────────────────────────────────────────

describe('Breakpoint boundary — exactly 1024px', () => {
  test('should show NavigationRail at exactly 1024px (desktop breakpoint inclusive)', async () => {
    // GIVEN: Viewport is exactly the lg breakpoint (1024px)
    setViewportWidth(1024);

    // WHEN: AppLayout renders
    await renderWithRouter(<AppLayout />);

    // THEN: Desktop rail is visible; mobile bar is hidden
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
    expect(screen.queryByTestId('navigation-bar')).not.toBeVisible();
  });

  test('should show NavigationBar at 1023px (one pixel below breakpoint)', async () => {
    // GIVEN: Viewport is 1px below the lg breakpoint
    setViewportWidth(1023);

    // WHEN: AppLayout renders
    await renderWithRouter(<AppLayout />);

    // THEN: Mobile bar is visible; desktop rail is hidden
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('navigation-rail')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Resize transitions
// ─────────────────────────────────────────────────────────────────────────────

describe('Responsive resize transitions — edge cases', () => {
  test('should switch from NavigationRail to NavigationBar on resize from desktop to mobile', async () => {
    // GIVEN: App starts at desktop width (1280px)
    setViewportWidth(1280);
    await renderWithRouter(<AppLayout />);

    // Verify initial state: rail visible
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();

    // WHEN: User resizes browser to mobile (390px)
    await act(async () => {
      setViewportWidth(390);
    });

    // THEN: NavigationBar becomes visible, NavigationRail hidden
    await waitFor(() => {
      expect(screen.queryByTestId('navigation-rail')).not.toBeVisible();
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    });
  });

  test('should switch from NavigationBar to NavigationRail on resize from mobile to desktop', async () => {
    // GIVEN: App starts at mobile width (390px)
    setViewportWidth(390);
    await renderWithRouter(<AppLayout />);

    // Verify initial state: bar visible
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();

    // WHEN: User resizes to desktop (1440px)
    await act(async () => {
      setViewportWidth(1440);
    });

    // THEN: NavigationRail becomes visible, NavigationBar hidden
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
      expect(screen.queryByTestId('navigation-bar')).not.toBeVisible();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Active-state logic for nested and edge paths
// ─────────────────────────────────────────────────────────────────────────────

describe('Active nav item — path edge cases', () => {
  test('should mark "Clientes" as active for a nested path /clientes/123', async () => {
    // GIVEN: The app is on a nested clientes sub-route
    setViewportWidth(1280);

    // WHEN: AppLayout receives a nested path
    await renderWithRouter(<AppLayout currentPath="/clientes/123" />);

    // THEN: "Clientes" nav item has aria-current="page" (startsWith match)
    const clientesLink = screen.getByTestId('nav-item-clientes');
    expect(clientesLink).toHaveAttribute('aria-current', 'page');
  });

  test('should mark "Contactos" as active for a nested path /contactos/456', async () => {
    // GIVEN: The app is on a nested contactos sub-route
    setViewportWidth(1280);

    // WHEN: AppLayout receives a nested path
    await renderWithRouter(<AppLayout currentPath="/contactos/456" />);

    // THEN: "Contactos" nav item has aria-current="page"
    const contactosLink = screen.getByTestId('nav-item-contactos');
    expect(contactosLink).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT mark any nav item as active when currentPath is root "/"', async () => {
    // GIVEN: The app is at root "/" (index redirect has not yet fired)
    setViewportWidth(1280);

    // WHEN: AppLayout renders with currentPath="/"
    await renderWithRouter(<AppLayout currentPath="/" />);

    // THEN: Neither "Clientes" nor "Contactos" has aria-current="page"
    const clientesLink = screen.getByTestId('nav-item-clientes');
    const contactosLink = screen.getByTestId('nav-item-contactos');
    expect(clientesLink).not.toHaveAttribute('aria-current', 'page');
    expect(contactosLink).not.toHaveAttribute('aria-current', 'page');
  });

  test('should NOT mark any nav item as active for an unknown path /unknown', async () => {
    // GIVEN: The app is on an unknown route (404 scenario)
    setViewportWidth(1280);

    // WHEN: AppLayout receives an unrecognised path
    await renderWithRouter(<AppLayout currentPath="/unknown" />);

    // THEN: No nav item is active
    const clientesLink = screen.getByTestId('nav-item-clientes');
    const contactosLink = screen.getByTestId('nav-item-contactos');
    expect(clientesLink).not.toHaveAttribute('aria-current', 'page');
    expect(contactosLink).not.toHaveAttribute('aria-current', 'page');
  });

  test('should handle empty string currentPath without crashing', async () => {
    // GIVEN: currentPath is empty (edge case: uninitialised consumer)
    setViewportWidth(1280);

    // WHEN: AppLayout renders
    // THEN: Component does not throw; renders without crash
    await expect(renderWithRouter(<AppLayout currentPath="" />)).resolves.not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: ARIA landmark uniqueness
// ─────────────────────────────────────────────────────────────────────────────

describe('ARIA landmark uniqueness — edge cases', () => {
  test('should render exactly two nav elements (rail + bar) — no unintended duplicates', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280);

    // WHEN: AppLayout renders
    await renderWithRouter(<AppLayout />);

    // THEN: Exactly 2 nav elements exist (one rail, one bar, always in DOM)
    const navElements = document.querySelectorAll('nav[aria-label="Navegación principal"]');
    expect(navElements.length).toBe(2);
  });

  test('mobile NavigationBar nav should carry the same aria-label as the desktop rail', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(390);

    // WHEN: AppLayout renders
    await renderWithRouter(<AppLayout />);

    // THEN: The mobile nav also carries aria-label="Navegación principal"
    const navBar = screen.getByTestId('navigation-bar');
    expect(navBar).toHaveAttribute('aria-label', 'Navegación principal');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: NotFoundView isolation and content correctness
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — isolation and content edge cases', () => {
  test('should render without crashing when no router context is provided', () => {
    // GIVEN: NotFoundView is rendered standalone (no RouterProvider)
    // WHEN: Component mounts
    // THEN: No error thrown; DOM element present
    expect(() => render(<NotFoundView />)).not.toThrow();
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
  });

  test('back link href should be exactly "/clientes" — not a relative or full URL', () => {
    // GIVEN: NotFoundView is rendered
    render(<NotFoundView />);

    // WHEN: Inspecting the href attribute of the back link
    const link = screen.getByTestId('not-found-back-link');

    // THEN: href is exactly "/clientes" (absolute path, not "clientes" or "http://...")
    expect(link.getAttribute('href')).toBe('/clientes');
  });

  test('should display "404" numeric code visually', () => {
    // GIVEN: NotFoundView is rendered
    render(<NotFoundView />);

    // WHEN: Inspecting visible text
    // THEN: The literal "404" number is visible to users
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  test('back link text should be in Spanish (case-insensitive match for "volver")', () => {
    // GIVEN: NotFoundView is rendered
    render(<NotFoundView />);

    // WHEN: Reading the back link's accessible text
    const link = screen.getByTestId('not-found-back-link');

    // THEN: Text contains a Spanish return phrase
    expect(link.textContent?.toLowerCase()).toMatch(/volver/);
  });

  test('should have an h1 element (document outline) inside the 404 view', () => {
    // GIVEN: NotFoundView is rendered (accessibility — heading hierarchy)
    render(<NotFoundView />);

    // WHEN: Querying for the heading element
    const heading = screen.getByRole('heading', { level: 1 });

    // THEN: An h1 exists inside the not-found view (screen reader navigation)
    expect(heading).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: NavItem link structure and target
// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation link targets — edge cases', () => {
  test('"Clientes" nav item link href should point to /clientes', async () => {
    // GIVEN: Desktop viewport with AppLayout rendered
    setViewportWidth(1280);
    await renderWithRouter(<AppLayout />);

    // WHEN: Inspecting the "Clientes" link href
    const link = screen.getByTestId('nav-item-clientes');

    // THEN: Link points to /clientes
    expect(link.getAttribute('href')).toBe('/clientes');
  });

  test('"Contactos" nav item link href should point to /contactos', async () => {
    // GIVEN: Desktop viewport with AppLayout rendered
    setViewportWidth(1280);
    await renderWithRouter(<AppLayout />);

    // WHEN: Inspecting the "Contactos" link href
    const link = screen.getByTestId('nav-item-contactos');

    // THEN: Link points to /contactos
    expect(link.getAttribute('href')).toBe('/contactos');
  });

  test('nav items should not open in a new tab (no target="_blank")', async () => {
    // GIVEN: Navigation items are internal SPA routes — should not open new tabs
    setViewportWidth(1280);
    await renderWithRouter(<AppLayout />);

    // WHEN: Inspecting link target attributes
    const clientes = screen.getByTestId('nav-item-clientes');
    const contactos = screen.getByTestId('nav-item-contactos');

    // THEN: Neither link has target="_blank"
    expect(clientes.getAttribute('target')).not.toBe('_blank');
    expect(contactos.getAttribute('target')).not.toBe('_blank');
  });

  test('mobile nav items should have the correct labels in Spanish', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(390);
    await renderWithRouter(<AppLayout />);

    // WHEN: Reading mobile nav item text content
    const clientes = screen.getByTestId('nav-item-clientes');
    const contactos = screen.getByTestId('nav-item-contactos');

    // THEN: Labels are in Spanish
    expect(clientes.textContent?.toLowerCase()).toContain('clientes');
    expect(contactos.textContent?.toLowerCase()).toContain('contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Default prop behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout default props — edge cases', () => {
  test('should render without exploding when no props are passed at all', async () => {
    // GIVEN: AppLayout receives no props (bare usage)
    setViewportWidth(1280);

    // WHEN: Component renders with no props
    await expect(renderWithRouter(<AppLayout />)).resolves.not.toThrow();
  });

  test('should render nav items even when children prop is undefined', async () => {
    // GIVEN: AppLayout used as pure shell wrapper with no children
    setViewportWidth(1280);
    await renderWithRouter(<AppLayout />);

    // THEN: Nav items are still present
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  test('should render children inside the main element when provided', async () => {
    // GIVEN: AppLayout wraps child content
    setViewportWidth(1280);
    await renderWithRouter(
      <AppLayout>
        <div data-testid="child-content">Contenido hijo</div>
      </AppLayout>
    );

    // THEN: Child content is present in the DOM
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Contenido hijo')).toBeInTheDocument();
  });
});
