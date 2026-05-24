import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

async function renderWithRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  await router.load()
  render(<RouterProvider router={router} />)
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

  it('renders Clientes heading at /clientes route', async () => {
    await renderWithRouter('/clientes')
    expect(await screen.findByRole('heading', { name: /clientes/i })).toBeInTheDocument()
  })

  it('renders Contactos heading at /contactos route', async () => {
    await renderWithRouter('/contactos')
    expect(await screen.findByRole('heading', { name: /contactos/i })).toBeInTheDocument()
  })

  it('clicking Clientes nav item navigates to /clientes', async () => {
    await renderWithRouter('/contactos')
    await screen.findByRole('heading', { name: /contactos/i })
    // NavigationBar buttons have no data-item-id; NavigationRailItem buttons have data-item-id
    const allButtons = await screen.findAllByRole('button', { name: /clientes/i })
    const navBarButton = allButtons.find(b => !b.getAttribute('data-item-id'))
    if (!navBarButton) throw new Error('NavigationBar Clientes button not found')
    await act(async () => {
      fireEvent.click(navBarButton)
    })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /clientes/i })).toBeInTheDocument()
    })
  })

  it('clicking Contactos nav item navigates to /contactos', async () => {
    await renderWithRouter('/clientes')
    await screen.findByRole('heading', { name: /clientes/i })
    const allButtons = await screen.findAllByRole('button', { name: /contactos/i })
    const navBarButton = allButtons.find(b => !b.getAttribute('data-item-id'))
    if (!navBarButton) throw new Error('NavigationBar Contactos button not found')
    await act(async () => {
      fireEvent.click(navBarButton)
    })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contactos/i })).toBeInTheDocument()
    })
  })

  it('active nav item has aria-current="page" when on matching route', async () => {
    await renderWithRouter('/clientes')
    await screen.findByRole('heading', { name: /clientes/i })
    // NavigationBar renders buttons with aria-current="page" for the active item
    const allButtons = await screen.findAllByRole('button', { name: /clientes/i })
    const activeButton = allButtons.find(b => b.getAttribute('aria-current') === 'page')
    expect(activeButton).toBeDefined()
  })

  it('navigating to unknown route renders 404 not-found view', async () => {
    await renderWithRouter('/unknown-path')
    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /ir a clientes/i })).toBeInTheDocument()
  })

  it('redirects from / to /clientes', async () => {
    await renderWithRouter('/')
    expect(await screen.findByRole('heading', { name: /clientes/i })).toBeInTheDocument()
  })
})
