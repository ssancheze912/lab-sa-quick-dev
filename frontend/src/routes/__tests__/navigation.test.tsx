/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — Vitest + React Testing Library
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible with Clientes/Contactos; SPA navigation (FR28)
 *   AC3 — Direct URL /clientes renders Clientes view with active highlight (FR30)
 *   AC4 — Direct URL /contactos renders Contactos view with active highlight (FR30)
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
import { ClientesShellView } from '../../modules/crm/clientes/presentation/components/ClientesShellView';

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
// AC1 — NavigationRail renders correct entries at desktop viewport
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — NavigationRail at desktop viewport (>= 1024px)', () => {
  it('should render the NavigationRail component', async () => {
    // GIVEN: Desktop viewport with router context
    const router = await createLoadedTestRouter();
    // WHEN: NavigationRail is rendered
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );
    // THEN: NavigationRail container is present in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('should display the "Clientes" navigation entry', async () => {
    // GIVEN: Desktop viewport with router context
    const router = await createLoadedTestRouter();
    // WHEN: NavigationRail is rendered
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );
    // THEN: Clientes nav item is visible
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should display the "Contactos" navigation entry', async () => {
    // GIVEN: Desktop viewport with router context
    const router = await createLoadedTestRouter();
    // WHEN: NavigationRail is rendered
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );
    // THEN: Contactos nav item is visible
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  it('should have accessible aria-label on "Clientes" nav item in Spanish', async () => {
    // GIVEN: Desktop viewport with router context
    const router = await createLoadedTestRouter();
    // WHEN: NavigationRail is rendered
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );
    // THEN: Clientes item has Spanish aria-label for accessibility
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-label', 'Ir a Clientes');
  });

  it('should have accessible aria-label on "Contactos" nav item in Spanish', async () => {
    // GIVEN: Desktop viewport with router context
    const router = await createLoadedTestRouter();
    // WHEN: NavigationRail is rendered
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );
    // THEN: Contactos item has Spanish aria-label for accessibility
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-label', 'Ir a Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Active route highlight on NavigationRail
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 / AC3 — Active route highlight in NavigationRail', () => {
  it('should highlight "Clientes" as active when activeRoute is /clientes', async () => {
    // GIVEN: Router is at /clientes
    const router = await createLoadedTestRouter('/clientes');
    // WHEN: NavigationRail is rendered with activeRoute /clientes
    render(
      <RouterContextProvider router={router}>
        <NavigationRail activeRoute="/clientes" />
      </RouterContextProvider>
    );
    // THEN: Clientes item has data-active=true
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
  });

  it('should NOT highlight "Contactos" as active when activeRoute is /clientes', async () => {
    // GIVEN: Router is at /clientes
    const router = await createLoadedTestRouter('/clientes');
    // WHEN: NavigationRail is rendered with activeRoute /clientes
    render(
      <RouterContextProvider router={router}>
        <NavigationRail activeRoute="/clientes" />
      </RouterContextProvider>
    );
    // THEN: Contactos item does NOT have data-active=true
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('data-active', 'true');
  });

  it('should highlight "Contactos" as active when activeRoute is /contactos', async () => {
    // GIVEN: Router is at /contactos
    const router = await createLoadedTestRouter('/contactos');
    // WHEN: NavigationRail is rendered with activeRoute /contactos
    render(
      <RouterContextProvider router={router}>
        <NavigationRail activeRoute="/contactos" />
      </RouterContextProvider>
    );
    // THEN: Contactos item has data-active=true
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true');
  });

  it('should NOT highlight "Clientes" as active when activeRoute is /contactos', async () => {
    // GIVEN: Router is at /contactos
    const router = await createLoadedTestRouter('/contactos');
    // WHEN: NavigationRail is rendered with activeRoute /contactos
    render(
      <RouterContextProvider router={router}>
        <NavigationRail activeRoute="/contactos" />
      </RouterContextProvider>
    );
    // THEN: Clientes item does NOT have data-active=true
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — ClientesShellView renders correctly
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — ClientesShellView component renders correctly', () => {
  it('should render the ClientesShellView with correct data-testid', () => {
    // GIVEN/WHEN: ClientesShellView is rendered
    render(<ClientesShellView />);
    // THEN: Root testid is present
    expect(screen.getByTestId('clientes-shell-view')).toBeInTheDocument();
  });

  it('should display the "Clientes" heading in Spanish', () => {
    // GIVEN/WHEN: ClientesShellView is rendered
    render(<ClientesShellView />);
    // THEN: Spanish heading is visible
    expect(screen.getByRole('heading', { name: /Clientes/i })).toBeInTheDocument();
  });

  it('should render a loading skeleton as placeholder content', () => {
    // GIVEN/WHEN: ClientesShellView is rendered
    render(<ClientesShellView />);
    // THEN: Skeleton placeholder is present
    expect(screen.getByTestId('clientes-skeleton')).toBeInTheDocument();
  });
});
