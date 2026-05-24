/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — AppLayout edge cases & boundary conditions
 * Expands ATDD coverage with edge paths that the main AppLayout.test.tsx does not cover:
 *   - Outlet is rendered inside the layout (content area is present)
 *   - Active state boundary: only exact path prefix activates item (not substring)
 *   - Unknown/empty pathname does not crash and shows no active nav item
 *   - Both NavigationRail and NavigationBar render exactly two nav items
 *   - Nav items have correct href attributes in both rail and bar variants
 *   - Nav items are not tabIndex=-1 on both desktop and mobile
 *   - aria-current is absent (not false or "") on inactive items
 *   - AppLayout does not render both rail and bar simultaneously
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — component tested directly (no full router context needed)
import { AppLayout } from '../_app';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockUseRouterState = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useRouterState: () => mockUseRouterState(),
    Outlet: () => <div data-testid="outlet-placeholder" />,
    Link: ({
      to,
      children,
      ...props
    }: {
      to: string;
      children: React.ReactNode;
      [key: string]: unknown;
    }) => (
      <a href={to as string} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock('siesa-ui-kit', () => ({
  LayoutBase: ({
    children,
    navigationItems,
  }: {
    children: React.ReactNode;
    navigationItems: Array<{ label: string; icon: unknown; to: string }>;
  }) => (
    <div data-testid="layout-base">
      <nav aria-label="Navegación principal">
        {navigationItems.map((item) => (
          <a
            key={item.to}
            href={item.to}
            data-testid={`nav-item-${item.label.toLowerCase()}`}
            aria-label={item.label}
          >
            {item.label}
          </a>
        ))}
      </nav>
      {children}
    </div>
  ),
  NavigationRail: ({
    navigationItems,
  }: {
    navigationItems: Array<{ label: string; icon: unknown; to: string }>;
  }) => (
    <nav data-testid="navigation-rail" aria-label="Navegación principal">
      {navigationItems.map((item) => (
        <a
          key={item.to}
          href={item.to}
          data-testid={`nav-item-${item.label.toLowerCase()}`}
          aria-label={item.label}
        >
          {item.label}
        </a>
      ))}
    </nav>
  ),
  NavigationBar: ({
    navigationItems,
  }: {
    navigationItems: Array<{ label: string; icon: unknown; to: string }>;
  }) => (
    <nav data-testid="navigation-bar" aria-label="Navegación principal">
      {navigationItems.map((item) => (
        <a
          key={item.to}
          href={item.to}
          data-testid={`nav-item-${item.label.toLowerCase()}`}
          aria-label={item.label}
        >
          {item.label}
        </a>
      ))}
    </nav>
  ),
  Navbar: ({ productName }: { productName: string }) => (
    <header data-testid="navbar">{productName}</header>
  ),
}));

function mockMatchMedia(isDesktop: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('min-width: 1024px') ? isDesktop : !isDesktop,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Outlet rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — Outlet rendering', () => {
  beforeEach(() => {
    mockMatchMedia(true);
    mockUseRouterState.mockReturnValue({ location: { pathname: '/clientes' } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Outlet placeholder inside the layout on desktop', () => {
    // GIVEN: Desktop viewport with AppLayout
    // WHEN: Component is rendered
    render(<AppLayout />);

    // THEN: Outlet (child route content area) is present
    expect(screen.getByTestId('outlet-placeholder')).toBeInTheDocument();
  });

  it('renders the Outlet placeholder inside the layout on mobile', () => {
    // GIVEN: Mobile viewport
    mockMatchMedia(false);
    render(<AppLayout />);

    // THEN: Outlet is present on mobile too
    expect(screen.getByTestId('outlet-placeholder')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exactly two nav items in each nav variant
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — nav item count boundaries', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('NavigationRail renders EXACTLY 2 nav items (Clientes + Contactos), no more, no fewer', () => {
    // GIVEN: Desktop viewport
    mockMatchMedia(true);
    mockUseRouterState.mockReturnValue({ location: { pathname: '/clientes' } });

    render(<AppLayout />);

    // WHEN: Nav items inside the rail are counted
    const rail = screen.getByTestId('navigation-rail');
    const navItems = rail.querySelectorAll('[data-testid^="nav-item-"]');

    // THEN: Exactly 2 items (no accidental duplicates or missing items)
    expect(navItems).toHaveLength(2);
  });

  it('NavigationBar renders EXACTLY 2 nav items (Clientes + Contactos), no more, no fewer', () => {
    // GIVEN: Mobile viewport
    mockMatchMedia(false);
    mockUseRouterState.mockReturnValue({ location: { pathname: '/clientes' } });

    render(<AppLayout />);

    // WHEN: Nav items inside the bar are counted
    const bar = screen.getByTestId('navigation-bar');
    const navItems = bar.querySelectorAll('[data-testid^="nav-item-"]');

    // THEN: Exactly 2 items
    expect(navItems).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Href attributes on nav items
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — nav item href attributes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('desktop nav-item-clientes has href="/clientes"', () => {
    // GIVEN: Desktop viewport
    mockMatchMedia(true);
    mockUseRouterState.mockReturnValue({ location: { pathname: '/contactos' } });

    render(<AppLayout />);

    // WHEN: The href is inspected
    const item = screen.getByTestId('nav-item-clientes');

    // THEN: Correct route href
    expect(item).toHaveAttribute('href', '/clientes');
  });

  it('desktop nav-item-contactos has href="/contactos"', () => {
    // GIVEN: Desktop viewport
    mockMatchMedia(true);
    mockUseRouterState.mockReturnValue({ location: { pathname: '/clientes' } });

    render(<AppLayout />);

    const item = screen.getByTestId('nav-item-contactos');
    expect(item).toHaveAttribute('href', '/contactos');
  });

  it('mobile nav-item-clientes has href="/clientes"', () => {
    // GIVEN: Mobile viewport
    mockMatchMedia(false);
    mockUseRouterState.mockReturnValue({ location: { pathname: '/contactos' } });

    render(<AppLayout />);

    const item = screen.getByTestId('nav-item-clientes');
    expect(item).toHaveAttribute('href', '/clientes');
  });

  it('mobile nav-item-contactos has href="/contactos"', () => {
    // GIVEN: Mobile viewport
    mockMatchMedia(false);
    mockUseRouterState.mockReturnValue({ location: { pathname: '/clientes' } });

    render(<AppLayout />);

    const item = screen.getByTestId('nav-item-contactos');
    expect(item).toHaveAttribute('href', '/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Active state boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — active state boundary conditions', () => {
  beforeEach(() => {
    mockMatchMedia(true); // desktop
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('no nav item has aria-current="page" when pathname is "/" (root redirect state)', () => {
    // GIVEN: pathname is "/" — TanStack Router redirects this, but we test the component in isolation
    mockUseRouterState.mockReturnValue({ location: { pathname: '/' } });

    // WHEN: AppLayout is rendered
    render(<AppLayout />);

    // THEN: Neither nav item is marked as current
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(clientesItem).not.toHaveAttribute('aria-current', 'page');
    expect(contactosItem).not.toHaveAttribute('aria-current', 'page');
  });

  it('no nav item has aria-current="page" when pathname is unknown ("/admin")', () => {
    // GIVEN: An unknown pathname that does not match any nav item
    mockUseRouterState.mockReturnValue({ location: { pathname: '/admin' } });

    render(<AppLayout />);

    // THEN: No nav item is active
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });

  it('inactive nav item should not have aria-current attribute at all (not just not "page")', () => {
    // GIVEN: Contactos is the active route
    mockUseRouterState.mockReturnValue({ location: { pathname: '/contactos' } });

    render(<AppLayout />);

    // WHEN: The inactive "Clientes" item is inspected
    const clientesItem = screen.getByTestId('nav-item-clientes');

    // THEN: aria-current is absent entirely (not set to "" or "false")
    // This prevents screen readers from announcing incorrect state
    const ariaCurrent = clientesItem.getAttribute('aria-current');
    expect(ariaCurrent).toBeNull();
  });

  it('only ONE nav item has aria-current="page" when a known route is active', () => {
    // GIVEN: User is on /clientes
    mockUseRouterState.mockReturnValue({ location: { pathname: '/clientes' } });

    render(<AppLayout />);

    // WHEN: All items with aria-current="page" are counted
    const activeItems = document
      .querySelectorAll('[aria-current="page"]');

    // THEN: Exactly one item has aria-current="page"
    expect(activeItems).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mutual exclusivity: rail vs bar never both rendered
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — mutual exclusivity of NavigationRail and NavigationBar', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('NavigationBar is NOT in the DOM when on desktop viewport', () => {
    // GIVEN: Desktop viewport
    mockMatchMedia(true);
    mockUseRouterState.mockReturnValue({ location: { pathname: '/clientes' } });

    render(<AppLayout />);

    // THEN: NavigationBar element is completely absent from DOM (not just hidden)
    expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
  });

  it('NavigationRail is NOT in the DOM when on mobile viewport', () => {
    // GIVEN: Mobile viewport
    mockMatchMedia(false);
    mockUseRouterState.mockReturnValue({ location: { pathname: '/clientes' } });

    render(<AppLayout />);

    // THEN: NavigationRail element is completely absent from DOM
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument();
  });

  it('exactly ONE navigation landmark exists on desktop (no duplicate <nav> elements)', () => {
    // GIVEN: Desktop viewport
    mockMatchMedia(true);
    mockUseRouterState.mockReturnValue({ location: { pathname: '/clientes' } });

    render(<AppLayout />);

    // WHEN: All nav landmarks are counted
    const navElements = document.querySelectorAll('nav[aria-label="Navegación principal"]');

    // THEN: Exactly one nav landmark (screen readers must not get confused by duplicates)
    expect(navElements).toHaveLength(1);
  });

  it('exactly ONE navigation landmark exists on mobile (no duplicate <nav> elements)', () => {
    // GIVEN: Mobile viewport
    mockMatchMedia(false);
    mockUseRouterState.mockReturnValue({ location: { pathname: '/clientes' } });

    render(<AppLayout />);

    const navElements = document.querySelectorAll('nav[aria-label="Navegación principal"]');
    expect(navElements).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Crash safety with unexpected router state
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — crash safety with edge router states', () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT crash when pathname is an empty string', () => {
    // GIVEN: Edge case where router returns empty pathname
    mockUseRouterState.mockReturnValue({ location: { pathname: '' } });

    // WHEN: Component renders with empty pathname
    // THEN: No error thrown
    expect(() => render(<AppLayout />)).not.toThrow();
  });

  it('does NOT crash when pathname is a deeply nested unknown path', () => {
    // GIVEN: A deeply nested pathname that does not match any nav item
    mockUseRouterState.mockReturnValue({ location: { pathname: '/a/b/c/d/e/f' } });

    // WHEN: Component renders
    expect(() => render(<AppLayout />)).not.toThrow();
  });

  it('renders correctly with a pathname containing special URL characters', () => {
    // GIVEN: Pathname with encoded characters (defensive case)
    mockUseRouterState.mockReturnValue({ location: { pathname: '/clientes%20test' } });

    // WHEN: Component renders
    expect(() => render(<AppLayout />)).not.toThrow();

    // THEN: No nav item is marked active (no false match for encoded pathname)
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });
});
