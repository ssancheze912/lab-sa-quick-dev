/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — RED Phase
 * These tests are intentionally FAILING until AppLayout implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail renders on desktop viewport (≥1024px)
 *   AC2 — NavigationBar renders on mobile viewport (<1024px)
 *   AC5 — Active nav item matches current route
 *   AC6 — Accessibility: aria-label, accessible names, tab navigation
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// AppLayout does not exist yet — these imports will fail (RED phase)
// Implementation must create: frontend/src/routes/_app.tsx
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — component not yet implemented (RED phase)
import { AppLayout } from '../_app';

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mock TanStack Router context for component tests.
 * Implementation must use @tanstack/react-router's test utilities.
 */
const mockUseRouterState = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useRouterState: () => mockUseRouterState(),
    Outlet: () => <div data-testid="outlet-placeholder" />,
    Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

/**
 * Mock siesa-ui-kit components that AppLayout depends on.
 * These will be replaced by real implementations.
 */
vi.mock('siesa-ui-kit', () => ({
  LayoutBase: ({ children, navigationItems }: {
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
  NavigationRail: ({ navigationItems }: {
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
  NavigationBar: ({ navigationItems }: {
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper: mock window.matchMedia for viewport simulation
// ─────────────────────────────────────────────────────────────────────────────

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('min-width: 1024px') ? matches : !matches,
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
// AC1 — NavigationRail renders on desktop viewport
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — NavigationRail on desktop viewport (≥1024px)', () => {
  beforeEach(() => {
    mockMatchMedia(true); // desktop = matches min-width: 1024px
    mockUseRouterState.mockReturnValue({
      location: { pathname: '/clientes' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render NavigationRail on desktop viewport', () => {
    // GIVEN: Desktop viewport is simulated (matchMedia matches 1024px)

    // WHEN: AppLayout is rendered
    render(<AppLayout />);

    // THEN: NavigationRail is present in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('should render "Clientes" nav item in NavigationRail', () => {
    // GIVEN: Desktop viewport
    render(<AppLayout />);

    // WHEN: Nav items are inspected
    // THEN: "Clientes" nav item is present
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should render "Contactos" nav item in NavigationRail', () => {
    // GIVEN: Desktop viewport
    render(<AppLayout />);

    // WHEN: Nav items are inspected
    // THEN: "Contactos" nav item is present
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  it('should NOT render NavigationBar on desktop viewport', () => {
    // GIVEN: Desktop viewport
    render(<AppLayout />);

    // WHEN: Layout is rendered
    // THEN: Mobile NavigationBar is not visible
    expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
  });

  it('clicking "Clientes" nav item calls router navigation to /clientes', async () => {
    // GIVEN: Desktop viewport; AppLayout is rendered
    const user = userEvent.setup();
    render(<AppLayout />);

    // WHEN: User clicks the "Clientes" nav item
    const clientesItem = screen.getByTestId('nav-item-clientes');
    await user.click(clientesItem);

    // THEN: The nav item href points to /clientes (TanStack Router Link)
    expect(clientesItem).toHaveAttribute('href', '/clientes');
  });

  it('clicking "Contactos" nav item calls router navigation to /contactos', async () => {
    // GIVEN: Desktop viewport; AppLayout is rendered
    const user = userEvent.setup();
    render(<AppLayout />);

    // WHEN: User clicks the "Contactos" nav item
    const contactosItem = screen.getByTestId('nav-item-contactos');
    await user.click(contactosItem);

    // THEN: The nav item href points to /contactos
    expect(contactosItem).toHaveAttribute('href', '/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — NavigationBar renders on mobile viewport
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — NavigationBar on mobile viewport (<1024px)', () => {
  beforeEach(() => {
    mockMatchMedia(false); // mobile = does NOT match min-width: 1024px
    mockUseRouterState.mockReturnValue({
      location: { pathname: '/clientes' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render NavigationBar on mobile viewport', () => {
    // GIVEN: Mobile viewport simulated (matchMedia does not match 1024px)

    // WHEN: AppLayout is rendered
    render(<AppLayout />);

    // THEN: NavigationBar is present
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('should NOT render NavigationRail on mobile viewport', () => {
    // GIVEN: Mobile viewport
    render(<AppLayout />);

    // WHEN: Layout is rendered
    // THEN: Desktop NavigationRail is not visible
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument();
  });

  it('should render "Clientes" item in NavigationBar on mobile', () => {
    // GIVEN: Mobile viewport
    render(<AppLayout />);

    // WHEN: Bottom nav is rendered
    // THEN: "Clientes" is accessible
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should render "Contactos" item in NavigationBar on mobile', () => {
    // GIVEN: Mobile viewport
    render(<AppLayout />);

    // WHEN: Bottom nav is rendered
    // THEN: "Contactos" is accessible
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Active state matches current route
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Active nav item matches current route', () => {
  beforeEach(() => {
    mockMatchMedia(true); // desktop
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('"Clientes" nav item should have aria-current="page" when on /clientes route', () => {
    // GIVEN: Router state shows current path is /clientes
    mockUseRouterState.mockReturnValue({
      location: { pathname: '/clientes' },
    });

    // WHEN: AppLayout is rendered
    render(<AppLayout />);

    // THEN: "Clientes" nav item has aria-current="page"
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
  });

  it('"Contactos" nav item should have aria-current="page" when on /contactos route', () => {
    // GIVEN: Router state shows current path is /contactos
    mockUseRouterState.mockReturnValue({
      location: { pathname: '/contactos' },
    });

    // WHEN: AppLayout is rendered
    render(<AppLayout />);

    // THEN: "Contactos" nav item has aria-current="page"
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page');
  });

  it('"Clientes" nav item should NOT have aria-current="page" when on /contactos', () => {
    // GIVEN: Router state shows current path is /contactos
    mockUseRouterState.mockReturnValue({
      location: { pathname: '/contactos' },
    });

    // WHEN: AppLayout is rendered
    render(<AppLayout />);

    // THEN: "Clientes" does not have active state
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Accessibility requirements
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Accessibility: aria-label, accessible names, keyboard nav', () => {
  beforeEach(() => {
    mockMatchMedia(true); // desktop
    mockUseRouterState.mockReturnValue({
      location: { pathname: '/clientes' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('navigation landmark should have aria-label="Navegación principal"', () => {
    // GIVEN: AppLayout is rendered with nav shell

    // WHEN: The component is rendered
    render(<AppLayout />);

    // THEN: <nav aria-label="Navegación principal"> is present
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav).toBeInTheDocument();
  });

  it('"Clientes" nav item should have accessible name "Clientes" in Spanish', () => {
    // GIVEN: Nav items must have accessible names (WCAG 2.1 AA 4.1.2)
    render(<AppLayout />);

    // WHEN: "Clientes" nav item is rendered
    const clientesItem = screen.getByTestId('nav-item-clientes');

    // THEN: Accessible name is "Clientes"
    expect(clientesItem).toHaveAccessibleName('Clientes');
  });

  it('"Contactos" nav item should have accessible name "Contactos" in Spanish', () => {
    // GIVEN: Nav items must have accessible names
    render(<AppLayout />);

    // WHEN: "Contactos" nav item is rendered
    const contactosItem = screen.getByTestId('nav-item-contactos');

    // THEN: Accessible name is "Contactos"
    expect(contactosItem).toHaveAccessibleName('Contactos');
  });

  it('nav items should be reachable by Tab key navigation', () => {
    // GIVEN: WCAG 2.1 AA 2.1.1 — all functionality must be keyboard accessible
    render(<AppLayout />);

    // WHEN: Tab focuses are applied
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');

    // THEN: Both items are focusable (tabIndex not -1, or are naturally focusable links/buttons)
    expect(clientesItem.tagName.toLowerCase()).toMatch(/^(a|button)$/);
    expect(contactosItem.tagName.toLowerCase()).toMatch(/^(a|button)$/);
  });

  it('nav items should NOT have negative tabIndex that prevents keyboard access', () => {
    // GIVEN: Nav items must be accessible via keyboard
    render(<AppLayout />);

    // WHEN: Nav items are rendered
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');

    // THEN: tabIndex is not -1 (would prevent keyboard navigation)
    expect(clientesItem).not.toHaveAttribute('tabindex', '-1');
    expect(contactosItem).not.toHaveAttribute('tabindex', '-1');
  });
});
