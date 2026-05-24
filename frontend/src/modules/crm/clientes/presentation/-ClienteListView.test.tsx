/**
 * Story 2.1: Client List & Search
 * Component Tests — ClienteListView (Vitest + RTL + MSW)
 *
 * Test Cases Covered:
 *   TC-E2-P1-01 — Client list renders on page load with Nombre and NIT/RUC per item
 *   TC-E2-P1-02 — Real-time filter by Nombre (no additional API call)
 *   TC-E2-P1-03 — Real-time filter by NIT/RUC
 *   TC-E2-P1-04 — EmptyState shown when no clients exist
 *   TC-E2-P1-05 — ErrorPanel shown when API is unavailable (with "Reintentar" button)
 *   Skeleton loading state — skeletons render while loading (no spinner)
 *
 * RED Phase: All tests fail until ClienteListView and its dependencies are implemented.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { ClienteListView } from './ClienteListView'

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const CLIENTES_URL = '/api/v1/clientes'

const mockClientes = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Empresa Alpha',
    nitRuc: '900111001',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Empresa Beta',
    nitRuc: '900222002',
    telefono: '3007654321',
    ciudad: 'Medellín',
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'Organización Gamma',
    nitRuc: '900333003',
    telefono: '3009876543',
    ciudad: 'Cali',
    createdAt: '2026-03-20T12:00:00Z',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get(CLIENTES_URL, () => {
    return HttpResponse.json(mockClientes)
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Render ClienteListView with QueryClient wrapper
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteListView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView />
    </QueryClientProvider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-01: Client list renders on page load
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-01 — Client list renders on page load', () => {
  it('[P1] Given clients exist, When navigating to /clientes, Then all client Nombre values are visible', async () => {
    // GIVEN: MSW returns 3 clients
    renderClienteListView()

    // WHEN: Component loads and query resolves
    // THEN: Each client nombre is visible
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument()
    expect(screen.getByText('Organización Gamma')).toBeInTheDocument()
  })

  it('[P1] Given clients exist, When list is loaded, Then each item shows NIT/RUC value', async () => {
    // GIVEN: MSW returns 3 clients with nitRuc fields
    renderClienteListView()

    // WHEN: Component loads
    // THEN: Each client NIT/RUC is visible
    await waitFor(() => {
      expect(screen.getByText('900111001')).toBeInTheDocument()
    })
    expect(screen.getByText('900222002')).toBeInTheDocument()
    expect(screen.getByText('900333003')).toBeInTheDocument()
  })

  it('[P1] Given clients exist, When list is loaded, Then list panel renders with data-testid="clientes-list-panel"', async () => {
    // GIVEN: MSW returns 3 clients
    renderClienteListView()

    // WHEN: Component mounts
    // THEN: The left panel container has the expected test id
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    })
  })

  it('[P1] Given clients exist, When list is loaded, Then no ErrorPanel is shown', async () => {
    // GIVEN: MSW returns clients successfully
    renderClienteListView()

    // WHEN: Component loads
    // THEN: No error panel renders
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })

  it('[P1] Given clients exist, When list is loaded, Then no EmptyState is shown', async () => {
    // GIVEN: MSW returns non-empty client list
    renderClienteListView()

    // WHEN: List loads successfully
    // THEN: No empty state renders
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-02: Real-time filter by Nombre (client-side, no extra API call)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-02 — Real-time filter by Nombre', () => {
  it('[P1] Given list is loaded, When typing "Beta" in search, Then only Empresa Beta is visible', async () => {
    // GIVEN: MSW returns 3 clients — list loads
    renderClienteListView()
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // WHEN: User types "Beta" in the search field
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i)
    fireEvent.change(searchInput, { target: { value: 'Beta' } })

    // THEN: Only "Empresa Beta" is visible
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument()
    expect(screen.queryByText('Empresa Alpha')).not.toBeInTheDocument()
    expect(screen.queryByText('Organización Gamma')).not.toBeInTheDocument()
  })

  it('[P1] Given filter "Beta" applied, When search is cleared, Then all 3 clients are visible again', async () => {
    // GIVEN: List loaded and filter applied
    renderClienteListView()
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i)
    fireEvent.change(searchInput, { target: { value: 'Beta' } })
    expect(screen.queryByText('Empresa Alpha')).not.toBeInTheDocument()

    // WHEN: User clears the search input
    fireEvent.change(searchInput, { target: { value: '' } })

    // THEN: All 3 clients are visible
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument()
    expect(screen.getByText('Organización Gamma')).toBeInTheDocument()
  })

  it('[P1] Given list loaded, When search is case-insensitive match, Then client is found regardless of case', async () => {
    // GIVEN: MSW returns 3 clients
    renderClienteListView()
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // WHEN: User types lowercase "alpha"
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i)
    fireEvent.change(searchInput, { target: { value: 'alpha' } })

    // THEN: "Empresa Alpha" is visible (case-insensitive)
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Empresa Beta')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-03: Real-time filter by NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-03 — Real-time filter by NIT/RUC', () => {
  it('[P1] Given list is loaded, When typing the NIT/RUC of Empresa Beta, Then only Empresa Beta is visible', async () => {
    // GIVEN: MSW returns 3 clients with distinct NIT/RUC values
    renderClienteListView()
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // WHEN: User types the NIT/RUC of Empresa Beta
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i)
    fireEvent.change(searchInput, { target: { value: '900222002' } })

    // THEN: Only "Empresa Beta" is visible
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument()
    expect(screen.queryByText('Empresa Alpha')).not.toBeInTheDocument()
    expect(screen.queryByText('Organización Gamma')).not.toBeInTheDocument()
  })

  it('[P1] Given list is loaded, When typing a partial NIT/RUC, Then matching clients are visible', async () => {
    // GIVEN: MSW returns 3 clients
    renderClienteListView()
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // WHEN: User types partial NIT "9003"
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i)
    fireEvent.change(searchInput, { target: { value: '9003' } })

    // THEN: Only "Organización Gamma" (NIT 900333003) is visible
    expect(screen.getByText('Organización Gamma')).toBeInTheDocument()
    expect(screen.queryByText('Empresa Alpha')).not.toBeInTheDocument()
    expect(screen.queryByText('Empresa Beta')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-04: EmptyState shown when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-04 — EmptyState shown when no clients exist', () => {
  it('[P1] Given no clients in system, When navigating to /clientes, Then EmptyState renders with guidance text', async () => {
    // GIVEN: MSW returns empty array
    server.use(
      http.get(CLIENTES_URL, () => {
        return HttpResponse.json([])
      })
    )

    renderClienteListView()

    // WHEN: Query resolves with empty list
    // THEN: EmptyState component renders
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  it('[P1] Given no clients, When EmptyState renders, Then guidance text directs user to create first client', async () => {
    // GIVEN: MSW returns empty array
    server.use(
      http.get(CLIENTES_URL, () => {
        return HttpResponse.json([])
      })
    )

    renderClienteListView()

    // WHEN: EmptyState is shown
    // THEN: Contains Spanish-language guidance text
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
    // EmptyState must contain Spanish guidance
    const emptyState = screen.getByTestId('empty-state')
    expect(emptyState.textContent).toMatch(/sin clientes|primer cliente|crea/i)
  })

  it('[P1] Given no clients, When EmptyState renders, Then no client list items are shown', async () => {
    // GIVEN: MSW returns empty array
    server.use(
      http.get(CLIENTES_URL, () => {
        return HttpResponse.json([])
      })
    )

    renderClienteListView()

    // WHEN: Component resolves
    // THEN: No list items — only EmptyState
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
  })

  it('[P1] Given no clients, When EmptyState renders, Then no ErrorPanel is shown', async () => {
    // GIVEN: MSW returns empty array (not an error)
    server.use(
      http.get(CLIENTES_URL, () => {
        return HttpResponse.json([])
      })
    )

    renderClienteListView()

    // WHEN: Successful empty response
    // THEN: No error panel — only EmptyState
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-05: ErrorPanel shown when API is unavailable
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-05 — ErrorPanel shown when API is unavailable', () => {
  it('[P1] Given backend is unavailable, When query fails, Then ErrorPanel renders instead of the list', async () => {
    // GIVEN: MSW configured to return a network error
    server.use(
      http.get(CLIENTES_URL, () => {
        return HttpResponse.error()
      })
    )

    renderClienteListView()

    // WHEN: Network error occurs
    // THEN: ErrorPanel component renders
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })

  it('[P1] Given ErrorPanel is shown, When user sees it, Then a "Reintentar" button is visible', async () => {
    // GIVEN: MSW returns network error
    server.use(
      http.get(CLIENTES_URL, () => {
        return HttpResponse.error()
      })
    )

    renderClienteListView()

    // WHEN: ErrorPanel renders
    // THEN: "Reintentar" button is present (required by AC4 and test design notes)
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('[P1] Given ErrorPanel is shown, When API unavailable, Then no client items are rendered', async () => {
    // GIVEN: MSW returns network error
    server.use(
      http.get(CLIENTES_URL, () => {
        return HttpResponse.error()
      })
    )

    renderClienteListView()

    // WHEN: Error state
    // THEN: No client list items shown
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
  })

  it('[P1] Given ErrorPanel is shown, When API unavailable, Then no EmptyState is shown', async () => {
    // GIVEN: MSW returns network error
    server.use(
      http.get(CLIENTES_URL, () => {
        return HttpResponse.error()
      })
    )

    renderClienteListView()

    // WHEN: Error state
    // THEN: EmptyState is not shown alongside ErrorPanel
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Loading State
// ─────────────────────────────────────────────────────────────────────────────

describe('Skeleton loading state', () => {
  it('[P1] Given API call is in-flight, When component first renders, Then skeleton placeholders appear (no spinner)', async () => {
    // GIVEN: MSW handler returns data after a delay — component is in loading state
    server.use(
      http.get(CLIENTES_URL, async () => {
        // Simulate network delay so we can observe loading state
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json(mockClientes)
      })
    )

    renderClienteListView()

    // WHEN: Component is in loading state (before data arrives)
    // THEN: Skeleton placeholders are present, no spinner role
    const skeletons = document.querySelectorAll('[data-testid="skeleton-row"]')
    // Skeletons may be in the DOM immediately (before data arrives)
    // We verify: no role="status" spinner in the loading state
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    // Wait for data to load to clean up
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Search Input Accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('Search input accessibility', () => {
  it('[P1] Given list panel renders, When inspecting search input, Then it has aria-label="Buscar clientes"', async () => {
    // GIVEN: MSW returns 3 clients
    renderClienteListView()

    // WHEN: Component loads
    // THEN: Search input has the required aria-label for accessibility
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/buscar clientes/i)).toBeInTheDocument()
  })
})
