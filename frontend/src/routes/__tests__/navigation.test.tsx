/**
 * Story 1.2: Frontend Navigation Shell — Component Tests
 * ATDD - GREEN Phase (Implementation complete, tests passing)
 *
 * Framework: Vitest + React Testing Library + @tanstack/react-router
 *
 * Acceptance Criteria covered:
 * - AC1: Desktop (>=1024px) shows NavigationRail with Clientes/Contactos (FR28)
 * - AC2: Mobile (<1024px) shows NavigationBar; items accessible and tappable (FR29)
 * - AC3: Direct /clientes and /contactos navigation renders correct views (FR30)
 * - AC4: Unknown route shows 404 not-found view with Spanish message
 * - AC5: All nav links have aria-label in Spanish; reachable via Tab (WCAG 2.1 AA)
 * - AC6: Active route link is visually highlighted (aria-current="page")
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createElement } from 'react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { routeTree } from '../../routeTree.gen';

// ─── MSW server — stub API calls made by ClienteListPanel and ContactoListView ──

const server = setupServer(
  http.get('http://localhost:5000/api/v1/clientes', () => HttpResponse.json([])),
  http.get('http://localhost:5000/api/v1/contactos', () => HttpResponse.json([])),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  return createRouter({ routeTree, history });
}

async function renderAtPath(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createTestRouter(path);
  await router.load();
  await act(async () => {
    render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(RouterProvider, { router }),
      ),
    );
  });
}

// Viewport mock helpers
function mockDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true, configurable: true });
  window.dispatchEvent(new Event('resize'));
}

function mockMobileViewport() {
  Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
  window.dispatchEvent(new Event('resize'));
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── AC1: Desktop NavigationRail ─────────────────────────────────────────────

describe('AC1 - Desktop NavigationRail (viewport >=1024px)', () => {
  it('should render NavigationRail on desktop viewport', async () => {
    // GIVEN: Desktop viewport (1280px)
    mockDesktopViewport();

    // WHEN: Application renders at /clientes
    await renderAtPath('/clientes');

    // THEN: NavigationRail is visible
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('should show Clientes entry in NavigationRail on desktop', async () => {
    // GIVEN: Desktop viewport
    mockDesktopViewport();

    // WHEN: Application renders at /clientes
    await renderAtPath('/clientes');

    // THEN: Clientes nav item is visible
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should show Contactos entry in NavigationRail on desktop', async () => {
    // GIVEN: Desktop viewport
    mockDesktopViewport();

    // WHEN: Application renders at /clientes
    await renderAtPath('/clientes');

    // THEN: Contactos nav item is visible
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  it('should NOT render NavigationBar on desktop viewport', async () => {
    // GIVEN: Desktop viewport (1280px)
    mockDesktopViewport();

    // WHEN: Application renders at /clientes
    await renderAtPath('/clientes');

    // THEN: NavigationBar (mobile) is not rendered on desktop (JS-conditional rendering)
    expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
  });
});

// ─── AC2: Mobile NavigationBar ────────────────────────────────────────────────

describe('AC2 - Mobile NavigationBar (viewport <1024px)', () => {
  it('should render NavigationBar on mobile viewport', async () => {
    // GIVEN: Mobile viewport (375px)
    mockMobileViewport();

    // WHEN: Application renders at /clientes
    await renderAtPath('/clientes');

    // THEN: NavigationBar is present in DOM
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('should show Clientes item in NavigationBar on mobile', async () => {
    // GIVEN: Mobile viewport
    mockMobileViewport();

    // WHEN: Application renders at /clientes
    await renderAtPath('/clientes');

    // THEN: Clientes nav item is visible and tappable
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should show Contactos item in NavigationBar on mobile', async () => {
    // GIVEN: Mobile viewport
    mockMobileViewport();

    // WHEN: Application renders at /clientes
    await renderAtPath('/clientes');

    // THEN: Contactos nav item is visible and tappable
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  it('should NOT render NavigationRail on mobile viewport', async () => {
    // GIVEN: Mobile viewport (375px)
    mockMobileViewport();

    // WHEN: Application renders at /clientes
    await renderAtPath('/clientes');

    // THEN: NavigationRail is not rendered on mobile (JS-conditional rendering)
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument();
  });
});

// ─── AC3: Deep Linking ────────────────────────────────────────────────────────

describe('AC3 - Deep Linking to /clientes and /contactos (FR30)', () => {
  it('should render ClienteListPanel when navigating directly to /clientes', async () => {
    // GIVEN: User navigates directly to /clientes
    // WHEN: The page renders
    await renderAtPath('/clientes');

    // THEN: ClienteListPanel container is displayed (Story 2.1 replaces placeholder)
    expect(await screen.findByTestId('clientes-list-panel')).toBeInTheDocument();
  });

  it('should render ContactoListView when navigating directly to /contactos', async () => {
    // GIVEN: User navigates directly to /contactos
    // WHEN: The page renders
    await renderAtPath('/contactos');

    // THEN: ContactoListView container is displayed (Story 3.1 replaces placeholder)
    expect(await screen.findByTestId('contactos-list-view')).toBeInTheDocument();
  });

  it('should display clientes-search-input in the Clientes view', async () => {
    // GIVEN: User is on /clientes
    await renderAtPath('/clientes');

    // THEN: Search input is rendered (Story 2.1 — ClienteListPanel)
    expect(await screen.findByTestId('clientes-search-input')).toBeInTheDocument();
  });

  it('should display search input in the Contactos view', async () => {
    // GIVEN: User is on /contactos
    await renderAtPath('/contactos');

    // THEN: ContactoListView search input is rendered (Story 3.1)
    expect(await screen.findByTestId('contactos-search-input')).toBeInTheDocument();
  });
});

// ─── AC4: Unknown Route — 404 Not Found ───────────────────────────────────────

describe('AC4 - Unknown Route shows 404 Not Found view', () => {
  it('should render not-found view when navigating to an unknown route', async () => {
    // GIVEN: User navigates to /unknown
    // WHEN: The page renders
    await renderAtPath('/unknown-route');

    // THEN: Not-found view is rendered
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
  });

  it('should display "Pagina no encontrada" message in Spanish', async () => {
    // GIVEN: User navigates to an unknown route
    await renderAtPath('/this-does-not-exist');

    // THEN: Spanish not-found message is shown
    expect(screen.getByTestId('not-found-message')).toHaveTextContent('Página no encontrada');
  });

  it('should display a link back to Clientes on the not-found view', async () => {
    // GIVEN: User is on the 404 page
    await renderAtPath('/nonexistent');

    // THEN: A back link to Clientes is available
    expect(screen.getByTestId('not-found-back-link')).toBeInTheDocument();
  });
});

// ─── AC5: Accessibility — WCAG 2.1 AA ────────────────────────────────────────

describe('AC5 - Accessibility: aria-labels in Spanish and keyboard navigation', () => {
  it('navigation landmark should have aria-label "Navegacion principal"', async () => {
    // GIVEN: Navigation is rendered
    await renderAtPath('/clientes');

    // THEN: nav element has correct accessible label in Spanish
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
  });

  it('Clientes nav link should have aria-label "Ir a Clientes"', async () => {
    // GIVEN: Navigation is rendered
    await renderAtPath('/clientes');

    // THEN: Clientes link has correct Spanish aria-label
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-label', 'Ir a Clientes');
  });

  it('Contactos nav link should have aria-label "Ir a Contactos"', async () => {
    // GIVEN: Navigation is rendered
    await renderAtPath('/clientes');

    // THEN: Contactos link has correct Spanish aria-label
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute(
      'aria-label',
      'Ir a Contactos',
    );
  });

  it('Clientes nav link should be reachable via Tab key', async () => {
    // GIVEN: Navigation is rendered
    await renderAtPath('/clientes');
    const user = userEvent.setup();

    // WHEN: User navigates via Tab
    await user.tab();

    // THEN: A nav item receives focus (keyboard accessible)
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');
    const focused = document.activeElement;

    const navItemFocused =
      focused === clientesItem ||
      focused === contactosItem ||
      clientesItem.contains(focused) ||
      contactosItem.contains(focused);

    expect(navItemFocused).toBe(true);
  });
});

// ─── AC6: Active Route Highlighting ──────────────────────────────────────────

describe('AC6 - Active route link is highlighted', () => {
  it('Clientes link should have aria-current="page" when on /clientes', async () => {
    // GIVEN: User is on /clientes
    await renderAtPath('/clientes');

    // THEN: Clientes nav item is marked as current page
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
  });

  it('Contactos link should have aria-current="page" when on /contactos', async () => {
    // GIVEN: User is on /contactos
    await renderAtPath('/contactos');

    // THEN: Contactos nav item is marked as current page
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page');
  });

  it('Clientes link should NOT have aria-current="page" when on /contactos', async () => {
    // GIVEN: User is on /contactos
    await renderAtPath('/contactos');

    // THEN: Clientes nav item is NOT marked as current
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });

  it('Contactos link should NOT have aria-current="page" when on /clientes', async () => {
    // GIVEN: User is on /clientes
    await renderAtPath('/clientes');

    // THEN: Contactos nav item is NOT marked as current
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });

  it('Clientes link should have nav-active class when on /clientes', async () => {
    // GIVEN: User is on /clientes
    await renderAtPath('/clientes');

    // THEN: Active class is applied for visual highlighting
    expect(screen.getByTestId('nav-item-clientes')).toHaveClass('nav-active');
  });

  it('Contactos link should have nav-active class when on /contactos', async () => {
    // GIVEN: User is on /contactos
    await renderAtPath('/contactos');

    // THEN: Active class is applied for visual highlighting
    expect(screen.getByTestId('nav-item-contactos')).toHaveClass('nav-active');
  });
});

// ─── Root Redirect ────────────────────────────────────────────────────────────

describe('Root redirect to /clientes', () => {
  it('should redirect from / to /clientes', async () => {
    // GIVEN: User navigates to the root URL
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createTestRouter('/');
    render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(RouterProvider, { router }),
      ),
    );

    // THEN: Router redirects to /clientes and renders the ClienteListPanel (Story 2.1)
    expect(await screen.findByTestId('clientes-list-panel')).toBeInTheDocument();
  });
});
