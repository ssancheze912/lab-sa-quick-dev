import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
import { ClienteListView } from './ClienteListView'
import type { Cliente } from '../domain/Cliente'

// Mock siesa-ui-kit Button component
vi.mock('siesa-ui-kit', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) =>
    createElement('button', { onClick, ...props }, children),
}))

const mockClientes: Cliente[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Empresa Alpha',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Empresa Beta',
    nit: '800987654-2',
    telefono: '3119876543',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
]

const server = setupServer(
  http.get('*/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes)
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderClienteListView(initialUrl = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: ClienteListView,
  })
  const clienteDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => null,
  })

  const routeTree = rootRoute.addChildren([indexRoute, clienteDetailRoute])
  const memoryHistory = createMemoryHistory({ initialEntries: [initialUrl] })
  const router = createRouter({ routeTree, history: memoryHistory })

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(RouterProvider, { router }),
    ),
  )
}

describe('ClienteListView', () => {
  it('renders the list view container', async () => {
    // Arrange & Act
    renderClienteListView()

    // Assert — the aside container renders
    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-view')).toBeInTheDocument()
    })
  })

  it('renders EmptyState when API returns empty array', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([])
      }),
    )

    // Act
    renderClienteListView()

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
    expect(screen.getByText('No hay clientes registrados. Crea el primero.')).toBeInTheDocument()
  })

  it('renders ErrorPanel with retry button on API failure', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.error()
      }),
    )

    // Act
    renderClienteListView()

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  it('renders list of clients with Nombre and NIT/RUC visible', async () => {
    // Arrange & Act
    renderClienteListView()

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })
    expect(screen.getByText('900123456-1')).toBeInTheDocument()
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument()
    expect(screen.getByText('800987654-2')).toBeInTheDocument()
  })

  it('filters list when search input changes (case-insensitive)', async () => {
    // Arrange
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // Act — type in search input
    const searchInput = screen.getByTestId('client-search-input')
    fireEvent.change(searchInput, { target: { value: 'alpha' } })

    // Assert
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Empresa Beta')).not.toBeInTheDocument()
  })

  it('filters by NIT case-insensitively', async () => {
    // Arrange
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // Act
    const searchInput = screen.getByTestId('client-search-input')
    fireEvent.change(searchInput, { target: { value: '800987654' } })

    // Assert
    expect(screen.queryByText('Empresa Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument()
  })

  it('accessibility — aside aria-label present and items have aria-selected', async () => {
    // Arrange & Act
    renderClienteListView()

    // Assert
    await waitFor(() => {
      const aside = screen.getByTestId('cliente-list-view')
      expect(aside).toBeInTheDocument()
      expect(aside.tagName.toLowerCase()).toBe('aside')
      expect(aside).toHaveAttribute('aria-label', 'Lista de clientes')
    })

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    const items = screen.getAllByRole('option')
    items.forEach((item) => {
      expect(item).toHaveAttribute('aria-selected')
    })
  })
})
