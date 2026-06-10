import { render, screen } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from '../../routeTree.gen'
import { describe, test, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
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

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

function renderWithQueryProvider(router: ReturnType<typeof createTestRouter>) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// jsdom defaults to window.innerWidth = 1024 which triggers desktop layout
describe('RootLayout - NavigationRail (desktop, width >= 1024)', () => {
  beforeEach(() => {
    // jsdom defaults to 1024 — ensure desktop breakpoint triggers
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1024') ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  test('renders navigation-rail wrapper element', async () => {
    const router = createTestRouter('/clientes')
    renderWithQueryProvider(router)
    const rail = await screen.findByTestId('navigation-rail')
    expect(rail).toBeInTheDocument()
  })

  test('renders Clientes label in navigation', async () => {
    const router = createTestRouter('/clientes')
    renderWithQueryProvider(router)
    const items = await screen.findAllByText('Clientes')
    expect(items.length).toBeGreaterThan(0)
  })

  test('renders Contactos label in navigation', async () => {
    const router = createTestRouter('/contactos')
    renderWithQueryProvider(router)
    const items = await screen.findAllByText('Contactos')
    expect(items.length).toBeGreaterThan(0)
  })

  test('renders clientes-view when at /clientes', async () => {
    const router = createTestRouter('/clientes')
    renderWithQueryProvider(router)
    expect(await screen.findByTestId('clientes-view')).toBeInTheDocument()
  })

  test('renders contactos-view when at /contactos', async () => {
    const router = createTestRouter('/contactos')
    renderWithQueryProvider(router)
    expect(await screen.findByTestId('contactos-view')).toBeInTheDocument()
  })
})

describe('RootLayout - NavigationBar (mobile, width < 1024)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('renders navigation-bar wrapper element for mobile', async () => {
    const router = createTestRouter('/clientes')
    renderWithQueryProvider(router)
    const bar = await screen.findByTestId('navigation-bar')
    expect(bar).toBeInTheDocument()
  })
})
