/**
 * Component Tests — ClienteListPanel edge cases
 * Story 2.1: Client List & Search (edge-case expansion)
 * Stack: Vitest + React Testing Library + MSW
 */

import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../../../../routeTree.gen'
import {
  clienteListSuccessHandler,
  clienteListNetworkErrorHandler,
  mockClientes,
} from '../../../../../test/handlers/clientes'
import { createCliente } from '../../../../../test/factories/cliente.factory'

// ---------------------------------------------------------------------------
// MSW Server
// ---------------------------------------------------------------------------

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: 0 } },
  })
}

function renderClientesRoute(initialUrl = '/clientes') {
  const queryClient = createTestQueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
    context: { queryClient },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// ---------------------------------------------------------------------------
// No-match search state
// ---------------------------------------------------------------------------

describe('ClienteListPanel — no-match search shows filtered EmptyState', () => {
  test('typing a query that matches no clients shows EmptyState', async () => {
    server.use(clienteListSuccessHandler)
    const user = userEvent.setup()
    renderClientesRoute()

    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })

    const searchInput = screen.getByTestId('search-input')
    await user.type(searchInput, 'ZZZNOMATCH')

    await waitFor(() => {
      // All items hidden, EmptyState shown
      expect(screen.queryAllByTestId('client-list-item')).toHaveLength(0)
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  test('no-match EmptyState shows a message about search criteria (not "create first")', async () => {
    server.use(clienteListSuccessHandler)
    const user = userEvent.setup()
    renderClientesRoute()

    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })

    await user.type(screen.getByTestId('search-input'), 'ZZZNOMATCH')

    await waitFor(() => {
      // Should mention "criterio" or "búsqueda", NOT "Crea el primero"
      expect(screen.getByTestId('empty-state')).not.toHaveTextContent(/crea el primero/i)
    })
  })

  test('clearing the no-match query restores the client list', async () => {
    server.use(clienteListSuccessHandler)
    const user = userEvent.setup()
    renderClientesRoute()

    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })

    const searchInput = screen.getByTestId('search-input')
    await user.type(searchInput, 'ZZZNOMATCH')

    await waitFor(() => {
      expect(screen.queryAllByTestId('client-list-item')).toHaveLength(0)
    })

    await user.clear(searchInput)

    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })
  })
})

// ---------------------------------------------------------------------------
// Whitespace-only search
// ---------------------------------------------------------------------------

describe('ClienteListPanel — whitespace-only search shows full list', () => {
  test('spaces in the search field do not filter out any clients', async () => {
    server.use(clienteListSuccessHandler)
    const user = userEvent.setup()
    renderClientesRoute()

    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })

    await user.type(screen.getByTestId('search-input'), '   ')

    await waitFor(() => {
      // Whitespace-only → trim() returns '' → no filter → full list shown
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })
  })
})

// ---------------------------------------------------------------------------
// Retry interaction
// ---------------------------------------------------------------------------

describe('ClienteListPanel — retry mechanism', () => {
  test('clicking Reintentar after failure re-fetches and shows the list on success', async () => {
    // First request fails, second succeeds
    let callCount = 0
    server.use(
      http.get('/api/v1/clientes', () => {
        callCount++
        if (callCount === 1) return HttpResponse.error()
        return HttpResponse.json(mockClientes, { status: 200 })
      }),
    )

    const user = userEvent.setup()
    renderClientesRoute()

    // ErrorPanel appears after first failure
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // Click Reintentar
    await user.click(screen.getByTestId('retry-button'))

    // After retry, list should appear
    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })

    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Single-client list
// ---------------------------------------------------------------------------

describe('ClienteListPanel — single client in list', () => {
  test('renders exactly one client-list-item when API returns one client', async () => {
    server.use(
      http.get('/api/v1/clientes', () =>
        HttpResponse.json(
          [createCliente({ id: 'solo-001', nombre: 'Solo Corp', nit: '999000111' })],
          { status: 200 },
        ),
      ),
    )

    renderClientesRoute()

    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(1)
    })

    expect(screen.getByText('Solo Corp')).toBeInTheDocument()
    expect(screen.getByText('999000111')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Search input accessibility
// ---------------------------------------------------------------------------

describe('ClienteListPanel — search input accessibility', () => {
  test('search input has type="text"', async () => {
    server.use(clienteListSuccessHandler)
    renderClientesRoute()

    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    })

    const input = screen.getByTestId('search-input')
    expect(input).toHaveAttribute('type', 'text')
  })

  test('search input has correct placeholder for screen readers', async () => {
    server.use(clienteListSuccessHandler)
    renderClientesRoute()

    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText('Buscar por nombre o NIT/RUC')).toBeInTheDocument()
  })

  test('search input value reflects what the user typed', async () => {
    server.use(clienteListSuccessHandler)
    const user = userEvent.setup()
    renderClientesRoute()

    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    })

    const input = screen.getByTestId('search-input')
    await user.type(input, 'Alfa')
    expect(input).toHaveValue('Alfa')
  })
})

// ---------------------------------------------------------------------------
// No API duplication — search does not trigger a new network request
// ---------------------------------------------------------------------------

describe('ClienteListPanel — search does not trigger additional API calls', () => {
  test('typing in the search field does not make a second GET /api/v1/clientes call', async () => {
    let requestCount = 0
    server.use(
      http.get('/api/v1/clientes', () => {
        requestCount++
        return HttpResponse.json(mockClientes, { status: 200 })
      }),
    )

    const user = userEvent.setup()
    renderClientesRoute()

    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })

    const requestsAfterLoad = requestCount
    await user.type(screen.getByTestId('search-input'), 'Alfa')

    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(1)
    })

    // No additional API calls should have been made while typing
    expect(requestCount).toBe(requestsAfterLoad)
  })
})

// ---------------------------------------------------------------------------
// HTTP 500 response (server error, not network error)
// ---------------------------------------------------------------------------

describe('ClienteListPanel — server error (HTTP 500)', () => {
  test('shows ErrorPanel when API returns HTTP 500', async () => {
    server.use(
      http.get('/api/v1/clientes', () =>
        HttpResponse.json({ detail: 'Internal Server Error' }, { status: 500 }),
      ),
    )

    renderClientesRoute()

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })
})
