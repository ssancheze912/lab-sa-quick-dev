import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// Mock siesa-ui-kit LayoutBase to simplify test rendering
vi.mock('siesa-ui-kit', () => ({
  LayoutBase: ({ children, navigationItems, productName }: {
    children: React.ReactNode
    navigationItems?: Array<{ id: string; label: string; active?: boolean; onClick?: () => void }>
    productName?: string
  }) => (
    <div data-testid="layout-base">
      <div data-testid="product-name">{productName}</div>
      <nav aria-label="navegación principal">
        {navigationItems?.map((item) => (
          <button
            key={item.id}
            data-testid={`nav-item-${item.id}`}
            aria-current={item.active ? 'page' : undefined}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  ),
}))

// Mock heroicons to avoid SVG issues in jsdom
vi.mock('@heroicons/react/24/outline', () => ({
  UsersIcon: () => <svg data-testid="icon-users" />,
  UserGroupIcon: () => <svg data-testid="icon-usergroup" />,
}))

// Mock siesa-ui-kit styles
vi.mock('siesa-ui-kit/styles.css', () => ({}))

function renderWithRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  return render(<RouterProvider router={router} />)
}

describe('Navigation Shell', () => {
  it('renders LayoutBase with navigation items for Clientes and Contactos', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('layout-base')).toBeInTheDocument()
    })

    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
    expect(screen.getAllByText('Clientes').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Contactos')).toBeInTheDocument()
  })

  it('renders the product name "Siesa Agents" in LayoutBase', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('product-name')).toHaveTextContent('Siesa Agents')
    })
  })

  it('sets active state on Clientes nav item when on /clientes route', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      const clientesItem = screen.getByTestId('nav-item-clientes')
      expect(clientesItem).toHaveAttribute('aria-current', 'page')
    })

    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).not.toHaveAttribute('aria-current', 'page')
  })

  it('sets active state on Contactos nav item when on /contactos route', async () => {
    renderWithRouter('/contactos')

    await waitFor(() => {
      const contactosItem = screen.getByTestId('nav-item-contactos')
      expect(contactosItem).toHaveAttribute('aria-current', 'page')
    })

    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).not.toHaveAttribute('aria-current', 'page')
  })

  it('renders the Clientes page content on /clientes route', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
    })
  })

  it('renders the Contactos page content on /contactos route', async () => {
    renderWithRouter('/contactos')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Contactos' })).toBeInTheDocument()
    })
  })

  it('redirects from / to /clientes', async () => {
    renderWithRouter('/')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
    })
  })

  it('renders 404 not-found view for unknown routes', async () => {
    renderWithRouter('/ruta-desconocida')

    await waitFor(() => {
      expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    })

    expect(screen.getByText('La ruta solicitada no existe.')).toBeInTheDocument()
    expect(screen.getByText('Ir a Clientes')).toBeInTheDocument()
  })

  it('renders "Ir a Clientes" link in 404 view pointing to /clientes', async () => {
    renderWithRouter('/ruta-desconocida')

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Ir a Clientes' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/clientes')
    })
  })
})
