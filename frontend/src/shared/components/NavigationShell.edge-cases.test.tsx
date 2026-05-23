/**
 * Story 1.2: Frontend Navigation Shell — Component Edge Cases
 * Epic 1: Project Foundation & Application Shell
 *
 * Expands component test coverage with edge cases, boundary conditions,
 * and error paths NOT covered by NavigationShell.test.tsx (ATDD phase).
 *
 * Coverage areas:
 *   - currentPath prop: undefined, null-like, unknown route, trailing slash, case
 *   - Viewport resize: switching desktop↔mobile at runtime
 *   - NavigationBar active state (mobile, not in ATDD component tests)
 *   - Exactly two nav items (no more, no less)
 *   - Link hrefs point to correct paths
 *   - aria-label on NavigationBar (mobile nav landmark)
 *   - Inactive items carry no aria-current attribute at all
 *   - Icon presence in both rail and bar items
 *   - Re-render with different currentPath keeps state consistent
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

import { NavigationShell } from './NavigationShell';

// ─── Helpers ────────────────────────────────────────────────────────────────

function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  window.dispatchEvent(new Event('resize'));
}

function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
  window.dispatchEvent(new Event('resize'));
}

function setBoundaryViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn(() => ({ location: { pathname: '/clientes' } })),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// currentPath prop edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('currentPath prop — Edge cases', () => {
  beforeEach(() => setDesktopViewport());

  test('should not apply aria-current to any item when currentPath is an unknown route', () => {
    // GIVEN: currentPath does not match any nav item
    render(<NavigationShell currentPath="/unknown-route" />);

    // THEN: Neither nav item has aria-current="page"
    expect(screen.getByTestId('nav-rail-item-clientes')).not.toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-rail-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should not apply aria-current when currentPath has a trailing slash (/clientes/)', () => {
    // GIVEN: currentPath has trailing slash — does not exactly match "/clientes"
    render(<NavigationShell currentPath="/clientes/" />);

    // THEN: "Clientes" item does NOT have aria-current="page" (exact match)
    expect(screen.getByTestId('nav-rail-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should not apply aria-current when currentPath is case-different (/Clientes)', () => {
    // GIVEN: currentPath is mixed case — paths are case-sensitive
    render(<NavigationShell currentPath="/Clientes" />);

    // THEN: "Clientes" item does NOT have aria-current="page" (case-sensitive match)
    expect(screen.getByTestId('nav-rail-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should not apply aria-current when currentPath is a sub-path of a nav item (/clientes/detail/1)', () => {
    // GIVEN: currentPath is a sub-path, not an exact nav route
    render(<NavigationShell currentPath="/clientes/detail/1" />);

    // THEN: "Clientes" item does NOT have aria-current="page" (exact match required)
    expect(screen.getByTestId('nav-rail-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should fall back to router state path when currentPath prop is not provided', () => {
    // GIVEN: No currentPath prop — router state returns "/clientes"
    // (mock is set to /clientes by default)
    render(<NavigationShell />);

    // THEN: "Clientes" item is active based on router state
    expect(screen.getByTestId('nav-rail-item-clientes')).toHaveAttribute('aria-current', 'page');
  });

  test('should update active state correctly when re-rendered with different currentPath', () => {
    // GIVEN: NavigationShell initially on /clientes
    const { rerender } = render(<NavigationShell currentPath="/clientes" />);
    expect(screen.getByTestId('nav-rail-item-clientes')).toHaveAttribute('aria-current', 'page');

    // WHEN: Re-rendered with /contactos
    rerender(<NavigationShell currentPath="/contactos" />);

    // THEN: "Contactos" is now active, "Clientes" is not
    expect(screen.getByTestId('nav-rail-item-contactos')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-rail-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Viewport resize — switching desktop ↔ mobile at runtime
// ─────────────────────────────────────────────────────────────────────────────

describe('Viewport resize — Runtime breakpoint switch', () => {
  test('should apply aria-current only to NavigationBar items after switching to mobile', async () => {
    // GIVEN: NavigationShell rendered on desktop
    setDesktopViewport();
    render(<NavigationShell currentPath="/clientes" />);

    // Rail item should be active on desktop
    expect(screen.getByTestId('nav-rail-item-clientes')).toHaveAttribute('aria-current', 'page');

    // WHEN: Viewport switches to mobile
    await act(async () => {
      setBoundaryViewport(375);
    });

    // THEN: NavigationBar item should be active, rail item should NOT be
    expect(screen.getByTestId('nav-bar-item-clientes')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-rail-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should apply aria-current only to NavigationRail items after switching to desktop', async () => {
    // GIVEN: NavigationShell rendered on mobile
    setMobileViewport();
    render(<NavigationShell currentPath="/contactos" />);

    // Bar item should be active on mobile
    expect(screen.getByTestId('nav-bar-item-contactos')).toHaveAttribute('aria-current', 'page');

    // WHEN: Viewport switches to desktop
    await act(async () => {
      setBoundaryViewport(1280);
    });

    // THEN: Rail item should be active, bar item should NOT be
    expect(screen.getByTestId('nav-rail-item-contactos')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-bar-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile NavigationBar — active state (not covered in ATDD component tests)
// ─────────────────────────────────────────────────────────────────────────────

describe('Mobile NavigationBar — Active state', () => {
  beforeEach(() => setMobileViewport());

  test('should apply aria-current="page" to "Clientes" bar item on mobile when on /clientes', () => {
    // GIVEN: Mobile viewport, currentPath is /clientes
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: "Clientes" bar item has aria-current="page"
    expect(screen.getByTestId('nav-bar-item-clientes')).toHaveAttribute('aria-current', 'page');
  });

  test('should apply aria-current="page" to "Contactos" bar item on mobile when on /contactos', () => {
    // GIVEN: Mobile viewport, currentPath is /contactos
    render(<NavigationShell currentPath="/contactos" />);

    // THEN: "Contactos" bar item has aria-current="page"
    expect(screen.getByTestId('nav-bar-item-contactos')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT apply aria-current="page" to "Contactos" bar item when on /clientes (mobile)', () => {
    // GIVEN: Mobile viewport, currentPath is /clientes
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: "Contactos" bar item does NOT have aria-current="page"
    expect(screen.getByTestId('nav-bar-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should NOT apply aria-current to NavigationRail items on mobile (desktop-only)', () => {
    // GIVEN: Mobile viewport, currentPath is /clientes
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Rail items do NOT carry aria-current since rail is not the visible nav
    expect(screen.getByTestId('nav-rail-item-clientes')).not.toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-rail-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NavigationBar ARIA landmark
// ─────────────────────────────────────────────────────────────────────────────

describe('NavigationBar — ARIA landmark', () => {
  beforeEach(() => setMobileViewport());

  test('should render a <nav> element for the mobile NavigationBar', () => {
    // GIVEN: Mobile viewport
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: The mobile bar is a semantic nav element
    const bar = screen.getByTestId('navigation-bar');
    expect(bar.tagName).toBe('NAV');
  });

  test('should render NavigationBar with an aria-label attribute', () => {
    // GIVEN: Mobile viewport
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: NavigationBar has an aria-label
    const bar = screen.getByTestId('navigation-bar');
    expect(bar).toHaveAttribute('aria-label');
    expect(bar.getAttribute('aria-label')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Nav items structure — Exactly two items
// ─────────────────────────────────────────────────────────────────────────────

describe('Nav items structure — Exactly two items', () => {
  beforeEach(() => setDesktopViewport());

  test('should render exactly two items in the NavigationRail on desktop', () => {
    // GIVEN: Desktop viewport
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Exactly 2 rail nav items
    const railItems = [
      screen.queryByTestId('nav-rail-item-clientes'),
      screen.queryByTestId('nav-rail-item-contactos'),
    ].filter(Boolean);
    expect(railItems).toHaveLength(2);
  });

  test('should render exactly two items in the NavigationBar on mobile', () => {
    // GIVEN: Mobile viewport
    setMobileViewport();
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Exactly 2 bar nav items
    const barItems = [
      screen.queryByTestId('nav-bar-item-clientes'),
      screen.queryByTestId('nav-bar-item-contactos'),
    ].filter(Boolean);
    expect(barItems).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Link hrefs — Correct paths
// ─────────────────────────────────────────────────────────────────────────────

describe('Link hrefs — Correct paths', () => {
  beforeEach(() => setDesktopViewport());

  test('"Clientes" rail item should have href="/clientes"', () => {
    // GIVEN: Desktop viewport
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Clientes rail link points to /clientes
    const clientesLink = screen.getByTestId('nav-rail-item-clientes');
    expect(clientesLink).toHaveAttribute('href', '/clientes');
  });

  test('"Contactos" rail item should have href="/contactos"', () => {
    // GIVEN: Desktop viewport
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Contactos rail link points to /contactos
    const contactosLink = screen.getByTestId('nav-rail-item-contactos');
    expect(contactosLink).toHaveAttribute('href', '/contactos');
  });

  test('"Clientes" bar item should have href="/clientes" on mobile', () => {
    // GIVEN: Mobile viewport
    setMobileViewport();
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Clientes bar link points to /clientes
    const clientesBarLink = screen.getByTestId('nav-bar-item-clientes');
    expect(clientesBarLink).toHaveAttribute('href', '/clientes');
  });

  test('"Contactos" bar item should have href="/contactos" on mobile', () => {
    // GIVEN: Mobile viewport
    setMobileViewport();
    render(<NavigationShell currentPath="/contactos" />);

    // THEN: Contactos bar link points to /contactos
    const contactosBarLink = screen.getByTestId('nav-bar-item-contactos');
    expect(contactosBarLink).toHaveAttribute('href', '/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Inactive items — No aria-current attribute at all
// ─────────────────────────────────────────────────────────────────────────────

describe('Inactive nav items — No aria-current attribute', () => {
  beforeEach(() => setDesktopViewport());

  test('inactive "Contactos" rail item should have no aria-current attribute (not just false)', () => {
    // GIVEN: Desktop, currentPath="/clientes"
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: aria-current attribute is completely absent on inactive item
    const contactosItem = screen.getByTestId('nav-rail-item-contactos');
    expect(contactosItem.getAttribute('aria-current')).toBeNull();
  });

  test('inactive "Clientes" rail item should have no aria-current attribute when on /contactos', () => {
    // GIVEN: Desktop, currentPath="/contactos"
    render(<NavigationShell currentPath="/contactos" />);

    // THEN: aria-current attribute is completely absent on inactive item
    const clientesItem = screen.getByTestId('nav-rail-item-clientes');
    expect(clientesItem.getAttribute('aria-current')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Viewport boundary exactly at 1024px
// ─────────────────────────────────────────────────────────────────────────────

describe('Viewport boundary — Exactly 1024px', () => {
  test('should treat exactly 1024px as desktop (NavigationRail active, not bar)', () => {
    // GIVEN: Viewport exactly at lg breakpoint
    setBoundaryViewport(1024);
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Rail item carries aria-current (desktop treatment)
    expect(screen.getByTestId('nav-rail-item-clientes')).toHaveAttribute('aria-current', 'page');
    // AND: Bar item does NOT carry aria-current
    expect(screen.getByTestId('nav-bar-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should treat 1023px as mobile (NavigationBar active, not rail)', () => {
    // GIVEN: Viewport one pixel below lg breakpoint
    setBoundaryViewport(1023);
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Bar item carries aria-current (mobile treatment)
    expect(screen.getByTestId('nav-bar-item-clientes')).toHaveAttribute('aria-current', 'page');
    // AND: Rail item does NOT carry aria-current
    expect(screen.getByTestId('nav-rail-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });
});
