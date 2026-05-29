/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — Mobile — Vitest + React Testing Library
 *
 * Acceptance Criteria covered:
 *   AC2 — Mobile viewport (< 1024px) renders NavigationBar at bottom; items tappable (FR29)
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
// AC2 — NavigationBar renders on mobile viewport (< 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — NavigationBar at mobile viewport (< 1024px)', () => {
  it('should render the NavigationBar component', async () => {
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('should display the "Clientes" navigation item in the NavigationBar', async () => {
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should display the "Contactos" navigation item in the NavigationBar', async () => {
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  it('should have accessible aria-label on "Clientes" item in Spanish', async () => {
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-label', 'Ir a Clientes');
  });

  it('should have accessible aria-label on "Contactos" item in Spanish', async () => {
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-label', 'Ir a Contactos');
  });

  it('should highlight "Clientes" as active when activeRoute is /clientes', async () => {
    const router = await createLoadedTestRouter('/clientes');
    render(
      <RouterContextProvider router={router}>
        <NavigationBar activeRoute="/clientes" />
      </RouterContextProvider>
    );
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
  });

  it('should highlight "Contactos" as active when activeRoute is /contactos', async () => {
    const router = await createLoadedTestRouter('/contactos');
    render(
      <RouterContextProvider router={router}>
        <NavigationBar activeRoute="/contactos" />
      </RouterContextProvider>
    );
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true');
  });
});
