/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — AppShell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible on viewport >= 1024px
 *   AC2 — Mobile NavigationBar visible on viewport < 1024px
 *   AC8 — WCAG 2.1 AA: <nav> landmark, aria-current="page" on active item, keyboard accessible
 *
 * NOTE: AppShell does not exist yet — all tests will fail with module import errors (RED phase).
 */

import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppShell } from '../AppShell';

// ─────────────────────────────────────────────────────────────────────────────
// Test utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mock the viewport width to simulate desktop or mobile device.
 * TanStack Router's <Link> component requires a router context.
 * We use a simplified wrapper that bypasses router context for unit tests.
 */
function mockViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

// Mock TanStack Router hooks used by AppShell for active route detection
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, 'aria-current': ariaCurrent, ...props }: {
    to: string;
    children: React.ReactNode;
    'aria-current'?: string;
    [key: string]: unknown;
  }) => (
    <a href={to} aria-current={ariaCurrent} {...props}>
      {children}
    </a>
  ),
  useRouterState: () => ({
    location: { pathname: '/clientes' },
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport >= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — AC1: Desktop NavigationRail on wide viewport', () => {
  beforeEach(() => {
    mockViewportWidth(1280);
  });

  afterEach(() => {
    mockViewportWidth(1280); // reset
  });

  test('should render NavigationRail when viewport is 1280px wide', () => {
    // GIVEN: AppShell is rendered at desktop viewport (>= 1024px)
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // THEN: NavigationRail element is in the document
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  test('should display "Clientes" navigation entry in NavigationRail on desktop', () => {
    // GIVEN: AppShell is rendered at desktop viewport
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // THEN: nav item for Clientes is present
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  test('should display "Contactos" navigation entry in NavigationRail on desktop', () => {
    // GIVEN: AppShell is rendered at desktop viewport
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // THEN: nav item for Contactos is present
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  test('should visually highlight the active Clientes entry with aria-current="page" when at /clientes', () => {
    // GIVEN: AppShell rendered with currentPath "/clientes"
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // THEN: Clientes nav item carries aria-current="page"
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT set aria-current="page" on the inactive Contactos entry when at /clientes', () => {
    // GIVEN: AppShell rendered with currentPath "/clientes"
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // THEN: Contactos nav item does NOT carry aria-current="page"
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — AC2: Mobile NavigationBar on narrow viewport', () => {
  beforeEach(() => {
    mockViewportWidth(390); // iPhone 14
  });

  afterEach(() => {
    mockViewportWidth(1280); // reset to desktop
  });

  test('should render NavigationBar when viewport is 390px wide', () => {
    // GIVEN: AppShell is rendered at mobile viewport (< 1024px)
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // THEN: NavigationBar element is in the document
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  test('should display "Clientes" navigation entry accessible in NavigationBar on mobile', () => {
    // GIVEN: AppShell rendered at mobile viewport
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // THEN: Clientes nav item is present in the document
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  test('should display "Contactos" navigation entry accessible in NavigationBar on mobile', () => {
    // GIVEN: AppShell rendered at mobile viewport
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // THEN: Contactos nav item is present in the document
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — WCAG 2.1 AA Accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — AC8: WCAG 2.1 AA accessibility compliance', () => {
  test('should render a <nav> landmark wrapping the navigation component', () => {
    // GIVEN: AppShell is rendered
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // THEN: A <nav> element is present as WCAG landmark
    const navElement = document.querySelector('nav');
    expect(navElement).toBeInTheDocument();
  });

  test('should have at least two focusable interactive elements within nav (Clientes and Contactos)', () => {
    // GIVEN: AppShell is rendered at desktop viewport
    mockViewportWidth(1280);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // THEN: Both nav items are interactive (anchor or button elements)
    const navElement = document.querySelector('nav');
    expect(navElement).not.toBeNull();
    const interactiveElements = navElement!.querySelectorAll('a, button');
    expect(interactiveElements.length).toBeGreaterThanOrEqual(2);
  });

  test('should set aria-current="page" on Contactos nav item when currentPath is /contactos', () => {
    // GIVEN: AppShell rendered with currentPath "/contactos"
    render(<AppShell currentPath="/contactos"><div /></AppShell>);

    // THEN: Contactos nav item carries aria-current="page"
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT set aria-current on Clientes nav item when currentPath is /contactos', () => {
    // GIVEN: AppShell rendered with currentPath "/contactos"
    render(<AppShell currentPath="/contactos"><div /></AppShell>);

    // THEN: Clientes nav item does NOT carry aria-current="page"
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should render all navigation item labels in Spanish', () => {
    // GIVEN: AppShell is rendered
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    // THEN: Spanish labels "Clientes" and "Contactos" are visible in the nav
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Contactos')).toBeInTheDocument();
  });
});
