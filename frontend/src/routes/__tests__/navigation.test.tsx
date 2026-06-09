/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests (Vitest + React Testing Library) — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop (>= 1024px); navigation items present
 *   AC2 — Mobile NavigationBar visible at bottom on viewport < 1024px
 *   AC4 — Unknown route renders not-found component
 *   AC5 — ARIA roles and labels present on all navigation landmarks (WCAG 2.1 AA)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';
import { act } from 'react';
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
  createRootRoute,
} from '@tanstack/react-router';

/**
 * Minimal router wrapper for unit tests.
 * Provides the router context required by TanStack Router's <Link> component.
 * Uses router.load() + act to ensure routes are resolved before assertions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function renderWithRouter(ui: React.ReactElement, { initialPath = '/' } = {}) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await router.load();
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: simulate viewport width via window.innerWidth mock
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
// These imports will fail (RED) until the implementation files are created:
//   frontend/src/routes/_app.tsx
//   frontend/src/routes/__root.tsx  (updated with notFoundComponent)
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AppLayout: React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let NotFoundView: React.ComponentType<any>;

beforeEach(async () => {
  // Dynamic imports will throw MODULE_NOT_FOUND until implementation exists (RED phase)
  // @ts-expect-error – file does not exist yet (RED phase)
  const appModule = await import('../_app');
  AppLayout = appModule.AppLayout ?? appModule.default;

  // @ts-expect-error – notFoundComponent not exported yet (RED phase)
  const rootModule = await import('../__root.notfound');
  NotFoundView = rootModule.NotFoundView ?? rootModule.default;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — NavigationRail on desktop (>= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — NavigationRail rendered on desktop viewport (>= 1024px)', () => {
  test('should render the NavigationRail on a desktop-width viewport', async () => {
    // GIVEN: Viewport width is 1280px (desktop)
    setViewportWidth(1280);

    // WHEN: The AppLayout component is rendered
    await renderWithRouter(<AppLayout />);

    // THEN: The NavigationRail is present in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  test('should render a "Clientes" navigation item in the NavigationRail', async () => {
    // GIVEN: Viewport width is 1280px (desktop)
    setViewportWidth(1280);

    // WHEN: The AppLayout is rendered
    await renderWithRouter(<AppLayout />);

    // THEN: A nav item with data-testid "nav-item-clientes" is visible
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  test('should render a "Contactos" navigation item in the NavigationRail', async () => {
    // GIVEN: Viewport width is 1280px (desktop)
    setViewportWidth(1280);

    // WHEN: The AppLayout is rendered
    await renderWithRouter(<AppLayout />);

    // THEN: A nav item with data-testid "nav-item-contactos" is visible
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  test('should NOT render the mobile NavigationBar on desktop viewport', async () => {
    // GIVEN: Viewport width is 1280px (desktop)
    setViewportWidth(1280);

    // WHEN: The AppLayout is rendered
    await renderWithRouter(<AppLayout />);

    // THEN: The mobile NavigationBar is not visible (hidden via Tailwind lg: class)
    expect(screen.queryByTestId('navigation-bar')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — NavigationBar rendered on mobile viewport (< 1024px)', () => {
  test('should render the NavigationBar on a mobile viewport', async () => {
    // GIVEN: Viewport width is 390px (mobile, iPhone 14)
    setViewportWidth(390);

    // WHEN: The AppLayout component is rendered
    await renderWithRouter(<AppLayout />);

    // THEN: The NavigationBar is present and visible
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  test('should render a "Clientes" navigation item in the mobile NavigationBar', async () => {
    // GIVEN: Viewport width is 390px (mobile)
    setViewportWidth(390);

    // WHEN: The AppLayout is rendered
    await renderWithRouter(<AppLayout />);

    // THEN: The "Clientes" item is present and accessible
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).toBeInTheDocument();
    expect(clientesItem).not.toBeDisabled();
  });

  test('should render a "Contactos" navigation item in the mobile NavigationBar', async () => {
    // GIVEN: Viewport width is 390px (mobile)
    setViewportWidth(390);

    // WHEN: The AppLayout is rendered
    await renderWithRouter(<AppLayout />);

    // THEN: The "Contactos" item is present and accessible
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem).toBeInTheDocument();
    expect(contactosItem).not.toBeDisabled();
  });

  test('should NOT render the desktop NavigationRail on mobile viewport', async () => {
    // GIVEN: Viewport width is 390px (mobile)
    setViewportWidth(390);

    // WHEN: The AppLayout is rendered
    await renderWithRouter(<AppLayout />);

    // THEN: The desktop NavigationRail is not visible
    expect(screen.queryByTestId('navigation-rail')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Not Found / 404 Component
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — Not-found component', () => {
  test('should render the not-found view with data-testid "not-found-view"', () => {
    // GIVEN: The not-found component is mounted (simulates unknown route)
    // WHEN: The NotFoundView is rendered
    render(<NotFoundView />);

    // THEN: An element with data-testid="not-found-view" is in the DOM
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
  });

  test('should display the Spanish message "Página no encontrada" in the 404 view', () => {
    // GIVEN: The NotFoundView component is rendered
    // WHEN: The component is mounted
    render(<NotFoundView />);

    // THEN: The Spanish 404 message is displayed
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
  });

  test('should display a link back to /clientes in the 404 view', () => {
    // GIVEN: The NotFoundView component is rendered
    // WHEN: The component mounts
    render(<NotFoundView />);

    // THEN: A link element with data-testid="not-found-back-link" pointing to /clientes is present
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/clientes');
  });

  test('should render the back-to-clientes link text in Spanish', () => {
    // GIVEN: The NotFoundView is rendered
    render(<NotFoundView />);

    // WHEN: Inspecting the back link text
    // THEN: The link label is in Spanish (e.g., "Volver al inicio")
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink.textContent).toMatch(/volver/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Accessibility (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — ARIA roles and labels on navigation landmarks', () => {
  test('should have a <nav> element with aria-label="Navegación principal"', async () => {
    // GIVEN: The AppLayout is rendered on desktop
    setViewportWidth(1280);

    // WHEN: The component mounts
    await renderWithRouter(<AppLayout />);

    // THEN: A nav landmark with the accessible label "Navegación principal" is present
    const navElement = screen.getByRole('navigation', {
      name: 'Navegación principal',
    });
    expect(navElement).toBeInTheDocument();
  });

  test('should mark the active navigation link with aria-current="page"', async () => {
    // GIVEN: The AppLayout is rendered and /clientes is the current route
    setViewportWidth(1280);

    // WHEN: The component mounts with /clientes as active route
    await renderWithRouter(<AppLayout currentPath="/clientes" />, { initialPath: '/clientes' });

    // THEN: The "Clientes" link has aria-current="page"
    const clientesLink = screen.getByTestId('nav-item-clientes');
    expect(clientesLink).toHaveAttribute('aria-current', 'page');
  });

  test('should not mark inactive links with aria-current="page"', async () => {
    // GIVEN: The AppLayout is rendered with /clientes as active route
    setViewportWidth(1280);

    // WHEN: The component mounts
    await renderWithRouter(<AppLayout currentPath="/clientes" />, { initialPath: '/clientes' });

    // THEN: The "Contactos" link does NOT have aria-current="page"
    const contactosLink = screen.getByTestId('nav-item-contactos');
    expect(contactosLink).not.toHaveAttribute('aria-current', 'page');
  });

  test('should have accessible text labels for all navigation items', async () => {
    // GIVEN: AppLayout is rendered on desktop
    setViewportWidth(1280);

    // WHEN: The component mounts
    await renderWithRouter(<AppLayout />);

    // THEN: Each nav item has a visible text label (accessible name)
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');

    expect(clientesItem.textContent).toMatch(/clientes/i);
    expect(contactosItem.textContent).toMatch(/contactos/i);
  });

  test('should have keyboard-focusable navigation items', async () => {
    // GIVEN: AppLayout is rendered
    setViewportWidth(1280);

    // WHEN: The component mounts
    await renderWithRouter(<AppLayout />);

    // THEN: Navigation items can receive keyboard focus (tabIndex !== -1 or are naturally focusable)
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');

    // Elements should be focusable (links are focusable by default, buttons too)
    expect(clientesItem.tagName).toMatch(/^(A|BUTTON)$/i);
    expect(contactosItem.tagName).toMatch(/^(A|BUTTON)$/i);
  });
});
