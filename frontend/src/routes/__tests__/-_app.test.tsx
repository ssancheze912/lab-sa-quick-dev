import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { routeTree } from '../../routeTree.gen'

// MSW server to intercept API calls from ClienteListView and ClienteDetailView in route tests
const FIXED_CLIENTE_ID = '00000000-0000-0000-0000-000000000099'
const server = setupServer(
  http.get('/api/v1/clientes', () => HttpResponse.json([])),
  http.get(`/api/v1/clientes/${FIXED_CLIENTE_ID}`, () =>
    HttpResponse.json({
      id: FIXED_CLIENTE_ID,
      nombre: 'Empresa Ruta SA',
      nit: '900000099',
      telefono: '3000000099',
      ciudad: 'Bogotá',
      createdAt: new Date().toISOString(),
    }),
  ),
)
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderWithProviders(router: ReturnType<typeof createRouter>) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      subscribe: (_cb: () => void) => () => undefined,
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      createHref: (_location: { pathname: string }) => _location.pathname,
      block: vi.fn(),
      flush: vi.fn(),
      destroy: vi.fn(),
      notify: vi.fn(),
      location: {
        pathname: initialPath,
        search: '',
        hash: '',
        state: {},
        key: 'default',
      },
      encodeLocation: (location: { pathname: string }) => location,
    },
  })
}

describe('AppShell Navigation', () => {
  it('renders navigation with Clientes label', async () => {
    const router = createTestRouter('/clientes')
    await router.load()
    renderWithProviders(router)

    expect(screen.getByText('Clientes')).toBeInTheDocument()
  })

  it('renders navigation with Contactos label', async () => {
    const router = createTestRouter('/contactos')
    await router.load()
    renderWithProviders(router)

    expect(screen.getByText('Contactos')).toBeInTheDocument()
  })

  it('renders clientes view on /clientes route', async () => {
    const router = createTestRouter('/clientes')
    await router.load()
    renderWithProviders(router)

    expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
  })

  it('renders contactos view on /contactos route', async () => {
    const router = createTestRouter('/contactos')
    await router.load()
    renderWithProviders(router)

    expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
  })

  it('renders 404 page for unknown route', async () => {
    const router = createTestRouter('/ruta-desconocida')
    await router.load()
    renderWithProviders(router)

    expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
  })

  it('not found page contains link to Clientes', async () => {
    const router = createTestRouter('/ruta-desconocida')
    await router.load()
    renderWithProviders(router)

    expect(screen.getByText('Ir a Clientes')).toBeInTheDocument()
  })
})

describe('NotFoundPage', () => {
  it('shows Spanish text content', async () => {
    const router = createTestRouter('/algo-desconocido')
    await router.load()
    renderWithProviders(router)

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    expect(screen.getByText('La ruta solicitada no existe.')).toBeInTheDocument()
  })
})

// Story 2.2 — Route test: /clientes/:clienteId renders ClienteDetailView with correct param
describe('ClienteDetailRoute — /clientes/:clienteId', () => {
  it('renders ClienteDetailView with the correct clienteId param from the URL', async () => {
    const router = createTestRouter(`/clientes/${FIXED_CLIENTE_ID}`)
    await router.load()
    renderWithProviders(router)

    // The detail panel must be present
    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
  })

  it('loads and displays client data when navigating directly to /clientes/:clienteId', async () => {
    const router = createTestRouter(`/clientes/${FIXED_CLIENTE_ID}`)
    await router.load()
    renderWithProviders(router)

    // Client name should appear after data loads
    await screen.findByText('Empresa Ruta SA')
    expect(screen.getByText('900000099')).toBeInTheDocument()
  })
})
