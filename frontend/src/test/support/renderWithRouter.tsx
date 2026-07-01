import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'

/**
 * Test support helper: mounts `ui` inside a real TanStack Router instance
 * (memory history) starting at `initialPath`. AppShell/NotFoundView are
 * router-agnostic themselves but depend on router hooks (`useNavigate`,
 * `useRouterState`) which only work inside a RouterProvider tree.
 *
 * Given a component under test that reads/writes router state,
 * When it's rendered via this helper at a given path,
 * Then router hooks resolve exactly as they would in the real app shell.
 */
export function renderWithRouter(ui: ReactNode, { initialPath = '/' }: { initialPath?: string } = {}) {
  const rootRoute = createRootRoute()
  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: initialPath,
    component: () => ui,
  })

  const routeTree = rootRoute.addChildren([testRoute])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return render(<RouterProvider router={router} />)
}
