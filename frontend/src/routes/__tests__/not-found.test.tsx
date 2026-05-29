/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — 404 Not Found — Vitest + React Testing Library
 *
 * Acceptance Criteria covered:
 *   AC5 — Unknown route renders graceful 404 view in Spanish with link to /clientes
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

import { NotFoundView } from '../../shared/components/ui/NotFoundView';

// ─────────────────────────────────────────────────────────────────────────────
// Test router factory
// ─────────────────────────────────────────────────────────────────────────────

async function createLoadedTestRouter(initialPath = '/unknown') {
  const rootRoute = createRootRoute({ component: Outlet });
  const clientesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/clientes', component: () => null });
  const routeTree = rootRoute.addChildren([clientesRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => { await router.load(); });
  return router;
}

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — NotFoundView renders correctly for unknown routes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — NotFoundView for unknown routes', () => {
  it('should render the not-found view with correct data-testid', async () => {
    // GIVEN: User navigated to an unknown route
    const router = await createLoadedTestRouter();
    // WHEN: NotFoundView is rendered
    render(
      <RouterContextProvider router={router}>
        <NotFoundView />
      </RouterContextProvider>
    );
    // THEN: Not-found container is present
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
  });

  it('should display Spanish message "Página no encontrada"', async () => {
    // GIVEN: User navigated to an unknown route
    const router = await createLoadedTestRouter();
    // WHEN: NotFoundView is rendered
    render(
      <RouterContextProvider router={router}>
        <NotFoundView />
      </RouterContextProvider>
    );
    // THEN: Spanish not-found message is shown
    expect(screen.getByTestId('not-found-message')).toHaveTextContent('Página no encontrada');
  });

  it('should display a link to return to /clientes', async () => {
    // GIVEN: User navigated to an unknown route
    const router = await createLoadedTestRouter();
    // WHEN: NotFoundView is rendered
    render(
      <RouterContextProvider router={router}>
        <NotFoundView />
      </RouterContextProvider>
    );
    // THEN: Back link to /clientes is present
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink).toBeInTheDocument();
  });

  it('should have the back link pointing to /clientes', async () => {
    // GIVEN: User navigated to an unknown route
    const router = await createLoadedTestRouter();
    // WHEN: NotFoundView is rendered
    render(
      <RouterContextProvider router={router}>
        <NotFoundView />
      </RouterContextProvider>
    );
    // THEN: Back link href is /clientes
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink).toHaveAttribute('href', '/clientes');
  });

  it('should display a graceful message (not a raw error or stack trace)', async () => {
    // GIVEN: User navigated to an unknown route
    const router = await createLoadedTestRouter();
    // WHEN: NotFoundView is rendered
    render(
      <RouterContextProvider router={router}>
        <NotFoundView />
      </RouterContextProvider>
    );
    // THEN: View is present and no raw error text is shown
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
    expect(screen.queryByText(/Error|Exception|stack/i)).not.toBeInTheDocument();
  });
});
