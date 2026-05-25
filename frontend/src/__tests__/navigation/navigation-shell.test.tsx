/// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// Mock heroicons to avoid SVG issues in jsdom
vi.mock('@heroicons/react/24/outline', () => ({
  UsersIcon: () => <svg data-testid="icon-users" />,
  UserGroupIcon: () => <svg data-testid="icon-usergroup" />,
}))

function renderWithRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  return render(<RouterProvider router={router} />)
}

describe('Navigation Shell', () => {
  it('renders navigation items for Clientes and Contactos', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getAllByTestId('nav-item-clientes').length).toBeGreaterThanOrEqual(1)
    })

    expect(screen.getAllByTestId('nav-item-contactos').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Clientes').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Contactos').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the product name "Siesa Agents" in the navbar', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByText('Siesa Agents')).toBeInTheDocument()
    })
  })

  it('sets active state on Clientes nav item when on /clientes route', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.some((el) => el.getAttribute('aria-current') === 'page')).toBe(true)
    })

    const contactosItems = screen.getAllByTestId('nav-item-contactos')
    expect(contactosItems.every((el) => el.getAttribute('aria-current') !== 'page')).toBe(true)
  })

  it('sets active state on Contactos nav item when on /contactos route', async () => {
    renderWithRouter('/contactos')

    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      expect(contactosItems.some((el) => el.getAttribute('aria-current') === 'page')).toBe(true)
    })

    const clientesItems = screen.getAllByTestId('nav-item-clientes')
    expect(clientesItems.every((el) => el.getAttribute('aria-current') !== 'page')).toBe(true)
  })

  it('renders the Clientes page content on /clientes route', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('clientes-page-title')).toBeInTheDocument()
    })
  })

  it('renders the Contactos page content on /contactos route', async () => {
    renderWithRouter('/contactos')

    await waitFor(() => {
      expect(screen.getByTestId('contactos-page-title')).toBeInTheDocument()
    })
  })

  it('redirects from / to /clientes', async () => {
    renderWithRouter('/')

    await waitFor(() => {
      expect(screen.getByTestId('clientes-page-title')).toBeInTheDocument()
    })
  })

  it('renders 404 not-found view for unknown routes', async () => {
    renderWithRouter('/ruta-desconocida')

    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })

    expect(screen.getByTestId('not-found-message')).toBeInTheDocument()
    expect(screen.getByText('Ir a Clientes')).toBeInTheDocument()
  })

  it('renders "Ir a Clientes" link in 404 view pointing to /clientes', async () => {
    renderWithRouter('/ruta-desconocida')

    await waitFor(() => {
      const link = screen.getByTestId('not-found-back-link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/clientes')
    })
  })
})
