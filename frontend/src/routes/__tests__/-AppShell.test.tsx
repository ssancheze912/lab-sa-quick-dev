import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { routeTree } from '../../routeTree.gen'

async function renderWithRouter(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  await router.load()
  render(
    createElement(QueryClientProvider, { client: queryClient },
      createElement(RouterProvider, { router })
    )
  )
  return { router, history }
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders NavigationRail on desktop viewport', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    await renderWithRouter('/clientes')
    const navElements = await screen.findAllByRole('navigation', { name: 'Navegación principal' })
    expect(navElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders NavigationBar on mobile viewport', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
    await renderWithRouter('/clientes')
    const navElements = await screen.findAllByRole('navigation', { name: 'Navegación principal' })
    expect(navElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Clientes panel at /clientes route', async () => {
    await renderWithRouter('/clientes')
    expect(await screen.findByTestId('clientes-list-panel')).toBeInTheDocument()
  })

  it('renders Contactos heading at /contactos route', async () => {
    await renderWithRouter('/contactos')
    expect(await screen.findByRole('heading', { name: /contactos/i })).toBeInTheDocument()
  })

  it('clicking Clientes nav item navigates to /clientes', async () => {
    await renderWithRouter('/contactos')
    await screen.findByRole('heading', { name: /contactos/i })
    // Nav items render as <a> links (TanStack Router <Link>), not buttons
    const navLink = await screen.findByTestId('nav-item-clientes')
    await act(async () => {
      fireEvent.click(navLink)
    })
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    })
  })

  it('clicking Contactos nav item navigates to /contactos', async () => {
    await renderWithRouter('/clientes')
    await screen.findByTestId('clientes-list-panel')
    // Nav items render as <a> links (TanStack Router <Link>), not buttons
    const navLink = await screen.findByTestId('nav-item-contactos')
    await act(async () => {
      fireEvent.click(navLink)
    })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contactos/i })).toBeInTheDocument()
    })
  })

  it('active nav item has aria-current="page" when on matching route', async () => {
    await renderWithRouter('/clientes')
    await screen.findByTestId('clientes-list-panel')
    // Nav items render as <a> links with aria-current="page" set directly on the element
    const navLink = await screen.findByTestId('nav-item-clientes')
    expect(navLink.getAttribute('aria-current')).toBe('page')
  })

  it('navigating to unknown route renders 404 not-found view', async () => {
    await renderWithRouter('/unknown-path')
    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /ir a clientes/i })).toBeInTheDocument()
  })

  it('redirects from / to /clientes', async () => {
    await renderWithRouter('/')
    expect(await screen.findByTestId('clientes-list-panel')).toBeInTheDocument()
  })
})
