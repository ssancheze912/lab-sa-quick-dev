import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
 * `withQueryClient` (opt-in, defaults to false to avoid changing behavior for
 * existing callers like AppShell/NotFoundView tests): wraps `ui` in a FRESH
 * `QueryClientProvider` per call (provider isolation pattern — see
 * component-tdd.md) so TanStack Query hooks (`useClientes`, etc.) resolve
 * inside a real QueryClient with zero state bleed between tests. Retries are
 * disabled so error-path tests (ErrorPanel/network failure) resolve
 * immediately instead of retrying for several seconds.
 *
 * Given a component under test that reads/writes router state,
 * When it's rendered via this helper at a given path,
 * Then router hooks resolve exactly as they would in the real app shell.
 */
export function renderWithRouter(
  ui: ReactNode,
  { initialPath = '/', withQueryClient = false }: { initialPath?: string; withQueryClient?: boolean } = {},
) {
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

  const tree = <RouterContextProvider router={router}>{ui}</RouterContextProvider>

  if (!withQueryClient) {
    return render(tree)
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(<QueryClientProvider client={queryClient}>{tree}</QueryClientProvider>)
}
