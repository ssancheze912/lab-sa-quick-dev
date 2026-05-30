// Story 2.2: Client Detail View
// Edge-Case / Boundary Tests — ClienteDetailView (testarch-automate expansion)
// Expands ATDD coverage with boundary conditions, error paths, and state transitions
// not covered by ClienteDetailView.test.tsx.

import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { ClienteDetailView } from './ClienteDetailView'
import { mockClientes } from '../../../../__mocks__/handlers/clientes'

const mockCliente = mockClientes[0] // Ana García
const mockCliente2 = mockClientes[1] // Pedro Pérez

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------
const server = setupServer(
  http.get('/api/v1/clientes', () => HttpResponse.json(mockClientes)),
  http.get('/api/v1/clientes/:id', ({ params }) => {
    const { id } = params
    const found = mockClientes.find((c) => c.id === id)
    if (!found) {
      return HttpResponse.json(
        { status: 404, title: 'Cliente no encontrado', detail: `No existe un cliente con ID ${id}.` },
        { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
      )
    }
    return HttpResponse.json(found)
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
}

async function renderWithRouter(initialPath: string) {
  const queryClient = createTestQueryClient()

  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: ClienteDetailView,
  })
  const baseRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: ClienteDetailView,
  })

  const routeTree = rootRoute.addChildren([detailRoute, baseRoute])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  await router.load()

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { ...utils, queryClient, router }
}

// ---------------------------------------------------------------------------
// Success panel — semantic/ARIA edge cases
// ---------------------------------------------------------------------------
describe('ClienteDetailView — success panel semantic HTML and ARIA', () => {
  it('Given client data loaded When success renders Then Nombre is in an h2 element', async () => {
    // AC#1 — spec mandates h2 for Nombre
    await renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Ana García')
    })
  })

  it('Given client data loaded When success renders Then detail panel has aria-label "Detalle del cliente"', async () => {
    // WCAG 2.1 AA — landmark region labelled for screen readers
    await renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      const panel = screen.getByTestId('cliente-detail-panel')
      expect(panel).toHaveAttribute('aria-label', 'Detalle del cliente')
    })
  })

  it('Given client data loaded When success renders Then NIT field has data-testid "cliente-detail-nit"', async () => {
    // Boundary: testid must be present for E2E selectors
    await renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nit')).toBeInTheDocument()
    })
  })

  it('Given client data loaded When success renders Then Teléfono field has data-testid "cliente-detail-telefono"', async () => {
    await renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-telefono')).toBeInTheDocument()
    })
  })

  it('Given client data loaded When success renders Then Ciudad field has data-testid "cliente-detail-ciudad"', async () => {
    await renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-ciudad')).toBeInTheDocument()
    })
  })

  it('Given second client When navigated directly Then detail panel shows Pedro Pérez', async () => {
    // Boundary: different client ID resolves different data
    await renderWithRouter(`/clientes/${mockCliente2.id}`)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Pedro Pérez')
    })
  })

  it('Given second client When navigated directly Then NIT 800-222-002 is shown', async () => {
    await renderWithRouter(`/clientes/${mockCliente2.id}`)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent('800-222-002')
    })
  })

  it('Given second client When navigated directly Then Ciudad Medellín is shown', async () => {
    await renderWithRouter(`/clientes/${mockCliente2.id}`)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Medellín')
    })
  })
})

// ---------------------------------------------------------------------------
// 404 not-found panel — boundary conditions
// ---------------------------------------------------------------------------
describe('ClienteDetailView — 404 not-found panel boundary', () => {
  it('Given 404 response When not-found panel renders Then secondary description text is visible', async () => {
    // AC#3 — component spec includes "El cliente solicitado no existe o fue eliminado."
    await renderWithRouter('/clientes/00000000-0000-0000-0000-000000000099')

    await waitFor(() => {
      expect(screen.getByText(/fue eliminado/i)).toBeInTheDocument()
    })
  })

  it('Given 404 response When not-found panel renders Then panel has data-testid "cliente-detail-panel"', async () => {
    // The 404 state must still expose the testid for E2E panel assertions
    await renderWithRouter('/clientes/00000000-0000-0000-0000-000000000099')

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })

  it('Given 404 response When not-found panel renders Then no h2 heading is present (no client data)', async () => {
    // Edge: success-state h2 must not bleed into error state
    await renderWithRouter('/clientes/00000000-0000-0000-0000-000000000099')

    await waitFor(() => {
      expect(screen.getByText(/cliente no encontrado/i)).toBeInTheDocument()
    })

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('Given 404 response When not-found renders Then NIT testid is absent', async () => {
    // Edge: data fields must not leak into error state
    await renderWithRouter('/clientes/00000000-0000-0000-0000-000000000099')

    await waitFor(() => {
      expect(screen.getByText(/cliente no encontrado/i)).toBeInTheDocument()
    })

    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Network error panel — boundary and error path
// ---------------------------------------------------------------------------
describe('ClienteDetailView — network error panel boundary', () => {
  it('Given 500 server error When error panel renders Then panel has data-testid "cliente-detail-panel"', async () => {
    // AC#4 — error panel must have testid so E2E selectors work
    server.use(
      http.get('/api/v1/clientes/:id', () =>
        HttpResponse.json({ status: 500, title: 'Internal error' }, { status: 500 }),
      ),
    )

    await renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })

  it('Given 500 server error When error panel renders Then "Reintentar" is a button (not a link)', async () => {
    // Boundary: must be a button for correct ARIA role (clickable action)
    server.use(
      http.get('/api/v1/clientes/:id', () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    )

    await renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /reintentar/i })
      expect(btn.tagName).toBe('BUTTON')
    })
  })

  it('Given network error When error panel renders Then no client data fields are visible', async () => {
    // Edge: error state must not expose stale data
    server.use(http.get('/api/v1/clientes/:id', () => HttpResponse.error()))

    await renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar el cliente/i)).toBeInTheDocument()
    })

    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-telefono')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-ciudad')).not.toBeInTheDocument()
  })

  it('Given 403 forbidden error (non-404 Axios error) When error panel renders Then retry panel is shown', async () => {
    // Boundary: 403 is a non-404 Axios error — must show retry, not not-found
    server.use(
      http.get('/api/v1/clientes/:id', () =>
        HttpResponse.json({ status: 403, title: 'Forbidden' }, { status: 403 }),
      ),
    )

    await renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar el cliente/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })
  })

  it('Given 403 forbidden error When error renders Then "Cliente no encontrado" is NOT shown', async () => {
    // Edge: only 404 must show not-found; 403 must NOT trigger that branch
    server.use(
      http.get('/api/v1/clientes/:id', () =>
        HttpResponse.json({ status: 403, title: 'Forbidden' }, { status: 403 }),
      ),
    )

    await renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })

    expect(screen.queryByText(/cliente no encontrado/i)).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Loading state — boundary conditions
// ---------------------------------------------------------------------------
describe('ClienteDetailView — skeleton loading boundary', () => {
  it('Given loading When skeleton renders Then skeleton testid container is present', async () => {
    server.use(
      http.get('/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(mockCliente)
      }),
    )

    await renderWithRouter(`/clientes/${mockCliente.id}`)

    expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument()
  })

  it('Given loading When skeleton renders Then aria-busy is "true"', async () => {
    server.use(
      http.get('/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(mockCliente)
      }),
    )

    await renderWithRouter(`/clientes/${mockCliente.id}`)

    const skeleton = screen.getByTestId('cliente-detail-skeleton')
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
  })

  it('Given loading When skeleton renders Then no client data fields are visible', async () => {
    // Edge: skeleton must not prematurely show field testids
    server.use(
      http.get('/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(mockCliente)
      }),
    )

    await renderWithRouter(`/clientes/${mockCliente.id}`)

    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-telefono')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-ciudad')).not.toBeInTheDocument()
  })

  it('Given loading then data arrives When data loads Then skeleton is replaced by detail panel', async () => {
    // State transition: loading → success
    await renderWithRouter(`/clientes/${mockCliente.id}`)

    // Eventually: skeleton gone, detail panel present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Empty state — no clienteId boundary
// ---------------------------------------------------------------------------
describe('ClienteDetailView — empty state boundary conditions', () => {
  it('Given no clienteId When empty state renders Then no skeleton is shown', async () => {
    // Edge: empty state must not show loading skeleton
    await renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByText(/selecciona un cliente para ver su detalle/i)).toBeInTheDocument()
    })

    expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
  })

  it('Given no clienteId When empty state renders Then no error panel is shown', async () => {
    // Edge: empty state is distinct from error state
    await renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByText(/selecciona un cliente para ver su detalle/i)).toBeInTheDocument()
    })

    expect(screen.queryByText(/no se pudo cargar/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument()
  })

  it('Given no clienteId When empty state renders Then no detail panel testid is present', async () => {
    // The testid only appears when a client is being shown or errored
    await renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByText(/selecciona un cliente para ver su detalle/i)).toBeInTheDocument()
    })

    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Retry interaction — boundary condition
// ---------------------------------------------------------------------------
describe('ClienteDetailView — retry interaction boundary', () => {
  it('Given retry button clicked When refetch resolves Then detail panel replaces error panel', async () => {
    // Error path → success transition after retry
    let callCount = 0
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.json({ status: 500 }, { status: 500 })
        }
        return HttpResponse.json(mockCliente)
      }),
    )

    const user = userEvent.setup()
    await renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Ana García')
    })
  })
})
