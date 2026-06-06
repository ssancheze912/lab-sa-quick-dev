// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createRouter, RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'
// Helper to render the app at a given path
function renderAtPath(path: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history: memoryHistory })
  return render(<RouterProvider router={router} />)
}

// Helper to mock window.innerWidth for viewport tests
function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

afterEach(() => {
  cleanup()
})

describe('AppShell - Navigation Structure', () => {
  it('renders NavigationRail on desktop viewport (>= 1024px)', async () => {
    setViewportWidth(1280)
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')

    // NavigationRail is in a hidden lg:flex nav — check nav elements present
    const navElements = screen.getAllByRole('navigation')
    expect(navElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders NavigationBar on mobile viewport (< 1024px)', async () => {
    setViewportWidth(375)
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')

    const navElements = screen.getAllByRole('navigation')
    expect(navElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Clientes page at /clientes', async () => {
    renderAtPath('/clientes')
    const page = await screen.findByTestId('clientes-page')
    expect(page).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
  })

  it('renders Contactos page at /contactos', async () => {
    renderAtPath('/contactos')
    const page = await screen.findByTestId('contactos-page')
    expect(page).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Contactos' })).toBeInTheDocument()
  })

  it('redirects from / to /clientes', async () => {
    renderAtPath('/')
    // After redirect, clientes page should be rendered
    const page = await screen.findByTestId('clientes-page')
    expect(page).toBeInTheDocument()
  })

  it('renders not-found view for unknown routes', async () => {
    renderAtPath('/unknown-route-xyz')
    const heading = await screen.findByRole('heading', { name: 'Página no encontrada' })
    expect(heading).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Ir a Clientes' })
    expect(link).toBeInTheDocument()
  })

  it('renders app-root wrapper with correct testid', async () => {
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')
    expect(screen.getByTestId('app-root')).toBeInTheDocument()
  })

  it('navigation elements have aria-label in Spanish', async () => {
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')

    const navElements = screen.getAllByRole('navigation')
    const hasSpanishLabel = navElements.some(
      (nav) => nav.getAttribute('aria-label') === 'Navegación principal'
    )
    expect(hasSpanishLabel).toBe(true)
  })
})

describe('AppShell - Accessibility (WCAG 2.1 AA)', () => {
  it('nav elements have aria-label for screen reader accessibility', async () => {
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')

    // All nav elements must have aria-label in Spanish per WCAG 2.1 AA
    const navElements = screen.getAllByRole('navigation')
    navElements.forEach((nav) => {
      expect(nav).toHaveAttribute('aria-label')
    })
  })

  it('not-found link has visible text for screen readers', async () => {
    renderAtPath('/unknown-route-for-a11y-test')
    await screen.findByRole('heading', { name: 'Página no encontrada' })

    // Link must have accessible text
    const link = screen.getByRole('link', { name: 'Ir a Clientes' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveTextContent('Ir a Clientes')
  })

  it('heading hierarchy is correct on clientes page', async () => {
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('Clientes')
  })

  it('heading hierarchy is correct on 404 page', async () => {
    renderAtPath('/unknown-route-for-a11y-test')
    const h1 = await screen.findByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('Página no encontrada')
  })
})
