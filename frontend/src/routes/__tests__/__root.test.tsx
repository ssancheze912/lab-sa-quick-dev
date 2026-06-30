import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryHistory, RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// Mock siesa-ui-kit components
vi.mock('siesa-ui-kit', () => ({
  NavigationRail: ({ items, selectedId, onItemSelect }: {
    items: Array<{ id: string; label: string; selected?: boolean; ariaLabel?: string }>
    selectedId?: string
    onItemSelect?: (id: string) => void
  }) => (
    <nav data-testid="navigation-rail" aria-label="Navegación principal">
      {items.map((item) => (
        <button
          key={item.id}
          data-testid={`rail-item-${item.id}`}
          aria-label={item.ariaLabel ?? item.label}
          aria-current={item.id === selectedId ? 'page' : undefined}
          onClick={() => onItemSelect?.(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  ),
  NavigationBar: ({ items, activeItemId, onItemClick, ariaLabel }: {
    items: Array<{ id: string; label: string; active?: boolean; ariaLabel?: string }>
    activeItemId?: string
    onItemClick?: (id: string) => void
    ariaLabel?: string
  }) => (
    <nav data-testid="navigation-bar" aria-label={ariaLabel ?? 'Navegación principal'}>
      {items.map((item) => (
        <button
          key={item.id}
          data-testid={`bar-item-${item.id}`}
          aria-label={item.ariaLabel ?? item.label}
          aria-current={item.id === activeItemId ? 'page' : undefined}
          onClick={() => onItemClick?.(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  ),
}))

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('Root Navigation Shell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders NavigationRail with Clientes and Contactos items', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    expect(screen.getByTestId('rail-item-clientes')).toBeInTheDocument()
    expect(screen.getByTestId('rail-item-contactos')).toBeInTheDocument()
    expect(screen.getAllByText('Clientes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Contactos').length).toBeGreaterThan(0)
  })

  it('renders NavigationBar with Clientes and Contactos items', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    })

    expect(screen.getByTestId('bar-item-clientes')).toBeInTheDocument()
    expect(screen.getByTestId('bar-item-contactos')).toBeInTheDocument()
  })

  it('navigates to /clientes route and renders placeholder content', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('clientes-page')).toBeInTheDocument()
    })

    expect(screen.getByText('Clientes — próximamente')).toBeInTheDocument()
  })

  it('navigates to /contactos route and renders placeholder content', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('contactos-page')).toBeInTheDocument()
    })

    expect(screen.getByText('Contactos — próximamente')).toBeInTheDocument()
  })

  it('highlights Clientes navigation item when on /clientes route', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('rail-item-clientes')).toBeInTheDocument()
    })

    const clientesRailItem = screen.getByTestId('rail-item-clientes')
    expect(clientesRailItem).toHaveAttribute('aria-current', 'page')

    const contactosRailItem = screen.getByTestId('rail-item-contactos')
    expect(contactosRailItem).not.toHaveAttribute('aria-current', 'page')
  })

  it('highlights Contactos navigation item when on /contactos route', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('rail-item-contactos')).toBeInTheDocument()
    })

    const contactosRailItem = screen.getByTestId('rail-item-contactos')
    expect(contactosRailItem).toHaveAttribute('aria-current', 'page')
  })

  it('redirects from / to /clientes', async () => {
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })

    expect(screen.getByTestId('clientes-page')).toBeInTheDocument()
  })

  it('renders 404 page for unknown routes with Spanish message', async () => {
    const router = createTestRouter('/ruta-desconocida')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    })

    expect(screen.getByText('La página que buscas no existe.')).toBeInTheDocument()
  })

  it('navigation container has proper ARIA label in Spanish', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    const navElements = screen.getAllByRole('navigation')
    const hasSpanishLabel = navElements.some(
      (el) => el.getAttribute('aria-label') === 'Navegación principal',
    )
    expect(hasSpanishLabel).toBe(true)
  })

  it('navigation items have proper aria-labels in Spanish', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('rail-item-clientes')).toBeInTheDocument()
    })

    expect(screen.getAllByLabelText('Clientes').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Contactos').length).toBeGreaterThan(0)
  })
})
