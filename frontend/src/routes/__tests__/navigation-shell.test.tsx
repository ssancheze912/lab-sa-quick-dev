/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1  — Desktop: NavigationRail + Navbar visible at ≥1024px
 *   AC2  — Clicking "Clientes" navigates to /clientes with active state
 *   AC3  — Clicking "Contactos" navigates to /contactos with active state
 *   AC4  — Mobile (<1024px): NavigationBar visible, NavigationRail hidden
 *   AC5  — Direct URL /clientes renders Clientes view with active nav
 *   AC6  — Direct URL /contactos renders Contactos view with active nav
 *   AC7  — Unknown route /foo shows 404 view in Spanish with link to /clientes
 *   AC8  — Root / redirects to /clientes
 *   AC9  — Accessibility: aria-label in Spanish, role=navigation, axe violations = 0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mock window.matchMedia for responsive viewport tests.
 * Simulates a desktop (≥1024px) or mobile (<1024px) viewport.
 */
function mockDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  window.dispatchEvent(new Event('resize'));
}

function mockMobileViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
  window.dispatchEvent(new Event('resize'));
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop navigation shell: NavigationRail + Navbar visible at ≥1024px
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Desktop navigation shell (≥1024px)', () => {
  beforeEach(() => {
    mockDesktopViewport();
  });

  it('should render a Navbar with productName "Siesa Agents" on desktop', async () => {
    // GIVEN: The AppShell is rendered at desktop viewport (≥1024px)
    // Components imported from siesa-ui-kit are not yet available — RED phase
    const { AppShell } = await import('../__root');

    // WHEN: The component is rendered
    render(<AppShell />);

    // THEN: A Navbar with "Siesa Agents" is visible at the top
    const navbar = screen.getByTestId('navbar');
    expect(navbar).toBeInTheDocument();
    expect(navbar).toHaveTextContent('Siesa Agents');
  });

  it('should render a NavigationRail on the left side at ≥1024px', async () => {
    // GIVEN: The AppShell is rendered at desktop viewport (≥1024px)
    const { AppShell } = await import('../__root');

    // WHEN: The component is rendered
    render(<AppShell />);

    // THEN: The NavigationRail is visible on the left
    const navigationRail = screen.getByTestId('navigation-rail');
    expect(navigationRail).toBeVisible();
  });

  it('should show "Clientes" entry inside the NavigationRail on desktop', async () => {
    // GIVEN: The AppShell is rendered at desktop viewport
    const { AppShell } = await import('../__root');

    // WHEN: The NavigationRail is rendered
    render(<AppShell />);

    // THEN: A "Clientes" nav item is present inside the NavigationRail
    const rail = screen.getByTestId('navigation-rail');
    const clientesItem = rail.querySelector('[data-testid="nav-item-clientes"]');
    expect(clientesItem).toBeInTheDocument();
  });

  it('should show "Contactos" entry inside the NavigationRail on desktop', async () => {
    // GIVEN: The AppShell is rendered at desktop viewport
    const { AppShell } = await import('../__root');

    // WHEN: The NavigationRail is rendered
    render(<AppShell />);

    // THEN: A "Contactos" nav item is present inside the NavigationRail
    const rail = screen.getByTestId('navigation-rail');
    const contactosItem = rail.querySelector('[data-testid="nav-item-contactos"]');
    expect(contactosItem).toBeInTheDocument();
  });

  it('should NOT render the mobile NavigationBar on desktop viewport', async () => {
    // GIVEN: The AppShell is rendered at desktop viewport (≥1024px)
    const { AppShell } = await import('../__root');

    // WHEN: The component is rendered
    render(<AppShell />);

    // THEN: The mobile NavigationBar is not visible (CSS hidden class applied)
    const navigationBar = screen.queryByTestId('navigation-bar');
    if (navigationBar) {
      // Element may be in DOM but hidden via CSS (lg: hidden)
      expect(navigationBar).not.toBeVisible();
    } else {
      // Element should not be in DOM at all on desktop
      expect(navigationBar).toBeNull();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Desktop: active state for Clientes nav item on /clientes route
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Clientes nav item active state', () => {
  beforeEach(() => {
    mockDesktopViewport();
  });

  it('should mark the Clientes nav item as active when on /clientes route', async () => {
    // GIVEN: The router is set to /clientes
    // TanStack Router createMemoryHistory is used to simulate the route
    const { createMemoryHistory, createRouter } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/clientes'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: The RouterProvider renders the shell at /clientes
    const { RouterProvider } = await import('@tanstack/react-router');
    render(<RouterProvider router={router} />);
    await waitFor(() => screen.getByTestId('clientes-view'));

    // THEN: The Clientes nav item has aria-current="page" (active state)
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).toHaveAttribute('aria-current', 'page');
  });

  it('should NOT mark the Contactos nav item as active when on /clientes route', async () => {
    // GIVEN: The router is set to /clientes
    const { createMemoryHistory, createRouter } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/clientes'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: RouterProvider renders at /clientes
    const { RouterProvider } = await import('@tanstack/react-router');
    render(<RouterProvider router={router} />);
    await waitFor(() => screen.getByTestId('clientes-view'));

    // THEN: The Contactos nav item does NOT have aria-current="page"
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Desktop: active state for Contactos nav item on /contactos route
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Contactos nav item active state', () => {
  beforeEach(() => {
    mockDesktopViewport();
  });

  it('should mark the Contactos nav item as active when on /contactos route', async () => {
    // GIVEN: The router is set to /contactos
    const { createMemoryHistory, createRouter } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/contactos'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: RouterProvider renders at /contactos
    const { RouterProvider } = await import('@tanstack/react-router');
    render(<RouterProvider router={router} />);
    await waitFor(() => screen.getByTestId('contactos-view'));

    // THEN: The Contactos nav item has aria-current="page" (active state)
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem).toHaveAttribute('aria-current', 'page');
  });

  it('should NOT mark the Clientes nav item as active when on /contactos route', async () => {
    // GIVEN: The router is set to /contactos
    const { createMemoryHistory, createRouter } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/contactos'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: RouterProvider renders at /contactos
    const { RouterProvider } = await import('@tanstack/react-router');
    render(<RouterProvider router={router} />);
    await waitFor(() => screen.getByTestId('contactos-view'));

    // THEN: The Clientes nav item does NOT have aria-current="page"
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Mobile (<1024px): NavigationBar visible, NavigationRail hidden
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — Mobile navigation shell (<1024px)', () => {
  beforeEach(() => {
    mockMobileViewport();
  });

  it('should render a NavigationBar at the bottom on mobile viewport (<1024px)', async () => {
    // GIVEN: The AppShell is rendered at mobile viewport (<1024px)
    const { AppShell } = await import('../__root');

    // WHEN: The component is rendered
    render(<AppShell />);

    // THEN: The mobile NavigationBar is visible
    const navigationBar = screen.getByTestId('navigation-bar');
    expect(navigationBar).toBeVisible();
  });

  it('should NOT render the NavigationRail on mobile viewport (<1024px)', async () => {
    // GIVEN: The AppShell is rendered at mobile viewport
    const { AppShell } = await import('../__root');

    // WHEN: The component is rendered
    render(<AppShell />);

    // THEN: The NavigationRail is not visible (CSS hidden class applied)
    const navigationRail = screen.queryByTestId('navigation-rail');
    if (navigationRail) {
      expect(navigationRail).not.toBeVisible();
    } else {
      expect(navigationRail).toBeNull();
    }
  });

  it('should show "Clientes" entry inside the NavigationBar on mobile', async () => {
    // GIVEN: The AppShell is rendered at mobile viewport
    const { AppShell } = await import('../__root');

    // WHEN: The NavigationBar is rendered
    render(<AppShell />);

    // THEN: A "Clientes" nav item is present in the NavigationBar
    const bar = screen.getByTestId('navigation-bar');
    const clientesItem = bar.querySelector('[data-testid="nav-item-clientes"]');
    expect(clientesItem).toBeInTheDocument();
  });

  it('should show "Contactos" entry inside the NavigationBar on mobile', async () => {
    // GIVEN: The AppShell is rendered at mobile viewport
    const { AppShell } = await import('../__root');

    // WHEN: The NavigationBar is rendered
    render(<AppShell />);

    // THEN: A "Contactos" nav item is present in the NavigationBar
    const bar = screen.getByTestId('navigation-bar');
    const contactosItem = bar.querySelector('[data-testid="nav-item-contactos"]');
    expect(contactosItem).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Deep link /clientes renders Clientes view and nav item is active
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Deep link to /clientes (FR30)', () => {
  it('should render the Clientes view when navigating directly to /clientes', async () => {
    // GIVEN: The memory router is initialized with /clientes as the entry point
    const { createMemoryHistory, createRouter, RouterProvider } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/clientes'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: The router renders at /clientes
    render(<RouterProvider router={router} />);

    // THEN: The Clientes view is rendered — data-testid="clientes-view" must be present
    await waitFor(() => {
      const clientesView = screen.getByTestId('clientes-view');
      expect(clientesView).toBeInTheDocument();
    });
  });

  it('should NOT redirect /clientes to any other route', async () => {
    // GIVEN: The memory router is initialized with /clientes
    const { createMemoryHistory, createRouter, RouterProvider } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/clientes'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: The router renders
    render(<RouterProvider router={router} />);
    await waitFor(() => screen.getByTestId('clientes-view'));

    // THEN: The current route stays at /clientes (no redirect to / or other routes)
    expect(router.state.location.pathname).toBe('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Deep link /contactos renders Contactos view and nav item is active
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Deep link to /contactos (FR30)', () => {
  it('should render the Contactos view when navigating directly to /contactos', async () => {
    // GIVEN: The memory router is initialized with /contactos as the entry point
    const { createMemoryHistory, createRouter, RouterProvider } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/contactos'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: The router renders at /contactos
    render(<RouterProvider router={router} />);

    // THEN: The Contactos view is rendered — data-testid="contactos-view" must be present
    await waitFor(() => {
      const contactosView = screen.getByTestId('contactos-view');
      expect(contactosView).toBeInTheDocument();
    });
  });

  it('should NOT redirect /contactos to any other route', async () => {
    // GIVEN: The memory router is initialized with /contactos
    const { createMemoryHistory, createRouter, RouterProvider } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/contactos'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: The router renders
    render(<RouterProvider router={router} />);
    await waitFor(() => screen.getByTestId('contactos-view'));

    // THEN: The current route stays at /contactos
    expect(router.state.location.pathname).toBe('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Unknown route renders 404 view in Spanish with back link to /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC7 — 404 not-found view for unknown routes', () => {
  it('should render the not-found view for an unknown route like /foo', async () => {
    // GIVEN: The memory router is initialized with /foo (non-existent route)
    const { createMemoryHistory, createRouter, RouterProvider } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/foo'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: The router renders
    render(<RouterProvider router={router} />);

    // THEN: The not-found view container is rendered
    await waitFor(() => {
      const notFoundView = screen.getByTestId('not-found-view');
      expect(notFoundView).toBeInTheDocument();
    });
  });

  it('should display "Página no encontrada" message in Spanish on the 404 view', async () => {
    // GIVEN: The memory router is initialized with /foo
    const { createMemoryHistory, createRouter, RouterProvider } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/foo'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: The not-found view is rendered
    render(<RouterProvider router={router} />);
    await waitFor(() => screen.getByTestId('not-found-view'));

    // THEN: The Spanish message "Página no encontrada" is displayed
    const notFoundView = screen.getByTestId('not-found-view');
    expect(notFoundView).toHaveTextContent('Página no encontrada');
  });

  it('should display a back link to /clientes on the 404 view', async () => {
    // GIVEN: The memory router is initialized with /foo
    const { createMemoryHistory, createRouter, RouterProvider } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/foo'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: The not-found view is rendered
    render(<RouterProvider router={router} />);
    await waitFor(() => screen.getByTestId('not-found-view'));

    // THEN: A back link pointing to /clientes is present
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', expect.stringContaining('/clientes'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — Root / redirects to /clientes without blank page
// ─────────────────────────────────────────────────────────────────────────────

describe('AC8 — Root / redirects to /clientes', () => {
  it('should redirect from / to /clientes', async () => {
    // GIVEN: The memory router starts at /
    const { createMemoryHistory, createRouter, RouterProvider } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: The router initializes and processes /
    render(<RouterProvider router={router} />);

    // THEN: The router automatically redirects to /clientes (no blank page)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });
  });

  it('should render the Clientes view after / redirect (no blank page)', async () => {
    // GIVEN: The memory router starts at /
    const { createMemoryHistory, createRouter, RouterProvider } = await import('@tanstack/react-router');
    const { routeTree } = await import('../../routeTree.gen');

    const memoryHistory = createMemoryHistory({ initialEntries: ['/'] });
    const router = createRouter({ routeTree, history: memoryHistory });

    // WHEN: The redirect completes
    render(<RouterProvider router={router} />);

    // THEN: The Clientes view is rendered — not a blank or error page
    await waitFor(() => {
      const clientesView = screen.getByTestId('clientes-view');
      expect(clientesView).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 — Accessibility: aria-label in Spanish, role=navigation, no axe violations
// ─────────────────────────────────────────────────────────────────────────────

describe('AC9 — Accessibility and ARIA compliance (WCAG 2.1 AA)', () => {
  beforeEach(() => {
    mockDesktopViewport();
  });

  it('should have aria-label "Ir a Clientes" on the Clientes nav button', async () => {
    // GIVEN: The AppShell is rendered on any viewport
    const { AppShell } = await import('../__root');

    // WHEN: The nav items are rendered
    render(<AppShell />);

    // THEN: The Clientes icon-only button has aria-label="Ir a Clientes" in Spanish
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).toHaveAttribute('aria-label', 'Ir a Clientes');
  });

  it('should have aria-label "Ir a Contactos" on the Contactos nav button', async () => {
    // GIVEN: The AppShell is rendered on any viewport
    const { AppShell } = await import('../__root');

    // WHEN: The nav items are rendered
    render(<AppShell />);

    // THEN: The Contactos icon-only button has aria-label="Ir a Contactos" in Spanish
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem).toHaveAttribute('aria-label', 'Ir a Contactos');
  });

  it('should have role="navigation" on the NavigationRail container', async () => {
    // GIVEN: The AppShell is rendered on desktop
    const { AppShell } = await import('../__root');

    // WHEN: The NavigationRail is rendered
    render(<AppShell />);

    // THEN: The NavigationRail container has role="navigation"
    const navigationRail = screen.getByTestId('navigation-rail');
    expect(navigationRail).toHaveAttribute('role', 'navigation');
  });

  it('should have aria-label "Navegación principal" on the NavigationRail', async () => {
    // GIVEN: The AppShell is rendered on desktop
    const { AppShell } = await import('../__root');

    // WHEN: The NavigationRail is rendered
    render(<AppShell />);

    // THEN: The NavigationRail has aria-label="Navegación principal"
    const navigationRail = screen.getByTestId('navigation-rail');
    expect(navigationRail).toHaveAttribute('aria-label', 'Navegación principal');
  });

  it('should have no axe critical or serious violations on the app shell (WCAG 2.1 AA)', async () => {
    // GIVEN: The AppShell is rendered (desktop viewport)
    // @axe-core/react must be installed; this test will RED until it is
    const axe = await import('axe-core').catch(() => null);
    if (!axe) {
      // axe-core is not installed — this test fails in RED phase to signal requirement
      throw new Error(
        'axe-core package is not installed. Run: pnpm --filter frontend add -D axe-core @testing-library/jest-dom',
      );
    }

    const { AppShell } = await import('../__root');
    const { container } = render(<AppShell />);

    // WHEN: The page is analysed with axe
    const results = await axe.default.run(container);

    // THEN: No critical or serious violations
    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(criticalOrSerious).toHaveLength(0);
  });

  it('should have all nav item buttons reachable via keyboard (Tab)', async () => {
    // GIVEN: The AppShell is rendered
    const { AppShell } = await import('../__root');
    const user = userEvent.setup();

    // WHEN: The component is rendered and user presses Tab
    render(<AppShell />);

    // THEN: Tab focus can reach the nav items (they are not trapped or hidden from focus)
    await user.tab();
    const focusedEl = document.activeElement;

    // At least one interactive element is reachable via Tab
    // The Clientes or Contactos nav item should receive focus at some point
    expect(focusedEl).not.toBeNull();
    expect(focusedEl?.tagName).not.toBe('BODY'); // Tab moved focus away from body
  });
});
