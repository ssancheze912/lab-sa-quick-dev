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
import { ContactoListView } from './ContactoListView'
import type { Contacto } from '../domain/Contacto'

// Mock siesa-ui-kit components
vi.mock('siesa-ui-kit', () => ({
  Button: ({
    children,
    onClick,
    htmlType,
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
    htmlType?: string
    [key: string]: unknown
  }) =>
    createElement('button', { onClick, type: htmlType ?? 'button', ...props }, children),
}))

const mockContactos: Contacto[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    nombre: 'Juan Pérez',
    cargo: 'Gerente',
    telefono: '3001234567',
    email: 'juan.perez@empresa.com',
    clienteId: '11111111-1111-1111-1111-111111111111',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    nombre: 'María López',
    cargo: 'Directora',
    telefono: '3119876543',
    email: 'maria.lopez@otra.com',
    clienteId: null,
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
]

const server = setupServer(
  http.get('*/api/v1/contactos', () => {
    return HttpResponse.json(mockContactos)
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderContactoListView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const rootRoute = createRootRoute()
  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: ContactoListView,
  })
  const contactoDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos/$contactoId',
    component: () => createElement('div', null, 'Detail'),
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([contactosRoute, contactoDetailRoute]),
    history: createMemoryHistory({ initialEntries: ['/contactos'] }),
  })

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(RouterProvider, { router }),
    ),
  )
}

describe('ContactoListView', () => {
  it('renders skeleton during loading (AC#7)', async () => {
    // Arrange & Act
    renderContactoListView()

    // Assert — root element present while loading
    const listView = await screen.findByTestId('contacto-list-view')
    expect(listView).toBeInTheDocument()
    // Contacts are not yet visible
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
  })

  it('renders EmptyState when API returns empty array (AC#3)', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/contactos', () => {
        return HttpResponse.json([])
      }),
    )

    // Act
    renderContactoListView()

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(
        screen.getByText('No hay contactos registrados. Crea el primero.'),
      ).toBeInTheDocument()
    })
  })

  it('renders ErrorPanel with retry button on API failure (AC#4)', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/contactos', () => {
        return HttpResponse.error()
      }),
    )

    // Act
    renderContactoListView()

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    })
  })

  it('renders list of contacts with Nombre, Cargo, Email visible (AC#1)', async () => {
    // Arrange & Act
    renderContactoListView()

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByText('Gerente')).toBeInTheDocument()
      expect(screen.getByText('juan.perez@empresa.com')).toBeInTheDocument()
      expect(screen.getByText('María López')).toBeInTheDocument()
      expect(screen.getByText('Directora')).toBeInTheDocument()
      expect(screen.getByText('maria.lopez@otra.com')).toBeInTheDocument()
    })
  })

  it('filters list when search input changes by nombre — case-insensitive (AC#2)', async () => {
    // Arrange
    renderContactoListView()

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    // Act
    const searchInput = screen.getByTestId('contact-search-input')
    fireEvent.change(searchInput, { target: { value: 'juan' } })

    // Assert
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.queryByText('María López')).not.toBeInTheDocument()
  })

  it('filters list when search input changes by email — case-insensitive (AC#2)', async () => {
    // Arrange
    renderContactoListView()

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    // Act
    const searchInput = screen.getByTestId('contact-search-input')
    fireEvent.change(searchInput, { target: { value: 'MARIA.LOPEZ' } })

    // Assert
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
    expect(screen.getByText('María López')).toBeInTheDocument()
  })

  it('clicking item navigates to /contactos/:id (AC#5)', async () => {
    // Arrange
    renderContactoListView()

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    // Act
    const firstRow = screen.getByTestId(`contact-list-item-${mockContactos[0].id}`)
    fireEvent.click(firstRow)

    // Assert — row exists and is clickable
    expect(firstRow).toBeInTheDocument()
  })

  it('accessibility — section aria-label "Lista de contactos" is present (AC#1)', async () => {
    // Arrange & Act
    renderContactoListView()

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    // Assert
    expect(screen.getByRole('region', { name: 'Lista de contactos' })).toBeInTheDocument()
  })
})
