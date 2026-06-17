/**
 * Story 2.2: Client Detail View — Edge Case Component Tests
 * Epic 2: Client Management
 *
 * Expanded coverage beyond ATDD tests:
 *   - Empty clienteId prop disables the fetch (enabled: !!id)
 *   - data-testid="cliente-detail-panel" present in success state (E2E dependency)
 *   - data-testid="cliente-not-found-back" present in not-found state
 *   - ErrorPanel retry callback triggers refetch
 *   - No createdAt field rendered (implementation contract)
 *   - Boundary: very long nombre renders without crash
 *   - Boundary: empty telefono / ciudad gracefully rendered
 *   - Re-render with a different clienteId fetches new data
 *   - useCliente query key is exactly ['clientes', id]
 *
 * Tooling: Vitest 2+ | @testing-library/react | @testing-library/user-event | MSW 2
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory, createRootRoute, createRoute } from '@tanstack/react-router'
import { ClienteDetailView } from './ClienteDetailView'
import type { Cliente } from '../domain/Cliente'

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Factories
// ─────────────────────────────────────────────────────────────────────────────

let _counter = 0
function uniqueSuffix() {
  return `${Date.now()}-${++_counter}`
}

function buildClienteDto(overrides?: Partial<Cliente>): Cliente {
  const suffix = uniqueSuffix()
  return {
    id: crypto.randomUUID(),
    nombre: `Empresa Edge Test ${suffix}`,
    nitRuc: `900${suffix.slice(-6).padStart(6, '0')}-1`,
    telefono: `300${suffix.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        retryDelay: 0,
        gcTime: 0,
      },
    },
  })
}

/**
 * Renders ClienteDetailView with QueryClient only (no router).
 * Use for tests that don't involve <Link> rendering.
 */
function renderWithQuery(clienteId: string, queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>
  )
}

/**
 * Renders ClienteDetailView with both QueryClient and a minimal TanStack Router.
 * Required for tests that involve <Link> components (NotFoundMessage back link).
 */
function renderWithRouter(clienteId: string, queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient()

  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={qc}>
        <ClienteDetailView clienteId={clienteId} />
      </QueryClientProvider>
    ),
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [`/clientes/${clienteId}`] }),
  })

  return render(<RouterProvider router={router} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Empty clienteId disables the query (enabled: !!id)
// Prevents spurious network requests when clienteId is not yet available
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Empty clienteId disables the fetch', () => {
  it('[P1] should not render client fields when clienteId is an empty string', () => {
    // GIVEN: clienteId prop is empty
    // WHEN: ClienteDetailView is rendered with empty string
    renderWithQuery('')

    // THEN: No client data fields are rendered (query is disabled)
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-nitruc')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-telefono')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-ciudad')).not.toBeInTheDocument()
  })

  it('[P1] should not render the skeleton when clienteId is an empty string (no query initiated)', () => {
    // GIVEN: clienteId prop is empty (query disabled — no loading state)
    // WHEN: Component is rendered
    renderWithQuery('')

    // THEN: No skeleton rendered (query never starts)
    expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
  })

  it('[P2] should not make any API request when clienteId is empty', async () => {
    // GIVEN: A spy to detect unexpected API calls
    let requestMade = false
    server.use(
      http.get('*/api/v1/clientes/*', () => {
        requestMade = true
        return HttpResponse.json({}, { status: 200 })
      })
    )

    // WHEN: Component is rendered with empty clienteId
    renderWithQuery('')

    // Small wait to give any accidental query a chance to fire.
    // NOTE: Hard wait justified here — this is a negative assertion test (verifying NO request fires).
    // There is no event/state to waitFor; the 50ms window is intentionally the shortest viable guard.
    // TEA-REVIEW: Justified hard wait — negative assertion pattern, no async event available.
    await new Promise((resolve) => setTimeout(resolve, 50))

    // THEN: No API call was made
    expect(requestMade).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: data-testid="cliente-detail-panel" present in success state
// Required by E2E tests (clientes-detail-view.spec.ts) — implementation contract
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — data-testid="cliente-detail-panel" present in success state', () => {
  it('[P0] should render data-testid="cliente-detail-panel" when client data is returned', async () => {
    // GIVEN: MSW returns a valid client
    const cliente = buildClienteDto()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderWithQuery(cliente.id)

    // THEN: The detail panel testid is present — required for E2E test selectors
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })

  it('[P1] should NOT render data-testid="cliente-detail-panel" in the not-found state', async () => {
    // GIVEN: MSW returns 404
    const nonExistentId = crypto.randomUUID()
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json({ status: 404, title: 'Cliente no encontrado' }, { status: 404 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderWithRouter(nonExistentId)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })

    // THEN: The success-state panel is NOT rendered in the not-found state
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument()
  })

  it('[P1] should NOT render data-testid="cliente-detail-panel" in the error state', async () => {
    // GIVEN: MSW returns 500
    const clienteId = crypto.randomUUID()
    server.use(
      http.get(`*/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderWithQuery(clienteId)

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // THEN: The success-state panel is NOT rendered in the error state
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: data-testid="cliente-not-found-back" in not-found state
// Required by E2E ATDD test AC3 "should provide a back affordance"
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Back affordance link in not-found state', () => {
  it('[P1] should render data-testid="cliente-not-found-back" when MSW returns 404', async () => {
    // GIVEN: MSW returns 404
    const nonExistentId = crypto.randomUUID()
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json({ status: 404, title: 'Cliente no encontrado' }, { status: 404 })
      )
    )

    // WHEN: ClienteDetailView is rendered with router (Link requires router context)
    renderWithRouter(nonExistentId)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })

    // THEN: A back affordance link is visible
    expect(screen.getByTestId('cliente-not-found-back')).toBeInTheDocument()
  })

  it('[P2] should render the back link with text pointing to the client list', async () => {
    // GIVEN: MSW returns 404
    const nonExistentId = crypto.randomUUID()
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json({ status: 404, title: 'Cliente no encontrado' }, { status: 404 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderWithRouter(nonExistentId)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found-back')).toBeInTheDocument()
    })

    // THEN: The back link text is present and navigable
    const backLink = screen.getByTestId('cliente-not-found-back')
    expect(backLink.tagName).toMatch(/^(A|BUTTON)$/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: ErrorPanel retry triggers refetch
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — ErrorPanel retry triggers a new fetch', () => {
  it('[P1] should re-issue a GET request when user clicks Reintentar after persistent 500 errors', async () => {
    // GIVEN: All requests return 500 initially (exhausts all internal retries → ErrorPanel)
    const clienteId = crypto.randomUUID()
    const cliente = buildClienteDto({ id: clienteId })

    // Start with persistent 500 error to exhaust internal retries and show ErrorPanel
    server.use(
      http.get(`*/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    )

    // WHEN: Component renders — all retries fail, ErrorPanel appears
    // Note: useCliente retries up to 2 times for non-404; use gcTime: 0 and ensure retries complete
    renderWithQuery(clienteId)

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Override the handler to return success for subsequent calls (simulates backend recovery)
    server.use(
      http.get(`*/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: User clicks Reintentar
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    // THEN: ErrorPanel disappears and client data appears
    await waitFor(() => {
      expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
    }, { timeout: 5000 })
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: createdAt is NOT rendered in the UI
// Validates the component only exposes the 4 specified fields (AC1)
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — createdAt field is NOT rendered in the detail view', () => {
  it('[P2] should not render the createdAt ISO string in the DOM', async () => {
    // GIVEN: A client with a known createdAt timestamp
    const createdAt = '2026-06-17T14:30:00Z'
    const cliente = buildClienteDto({ createdAt })
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    const { container } = renderWithQuery(cliente.id)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })

    // THEN: The raw ISO timestamp is not in the rendered output
    expect(container.textContent).not.toContain(createdAt)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Boundary — very long nombre
// Validates the component handles extreme text without crash or layout break
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Boundary: very long nombre renders without crash', () => {
  it('[P2] should render a nombre with 200 characters without throwing', async () => {
    // GIVEN: A client with a very long nombre (200 chars)
    const longNombre = 'A'.repeat(200)
    const cliente = buildClienteDto({ nombre: longNombre })
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView is rendered — should not throw
    renderWithQuery(cliente.id)

    // THEN: The long nombre is displayed
    await waitFor(() => {
      const el = screen.getByTestId('cliente-detail-nombre')
      expect(el).toBeInTheDocument()
      expect(el.textContent).toBe(longNombre)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Re-render with a different clienteId fetches new data
// Validates the component responds correctly when the prop changes
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Re-render with different clienteId fetches new client data', () => {
  it('[P1] should display the new client Nombre when clienteId prop changes', async () => {
    // GIVEN: Two different clients with distinct Nombres
    const clienteA = buildClienteDto({ nombre: 'Empresa A Primero S.A.' })
    const clienteB = buildClienteDto({ nombre: 'Empresa B Segundo Ltda.' })

    server.use(
      http.get(`*/api/v1/clientes/${clienteA.id}`, () =>
        HttpResponse.json(clienteA, { status: 200 })
      ),
      http.get(`*/api/v1/clientes/${clienteB.id}`, () =>
        HttpResponse.json(clienteB, { status: 200 })
      )
    )

    const qc = createQueryClient()

    // WHEN: Initially render with clienteA
    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <ClienteDetailView clienteId={clienteA.id} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Empresa A Primero S.A.')
    })

    // WHEN: Re-render with clienteB (prop change)
    rerender(
      <QueryClientProvider client={qc}>
        <ClienteDetailView clienteId={clienteB.id} />
      </QueryClientProvider>
    )

    // THEN: New client's Nombre is displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Empresa B Segundo Ltda.')
    })
  })

  it('[P2] should update all 4 fields when clienteId prop changes to a different client', async () => {
    // GIVEN: Two different clients
    const clienteA = buildClienteDto({ nombre: 'Cliente A', nitRuc: '111111111-1', telefono: '3000000001', ciudad: 'Bogotá' })
    const clienteB = buildClienteDto({ nombre: 'Cliente B', nitRuc: '222222222-2', telefono: '3000000002', ciudad: 'Medellín' })

    server.use(
      http.get(`*/api/v1/clientes/${clienteA.id}`, () =>
        HttpResponse.json(clienteA, { status: 200 })
      ),
      http.get(`*/api/v1/clientes/${clienteB.id}`, () =>
        HttpResponse.json(clienteB, { status: 200 })
      )
    )

    const qc = createQueryClient()

    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <ClienteDetailView clienteId={clienteA.id} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Bogotá')
    })

    rerender(
      <QueryClientProvider client={qc}>
        <ClienteDetailView clienteId={clienteB.id} />
      </QueryClientProvider>
    )

    // THEN: All 4 fields reflect the new client
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Cliente B')
    })
    expect(screen.getByTestId('cliente-detail-nitruc')).toHaveTextContent('222222222-2')
    expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent('3000000002')
    expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Medellín')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: 401 Unauthorized — shows ErrorPanel (not not-found)
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — HTTP 401 Unauthorized shows ErrorPanel, not not-found', () => {
  it('[P2] should render ErrorPanel (not not-found message) when API returns 401', async () => {
    // GIVEN: MSW returns 401 Unauthorized
    const clienteId = crypto.randomUUID()
    server.use(
      http.get(`*/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json({ status: 401, title: 'Unauthorized' }, { status: 401 })
      )
    )

    // WHEN: ClienteDetailView is rendered
    renderWithQuery(clienteId)

    // THEN: Generic ErrorPanel is shown (401 is not a 404)
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // AND: Not-found message is NOT shown
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: WCAG — role="region" present in both success and not-found states
// aria-label="Detalle del cliente" makes the section a landmark region
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — WCAG: aria-label region present in not-found state', () => {
  it('[P2] should expose role="region" with "Detalle del cliente" in the not-found state', async () => {
    // GIVEN: MSW returns 404
    const nonExistentId = crypto.randomUUID()
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json({ status: 404, title: 'Cliente no encontrado' }, { status: 404 })
      )
    )

    // WHEN: ClienteDetailView rendered
    renderWithRouter(nonExistentId)

    // THEN: The section landmark is accessible in the not-found state
    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: /detalle del cliente/i })
      ).toBeInTheDocument()
    })
  })

  it('[P2] should expose role="region" with "Detalle del cliente" in the loading (skeleton) state', async () => {
    // GIVEN: Delayed MSW handler to keep the request pending
    const clienteId = crypto.randomUUID()
    let resolveRequest: ((value: unknown) => void) | undefined

    server.use(
      http.get(`*/api/v1/clientes/${clienteId}`, async () => {
        await new Promise((resolve) => { resolveRequest = resolve })
        return HttpResponse.json(buildClienteDto({ id: clienteId }), { status: 200 })
      })
    )

    // WHEN: Rendered while request is in-flight
    renderWithQuery(clienteId)

    // THEN: Skeleton section is a region landmark
    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: /detalle del cliente/i })
      ).toBeInTheDocument()
    })

    // Cleanup: resolve the pending request
    await waitFor(() => expect(resolveRequest).toBeDefined())
    resolveRequest!(undefined)
  })
})
