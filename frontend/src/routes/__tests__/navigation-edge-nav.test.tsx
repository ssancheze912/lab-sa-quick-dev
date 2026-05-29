/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — Navigation Edge Cases — Vitest + React Testing Library
 *
 * Edge cases for NavigationRail and NavigationBar components:
 *   - Renders exactly 2 items (no more, no less)
 *   - No activeRoute prop (default state)
 *   - Icon elements are aria-hidden
 *   - aria-label on the nav element
 */

import { describe, it, expect } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterContextProvider,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router';

import { NavigationRail } from '../../shared/components/ui/NavigationRail';
import { NavigationBar } from '../../shared/components/ui/NavigationBar';

// ─────────────────────────────────────────────────────────────────────────────
// Test router factory
// ─────────────────────────────────────────────────────────────────────────────

async function createLoadedTestRouter(initialPath = '/clientes') {
  const rootRoute = createRootRoute({ component: Outlet });
  const clientesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/clientes', component: () => null });
  const contactosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/contactos', component: () => null });
  const routeTree = rootRoute.addChildren([clientesRoute, contactosRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => { await router.load(); });
  return router;
}

// ─────────────────────────────────────────────────────────────────────────────
// NavigationRail edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] NavigationRail — item count boundary', () => {
  it('[P1] should render exactly 2 navigation items', async () => {
    // GIVEN: NavigationRail is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );

    // WHEN: We count all nav items by their data-testid pattern
    const items = screen.getAllByTestId(/^nav-item-/);

    // THEN: Exactly 2 items exist (Clientes + Contactos)
    expect(items).toHaveLength(2);
  });

  it('[P1] should render without crashing when no activeRoute prop is provided', async () => {
    // GIVEN: NavigationRail is mounted with no activeRoute prop
    const router = await createLoadedTestRouter();

    // WHEN: Render without activeRoute
    expect(() =>
      render(
        <RouterContextProvider router={router}>
          <NavigationRail />
        </RouterContextProvider>
      )
    ).not.toThrow();

    // THEN: Navigation rail is present
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('[P1] should have aria-label "Navegación principal" on the nav element', async () => {
    // GIVEN: NavigationRail is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );

    // WHEN: We find the nav element by testid
    const nav = screen.getByTestId('navigation-rail');

    // THEN: aria-label is correct for screen readers
    expect(nav).toHaveAttribute('aria-label', 'Navegación principal');
  });

  it('[P1] should render icons with aria-hidden to prevent duplicate announcements', async () => {
    // GIVEN: NavigationRail is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );

    // WHEN: We find SVG icons (aria-hidden prevents screen reader double-reading)
    const hiddenSvgs = screen
      .getByTestId('navigation-rail')
      .querySelectorAll('svg[aria-hidden="true"]');

    // THEN: Both icons are aria-hidden
    expect(hiddenSvgs).toHaveLength(2);
  });

  it('[P2] should NOT mark any item as active when no route is active', async () => {
    // GIVEN: NavigationRail mounted with no activeRoute prop
    const router = await createLoadedTestRouter('/clientes');
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );

    // WHEN: We check contactos item
    const contactosItem = screen.getByTestId('nav-item-contactos');

    // THEN: Contactos item is NOT active when on /clientes
    expect(contactosItem).not.toHaveAttribute('data-active', 'true');
  });

  it('[P2] should display item labels as text content', async () => {
    // GIVEN: NavigationRail is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );

    // WHEN/THEN: Both label texts are in the document
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Contactos')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NavigationBar edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] NavigationBar — item count and accessibility boundaries', () => {
  it('[P1] should render exactly 2 navigation items', async () => {
    // GIVEN: NavigationBar is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );

    // WHEN: We count all nav items
    const items = screen.getAllByTestId(/^nav-item-/);

    // THEN: Exactly 2 items
    expect(items).toHaveLength(2);
  });

  it('[P1] should render without crashing when no activeRoute prop is provided', async () => {
    // GIVEN: NavigationBar mounted with no activeRoute prop
    const router = await createLoadedTestRouter();

    // WHEN: Render without prop
    expect(() =>
      render(
        <RouterContextProvider router={router}>
          <NavigationBar />
        </RouterContextProvider>
      )
    ).not.toThrow();

    // THEN: Navigation bar is present
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('[P1] should have aria-label "Navegación principal" on the nav element', async () => {
    // GIVEN: NavigationBar is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );

    // WHEN: We find the nav element
    const nav = screen.getByTestId('navigation-bar');

    // THEN: aria-label is correct
    expect(nav).toHaveAttribute('aria-label', 'Navegación principal');
  });

  it('[P1] should render icons with aria-hidden', async () => {
    // GIVEN: NavigationBar is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );

    // WHEN: We find aria-hidden SVGs
    const hiddenSvgs = screen
      .getByTestId('navigation-bar')
      .querySelectorAll('svg[aria-hidden="true"]');

    // THEN: Both icons are aria-hidden
    expect(hiddenSvgs).toHaveLength(2);
  });

  it('[P2] should NOT mark Contactos as active when route is /clientes', async () => {
    // GIVEN: NavigationBar mounted with activeRoute /clientes
    const router = await createLoadedTestRouter('/clientes');
    render(
      <RouterContextProvider router={router}>
        <NavigationBar activeRoute="/clientes" />
      </RouterContextProvider>
    );

    // WHEN: We check contactos item
    const contactosItem = screen.getByTestId('nav-item-contactos');

    // THEN: Contactos is NOT active
    expect(contactosItem).not.toHaveAttribute('data-active', 'true');
  });

  it('[P2] should NOT mark Clientes as active when route is /contactos', async () => {
    // GIVEN: NavigationBar mounted with activeRoute /contactos
    const router = await createLoadedTestRouter('/contactos');
    render(
      <RouterContextProvider router={router}>
        <NavigationBar activeRoute="/contactos" />
      </RouterContextProvider>
    );

    // WHEN: We check clientes item
    const clientesItem = screen.getByTestId('nav-item-clientes');

    // THEN: Clientes is NOT active
    expect(clientesItem).not.toHaveAttribute('data-active', 'true');
  });

  it('[P2] should display item labels as text content', async () => {
    // GIVEN: NavigationBar is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );

    // WHEN/THEN: Both label texts are visible
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Contactos')).toBeInTheDocument();
  });
});
