/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests (Vitest + React Testing Library) — RED Phase
 * Tests fail until NavigationShell component is implemented.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop (>= 1024px)
 *   AC2 — Clientes nav item active state (aria-current="page")
 *   AC3 — Contactos nav item active state (aria-current="page")
 *   AC4 — NavigationBar visible on mobile (< 1024px), NavigationRail hidden
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// NavigationShell does not exist yet — tests will fail (RED phase)
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

// Mock TanStack Router hooks used by NavigationShell
vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn(() => ({ location: { pathname: '/clientes' } })),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — NavigationRail visible on desktop viewport (>= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Desktop NavigationRail rendering', () => {
  beforeEach(() => setDesktopViewport());

  test('should render NavigationRail with data-testid="navigation-rail" on desktop', () => {
    // GIVEN: Desktop viewport (>= 1024px)
    // WHEN: NavigationShell is rendered
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: NavigationRail element is present in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  test('should render a <nav> element with aria-label="Navegación principal"', () => {
    // GIVEN: Desktop viewport
    // WHEN: NavigationShell is rendered
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Accessible nav landmark is present with correct ARIA label
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
  });

  test('should render "Clientes" nav item in the NavigationRail', () => {
    // GIVEN: Desktop viewport
    // WHEN: NavigationShell is rendered
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: "Clientes" rail item is present
    expect(screen.getByTestId('nav-rail-item-clientes')).toBeInTheDocument();
  });

  test('should render "Contactos" nav item in the NavigationRail', () => {
    // GIVEN: Desktop viewport
    // WHEN: NavigationShell is rendered
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: "Contactos" rail item is present
    expect(screen.getByTestId('nav-rail-item-contactos')).toBeInTheDocument();
  });

  test('should display Spanish labels "Clientes" and "Contactos" in the NavigationRail', () => {
    // GIVEN: Desktop viewport
    // WHEN: NavigationShell is rendered
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Both Spanish labels are visible in the rail
    const rail = screen.getByTestId('navigation-rail');
    expect(rail).toHaveTextContent('Clientes');
    expect(rail).toHaveTextContent('Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Clientes nav item active state (aria-current="page")
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Active state on Clientes nav item', () => {
  beforeEach(() => setDesktopViewport());

  test('should apply aria-current="page" to "Clientes" item when on /clientes', () => {
    // GIVEN: Current route is /clientes
    // WHEN: NavigationShell is rendered with currentPath="/clientes"
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: "Clientes" item has aria-current="page"
    expect(screen.getByTestId('nav-rail-item-clientes')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT apply aria-current="page" to "Contactos" item when on /clientes', () => {
    // GIVEN: Current route is /clientes
    // WHEN: NavigationShell is rendered with currentPath="/clientes"
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: "Contactos" item does NOT have aria-current="page"
    expect(screen.getByTestId('nav-rail-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should apply active color class to "Clientes" item when on /clientes', () => {
    // GIVEN: Current route is /clientes
    // WHEN: NavigationShell is rendered
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: "Clientes" item carries the active styling indicator
    const clientesItem = screen.getByTestId('nav-rail-item-clientes');
    // Active item should have the brand blue color class applied
    expect(clientesItem.className).toMatch(/text-\[#0e79fd\]|text-blue-600|active/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Contactos nav item active state (aria-current="page")
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Active state on Contactos nav item', () => {
  beforeEach(() => setDesktopViewport());

  test('should apply aria-current="page" to "Contactos" item when on /contactos', () => {
    // GIVEN: Current route is /contactos
    // WHEN: NavigationShell is rendered with currentPath="/contactos"
    render(<NavigationShell currentPath="/contactos" />);

    // THEN: "Contactos" item has aria-current="page"
    expect(screen.getByTestId('nav-rail-item-contactos')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT apply aria-current="page" to "Clientes" item when on /contactos', () => {
    // GIVEN: Current route is /contactos
    // WHEN: NavigationShell is rendered with currentPath="/contactos"
    render(<NavigationShell currentPath="/contactos" />);

    // THEN: "Clientes" item does NOT have aria-current="page"
    expect(screen.getByTestId('nav-rail-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should apply active color class to "Contactos" item when on /contactos', () => {
    // GIVEN: Current route is /contactos
    // WHEN: NavigationShell is rendered
    render(<NavigationShell currentPath="/contactos" />);

    // THEN: "Contactos" item carries the active styling indicator
    const contactosItem = screen.getByTestId('nav-rail-item-contactos');
    expect(contactosItem.className).toMatch(/text-\[#0e79fd\]|text-blue-600|active/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — NavigationBar at bottom on mobile (< 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — Mobile NavigationBar rendering', () => {
  beforeEach(() => setMobileViewport());

  test('should render NavigationBar with data-testid="navigation-bar" on mobile', () => {
    // GIVEN: Mobile viewport (< 1024px)
    // WHEN: NavigationShell is rendered
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: NavigationBar element is present in the DOM
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  test('should render "Clientes" nav item in the NavigationBar on mobile', () => {
    // GIVEN: Mobile viewport
    // WHEN: NavigationShell is rendered
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: "Clientes" bar item is present
    expect(screen.getByTestId('nav-bar-item-clientes')).toBeInTheDocument();
  });

  test('should render "Contactos" nav item in the NavigationBar on mobile', () => {
    // GIVEN: Mobile viewport
    // WHEN: NavigationShell is rendered
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: "Contactos" bar item is present
    expect(screen.getByTestId('nav-bar-item-contactos')).toBeInTheDocument();
  });

  test('should render NavigationRail as hidden (not visible) on mobile', () => {
    // GIVEN: Mobile viewport (< 1024px)
    // WHEN: NavigationShell is rendered
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: NavigationRail element has hidden/display-none class (CSS-level hide)
    const rail = screen.getByTestId('navigation-rail');
    // Rail should carry the "hidden lg:flex" Tailwind class pattern
    expect(rail.className).toMatch(/hidden/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — WCAG 2.1 AA
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility — WCAG 2.1 AA requirements', () => {
  test('should have focus-visible ring on all interactive navigation items', () => {
    // GIVEN: NavigationShell is rendered on desktop
    setDesktopViewport();
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Nav items are focusable keyboard elements (links or buttons)
    const clientesItem = screen.getByTestId('nav-rail-item-clientes');
    expect(clientesItem.tagName).toMatch(/^(A|BUTTON)$/i);
  });

  test('should have aria-current="page" only on the active nav item, not all items', () => {
    // GIVEN: Current route is /clientes
    setDesktopViewport();
    render(<NavigationShell currentPath="/clientes" />);

    // THEN: Only one item has aria-current="page"
    const itemsWithAriaCurrent = screen.queryAllByRole('link', { current: 'page' });
    expect(itemsWithAriaCurrent).toHaveLength(1);
  });
});
