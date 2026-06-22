/**
 * Story 1.2: Frontend Navigation Shell — Component Tests
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Component Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Framework: Vitest + React Testing Library
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail rendered when viewport >= 1024px
 *   AC2 — Click "Clientes" triggers navigation to /clientes
 *   AC3 — Click "Contactos" triggers navigation to /contactos
 *   AC4 — Mobile: NavigationBar rendered when viewport < 1024px
 *   AC5 — /clientes route renders ClientesShellView with active highlight
 *   AC6 — /contactos route renders ContactosShellView with active highlight
 *   AC7 — Unknown route renders 404 view
 *   AC8 — Root / route redirects to /clientes
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from '../routeTree.gen';

// ─────────────────────────────────────────────────────────────────────────────
// Test router factory helper
// Creates a TanStack Router instance with a MemoryHistory for isolated testing
// ─────────────────────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string = '/clientes') {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  return createRouter({ routeTree, history: memoryHistory });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock siesa-ui-kit components to isolate navigation shell tests
// from third-party component internals
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('siesa-ui-kit', () => ({
  NavigationRail: ({
    items,
    activeItem,
    onNavigate,
  }: {
    items: Array<{ label: string; path: string }>;
    activeItem: string;
    onNavigate: (path: string) => void;
  }) => (
    <nav data-testid="navigation-rail" aria-label="Navegación principal escritorio">
      {items.map((item) => (
        <button
          key={item.path}
          data-testid={`nav-item-${item.label.toLowerCase()}`}
          data-active={activeItem === item.path ? 'true' : 'false'}
          onClick={() => onNavigate(item.path)}
          aria-current={activeItem === item.path ? 'page' : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  ),
  NavigationBar: ({
    items,
    activeItem,
    onNavigate,
  }: {
    items: Array<{ label: string; path: string }>;
    activeItem: string;
    onNavigate: (path: string) => void;
  }) => (
    <nav data-testid="navigation-bar" aria-label="Navegación principal móvil">
      {items.map((item) => (
        <button
          key={item.path}
          data-testid={`nav-item-${item.label.toLowerCase()}`}
          data-active={activeItem === item.path ? 'true' : 'false'}
          onClick={() => onNavigate(item.path)}
          aria-current={activeItem === item.path ? 'page' : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Viewport helpers — simulate desktop vs mobile window size
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Desktop viewport renders NavigationRail
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Desktop: NavigationRail visible', () => {
  beforeEach(() => setDesktopViewport());

  it('should render the NavigationRail component on desktop viewport', async () => {
    // GIVEN: Application shell rendered with desktop viewport
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // WHEN: Component mounts
    // THEN: NavigationRail is present in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('should render "Clientes" nav entry inside the NavigationRail', async () => {
    // GIVEN: Desktop NavigationRail rendered
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // WHEN: NavigationRail renders its items
    // THEN: "Clientes" item is visible
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should render "Contactos" nav entry inside the NavigationRail', async () => {
    // GIVEN: Desktop NavigationRail rendered
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // WHEN: NavigationRail renders its items
    // THEN: "Contactos" item is visible
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Click "Clientes" navigates to /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Click Clientes navigates to /clientes', () => {
  beforeEach(() => setDesktopViewport());

  it('should navigate to /clientes when Clientes nav item is clicked', async () => {
    // GIVEN: NavigationRail rendered, currently at /contactos
    const user = userEvent.setup();
    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // WHEN: User clicks "Clientes"
    await user.click(screen.getByTestId('nav-item-clientes'));

    // THEN: Router location is /clientes
    expect(router.state.location.pathname).toBe('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Click "Contactos" navigates to /contactos
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Click Contactos navigates to /contactos', () => {
  beforeEach(() => setDesktopViewport());

  it('should navigate to /contactos when Contactos nav item is clicked', async () => {
    // GIVEN: NavigationRail rendered, currently at /clientes
    const user = userEvent.setup();
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // WHEN: User clicks "Contactos"
    await user.click(screen.getByTestId('nav-item-contactos'));

    // THEN: Router location is /contactos
    expect(router.state.location.pathname).toBe('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Mobile viewport renders NavigationBar at the bottom
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — Mobile: NavigationBar displayed at bottom', () => {
  beforeEach(() => setMobileViewport());
  afterEach(() => setDesktopViewport());

  it('should render the NavigationBar component on mobile viewport', async () => {
    // GIVEN: Application shell rendered with mobile viewport (< 1024px)
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // WHEN: Component mounts
    // THEN: NavigationBar is present in the DOM
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('should render all navigation items in the NavigationBar on mobile', async () => {
    // GIVEN: NavigationBar rendered on mobile
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // WHEN: NavigationBar renders
    // THEN: Both "Clientes" and "Contactos" items are present
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Deep link /clientes renders ClientesShellView + highlights active
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Deep link /clientes renders view and highlights active entry', () => {
  beforeEach(() => setDesktopViewport());

  it('should render ClientesShellView on direct navigation to /clientes', async () => {
    // GIVEN: Router initialized with /clientes as initial path
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // WHEN: Page renders
    // THEN: ClientesShellView is in the document
    expect(screen.getByTestId('clientes-shell-view')).toBeInTheDocument();
  });

  it('should mark Clientes nav item as active (data-active="true") at /clientes', async () => {
    // GIVEN: Router at /clientes
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // WHEN: NavigationRail renders
    // THEN: Clientes item has data-active="true"
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).toHaveAttribute('data-active', 'true');
  });

  it('should mark Contactos nav item as NOT active at /clientes', async () => {
    // GIVEN: Router at /clientes
    const router = createTestRouter('/clientes');
    render(<RouterProvider router={router} />);

    // WHEN: NavigationRail renders
    // THEN: Contactos item has data-active="false"
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem).toHaveAttribute('data-active', 'false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6: Deep link /contactos renders ContactosShellView + highlights active
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Deep link /contactos renders view and highlights active entry', () => {
  beforeEach(() => setDesktopViewport());

  it('should render ContactosShellView on direct navigation to /contactos', async () => {
    // GIVEN: Router initialized with /contactos as initial path
    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // WHEN: Page renders
    // THEN: ContactosShellView is in the document
    expect(screen.getByTestId('contactos-shell-view')).toBeInTheDocument();
  });

  it('should mark Contactos nav item as active (data-active="true") at /contactos', async () => {
    // GIVEN: Router at /contactos
    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // WHEN: NavigationRail renders
    // THEN: Contactos item has data-active="true"
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem).toHaveAttribute('data-active', 'true');
  });

  it('should mark Clientes nav item as NOT active at /contactos', async () => {
    // GIVEN: Router at /contactos
    const router = createTestRouter('/contactos');
    render(<RouterProvider router={router} />);

    // WHEN: NavigationRail renders
    // THEN: Clientes item has data-active="false"
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).toHaveAttribute('data-active', 'false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7: Unknown route shows 404 view gracefully
// ─────────────────────────────────────────────────────────────────────────────

describe('AC7 — Unknown route renders 404 view without crashing', () => {
  it('should render the 404 not-found view for an unknown route', async () => {
    // GIVEN: Router initialized with an unknown path
    const router = createTestRouter('/unknown-path-xyz');
    render(<RouterProvider router={router} />);

    // WHEN: Page renders
    // THEN: Not-found view is displayed
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
  });

  it('should display "Página no encontrada" text in the 404 view', async () => {
    // GIVEN: Router at unknown route
    const router = createTestRouter('/unknown-path-xyz');
    render(<RouterProvider router={router} />);

    // WHEN: 404 view renders
    // THEN: Spanish not-found text is visible
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
  });

  it('should display a back link to /clientes in the 404 view', async () => {
    // GIVEN: Router at unknown route
    const router = createTestRouter('/unknown-path-xyz');
    render(<RouterProvider router={router} />);

    // WHEN: 404 view renders
    // THEN: Back link to /clientes is present
    expect(screen.getByTestId('not-found-back-link')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8: Root path / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC8 — Root / redirects to /clientes', () => {
  it('should redirect from / to /clientes when accessing root path', async () => {
    // GIVEN: Router initialized at /
    const router = createTestRouter('/');

    // Need to await router load to process beforeLoad redirect
    await router.load();
    render(<RouterProvider router={router} />);

    // WHEN: Route processes
    // THEN: Location is /clientes (redirect applied)
    expect(router.state.location.pathname).toBe('/clientes');
  });

  it('should render ClientesShellView after redirect from /', async () => {
    // GIVEN: Router initialized at root /
    const router = createTestRouter('/');
    await router.load();
    render(<RouterProvider router={router} />);

    // WHEN: Redirect to /clientes completes
    // THEN: ClientesShellView is rendered
    expect(screen.getByTestId('clientes-shell-view')).toBeInTheDocument();
  });
});
