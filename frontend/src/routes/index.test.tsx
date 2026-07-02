/**
 * Story 1.2: Frontend Navigation Shell — Root Route Redirect Test
 * ATDD RED Phase — this test FAILS until src/routes/index.tsx is converted
 * into a `beforeLoad` redirect to /clientes (Task 4).
 *
 * Test case covered:
 *   [TC-E1-P2-03] Router mounted at '/' triggers a redirect and the final
 *                 location is '/clientes'.
 */

import { describe, it, expect } from 'vitest';
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router';
import { Route as IndexRoute } from './index';

describe('Root route redirect (/) → /clientes', () => {
  it('[TC-E1-P2-03] should redirect from "/" to "/clientes" via TanStack Router beforeLoad', async () => {
    // GIVEN: A minimal in-memory router built from the real index route + a stub /clientes route
    const rootRoute = createRootRoute({ component: () => <Outlet /> });

    const indexRoute = createRoute({
      ...IndexRoute.options,
      getParentRoute: () => rootRoute,
      path: '/',
    });

    const clientesRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/clientes',
      component: () => <div data-testid="clientes-view">Clientes</div>,
    });

    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute, clientesRoute]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });

    // WHEN: The router resolves the initial location
    await router.load();

    // THEN: The final location is /clientes (the beforeLoad on '/' throws a redirect)
    expect(router.state.location.pathname).toBe('/clientes');
  });
});
