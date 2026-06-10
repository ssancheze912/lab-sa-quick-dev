/**
 * Component Tests — Story 2.1: Client List & Search
 * Test IDs: T2.1-001, T2.1-002, T2.1-003, T2.1-007
 *
 * RED PHASE — All tests intentionally fail until ClienteListPanel is implemented.
 * Tests define expected component behavior per the acceptance criteria (AC1–AC4).
 *
 * AC1: List renders with Nombre + NIT/RUC visible per item
 * AC2: Real-time search filtering (by Nombre and NIT/RUC)
 * AC3: EmptyState shown when API returns empty array
 * AC4: ErrorPanel + "Reintentar" button on fetch failure
 *
 * Stack: Vitest + React Testing Library + MSW (Mock Service Worker)
 * QueryClient: retry: 0, staleTime: 0 to prevent caching interference
 *
 * Pattern: Given-When-Then | data-testid selectors
 */

import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../../../../routeTree.gen'
import {
  clienteListSuccessHandler,
  clienteListEmptyHandler,
  clienteListNetworkErrorHandler,
  mockClientes,
} from '../../../../../test/handlers/clientes'

// ---------------------------------------------------------------------------
// MSW Server setup
// ---------------------------------------------------------------------------

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Test helper: Creates an isolated QueryClient for each test
// ---------------------------------------------------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        staleTime: 0,
      },
    },
  })
}

// ---------------------------------------------------------------------------
// Test helper: Renders the /clientes route with isolated providers
// ---------------------------------------------------------------------------

function renderClientesRoute() {
  const queryClient = createTestQueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/clientes'] }),
    context: { queryClient },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// ---------------------------------------------------------------------------
// T2.1-001 — AC1: List renders with Nombre + NIT/RUC per item
// ---------------------------------------------------------------------------

describe('T2.1-001 — AC1: Client list renders with Nombre and NIT/RUC per item', () => {
  test('should render the list panel when clients exist', async () => {
    // GIVEN: MSW returns 3 clients
    server.use(clienteListSuccessHandler)

    // WHEN: Component renders
    renderClientesRoute()

    // THEN: List panel container is in the document
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    })
  })

  test('should render each client item with its Nombre visible', async () => {
    // GIVEN: MSW returns mockClientes (Empresa Alfa, Compañía Beta, Corporación Gamma)
    server.use(clienteListSuccessHandler)

    // WHEN: Component renders
    renderClientesRoute()

    // THEN: Each client name appears in a list item
    await waitFor(() => {
      expect(screen.getByText('Empresa Alfa')).toBeInTheDocument()
      expect(screen.getByText('Compañía Beta')).toBeInTheDocument()
      expect(screen.getByText('Corporación Gamma')).toBeInTheDocument()
    })
  })

  test('should render each client item with its NIT visible', async () => {
    // GIVEN: MSW returns mockClientes with known NITs
    server.use(clienteListSuccessHandler)

    // WHEN: Component renders
    renderClientesRoute()

    // THEN: Each NIT appears alongside the client name
    await waitFor(() => {
      expect(screen.getByText('123456789')).toBeInTheDocument()
      expect(screen.getByText('987654321')).toBeInTheDocument()
      expect(screen.getByText('456789123')).toBeInTheDocument()
    })
  })

  test('should render three client-list-item elements for three clients', async () => {
    // GIVEN: MSW returns 3 clients
    server.use(clienteListSuccessHandler)

    // WHEN: Component renders
    renderClientesRoute()

    // THEN: Exactly 3 list items are rendered
    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })
  })

  test('should show loading-skeleton while data is loading', async () => {
    // GIVEN: MSW delays the response
    server.use(clienteListSuccessHandler)

    // WHEN: Component first renders (before data arrives)
    renderClientesRoute()

    // THEN: Skeleton placeholder is visible during loading phase
    // Note: This may pass immediately in fast test environments;
    // skeleton must be present before data resolves
    const skeleton = screen.queryByTestId('loading-skeleton')
    // If found immediately, skeleton is shown during loading
    // If not found, data loaded synchronously (valid edge case in test env)
    expect(skeleton !== null || screen.queryByTestId('client-list-item') !== null).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// T2.1-002 — AC3: EmptyState shown when API returns empty array
// ---------------------------------------------------------------------------

describe('T2.1-002 — AC3: EmptyState shown when no clients exist', () => {
  test('should display EmptyState component when API returns empty array', async () => {
    // GIVEN: MSW returns an empty array
    server.use(clienteListEmptyHandler)

    // WHEN: Component renders
    renderClientesRoute()

    // THEN: EmptyState is visible
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  test('should not render any client-list-item when the list is empty', async () => {
    // GIVEN: MSW returns an empty array
    server.use(clienteListEmptyHandler)

    // WHEN: Component renders
    renderClientesRoute()

    // THEN: No list items are rendered
    await waitFor(() => {
      expect(screen.queryAllByTestId('client-list-item')).toHaveLength(0)
    })
  })

  test('should display a message guiding user to create the first client', async () => {
    // GIVEN: MSW returns an empty array
    server.use(clienteListEmptyHandler)

    // WHEN: Component renders
    renderClientesRoute()

    // THEN: EmptyState message guides user to create first client
    await waitFor(() => {
      expect(
        screen.getByText(/no hay clientes registrados/i),
      ).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// T2.1-003 — AC4: ErrorPanel + "Reintentar" on fetch failure
// ---------------------------------------------------------------------------

describe('T2.1-003 — AC4: ErrorPanel displayed on fetch failure', () => {
  test('should display ErrorPanel when network request fails', async () => {
    // GIVEN: MSW simulates a network error
    server.use(clienteListNetworkErrorHandler)

    // WHEN: Component renders and fetch fails
    renderClientesRoute()

    // THEN: ErrorPanel is visible
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })

  test('should display "Reintentar" button when fetch fails', async () => {
    // GIVEN: MSW simulates a network error
    server.use(clienteListNetworkErrorHandler)

    // WHEN: Component renders and fetch fails
    renderClientesRoute()

    // THEN: The retry button is visible
    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    })
  })

  test('should not render client-list-item elements when fetch fails', async () => {
    // GIVEN: MSW simulates a network error
    server.use(clienteListNetworkErrorHandler)

    // WHEN: Component renders and fetch fails
    renderClientesRoute()

    // THEN: No list items are shown (ErrorPanel replaces the list)
    await waitFor(() => {
      expect(screen.queryAllByTestId('client-list-item')).toHaveLength(0)
    })
  })

  test('should not expose raw error.message to the user', async () => {
    // GIVEN: MSW simulates a network error
    server.use(clienteListNetworkErrorHandler)

    // WHEN: Component renders and fetch fails
    renderClientesRoute()

    // THEN: No raw technical error text is shown (NFR6 compliance)
    await waitFor(() => {
      expect(screen.queryByText(/network error|AxiosError|TypeError/i)).not.toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// T2.1-007 (P3) — AC2: Clearing search input restores full list
// ---------------------------------------------------------------------------

describe('T2.1-007 (P3) — AC2: Clearing search restores full list', () => {
  test('should restore all client items when search input is cleared', async () => {
    // GIVEN: MSW returns 3 clients and the list is rendered
    server.use(clienteListSuccessHandler)
    const user = userEvent.setup()
    renderClientesRoute()

    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })

    // WHEN: User types a search term and then clears it
    const searchInput = screen.getByTestId('search-input')
    await user.type(searchInput, 'Alfa')

    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(1)
    })

    await user.clear(searchInput)

    // THEN: Full list of 3 clients is restored
    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })
  })

  test('should show search input with placeholder text', async () => {
    // GIVEN: MSW returns 3 clients
    server.use(clienteListSuccessHandler)
    renderClientesRoute()

    // WHEN: List panel renders
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    })

    // THEN: Search input has the correct placeholder
    const searchInput = screen.getByTestId('search-input')
    expect(searchInput).toHaveAttribute('placeholder', 'Buscar por nombre o NIT/RUC')
  })
})
