/**
 * Component Tests — Story 2.2: ClienteDetailView
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * File under test (does NOT exist yet — must be created by DEV):
 *   frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
 *
 * Acceptance Criteria covered:
 *   AC2 — Renders all client fields: Nombre, NIT/RUC, Teléfono, Ciudad
 *   AC3 — Renders "Cliente no encontrado." on 404 error
 *   AC4 — Renders ErrorPanel with onRetry on non-404 error
 *   AC5 — Renders skeleton loader while isLoading=true (no spinner)
 *   AC7 — WCAG: <section aria-label="Detalle del cliente"> wrapper present
 *
 * Stack: Vitest + React Testing Library + MSW (Node handler)
 * Pattern: Arrange / Act / Assert
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createRouter,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router'
import { createElement } from 'react'
import type { ReactNode } from 'react'

// Mocks for external components
vi.mock('siesa-ui-kit', () => ({
  Button: ({ children, onClick, ...props }: { children: ReactNode; onClick?: () => void; [key: string]: unknown }) =>
    createElement('button', { onClick, ...props }, children),
}))

vi.mock('react-loading-skeleton', () => ({
  default: ({ count }: { count?: number }) =>
    createElement('div', { 'data-testid': 'cliente-detail-skeleton' },
      Array.from({ length: count ?? 1 }, (_, i) => createElement('span', { key: i }))
    ),
  SkeletonTheme: ({ children }: { children: ReactNode }) => createElement('div', null, children),
}))

// The component under test — does NOT exist until DEV implements it (RED phase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ClienteDetailView: React.ComponentType<{ clienteId: string }>;
try {
  const mod = await import('./ClienteDetailView')
  ClienteDetailView = mod.ClienteDetailView ?? mod.default
} catch {
  ClienteDetailView = ({ clienteId }: { clienteId: string }) =>
    createElement('div', { 'data-testid': 'cliente-detail-view-missing' }, `Component not implemented: ${clienteId}`)
}

const MOCK_CLIENTE = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Empresa Detalle Test',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const server = setupServer(
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === MOCK_CLIENTE.id) {
      return HttpResponse.json(MOCK_CLIENTE)
    }
    return HttpResponse.json(
      { status: 404, title: 'Not Found', detail: `Cliente with id '${String(params.id)}' was not found.` },
      { status: 404 }
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderClienteDetailView(clienteId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const rootRoute = createRootRoute()
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => createElement(ClienteDetailView, { clienteId }),
  })
  const routeTree = rootRoute.addChildren([detailRoute])
  const memoryHistory = createMemoryHistory({ initialEntries: [`/clientes/${clienteId}`] })
  const router = createRouter({ routeTree, history: memoryHistory })

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(RouterProvider, { router })
    )
  )
}

describe('ClienteDetailView component', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // AC2 — Renders client fields on success
  // ─────────────────────────────────────────────────────────────────────────

  it('should render the detail view root container with data-testid="cliente-detail-view"', async () => {
    // Arrange & Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })
  })

  it('should render the Nombre field value when client data is loaded', async () => {
    // Arrange & Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument()
    })
    expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Empresa Detalle Test')
  })

  it('should render the NIT/RUC field value when client data is loaded', async () => {
    // Arrange & Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nit')).toBeInTheDocument()
    })
    expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent('900123456-1')
  })

  it('should render the Teléfono field value when client data is loaded', async () => {
    // Arrange & Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-telefono')).toBeInTheDocument()
    })
    expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent('3001234567')
  })

  it('should render the Ciudad field value when client data is loaded', async () => {
    // Arrange & Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-ciudad')).toBeInTheDocument()
    })
    expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Bogotá')
  })

  it('should render all field labels in Spanish (Nombre, NIT/RUC, Teléfono, Ciudad)', async () => {
    // Arrange & Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert: Spanish field labels are present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })
    expect(screen.getByText(/Nombre/i)).toBeInTheDocument()
    expect(screen.getByText(/NIT\/RUC/i)).toBeInTheDocument()
    expect(screen.getByText(/Teléfono/i)).toBeInTheDocument()
    expect(screen.getByText(/Ciudad/i)).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC7 (WCAG) — section aria-label="Detalle del cliente"
  // ─────────────────────────────────────────────────────────────────────────

  it('should wrap the detail view in <section aria-label="Detalle del cliente"> for WCAG 2.1 AA', async () => {
    // Arrange & Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert
    await waitFor(() => {
      const section = screen.getByRole('region', { name: 'Detalle del cliente' })
      expect(section).toBeInTheDocument()
      expect(section.tagName.toLowerCase()).toBe('section')
    })
  })

  it('should have data-testid attributes for each field value', async () => {
    // Arrange & Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert: all four data-testid attributes are present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument()
    })
    expect(screen.getByTestId('cliente-detail-nit')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-telefono')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-ciudad')).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC5 — Skeleton loader while isLoading=true (no spinner)
  // ─────────────────────────────────────────────────────────────────────────

  it('should render a skeleton loader while the fetch is in-flight', async () => {
    // Arrange: delay the server response
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json(MOCK_CLIENTE)
      })
    )

    // Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert: skeleton is shown immediately before data arrives
    expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument()

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })
  })

  it('should NOT render a spinner during loading (skeleton only — no progressbar, no .spinner)', async () => {
    // Arrange: delay the server response
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json(MOCK_CLIENTE)
      })
    )

    // Act
    const { container } = renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert: no spinner element exists while loading
    expect(container.querySelector('[role="progressbar"]')).toBeNull()
    expect(container.querySelector('.spinner')).toBeNull()
    expect(screen.queryByTestId('spinner')).toBeNull()

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })
  })

  it('should hide the skeleton once the client data is loaded', async () => {
    // Arrange & Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument()
    })

    // Assert: skeleton is not visible after data loads
    expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC3 — "Cliente no encontrado." on 404
  // ─────────────────────────────────────────────────────────────────────────

  it('should render "Cliente no encontrado." when the API returns 404', async () => {
    // Arrange: use a non-existent ID (MSW will return 404)
    const nonExistentId = '99999999-9999-9999-9999-999999999999'

    // Act
    renderClienteDetailView(nonExistentId)

    // Assert: not-found message is displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })
    expect(screen.getByTestId('cliente-not-found')).toHaveTextContent('Cliente no encontrado.')
  })

  it('should NOT render ErrorPanel when the API returns 404 (404 is not a generic error)', async () => {
    // Arrange: non-existent ID
    const nonExistentId = '88888888-8888-8888-8888-888888888888'

    // Act
    renderClienteDetailView(nonExistentId)

    // Wait for 404 state
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })

    // Assert: generic ErrorPanel is NOT shown for 404
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })

  it('should NOT render the detail view fields when the API returns 404', async () => {
    // Arrange: non-existent ID
    const nonExistentId = '77777777-7777-7777-7777-777777777777'

    // Act
    renderClienteDetailView(nonExistentId)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })

    // Assert: no field values rendered
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC4 — ErrorPanel with onRetry on non-404 error
  // ─────────────────────────────────────────────────────────────────────────

  it('should render ErrorPanel when the API returns a 500 error', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    )

    // Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })

  it('should render a "Reintentar" button inside ErrorPanel on non-404 error', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ status: 503, title: 'Service Unavailable' }, { status: 503 })
      )
    )

    // Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    })
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  it('should trigger a new fetch when the "Reintentar" button is clicked', async () => {
    // Arrange: first call fails, second succeeds
    let callCount = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.json({ status: 500, title: 'Error' }, { status: 500 })
        }
        return HttpResponse.json(MOCK_CLIENTE)
      })
    )

    // Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // WHEN: User clicks "Reintentar"
    fireEvent.click(screen.getByTestId('retry-button'))

    // THEN: A second fetch is triggered and the detail view loads
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })
    expect(callCount).toBe(2)
  })

  it('should render ErrorPanel on a network error (not a 404)', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => HttpResponse.error())
    )

    // Act
    renderClienteDetailView(MOCK_CLIENTE.id)

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })
})
