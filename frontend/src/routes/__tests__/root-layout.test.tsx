/**
 * Story 1.2: Frontend Navigation Shell — Component Tests
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Component Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail visible at >= 1024px
 *   AC2 — Mobile: NavigationBar visible at < 1024px, NavigationRail hidden
 *   AC3 — Active nav item highlighted on deep link
 *   AC4 — 404 Not Found view rendered for unknown routes
 *   AC6 — ARIA labels and accessibility
 *
 * Framework: Vitest + React Testing Library + TanStack Router MemoryHistory
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from '../../routeTree.gen';

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a router with a given initial URL for testing.
 */
function createTestRouter(initialPath: string = '/clientes') {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  return createRouter({ routeTree, history: memoryHistory });
}

function renderWithRouter(initialPath: string = '/clientes') {
  const router = createTestRouter(initialPath);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (>= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Desktop NavigationRail renders at >= 1024px', () => {
  beforeEach(() => {
    // Mock window.innerWidth to simulate desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });
    window.dispatchEvent(new Event('resize'));
  });

  it('should render the NavigationRail element on desktop viewport', async () => {
    // GIVEN: Desktop viewport (>= 1024px)
    renderWithRouter('/clientes');

    // WHEN: The root layout is rendered
    // THEN: The NavigationRail is in the DOM
    const navRail = await screen.findByTestId('navigation-rail');
    expect(navRail).toBeDefined();
  });

  it('should render a "Clientes" link in the NavigationRail', async () => {
    // GIVEN: Desktop viewport
    renderWithRouter('/clientes');

    // WHEN: The NavigationRail is rendered
    // THEN: A Clientes navigation item is present
    const clientesItem = await screen.findByTestId('nav-item-clientes');
    expect(clientesItem).toBeDefined();
    expect(clientesItem.textContent).toContain('Clientes');
  });

  it('should render a "Contactos" link in the NavigationRail', async () => {
    // GIVEN: Desktop viewport
    renderWithRouter('/clientes');

    // WHEN: The NavigationRail is rendered
    // THEN: A Contactos navigation item is present
    const contactosItem = await screen.findByTestId('nav-item-contactos');
    expect(contactosItem).toBeDefined();
    expect(contactosItem.textContent).toContain('Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (< 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Mobile NavigationBar renders at < 1024px', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });
    window.dispatchEvent(new Event('resize'));
  });

  it('should render the NavigationBar element on mobile viewport', async () => {
    // GIVEN: Mobile viewport (< 1024px)
    renderWithRouter('/clientes');

    // WHEN: The root layout is rendered
    // THEN: The NavigationBar element is in the DOM
    const navBar = await screen.findByTestId('navigation-bar');
    expect(navBar).toBeDefined();
  });

  it('should render Clientes item in mobile NavigationBar', async () => {
    // GIVEN: Mobile viewport
    renderWithRouter('/clientes');

    // WHEN: The NavigationBar is rendered
    // THEN: Clientes item is accessible in the nav bar
    const clientesItem = await screen.findByTestId('nav-bar-item-clientes');
    expect(clientesItem).toBeDefined();
  });

  it('should render Contactos item in mobile NavigationBar', async () => {
    // GIVEN: Mobile viewport
    renderWithRouter('/clientes');

    // WHEN: The NavigationBar is rendered
    // THEN: Contactos item is accessible in the nav bar (FR29)
    const contactosItem = await screen.findByTestId('nav-bar-item-contactos');
    expect(contactosItem).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Active navigation item highlighted via deep linking
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Active nav item highlighted on deep link', () => {
  it('should mark Clientes nav item as active when on /clientes route', async () => {
    // GIVEN: The user navigates directly to /clientes
    renderWithRouter('/clientes');

    // WHEN: The page loads
    const clientesItem = await screen.findByTestId('nav-item-clientes');

    // THEN: The Clientes item has aria-current="page" (FR30)
    expect(clientesItem.getAttribute('aria-current')).toBe('page');
  });

  it('should mark Contactos nav item as active when on /contactos route', async () => {
    // GIVEN: The user navigates directly to /contactos
    renderWithRouter('/contactos');

    // WHEN: The page loads
    const contactosItem = await screen.findByTestId('nav-item-contactos');

    // THEN: The Contactos item has aria-current="page" (FR30)
    expect(contactosItem.getAttribute('aria-current')).toBe('page');
  });

  it('should NOT mark Contactos as active when on /clientes route', async () => {
    // GIVEN: The user is on /clientes
    renderWithRouter('/clientes');

    // WHEN: The page loads
    const contactosItem = await screen.findByTestId('nav-item-contactos');

    // THEN: Contactos item does NOT have aria-current="page"
    expect(contactosItem.getAttribute('aria-current')).not.toBe('page');
  });

  it('should render ClientesView content on /clientes route', async () => {
    // GIVEN: The user navigates to /clientes
    renderWithRouter('/clientes');

    // WHEN: The route renders
    // THEN: The Clientes content view is visible
    const clientesView = await screen.findByTestId('clientes-view');
    expect(clientesView).toBeDefined();
  });

  it('should render ContactosView content on /contactos route', async () => {
    // GIVEN: The user navigates to /contactos
    renderWithRouter('/contactos');

    // WHEN: The route renders
    // THEN: The Contactos content view is visible
    const contactosView = await screen.findByTestId('contactos-view');
    expect(contactosView).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 Not Found view
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — 404 Not Found view for unknown routes', () => {
  it('should render the not-found view for an unknown route', async () => {
    // GIVEN: The user navigates to an unknown route /foo
    renderWithRouter('/foo');

    // WHEN: The page loads
    // THEN: A 404 / not-found view is displayed gracefully
    const notFoundView = await screen.findByTestId('not-found-view');
    expect(notFoundView).toBeDefined();
  });

  it('should display a home link on the 404 not-found view', async () => {
    // GIVEN: The user is on an unknown route
    renderWithRouter('/this-does-not-exist');

    // WHEN: The 404 view renders
    // THEN: A link to return home is present
    const homeLink = await screen.findByTestId('not-found-home-link');
    expect(homeLink).toBeDefined();
  });

  it('should navigate to /clientes when clicking home link from 404 page', async () => {
    // GIVEN: The user is on the 404 page
    const user = userEvent.setup();
    const router = createTestRouter('/unknown-page');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    const homeLink = await screen.findByTestId('not-found-home-link');

    // WHEN: The user clicks the home link
    await user.click(homeLink);

    // THEN: The user is redirected to /clientes
    expect(router.state.location.pathname).toMatch(/\/clientes/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Accessibility: ARIA labels in Spanish
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Accessibility (WCAG 2.1 AA)', () => {
  it('should have a nav element with aria-label "Navegación principal"', async () => {
    // GIVEN: The navigation shell is rendered
    renderWithRouter('/clientes');

    // WHEN: Inspected with an accessibility tool
    // THEN: The nav element has the correct Spanish ARIA label (WCAG 2.1 AA)
    const navElement = await screen.findByRole('navigation', { name: 'Navegación principal' });
    expect(navElement).toBeDefined();
  });

  it('should display nav item labels in Spanish (Clientes, Contactos)', async () => {
    // GIVEN: The navigation shell is rendered
    renderWithRouter('/clientes');

    // WHEN: Reading nav item text
    const clientesItem = await screen.findByTestId('nav-item-clientes');
    const contactosItem = await screen.findByTestId('nav-item-contactos');

    // THEN: Labels are in Spanish
    expect(clientesItem.textContent).toContain('Clientes');
    expect(contactosItem.textContent).toContain('Contactos');
  });
});
