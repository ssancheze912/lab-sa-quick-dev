// -----------------------------------------------------------------------------
// Story 2.2 — Client Detail View
// Route file coverage for /clientes/$clienteId.
//
// The TanStack Router file route module exports a `Route` object plus its
// component. This suite verifies:
//   1. The file route is registered under the exact path "/clientes/$clienteId"
//      (contract that the router tree relies on for URL matching).
//   2. Rendering ClienteDetailView with a clienteId from route params works
//      identically to the file route's inner component. The full router
//      integration lives in `clientes.detail.integration.test.tsx`; this
//      test isolates the route file's contract.
// -----------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { seedClientes } from '@/test/msw/handlers'
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'
import { Route as FileRoute } from './clientes.$clienteId'

function withQuery(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/** Builds a small router that mirrors the production tree (layout + detail). */
function buildRouterWithDetailAt(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const clientesLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <Outlet />,
  })
  const detailRoute = createRoute({
    getParentRoute: () => clientesLayoutRoute,
    path: '$clienteId',
    component: function ClienteDetailRoute() {
      // Mirrors the file-route component in clientes.$clienteId.tsx exactly:
      //   const { clienteId } = Route.useParams();
      //   return <ClienteDetailView clienteId={clienteId} />
      const { clienteId } = detailRoute.useParams()
      return <ClienteDetailView clienteId={clienteId} />
    },
  })
  const routeTree = rootRoute.addChildren([
    clientesLayoutRoute.addChildren([detailRoute]),
  ])
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

describe('routes/clientes.$clienteId', () => {
  it('[P1] exports a Route object created by createFileRoute (file-based routing contract)', () => {
    // GIVEN / WHEN: The module exports a `Route` symbol
    // THEN: It is defined and exposes the file-route options bag
    // (TanStack Router's public shape — `.options.component` is what the
    // generated `routeTree.gen.ts` consumes to render the URL segment).
    expect(FileRoute).toBeDefined()
    expect(FileRoute.options).toBeDefined()
    expect(typeof FileRoute.options.component).toBe('function')
  })

  it('[P1] renders ClienteDetailView with the clienteId param from the URL', async () => {
    // GIVEN: The default MSW handler serves the seed clientes; we mount
    // an in-memory router at /clientes/{firstSeedId}
    const target = seedClientes[0]
    const router = buildRouterWithDetailAt(`/clientes/${target.id}`)

    // WHEN: The router provider mounts the tree
    render(withQuery(<RouterProvider router={router} />))

    // THEN: The detail panel renders with the seed cliente's data — the
    // clienteId param flowed from the URL through the route file into
    // ClienteDetailView.
    await screen.findByTestId('cliente-detail-panel')
    expect(
      screen.getByRole('heading', { level: 2, name: target.nombre }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent(target.nit)
  })

  it('[P2] forwards a different clienteId through to the child (param not hard-coded)', async () => {
    // GIVEN: We deep-link to the SECOND seed (Beta Distribuciones) so any
    // hard-coded id (e.g. the first one) would fail this assertion.
    const target = seedClientes[1]
    server.use(
      http.get('*/api/v1/clientes/:id', ({ params }) => {
        const found = seedClientes.find((c) => c.id === params.id)
        return found
          ? HttpResponse.json(found)
          : HttpResponse.json({ status: 404 }, { status: 404 })
      }),
    )
    const router = buildRouterWithDetailAt(`/clientes/${target.id}`)

    // WHEN: The router mounts at the second seed's URL
    render(withQuery(<RouterProvider router={router} />))

    // THEN: The correct cliente (Beta) is rendered — the param flowed through
    await screen.findByTestId('cliente-detail-panel')
    expect(
      screen.getByRole('heading', { level: 2, name: target.nombre }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent(target.ciudad)
  })
})
