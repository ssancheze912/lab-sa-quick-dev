import { render, screen } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from '../../routeTree.gen'
import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { clienteHandlers } from '../../test/handlers/clientes'

// MSW server to handle /api/v1/clientes calls made by ClienteListPanel
const server = setupServer(...clienteHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: 0, staleTime: 0 } } })
}

function renderWithQueryProvider(router: ReturnType<typeof createRouter>) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('Index Route - redirect to /clientes', () => {
  test('redirects / to /clientes and renders clientes view', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    renderWithQueryProvider(router)
    // After redirect, clientes-view should be rendered
    expect(await screen.findByTestId('clientes-view')).toBeInTheDocument()
  })

  test('router location is /clientes after / redirect', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    renderWithQueryProvider(router)
    await screen.findByTestId('clientes-view')
    expect(router.state.location.pathname).toBe('/clientes')
  })
})
