import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { axe } from 'vitest-axe'
import { routeTree } from '../../routeTree.gen'

function createTestRouter(initialPath: string = '/clientes') {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

async function renderWithRouter(initialPath: string = '/clientes') {
  const router = createTestRouter(initialPath)
  await act(async () => {
    render(<RouterProvider router={router} />)
    await router.load()
  })
  return { router }
}

describe('Navigation Shell — AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC1 — Desktop navigation shell', () => {
    it('renders nav with role=navigation and aria-label="Navegación principal"', async () => {
      await renderWithRouter('/clientes')
      const nav = document.querySelector('nav[role="navigation"]')
      expect(nav).not.toBeNull()
      expect(nav?.getAttribute('aria-label')).toBe('Navegación principal')
    })

    it('renders Clientes label in navigation', async () => {
      await renderWithRouter('/clientes')
      expect(screen.getAllByText('Clientes').length).toBeGreaterThan(0)
    })

    it('renders Contactos label in navigation', async () => {
      await renderWithRouter('/contactos')
      expect(screen.getAllByText('Contactos').length).toBeGreaterThan(0)
    })
  })

  describe('AC2/AC3 — Route navigation renders correct page content', () => {
    it('renders Clientes page content at /clientes', async () => {
      await renderWithRouter('/clientes')
      expect(screen.getByRole('heading', { name: 'Clientes' })).toBeDefined()
    })

    it('renders Contactos page content at /contactos', async () => {
      await renderWithRouter('/contactos')
      expect(screen.getByRole('heading', { name: 'Contactos' })).toBeDefined()
    })
  })

  describe('AC5 — Deep link /clientes', () => {
    it('renders Clientes view when navigating directly to /clientes without redirect', async () => {
      await renderWithRouter('/clientes')
      expect(screen.getByRole('heading', { name: 'Clientes' })).toBeDefined()
    })
  })

  describe('AC6 — Deep link /contactos', () => {
    it('renders Contactos view when navigating directly to /contactos without redirect', async () => {
      await renderWithRouter('/contactos')
      expect(screen.getByRole('heading', { name: 'Contactos' })).toBeDefined()
    })
  })

  describe('AC7 — 404 not-found route', () => {
    it('shows Spanish "Página no encontrada" message for unknown routes', async () => {
      await renderWithRouter('/unknown-route-xyz')
      expect(screen.getByText('Página no encontrada')).toBeDefined()
    })

    it('shows link back to /clientes on 404 page', async () => {
      await renderWithRouter('/unknown-route-xyz')
      const link = screen.getByRole('link', { name: 'Ir a Clientes' })
      expect(link).toBeDefined()
      expect(link.getAttribute('href')).toBe('/clientes')
    })
  })

  describe('AC8 — Root / redirects to /clientes', () => {
    it('redirects / to /clientes and renders Clientes page', async () => {
      const router = createTestRouter('/')
      await act(async () => {
        render(<RouterProvider router={router} />)
        await router.load()
      })
      expect(router.state.location.pathname).toBe('/clientes')
      expect(screen.getByRole('heading', { name: 'Clientes' })).toBeDefined()
    })
  })

  describe('AC9 — Accessibility ARIA labels', () => {
    it('aria-label "Ir a Clientes" exists on nav icon button', async () => {
      await renderWithRouter('/clientes')
      const ariaLabel = document.querySelector('[aria-label="Ir a Clientes"]')
      expect(ariaLabel).not.toBeNull()
    })

    it('aria-label "Ir a Contactos" exists on nav icon button', async () => {
      await renderWithRouter('/contactos')
      const ariaLabel = document.querySelector('[aria-label="Ir a Contactos"]')
      expect(ariaLabel).not.toBeNull()
    })

    it('has no critical or serious axe violations at /clientes', async () => {
      await renderWithRouter('/clientes')
      const results = await axe(document.body)
      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      )
      expect(criticalOrSerious).toEqual([])
    })
  })
})
