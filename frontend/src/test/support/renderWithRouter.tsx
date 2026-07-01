import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterContextProvider,
} from '@tanstack/react-router'

/**
 * Test support helper: mounts `ui` inside a real TanStack Router instance
 * (memory history) starting at `initialPath`. AppShell/NotFoundView are
 * router-agnostic themselves but depend on router hooks (`useNavigate`,
 * `useRouterState`, `Link`) which only work inside a router context tree.
 *
 * Uses the lower-level `RouterContextProvider` (router context only) instead
 * of the full `RouterProvider` (which renders `<Matches />`, gated behind the
 * router's async `Transitioner` load lifecycle — that pending phase never
 * resolves within a synchronous test body, since TanStack Router's initial
 * match/load pipeline is always microtask-async, even with zero loaders).
 * `RouterContextProvider` skips that gate and renders `ui` immediately while
 * still providing full router context, so router hooks resolve synchronously
 * against `initialPath`.
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
    component: () => null,
  })

  const routeTree = rootRoute.addChildren([testRoute])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return render(<RouterContextProvider router={router}>{ui}</RouterContextProvider>)
}
