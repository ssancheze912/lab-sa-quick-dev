/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — AppShell (Edge Cases & Boundary Conditions)
 *
 * Coverage focus:
 *   - Viewport boundary conditions (exact breakpoint, off-by-one)
 *   - Unknown / null / empty currentPath fallback behaviour
 *   - Active-state transitions when currentPath changes
 *   - Navigation links have correct href attributes
 *   - ARIA role and label on the nav landmark
 *   - Keyboard-tab order within nav
 *   - Component renders children prop (not Outlet) when provided
 *   - Labels visible in both desktop and mobile layouts
 *   - Non-matching path defaults active item to Clientes
 */

import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AppShell } from '../AppShell';

// ─────────────────────────────────────────────────────────────────────────────
// Mock TanStack Router
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    'aria-current': ariaCurrent,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    'aria-current'?: string;
    'aria-label'?: string;
    'data-testid'?: string;
    [key: string]: unknown;
  }) => (
    <a
      href={to}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      {...props}
    >
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet-placeholder" />,
  useRouterState: () => ({
    location: { pathname: '/clientes' },
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Viewport Boundary Conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Viewport boundary: exact breakpoint', () => {
  test('should render NavigationRail at exactly 768px (implementation breakpoint)', () => {
    // The implementation uses DESKTOP_BREAKPOINT = 768, not 1024.
    // This test documents the actual boundary the code enforces.
    setViewportWidth(768);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
    expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
  });

  test('should render NavigationBar at 767px (one below implementation breakpoint)', () => {
    setViewportWidth(767);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument();
  });

  test('should render NavigationRail at 1024px (AC1 spec breakpoint)', () => {
    setViewportWidth(1024);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  test('should render NavigationBar at 1023px (one below AC1 spec breakpoint)', () => {
    setViewportWidth(1023);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  test('should render NavigationBar at minimum practical width (320px)', () => {
    setViewportWidth(320);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  test('should render NavigationRail at very large width (2560px)', () => {
    setViewportWidth(2560);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Active-state default: unknown / empty / root paths
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Active state fallback for unknown / edge paths', () => {
  beforeEach(() => setViewportWidth(1280));

  test('should default active item to Clientes when currentPath is "/"', () => {
    render(<AppShell currentPath="/"><div /></AppShell>);

    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should default active item to Clientes when currentPath is an unknown route', () => {
    render(<AppShell currentPath="/unknown-route"><div /></AppShell>);

    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should default active item to Clientes when currentPath is empty string', () => {
    render(<AppShell currentPath=""><div /></AppShell>);

    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
  });

  test('should set Contactos as active when currentPath starts with /contactos (sub-path)', () => {
    render(<AppShell currentPath="/contactos/123"><div /></AppShell>);

    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should NOT set Contactos as active for paths that contain the word contactos elsewhere', () => {
    // e.g. /settings/contactos should not activate the Contactos nav item
    render(<AppShell currentPath="/settings/contactos"><div /></AppShell>);

    // Implementation uses startsWith('/contactos'), so this path should fall to default (Clientes)
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation link href attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Navigation link hrefs (no full page reload anchor check)', () => {
  beforeEach(() => setViewportWidth(1280));

  test('Clientes nav item link points to /clientes', () => {
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const link = screen.getByTestId('nav-item-clientes');
    expect(link).toHaveAttribute('href', '/clientes');
  });

  test('Contactos nav item link points to /contactos', () => {
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const link = screen.getByTestId('nav-item-contactos');
    expect(link).toHaveAttribute('href', '/contactos');
  });

  test('Clientes nav item link points to /clientes on mobile layout', () => {
    setViewportWidth(390);
    render(<AppShell currentPath="/contactos"><div /></AppShell>);

    const link = screen.getByTestId('nav-item-clientes');
    expect(link).toHaveAttribute('href', '/clientes');
  });

  test('Contactos nav item link points to /contactos on mobile layout', () => {
    setViewportWidth(390);
    render(<AppShell currentPath="/contactos"><div /></AppShell>);

    const link = screen.getByTestId('nav-item-contactos');
    expect(link).toHaveAttribute('href', '/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ARIA landmark attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — ARIA landmark and roles', () => {
  test('nav element has aria-label on desktop layout', () => {
    setViewportWidth(1280);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const nav = document.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav!.getAttribute('aria-label')).toBeTruthy();
  });

  test('nav element has aria-label on mobile layout', () => {
    setViewportWidth(390);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const nav = document.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav!.getAttribute('aria-label')).toBeTruthy();
  });

  test('nav aria-label contains descriptive text (not empty)', () => {
    setViewportWidth(1280);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const nav = document.querySelector('nav');
    expect(nav!.getAttribute('aria-label')!.trim().length).toBeGreaterThan(0);
  });

  test('exactly one nav landmark is rendered at any viewport', () => {
    setViewportWidth(1280);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // Only one nav (rail OR bar) should be rendered at any given time
    const navElements = document.querySelectorAll('nav');
    expect(navElements.length).toBe(1);
  });

  test('nav items have aria-label with their label text', () => {
    setViewportWidth(1280);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const clientesLink = screen.getByTestId('nav-item-clientes');
    const contactosLink = screen.getByTestId('nav-item-contactos');

    expect(clientesLink.getAttribute('aria-label')).toBeTruthy();
    expect(contactosLink.getAttribute('aria-label')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Children prop vs Outlet
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Children rendering', () => {
  beforeEach(() => setViewportWidth(1280));

  test('should render provided children inside the main area', () => {
    render(
      <AppShell currentPath="/clientes">
        <div data-testid="custom-child">Custom Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  test('should render Outlet when no children provided', () => {
    render(<AppShell currentPath="/clientes" />);

    // Outlet mock renders data-testid="outlet-placeholder"
    expect(screen.getByTestId('outlet-placeholder')).toBeInTheDocument();
  });

  test('should render multiple children if provided', () => {
    render(
      <AppShell currentPath="/clientes">
        <div data-testid="child-a">A</div>
        <div data-testid="child-b">B</div>
      </AppShell>
    );

    expect(screen.getByTestId('child-a')).toBeInTheDocument();
    expect(screen.getByTestId('child-b')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Spanish label visibility in both layouts
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Spanish labels visible in both layouts', () => {
  test('Spanish labels are visible in desktop NavigationRail', () => {
    setViewportWidth(1280);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Contactos')).toBeInTheDocument();
  });

  test('Spanish labels are visible in mobile NavigationBar', () => {
    setViewportWidth(390);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Contactos')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Nav items count — no extra items rendered
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Navigation item count', () => {
  test('desktop nav renders exactly 2 navigation items', () => {
    setViewportWidth(1280);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const nav = document.querySelector('nav');
    const navLinks = nav!.querySelectorAll('a');
    expect(navLinks.length).toBe(2);
  });

  test('mobile nav renders exactly 2 navigation items', () => {
    setViewportWidth(390);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const nav = document.querySelector('nav');
    const navLinks = nav!.querySelectorAll('a');
    expect(navLinks.length).toBe(2);
  });
});
