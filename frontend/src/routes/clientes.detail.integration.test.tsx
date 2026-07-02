import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
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
import { server } from '@/test/msw/server'
import { seedClientes } from '@/test/msw/handlers'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

/**
 * Story 2.2 — route integration tests.
 * Instantiates a small in-memory router that mirrors the production tree
 * (/clientes as a layout with two children: /clientes/ index and
 * /clientes/$clienteId). Verifies deep-link, index placeholder, and the
 * 404 branch (mitigates R-010).
 */
function buildRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })

  const clientesLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => (
      <section className="flex h-full">
        <ClienteListView />
        <Outlet />
      </section>
    ),
  })

  const clientesIndexRoute = createRoute({
    getParentRoute: () => clientesLayoutRoute,
    path: '/',
    component: () => (
      <div
        data-testid="cliente-detail-empty"
        className="hidden flex-1 items-center justify-center text-slate-400 lg:flex"
      >
        Selecciona un cliente para ver el detalle
      </div>
    ),
  })

  const clienteDetailRoute = createRoute({
    getParentRoute: () => clientesLayoutRoute,
    path: '$clienteId',
    component: function ClienteDetailRoute() {
      const { clienteId } = clienteDetailRoute.useParams()
      return <ClienteDetailView clienteId={clienteId} />
    },
  })

  const routeTree = rootRoute.addChildren([
    clientesLayoutRoute.addChildren([clientesIndexRoute, clienteDetailRoute]),
  ])

  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

function withQuery(children: React.ReactNode) {
  // retryDelay: 0 — useCliente sets its own retry (2 retries on non-404).
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('Story 2.2 — clientes routing integration', () => {
  it('[P1#12] deep-link /clientes/:id renders the detail panel with the seed data', async () => {
    const target = seedClientes[0]
    const router = buildRouter(`/clientes/${target.id}`)
    render(withQuery(<RouterProvider router={router} />))

    await screen.findByTestId('cliente-detail-panel')
    expect(
      screen.getByRole('heading', { level: 2, name: target.nombre }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent(target.nit)
  })

  it('[P1#3/R-010] deep-link with an unknown id renders NotFoundClientePanel', async () => {
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json(
          { title: 'Cliente no encontrado', status: 404 },
          { status: 404 },
        ),
      ),
    )

    const router = buildRouter('/clientes/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    render(withQuery(<RouterProvider router={router} />))

    await screen.findByTestId('cliente-not-found')
    expect(screen.queryByTestId('cliente-detail-panel')).toBeNull()
  })

  it('[AC7] /clientes without :id renders the empty-detail placeholder', async () => {
    const router = buildRouter('/clientes')
    render(withQuery(<RouterProvider router={router} />))

    await screen.findByTestId('cliente-detail-empty')
    expect(screen.queryByTestId('cliente-detail-panel')).toBeNull()
  })
})
