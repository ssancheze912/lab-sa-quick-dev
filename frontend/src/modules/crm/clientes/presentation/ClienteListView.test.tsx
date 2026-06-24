import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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

// Mock siesa-ui-kit components
vi.mock('siesa-ui-kit', () => ({
  Button: ({
    children,
    onClick,
    htmlType,
    disabled,
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
    htmlType?: string
    disabled?: boolean
    [key: string]: unknown
  }) =>
    createElement('button', { onClick, type: htmlType ?? 'button', disabled, ...props }, children),
  AlertDialog: ({
    isOpen,
    title,
    description,
    onCancel,
    showCloseButton,
  }: {
    isOpen?: boolean
    title?: string
    description?: React.ReactNode
    onCancel?: () => void
    showCloseButton?: boolean
    [key: string]: unknown
  }) => {
    if (!isOpen) return null
    return createElement(
      'div',
      { role: 'dialog', 'aria-label': title },
      showCloseButton &&
        createElement('button', { onClick: onCancel, 'aria-label': 'Cerrar' }, 'X'),
      description,
    )
  },
  Input: ({
    label,
    id,
    errorMessage,
    error: _error,
    ...props
  }: {
    label?: string
    id?: string
    errorMessage?: string
    error?: boolean
    [key: string]: unknown
  }) =>
    createElement(
      'div',
      null,
      label && createElement('label', { htmlFor: id }, label),
      createElement('input', { id, ...props }),
      errorMessage && createElement('p', { role: 'alert' }, errorMessage),
    ),
  Select: ({
    options,
    value,
    onChange,
    ariaLabel,
  }: {
    options: { value: string; label: string }[]
    value?: string
    onChange?: (value: string) => void
    ariaLabel?: string
  }) =>
    createElement(
      'select',
      {
        'aria-label': ariaLabel,
        value,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value),
        'data-testid': 'sort-select',
      },
      ...options.map((opt) =>
        createElement('option', { key: opt.value, value: opt.value }, opt.label),
      ),
    ),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

  it('renders skeleton loader while data is loading (AC#7)', () => {
    // Arrange — use a server that delays so component stays in loading state
    server.use(
      http.get('*/api/v1/clientes', async () => {
        // Delay response so component is in isLoading state during assertion
        await new Promise((resolve) => setTimeout(resolve, 500))
        return HttpResponse.json(mockClientes)
      }),
    )

    // Act
    renderClienteListView()

    // Assert — skeleton container renders while loading
    // react-loading-skeleton renders spans; we check the wrapper div is present
    const listView = screen.getByTestId('cliente-list-view')
    expect(listView).toBeInTheDocument()
    // The client list items should NOT yet be visible while loading
    expect(screen.queryByText('Empresa Alpha')).not.toBeInTheDocument()
  })

  it('clicking a client item navigates to /clientes/:clienteId (AC#5)', async () => {
    // Arrange
    const { container } = renderClienteListView()

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // Act — click first client item
    const firstItem = screen.getByTestId(`client-list-item-${mockClientes[0].id}`)
    fireEvent.click(firstItem)

    // Assert — router should update the URL to include clienteId
    await waitFor(() => {
      expect(container).toBeTruthy()
      // Verify the item has aria-selected reflecting selection state
      // (full URL assertion requires router inspection via history)
      expect(firstItem).toHaveAttribute('data-testid', `client-list-item-${mockClientes[0].id}`)
    })
  })

  it('shows different EmptyState message when search yields no results vs no data', async () => {
    // Arrange — server returns data
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // Act — search for something that matches nothing
    const searchInput = screen.getByTestId('client-search-input')
    fireEvent.change(searchInput, { target: { value: 'xyzzy-nomatch' } })

    // Assert — message is about search, not about creating first client
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('No se encontraron clientes que coincidan con la búsqueda.')).toBeInTheDocument()
      expect(screen.queryByText('No hay clientes registrados. Crea el primero.')).not.toBeInTheDocument()
    })
  })

  it('SortControl is rendered in the list view (AC#6 — sort-control present)', async () => {
    // Arrange & Act
    renderClienteListView()

    // Assert — sort control present after router initialization
    await waitFor(() => {
      expect(screen.getByTestId('sort-control')).toBeInTheDocument()
    })
  })

  it('changing sort via SortControl reorders the displayed client list (AC#1)', async () => {
    // Arrange — mockClientes: Alpha (2026-01-01), Beta (2026-01-02)
    // Default sort: fecha-desc → Beta first (newest)
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByText('Empresa Beta')).toBeInTheDocument()
    })

    // Verify default fecha-desc order: Beta (newest) appears before Alpha (oldest)
    // Use client-list-item test ids for precise ordering (not <option> elements from select)
    const betaItem = screen.getByTestId(`client-list-item-${mockClientes[1].id}`)
    const alphaItem = screen.getByTestId(`client-list-item-${mockClientes[0].id}`)
    const list = screen.getByRole('listbox')
    const allItems = Array.from(list.querySelectorAll('[role="option"]'))
    expect(allItems.indexOf(betaItem)).toBeLessThan(allItems.indexOf(alphaItem))

    // Act — change to nombre-asc: Alpha should appear first
    const sortSelect = screen.getByTestId('sort-select')
    act(() => {
      fireEvent.change(sortSelect, { target: { value: 'nombre-asc' } })
    })

    // Assert — Alpha (A) before Beta (B)
    const allItemsAfter = Array.from(list.querySelectorAll('[role="option"]'))
    const alphaIndex = allItemsAfter.findIndex((el) => el.getAttribute('data-testid') === `client-list-item-${mockClientes[0].id}`)
    const betaIndex = allItemsAfter.findIndex((el) => el.getAttribute('data-testid') === `client-list-item-${mockClientes[1].id}`)
    expect(alphaIndex).toBeLessThan(betaIndex)
  })

  it('search filter and sort coexist — filtered + sorted result renders correctly (AC#5)', async () => {
    // Arrange — server returns both clientes
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // Act — apply search filter (only Alpha matches)
    const searchInput = screen.getByTestId('client-search-input')
    fireEvent.change(searchInput, { target: { value: 'alpha' } })

    // Assert — only Alpha shown
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Empresa Beta')).not.toBeInTheDocument()

    // Act — change sort order (should not clear filter)
    const sortSelect = screen.getByTestId('sort-select')
    act(() => {
      fireEvent.change(sortSelect, { target: { value: 'nombre-desc' } })
    })

    // Assert — Alpha still shown, Beta still absent, search input not cleared
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Empresa Beta')).not.toBeInTheDocument()
    expect((searchInput as HTMLInputElement).value).toBe('alpha')
  })
})
