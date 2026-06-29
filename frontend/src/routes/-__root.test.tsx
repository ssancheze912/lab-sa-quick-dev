import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

async function renderWithRouter(initialPath: string = '/clientes') {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history: memoryHistory })
  await act(async () => {
    render(<RouterProvider router={router} />)
    await router.load()
  })
  return { router }
}

describe('RootLayout — NavigationRail desktop (lg+)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  it('renders NavigationRail wrapper on desktop viewport', async () => {
    await renderWithRouter('/clientes')
    const rail = document.querySelector('[data-testid="navigation-rail"]')
    expect(rail).toBeInTheDocument()
  })

  it('renders Clientes navigation item', async () => {
    await renderWithRouter('/clientes')
    const items = document.querySelectorAll('[aria-label="Clientes"]')
    expect(items.length).toBeGreaterThan(0)
  })

  it('renders Contactos navigation item', async () => {
    await renderWithRouter('/clientes')
    const items = document.querySelectorAll('[aria-label="Contactos"]')
    expect(items.length).toBeGreaterThan(0)
  })
})

describe('RootLayout — NavigationBar mobile (< lg)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
  })

  it('renders NavigationBar wrapper on mobile viewport', async () => {
    await renderWithRouter('/clientes')
    const bar = document.querySelector('[data-testid="navigation-bar"]')
    expect(bar).toBeInTheDocument()
  })
})

describe('Active navigation item', () => {
  it('marks Clientes as active when on /clientes route', async () => {
    await renderWithRouter('/clientes')
    const clientesItem = document.querySelector('[data-testid="nav-item-clientes"]')
    expect(clientesItem).toBeInTheDocument()
    expect(clientesItem).toHaveAttribute('data-active', 'true')
    expect(clientesItem).toHaveAttribute('aria-current', 'page')
  })

  it('marks Contactos as active when on /contactos route', async () => {
    await renderWithRouter('/contactos')
    const contactosItem = document.querySelector('[data-testid="nav-item-contactos"]')
    expect(contactosItem).toBeInTheDocument()
    expect(contactosItem).toHaveAttribute('data-active', 'true')
    expect(contactosItem).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark Contactos as active when on /clientes route', async () => {
    await renderWithRouter('/clientes')
    const contactosItem = document.querySelector('[data-testid="nav-item-contactos"]')
    expect(contactosItem).not.toHaveAttribute('data-active', 'true')
  })
})

describe('Route views', () => {
  it('renders Clientes placeholder content on /clientes', async () => {
    await renderWithRouter('/clientes')
    // h1 heading inside the view
    const heading = screen.getAllByText('Clientes').find(
      (el) => el.tagName === 'H1',
    )
    expect(heading).toBeInTheDocument()
  })

  it('renders Contactos placeholder content on /contactos', async () => {
    await renderWithRouter('/contactos')
    const heading = screen.getAllByText('Contactos').find(
      (el) => el.tagName === 'H1',
    )
    expect(heading).toBeInTheDocument()
  })
})

describe('404 not-found view', () => {
  it('renders not-found message in Spanish for unknown routes', async () => {
    await renderWithRouter('/ruta-desconocida')
    expect(screen.getByText(/Página no encontrada/i)).toBeInTheDocument()
  })

  it('renders a link back to /clientes from 404 page', async () => {
    await renderWithRouter('/ruta-desconocida')
    const link = screen.getByRole('link', { name: /Volver a Clientes/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/clientes')
  })
})
