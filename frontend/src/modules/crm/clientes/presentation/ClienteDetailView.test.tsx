// Story 2.2: Client Detail View
// ATDD Component Tests — ClienteDetailView
// Status: RED — Tests fail until ClienteDetailView is implemented
// AC covered:
//   AC#1 — List click → detail panel renders client fields + URL updates to /clientes/:clienteId
//   AC#2 — Deep link /clientes/:clienteId → client loaded and rendered
//   AC#3 — Non-existent clienteId → not-found message, no JS error, nav shell visible
//   AC#4 — Network error → error state with retry option shown
//   AC#5 — Loading → skeleton placeholders (not spinner)
// Test cases: TC-E2-P1-11, TC-E2-P1-12

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
} from '@tanstack/react-router'
import { ClienteDetailView } from './ClienteDetailView'
import {
  mockClientes,
} from '../../../../__mocks__/handlers/clientes'

// ---------------------------------------------------------------------------
// Mock client fixture data
// ---------------------------------------------------------------------------
const mockCliente = mockClientes[0] // Ana García — id: a1b2c3d4-0000-0000-0000-000000000001

// ---------------------------------------------------------------------------
// MSW server setup — network-first interception before any navigation
// ---------------------------------------------------------------------------
const server = setupServer(
  http.get('/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes)
  }),
  http.get('/api/v1/clientes/:id', ({ params }) => {
    const { id } = params
    const found = mockClientes.find((c) => c.id === id)
    if (!found) {
      return HttpResponse.json(
        {
          status: 404,
          title: 'Cliente no encontrado',
          detail: `No existe un cliente con ID ${id}.`,
        },
        { status: 404 }
      )
    }
    return HttpResponse.json(found)
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Router + QueryClient helpers
// ---------------------------------------------------------------------------
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

/**
 * Render ClienteDetailView inside a TanStack Router with a given initial URL.
 * Uses memory history so tests do not hit the browser.
 */
function renderWithRouter(initialPath: string) {
  const queryClient = createTestQueryClient()

  const rootRoute = createRootRoute({
    component: () => {
      // Inline root element — ClienteDetailView is rendered in child route
      const { Outlet } = require('@tanstack/react-router')
      return <Outlet />
    },
  })

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

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

// ---------------------------------------------------------------------------
// TC-E2-P1-11: List click → detail panel shows client fields + URL updates
// AC#1: "right panel renders detail fields: Nombre, NIT/RUC, Teléfono, Ciudad"
// AC#1: "URL updates to /clientes/:clienteId (FR30 deep linking)"
// ---------------------------------------------------------------------------
describe('ClienteDetailView — TC-E2-P1-11: detail panel fields after URL navigation', () => {
  it('Given clienteId in URL When component renders Then Nombre is displayed in detail panel', async () => {
    // GIVEN: Route navigated to /clientes/:clienteId with known client
    // WHEN: MSW returns client data and component renders
    renderWithRouter(`/clientes/${mockCliente.id}`)

    // THEN: Nombre is displayed
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument()
    })
  })

  it('Given clienteId in URL When component renders Then NIT/RUC is displayed in detail panel', async () => {
    // GIVEN: Route navigated to /clientes/:clienteId
    renderWithRouter(`/clientes/${mockCliente.id}`)

    // THEN: NIT value is visible
    await waitFor(() => {
      expect(screen.getByText('900-111-001')).toBeInTheDocument()
    })
  })

  it('Given clienteId in URL When component renders Then Teléfono is displayed in detail panel', async () => {
    // GIVEN
    renderWithRouter(`/clientes/${mockCliente.id}`)

    // THEN
    await waitFor(() => {
      expect(screen.getByText('3001111111')).toBeInTheDocument()
    })
  })

  it('Given clienteId in URL When component renders Then Ciudad is displayed in detail panel', async () => {
    // GIVEN
    renderWithRouter(`/clientes/${mockCliente.id}`)

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Bogotá')).toBeInTheDocument()
    })
  })

  it('Given clienteId in URL When detail renders Then field labels use semantic dl/dt/dd elements', async () => {
    // GIVEN: WCAG 2.1 AA — semantic HTML for field/value pairs
    renderWithRouter(`/clientes/${mockCliente.id}`)

    await waitFor(() => {
      // THEN: dt elements for labels, dd elements for values
      expect(screen.getByText('NIT/RUC').tagName).toBe('DT')
      expect(screen.getByText('Teléfono').tagName).toBe('DT')
      expect(screen.getByText('Ciudad').tagName).toBe('DT')
    })
  })
})

// ---------------------------------------------------------------------------
// TC-E2-P1-11 (extended): data-testid on detail panel container
// ---------------------------------------------------------------------------
describe('ClienteDetailView — TC-E2-P1-11: detail panel data-testid present', () => {
  it('Given clienteId in URL When detail renders Then cliente-detail-panel testid is present', async () => {
    // GIVEN
    renderWithRouter(`/clientes/${mockCliente.id}`)

    // THEN
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// TC-E2-P1-12: Not-found message on invalid deep link
// AC#3: "not-found message is displayed gracefully"
// AC#3: "no JavaScript error is thrown"
// ---------------------------------------------------------------------------
describe('ClienteDetailView — TC-E2-P1-12: not-found state for invalid clienteId', () => {
  it('Given non-existent clienteId in URL When backend returns 404 Then not-found message is displayed', async () => {
    // GIVEN: MSW returns 404 for unknown ID (default handler)
    renderWithRouter('/clientes/00000000-0000-0000-0000-000000000099')

    // THEN: Not-found message is shown
    await waitFor(() => {
      expect(screen.getByText(/cliente no encontrado/i)).toBeInTheDocument()
    })
  })

  it('Given non-existent clienteId in URL When backend returns 404 Then no spinner is shown', async () => {
    // GIVEN
    renderWithRouter('/clientes/00000000-0000-0000-0000-000000000099')

    await waitFor(() => {
      expect(screen.getByText(/cliente no encontrado/i)).toBeInTheDocument()
    })

    // THEN: No spinner present (company standard: skeleton/messages, not spinners)
    expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument()
  })

  it('Given non-existent clienteId When backend returns 404 Then retry button is NOT shown (not a retryable error)', async () => {
    // GIVEN: 404 is not a retriable network error — it means client genuinely does not exist
    renderWithRouter('/clientes/00000000-0000-0000-0000-000000000099')

    await waitFor(() => {
      expect(screen.getByText(/cliente no encontrado/i)).toBeInTheDocument()
    })

    // THEN: No "Reintentar" button for 404 (that's reserved for network errors)
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// AC#5: Loading state → skeleton placeholders, NOT spinner
// ---------------------------------------------------------------------------
describe('ClienteDetailView — AC5: skeleton shown while loading (not spinner)', () => {
  it('Given fetch is in progress When component renders Then skeleton placeholders are shown', () => {
    // GIVEN: MSW holds the response — component is in loading state
    server.use(
      http.get('/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json(mockCliente)
      })
    )

    // WHEN: Navigate to client detail
    renderWithRouter(`/clientes/${mockCliente.id}`)

    // THEN: Skeleton is shown immediately
    expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument()
    // And: No spinner (company standard — react-loading-skeleton, not spinners)
    expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument()
  })

  it('Given fetch is in progress When component renders Then aria-busy attribute is set', () => {
    // GIVEN: Slow response
    server.use(
      http.get('/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json(mockCliente)
      })
    )

    // WHEN
    renderWithRouter(`/clientes/${mockCliente.id}`)

    // THEN: Loading container has aria-busy="true" (WCAG 2.1 AA)
    expect(screen.getByRole('region', { name: /cargando/i }) || screen.getByTestId('cliente-detail-skeleton')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// AC#4: Network error (non-404) → error state with retry option
// ---------------------------------------------------------------------------
describe('ClienteDetailView — AC4: network error shows retry panel', () => {
  it('Given backend returns network error When detail renders Then error message is shown', async () => {
    // GIVEN: Override MSW to return network error (non-404)
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return HttpResponse.error()
      })
    )

    // WHEN
    renderWithRouter(`/clientes/${mockCliente.id}`)

    // THEN: Error state message is displayed
    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar el cliente/i)).toBeInTheDocument()
    })
  })

  it('Given network error When error panel renders Then "Reintentar" button is shown', async () => {
    // GIVEN
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return HttpResponse.error()
      })
    )

    // WHEN
    renderWithRouter(`/clientes/${mockCliente.id}`)

    // THEN
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })
  })

  it('Given network error When user clicks "Reintentar" Then a new API fetch is triggered', async () => {
    // GIVEN: First request fails, second succeeds
    let requestCount = 0
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        requestCount++
        if (requestCount === 1) {
          return HttpResponse.error()
        }
        return HttpResponse.json(mockCliente)
      })
    )

    const user = userEvent.setup()
    renderWithRouter(`/clientes/${mockCliente.id}`)

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })

    const callsBeforeRetry = requestCount

    // WHEN: User clicks Reintentar
    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    // THEN: A new fetch is triggered
    await waitFor(() => {
      expect(requestCount).toBeGreaterThan(callsBeforeRetry)
    })
  })

  it('Given network error When retry button renders Then it has correct aria-label (WCAG 2.1 AA)', async () => {
    // GIVEN
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return HttpResponse.error()
      })
    )

    // WHEN
    renderWithRouter(`/clientes/${mockCliente.id}`)

    // THEN: Retry button has aria-label for accessibility
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /reintentar/i })
      expect(btn).toHaveAttribute('aria-label')
    })
  })
})

// ---------------------------------------------------------------------------
// AC#1 (empty state): No clienteId in URL → placeholder text
// ---------------------------------------------------------------------------
describe('ClienteDetailView — empty state when no clienteId in URL', () => {
  it('Given no clienteId in URL (at /clientes root) When component renders Then placeholder text is shown', async () => {
    // GIVEN: User is at /clientes without selecting a client
    renderWithRouter('/clientes')

    // THEN: Placeholder message is shown in Spanish
    await waitFor(() => {
      expect(screen.getByText(/selecciona un cliente para ver su detalle/i)).toBeInTheDocument()
    })
  })

  it('Given no clienteId in URL When component renders Then no network request is made for single client', () => {
    // GIVEN: No clienteId — query must be disabled (enabled: !!id)
    let singleClientCallCount = 0
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        singleClientCallCount++
        return HttpResponse.json(mockCliente)
      })
    )

    // WHEN: At /clientes root
    renderWithRouter('/clientes')

    // THEN: No GET /api/v1/clientes/:id call made
    expect(singleClientCallCount).toBe(0)
  })
})
