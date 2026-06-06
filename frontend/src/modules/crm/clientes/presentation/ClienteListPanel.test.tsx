/**
 * Story 2.1: Client List & Search
 * Integration component tests for ClienteListPanel
 *
 * Acceptance Criteria covered: AC1–AC7
 *   AC1 — scrollable list of clients with Nombre + NIT, search input with placeholder
 *   AC2 — real-time case-insensitive filtering on Nombre and NIT/RUC
 *   AC3 — EmptyState variant="no-clients" when data is empty and no search query
 *   AC4 — EmptyState variant="search-empty" when search has no matches
 *   AC5 — ErrorPanel with "Reintentar" button on fetch failure; clicking calls refetch
 *   AC6 — Skeleton placeholders (react-loading-skeleton) while loading, aria-busy="true"
 *   AC7 — Mobile: search input is full-width at top; panel renders for mobile viewport
 *
 * NOTE: Tests are in RED state — they will fail until ClienteListPanel.tsx, useClientes.ts,
 *       clienteApiRepository.ts, and all shared components are implemented.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createElement } from 'react'

// RED: imports will fail until components and hooks exist
import { ClienteListPanel } from './ClienteListPanel'

// ─── MSW server setup (network-first intercept) ───────────────────────────────

const BASE_URL = 'http://localhost:5000'

const mockClientes = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Constructora Andina S.A.S',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Inversiones del Norte Ltda',
    nit: '800654321-2',
    telefono: '3019876543',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'Distribuidora Pacífico S.A',
    nit: '700111222-3',
    telefono: '3025551234',
    ciudad: 'Cali',
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-03T00:00:00Z',
  },
]

// Network-first intercept — registered before navigation/render
const server = setupServer(
  http.get(`${BASE_URL}/api/v1/clientes`, () => {
    return HttpResponse.json(mockClientes)
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())

// ─── Test helpers ─────────────────────────────────────────────────────────────

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  })
}

function renderPanel(props?: { selectedClienteId?: string | null; onSelectCliente?: (id: string) => void }) {
  const qc = createTestQueryClient()

  return render(
    createElement(
      QueryClientProvider,
      { client: qc },
      createElement(ClienteListPanel, {
        selectedClienteId: props?.selectedClienteId ?? null,
        onSelectCliente: props?.onSelectCliente ?? vi.fn(),
      })
    )
  )
}

// ─── AC1: Renders list of clients ────────────────────────────────────────────

describe('ClienteListPanel — AC1: client list and search input', () => {
  /**
   * AC1: Given there are clients in the system,
   * When the user navigates to /clientes,
   * Then the panel renders a scrollable list of all clients,
   * And each list item shows Nombre and NIT/RUC.
   */
  it('renders all client Nombres after data loads', async () => {
    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
      expect(screen.getByText('Inversiones del Norte Ltda')).toBeInTheDocument()
      expect(screen.getByText('Distribuidora Pacífico S.A')).toBeInTheDocument()
    })
  })

  it('renders NIT/RUC for each client in the list', async () => {
    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('900123456-1')).toBeInTheDocument()
      expect(screen.getByText('800654321-2')).toBeInTheDocument()
      expect(screen.getByText('700111222-3')).toBeInTheDocument()
    })
  })

  /**
   * AC1: The panel header contains a search input with placeholder "Buscar por nombre o NIT...".
   */
  it('renders search input with correct placeholder', async () => {
    renderPanel()

    // The input must be present even before data loads
    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')
    expect(input).toBeInTheDocument()
  })

  /**
   * AC1: Search input has aria-label="Buscar clientes" (WCAG 2.1 AA).
   */
  it('search input has aria-label="Buscar clientes"', () => {
    renderPanel()

    const input = screen.getByRole('searchbox', { name: 'Buscar clientes' })
    expect(input).toBeInTheDocument()
  })

  /**
   * AC1: Search container has role="search".
   */
  it('search container has role="search"', () => {
    renderPanel()

    expect(screen.getByRole('search')).toBeInTheDocument()
  })

  /**
   * AC1: Panel has data-testid="cliente-list-panel".
   */
  it('has data-testid="cliente-list-panel"', () => {
    renderPanel()

    expect(screen.getByTestId('cliente-list-panel')).toBeInTheDocument()
  })
})

// ─── AC2: Real-time filtering ─────────────────────────────────────────────────

describe('ClienteListPanel — AC2: real-time search filtering', () => {
  /**
   * AC2: Given the client list is loaded,
   * When the user types any characters in the search field,
   * Then the list filters in real time showing only clients whose Nombre
   * or NIT/RUC match the input (case-insensitive).
   */
  it('filters list in real time when user types in search field', async () => {
    renderPanel()

    // Wait for data to load first
    await waitFor(() => {
      expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    })

    // Act: type "Constr" in search field
    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')
    fireEvent.change(input, { target: { value: 'Constr' } })

    // Assert: only matching client visible
    expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    expect(screen.queryByText('Inversiones del Norte Ltda')).not.toBeInTheDocument()
    expect(screen.queryByText('Distribuidora Pacífico S.A')).not.toBeInTheDocument()
  })

  it('filters by NIT/RUC case-insensitively', async () => {
    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')
    // Search by partial NIT, lowercase
    fireEvent.change(input, { target: { value: '800654' } })

    expect(screen.getByText('Inversiones del Norte Ltda')).toBeInTheDocument()
    expect(screen.queryByText('Constructora Andina S.A.S')).not.toBeInTheDocument()
    expect(screen.queryByText('Distribuidora Pacífico S.A')).not.toBeInTheDocument()
  })

  it('filters by Nombre case-insensitively (lowercase query)', async () => {
    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')
    // Type lowercase — must still match
    fireEvent.change(input, { target: { value: 'constructora' } })

    expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    expect(screen.queryByText('Inversiones del Norte Ltda')).not.toBeInTheDocument()
  })

  it('shows all clients again when search field is cleared', async () => {
    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')
    fireEvent.change(input, { target: { value: 'Constr' } })

    // Clear
    fireEvent.change(input, { target: { value: '' } })

    expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    expect(screen.getByText('Inversiones del Norte Ltda')).toBeInTheDocument()
    expect(screen.getByText('Distribuidora Pacífico S.A')).toBeInTheDocument()
  })
})

// ─── AC3: Empty system state ─────────────────────────────────────────────────

describe('ClienteListPanel — AC3: empty system state', () => {
  /**
   * AC3: Given there are no clients in the system,
   * When the user navigates to /clientes,
   * Then the EmptyState component (variant="no-clients") is displayed
   * with the message "No hay clientes registrados" and "Nuevo cliente" CTA.
   */
  it('renders EmptyState with "No hay clientes registrados" when data is empty array and no search', async () => {
    // Override server to return empty array
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, () => {
        return HttpResponse.json([])
      })
    )

    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
    })
  })

  it('renders "Nuevo cliente" CTA button when no clients exist', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, () => {
        return HttpResponse.json([])
      })
    )

    renderPanel()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Nuevo cliente' })).toBeInTheDocument()
    })
  })

  it('does NOT render the client list when data is empty', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, () => {
        return HttpResponse.json([])
      })
    )

    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
    })

    expect(screen.queryByText('Constructora Andina S.A.S')).not.toBeInTheDocument()
  })
})

// ─── AC4: Search with no results ─────────────────────────────────────────────

describe('ClienteListPanel — AC4: search empty state', () => {
  /**
   * AC4: Given a search returns no matching clients,
   * When the search field contains text with no results,
   * Then the EmptyState component (variant="search-empty") is displayed
   * with the message "No se encontró ningún cliente" and hint "Intenta con otro nombre o NIT".
   */
  it('renders EmptyState "No se encontró ningún cliente" when search has no matches', async () => {
    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')
    fireEvent.change(input, { target: { value: 'XXXXXX_no_match_999' } })

    expect(screen.getByText('No se encontró ningún cliente')).toBeInTheDocument()
  })

  it('renders hint "Intenta con otro nombre o NIT" for search-empty', async () => {
    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')
    fireEvent.change(input, { target: { value: 'XXXXXX_no_match_999' } })

    expect(screen.getByText('Intenta con otro nombre o NIT')).toBeInTheDocument()
  })

  it('does NOT render "Nuevo cliente" CTA for search-empty state', async () => {
    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')
    fireEvent.change(input, { target: { value: 'XXXXXX_no_match_999' } })

    expect(screen.queryByRole('button', { name: 'Nuevo cliente' })).not.toBeInTheDocument()
  })
})

// ─── AC5: Error state ─────────────────────────────────────────────────────────

describe('ClienteListPanel — AC5: backend unavailable / error state', () => {
  /**
   * AC5: Given the backend is unavailable when the page loads,
   * When the GET /api/v1/clientes fetch fails,
   * Then an ErrorPanel component is displayed with a "Reintentar" button.
   */
  it('renders ErrorPanel with "Reintentar" button on fetch failure', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, () => {
        return HttpResponse.error()
      })
    )

    renderPanel()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    })
  })

  it('displays user-friendly error message (no technical details)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, () => {
        return HttpResponse.error()
      })
    )

    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la información')).toBeInTheDocument()
    })

    // Must NOT show technical details
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/500/)).not.toBeInTheDocument()
  })

  /**
   * AC5: Clicking "Reintentar" re-triggers the TanStack Query refetch().
   */
  it('clicking Reintentar triggers a new fetch attempt', async () => {
    let callCount = 0
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, () => {
        callCount++
        if (callCount === 1) return HttpResponse.error()
        return HttpResponse.json(mockClientes)
      })
    )

    renderPanel()

    // Wait for error state
    const retryButton = await screen.findByRole('button', { name: 'Reintentar' })

    // Act: click retry
    await act(async () => {
      fireEvent.click(retryButton)
    })

    // Assert: data eventually loads after retry
    await waitFor(() => {
      expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    })

    expect(callCount).toBeGreaterThanOrEqual(2)
  })

  it('does NOT render the client list when in error state', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, () => {
        return HttpResponse.error()
      })
    )

    renderPanel()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    })

    expect(screen.queryByText('Constructora Andina S.A.S')).not.toBeInTheDocument()
  })
})

// ─── AC6: Loading skeleton state ─────────────────────────────────────────────

describe('ClienteListPanel — AC6: loading skeleton', () => {
  /**
   * AC6: Given the client list is loading (first fetch in progress),
   * When the component is mounting,
   * Then skeleton placeholders are rendered instead of real content.
   */
  it('renders skeleton placeholders while loading', async () => {
    // Delay the response to capture the loading state
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(mockClientes)
      })
    )

    renderPanel()

    // Immediately after mount — skeletons should be visible
    const skeletonContainer = screen.getByTestId('skeleton-loading')
    expect(skeletonContainer).toBeInTheDocument()

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
    })
  })

  /**
   * AC6: The loading container has aria-busy="true".
   */
  it('loading container has aria-busy="true"', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(mockClientes)
      })
    )

    renderPanel()

    const skeletonContainer = screen.getByTestId('skeleton-loading')
    expect(skeletonContainer).toHaveAttribute('aria-busy', 'true')

    // After loading completes, aria-busy should be gone
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-loading')).not.toBeInTheDocument()
    })
  })

  it('does NOT render client data while loading', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(mockClientes)
      })
    )

    renderPanel()

    expect(screen.queryByText('Constructora Andina S.A.S')).not.toBeInTheDocument()
    expect(screen.queryByText('Inversiones del Norte Ltda')).not.toBeInTheDocument()
  })
})

// ─── AC7: Mobile viewport ─────────────────────────────────────────────────────

describe('ClienteListPanel — AC7: mobile layout', () => {
  /**
   * AC7: Given the application is on a mobile viewport (< 1024px),
   * When the user navigates to /clientes,
   * Then the search input is full-width at the top of the content area.
   *
   * NOTE: CSS-based responsive layout is validated by presence and structure,
   * not pixel dimensions (CSS not computed in jsdom).
   */
  it('renders the search input inside the panel for all viewports', async () => {
    renderPanel()

    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')
    expect(input).toBeInTheDocument()
  })

  it('renders the panel container regardless of viewport', () => {
    renderPanel()

    expect(screen.getByTestId('cliente-list-panel')).toBeInTheDocument()
  })
})
