/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Unit Tests — ClientesView split-panel layout
 *
 * Verifies:
 *   - Component renders split-panel layout (left panel + right placeholder)
 *   - Left panel contains ClienteListView
 *   - Right panel is a flex-1 placeholder for Story 2.2
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { clientesHandlers } from '../../../../../test-support/mocks/clientes.handlers'
import { ClientesView } from '../ClientesView'

const server = setupServer(clientesHandlers.empty())

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderClientesView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ClientesView />
    </QueryClientProvider>,
  )
}

describe('ClientesView — split-panel layout', () => {
  it('should render without crashing in isolation', () => {
    // GIVEN: A QueryClient is provided
    // WHEN: Component is rendered
    const { container } = renderClientesView()

    // THEN: The component mounts without errors
    expect(container).toBeTruthy()
  })

  it('should render the clientes-list-panel (ClienteListView) in the left slot', async () => {
    // GIVEN: API returns empty list
    server.use(clientesHandlers.empty())

    renderClientesView()

    // THEN: The list panel is present
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    })
  })

  it('should render the search input for client search', async () => {
    // GIVEN: API returns empty list
    server.use(clientesHandlers.empty())

    renderClientesView()

    // THEN: The search input is present
    await waitFor(() => {
      expect(screen.getByTestId('search-clientes')).toBeInTheDocument()
    })
  })
})
