/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — Vitest + React Testing Library
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail + Navbar rendered (≥ 1024px)
 *   AC2 — Desktop: /clientes route active state on nav item
 *   AC3 — Desktop: /contactos route active state on nav item
 *   AC4 — Mobile: NavigationBar rendered on mobile viewport (< 1024px)
 *   AC5 — Deep link /clientes renders ClientesPage placeholder with nav shell
 *   AC6 — Deep link /contactos renders ContactosPage placeholder with nav shell
 *   AC7 — Unknown route renders 404 view with Spanish message and back link
 *   AC8 — Root / redirects to /clientes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router';
import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// Type stubs for routes — will exist after implementation
// The dev agent must create these route files so these imports resolve.
// ---------------------------------------------------------------------------

// We import the route tree once implemented; for RED phase we stub the router.
// The routeTree will be the auto-generated file from TanStack Router plugin.
// Import path will be valid once: frontend/src/routeTree.gen.ts is regenerated.
import { routeTree } from '../../routeTree.gen';

// ---------------------------------------------------------------------------
// Helper: build a TanStack Router with memory history for testing
// ---------------------------------------------------------------------------

function createTestRouter(initialPath: string = '/clientes') {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  return createRouter({
    routeTree,
    history: memoryHistory,
  });
}

// ---------------------------------------------------------------------------
// Helper: resize window to simulate desktop or mobile viewport
// ---------------------------------------------------------------------------

function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1280,
  });
  window.dispatchEvent(new Event('resize'));
}

function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  });
  window.dispatchEvent(new Event('resize'));
}

// ---------------------------------------------------------------------------
// AC1 — Desktop: NavigationRail + Navbar visible at ≥ 1024px
// ---------------------------------------------------------------------------

describe('AC1 — Desktop navigation shell (NavigationRail + Navbar)', () => {
  beforeEach(() => setDesktopViewport());

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Given desktop viewport, When app renders, Then Navbar with "Siesa Agents" is visible', async () => {
    // GIVEN: Desktop viewport (1280px)
    const router = createTestRouter('/clientes');

    // WHEN: App renders at /clientes
    render(<RouterProvider router={router} />);

    // THEN: Navbar with product name is displayed at top
    await waitFor(() => {
      const navbar = screen.getByTestId('navbar');
      expect(navbar).toBeInTheDocument();
      expect(navbar).toHaveTextContent('Siesa Agents');
    });
  });

  it('Given desktop viewport, When app renders, Then NavigationRail is visible on the left', async () => {
    // GIVEN: Desktop viewport
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: NavigationRail is rendered and visible
    await waitFor(() => {
      const navRail = screen.getByTestId('navigation-rail');
      expect(navRail).toBeInTheDocument();
      expect(navRail).toBeVisible();
    });
  });

  it('Given desktop viewport, When app renders, Then NavigationRail contains "Clientes" entry', async () => {
    // GIVEN: Desktop viewport
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Clientes navigation item is present
    await waitFor(() => {
      const clientesItem = screen.getByTestId('nav-item-clientes');
      expect(clientesItem).toBeInTheDocument();
      expect(clientesItem).toHaveTextContent('Clientes');
    });
  });

  it('Given desktop viewport, When app renders, Then NavigationRail contains "Contactos" entry', async () => {
    // GIVEN: Desktop viewport
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Contactos navigation item is present
    await waitFor(() => {
      const contactosItem = screen.getByTestId('nav-item-contactos');
      expect(contactosItem).toBeInTheDocument();
      expect(contactosItem).toHaveTextContent('Contactos');
    });
  });

  it('Given desktop viewport, When app renders, Then mobile NavigationBar is NOT visible', async () => {
    // GIVEN: Desktop viewport
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Mobile NavigationBar is hidden (not rendered or display:none) on desktop
    await waitFor(() => {
      const navBar = screen.queryByTestId('navigation-bar');
      if (navBar) {
        expect(navBar).not.toBeVisible();
      } else {
        // navigation-bar not rendered at all on desktop — acceptable
        expect(navBar).toBeNull();
      }
    });
  });
});

// ---------------------------------------------------------------------------
// AC2 — Desktop: /clientes route active state
// ---------------------------------------------------------------------------

describe('AC2 — Active state: Clientes item marked active when at /clientes', () => {
  beforeEach(() => setDesktopViewport());

  it('Given user is at /clientes, When nav renders, Then Clientes item has aria-current="page"', async () => {
    // GIVEN: Router initialized at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Clientes nav item has aria-current="page" (FR28)
    await waitFor(() => {
      const clientesItem = screen.getByTestId('nav-item-clientes');
      expect(clientesItem).toHaveAttribute('aria-current', 'page');
    });
  });

  it('Given user is at /clientes, When nav renders, Then Contactos item does NOT have aria-current="page"', async () => {
    // GIVEN: Router at /clientes
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Contactos item is not active
    await waitFor(() => {
      const contactosItem = screen.getByTestId('nav-item-contactos');
      expect(contactosItem).not.toHaveAttribute('aria-current', 'page');
    });
  });

  it('Given user clicks Clientes item from /contactos, When navigation happens, Then URL becomes /clientes', async () => {
    // GIVEN: Router initialized at /contactos
    const router = createTestRouter('/contactos');
    const user = userEvent.setup();

    // WHEN: App renders and user clicks Clientes
    render(<RouterProvider router={router} />);

    await waitFor(() => screen.getByTestId('nav-item-clientes'));
    await user.click(screen.getByTestId('nav-item-clientes'));

    // THEN: Router state is at /clientes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });
  });
});

// ---------------------------------------------------------------------------
// AC3 — Desktop: /contactos route active state
// ---------------------------------------------------------------------------

describe('AC3 — Active state: Contactos item marked active when at /contactos', () => {
  beforeEach(() => setDesktopViewport());

  it('Given user is at /contactos, When nav renders, Then Contactos item has aria-current="page"', async () => {
    // GIVEN: Router initialized at /contactos
    const router = createTestRouter('/contactos');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Contactos nav item has aria-current="page" (FR28)
    await waitFor(() => {
      const contactosItem = screen.getByTestId('nav-item-contactos');
      expect(contactosItem).toHaveAttribute('aria-current', 'page');
    });
  });

  it('Given user is at /contactos, When nav renders, Then Clientes item does NOT have aria-current="page"', async () => {
    // GIVEN: Router at /contactos
    const router = createTestRouter('/contactos');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Clientes item is not active
    await waitFor(() => {
      const clientesItem = screen.getByTestId('nav-item-clientes');
      expect(clientesItem).not.toHaveAttribute('aria-current', 'page');
    });
  });

  it('Given user clicks Contactos item from /clientes, When navigation happens, Then URL becomes /contactos', async () => {
    // GIVEN: Router initialized at /clientes
    const router = createTestRouter('/clientes');
    const user = userEvent.setup();

    // WHEN: User clicks Contactos nav item
    render(<RouterProvider router={router} />);

    await waitFor(() => screen.getByTestId('nav-item-contactos'));
    await user.click(screen.getByTestId('nav-item-contactos'));

    // THEN: Router state is at /contactos
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos');
    });
  });
});

// ---------------------------------------------------------------------------
// AC4 — Mobile: NavigationBar (bottom nav) on viewport < 1024px
// ---------------------------------------------------------------------------

describe('AC4 — Mobile: NavigationBar rendered on viewport < 1024px', () => {
  beforeEach(() => setMobileViewport());

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Given mobile viewport (375px), When app renders, Then NavigationBar is visible', async () => {
    // GIVEN: Mobile viewport (375px width)
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: NavigationBar (bottom navigation) is rendered and visible (FR29)
    await waitFor(() => {
      const navBar = screen.getByTestId('navigation-bar');
      expect(navBar).toBeInTheDocument();
      expect(navBar).toBeVisible();
    });
  });

  it('Given mobile viewport, When app renders, Then NavigationRail is NOT visible', async () => {
    // GIVEN: Mobile viewport
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: NavigationRail is hidden or not rendered on mobile
    await waitFor(() => {
      const navRail = screen.queryByTestId('navigation-rail');
      if (navRail) {
        expect(navRail).not.toBeVisible();
      } else {
        expect(navRail).toBeNull();
      }
    });
  });

  it('Given mobile viewport, When app renders, Then Clientes and Contactos items are in NavigationBar', async () => {
    // GIVEN: Mobile viewport, NavigationBar rendered
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Both items exist inside the NavigationBar (FR29)
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// AC5 — Deep link: /clientes renders ClientesPage placeholder with nav shell
// ---------------------------------------------------------------------------

describe('AC5 — Deep link /clientes renders ClientesPage with navigation shell', () => {
  beforeEach(() => setDesktopViewport());

  it('Given direct URL /clientes, When page loads, Then ClientesPage placeholder is rendered', async () => {
    // GIVEN: Router initialized directly at /clientes (simulates deep link)
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Clientes placeholder page is rendered (data-testid="clientes-page")
    await waitFor(() => {
      const clientesPage = screen.getByTestId('clientes-page');
      expect(clientesPage).toBeInTheDocument();
    });
  });

  it('Given direct URL /clientes, When page loads, Then navigation shell (Navbar) is present', async () => {
    // GIVEN: Deep link to /clientes
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Navigation shell (Navbar) is visible
    await waitFor(() => {
      const navbar = screen.getByTestId('navbar');
      expect(navbar).toBeInTheDocument();
    });
  });

  it('Given direct URL /clientes, When page loads, Then router state remains at /clientes (no redirect)', async () => {
    // GIVEN: Deep link to /clientes
    const router = createTestRouter('/clientes');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Router state remains at /clientes — no redirect occurred (FR30)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });
  });
});

// ---------------------------------------------------------------------------
// AC6 — Deep link: /contactos renders ContactosPage placeholder with nav shell
// ---------------------------------------------------------------------------

describe('AC6 — Deep link /contactos renders ContactosPage with navigation shell', () => {
  beforeEach(() => setDesktopViewport());

  it('Given direct URL /contactos, When page loads, Then ContactosPage placeholder is rendered', async () => {
    // GIVEN: Router initialized directly at /contactos (simulates deep link)
    const router = createTestRouter('/contactos');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Contactos placeholder page is rendered (data-testid="contactos-page")
    await waitFor(() => {
      const contactosPage = screen.getByTestId('contactos-page');
      expect(contactosPage).toBeInTheDocument();
    });
  });

  it('Given direct URL /contactos, When page loads, Then navigation shell (Navbar) is present', async () => {
    // GIVEN: Deep link to /contactos
    const router = createTestRouter('/contactos');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Navigation shell (Navbar) is visible
    await waitFor(() => {
      const navbar = screen.getByTestId('navbar');
      expect(navbar).toBeInTheDocument();
    });
  });

  it('Given direct URL /contactos, When page loads, Then router state remains at /contactos (no redirect)', async () => {
    // GIVEN: Deep link to /contactos
    const router = createTestRouter('/contactos');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Router state remains at /contactos — no redirect (FR30)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos');
    });
  });
});

// ---------------------------------------------------------------------------
// AC7 — Unknown route: 404 not-found view with Spanish message and back link
// ---------------------------------------------------------------------------

describe('AC7 — Unknown route renders 404 view with Spanish message', () => {
  beforeEach(() => setDesktopViewport());

  it('Given unknown route /unknown, When page loads, Then 404 not-found component is rendered', async () => {
    // GIVEN: Router initialized at an unknown route
    const router = createTestRouter('/unknown-route');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: 404 not-found view is shown (data-testid="not-found-page")
    await waitFor(() => {
      const notFoundPage = screen.getByTestId('not-found-page');
      expect(notFoundPage).toBeInTheDocument();
    });
  });

  it('Given unknown route, When page loads, Then "Página no encontrada" message is visible in Spanish', async () => {
    // GIVEN: Router at /unknown
    const router = createTestRouter('/unknown-route');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Spanish 404 heading is displayed
    await waitFor(() => {
      expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
    });
  });

  it('Given unknown route, When page loads, Then a link "Volver a Clientes" pointing to /clientes is present', async () => {
    // GIVEN: Router at /unknown
    const router = createTestRouter('/unknown-route');

    // WHEN: App renders
    render(<RouterProvider router={router} />);

    // THEN: Back link exists and points to /clientes
    await waitFor(() => {
      const backLink = screen.getByTestId('not-found-back-link');
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveTextContent('Volver a Clientes');
      expect(backLink).toHaveAttribute('href', expect.stringContaining('/clientes'));
    });
  });
});

// ---------------------------------------------------------------------------
// AC8 — Root / redirects to /clientes
// ---------------------------------------------------------------------------

describe('AC8 — Root / redirects automatically to /clientes', () => {
  beforeEach(() => setDesktopViewport());

  it('Given app loads at /, When page renders, Then router state is redirected to /clientes', async () => {
    // GIVEN: Router initialized at /
    const router = createTestRouter('/');

    // WHEN: App renders (TanStack Router beforeLoad triggers redirect)
    render(<RouterProvider router={router} />);

    // THEN: Router state has been redirected to /clientes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });
  });

  it('Given app loads at /, When redirect happens, Then ClientesPage placeholder is rendered', async () => {
    // GIVEN: Router starts at /
    const router = createTestRouter('/');

    // WHEN: App renders
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(router.state.location.pathname).toBe('/clientes'));

    // THEN: Clientes page content is shown (redirect successful)
    await waitFor(() => {
      const clientesPage = screen.getByTestId('clientes-page');
      expect(clientesPage).toBeInTheDocument();
    });
  });
});
