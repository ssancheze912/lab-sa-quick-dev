import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// Mock siesa-ui-kit components
vi.mock('siesa-ui-kit', () => ({
  NavigationRail: ({ items, selectedId }: { items: Array<{ id: string; label: string; selected?: boolean }>; selectedId?: string }) => (
    <nav data-testid="navigation-rail" data-selected={selectedId}>
      {items.map((item) => (
        <a
          key={item.id}
          href={`/${item.id}`}
          data-testid={`rail-item-${item.id}`}
          aria-current={item.id === selectedId ? 'page' : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  ),
  NavigationBar: ({ items, activeItemId }: { items: Array<{ id: string; label: string; active?: boolean }>; activeItemId?: string }) => (
    <nav data-testid="navigation-bar" data-active={activeItemId}>
      {items.map((item) => (
        <a
          key={item.id}
          href={`/${item.id}`}
          data-testid={`bar-item-${item.id}`}
          aria-current={item.id === activeItemId ? 'page' : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  ),
}))

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  UsersIcon: () => <svg data-testid="icon-users" />,
  UserIcon: () => <svg data-testid="icon-user" />,
}))

function createTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

describe('RootLayout Navigation Shell', () => {
  describe('NavigationRail (desktop)', () => {
    it('renders NavigationRail with Clientes and Contactos items', async () => {
      const router = createTestRouter('/clientes')
      render(<RouterProvider router={router} />)
      await router.load()

      const rail = screen.getByTestId('navigation-rail')
      expect(rail).toBeTruthy()

      const clientesItem = screen.getByTestId('rail-item-clientes')
      expect(clientesItem).toBeTruthy()
      expect(clientesItem.textContent).toBe('Clientes')

      const contactosItem = screen.getByTestId('rail-item-contactos')
      expect(contactosItem).toBeTruthy()
      expect(contactosItem.textContent).toBe('Contactos')
    })

    it('highlights Clientes link as active when on /clientes route', async () => {
      const router = createTestRouter('/clientes')
      render(<RouterProvider router={router} />)
      await router.load()

      const clientesItem = screen.getByTestId('rail-item-clientes')
      expect(clientesItem.getAttribute('aria-current')).toBe('page')

      const contactosItem = screen.getByTestId('rail-item-contactos')
      expect(contactosItem.getAttribute('aria-current')).toBeNull()
    })

    it('highlights Contactos link as active when on /contactos route', async () => {
      const router = createTestRouter('/contactos')
      render(<RouterProvider router={router} />)
      await router.load()

      const contactosItem = screen.getByTestId('rail-item-contactos')
      expect(contactosItem.getAttribute('aria-current')).toBe('page')

      const clientesItem = screen.getByTestId('rail-item-clientes')
      expect(clientesItem.getAttribute('aria-current')).toBeNull()
    })
  })

  describe('NavigationBar (mobile)', () => {
    it('renders NavigationBar with navigation items', async () => {
      const router = createTestRouter('/clientes')
      render(<RouterProvider router={router} />)
      await router.load()

      const bar = screen.getByTestId('navigation-bar')
      expect(bar).toBeTruthy()
    })
  })

  describe('404 Not Found route', () => {
    it('renders 404 view for unknown routes', async () => {
      const router = createTestRouter('/ruta-desconocida')
      render(<RouterProvider router={router} />)
      await router.load()

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading.textContent).toBe('404')
    })

    it('renders a back-to-home link in 404 view', async () => {
      const router = createTestRouter('/pagina-que-no-existe')
      render(<RouterProvider router={router} />)
      await router.load()

      const homeLink = screen.getByRole('link', { name: /volver al inicio/i })
      expect(homeLink).toBeTruthy()
    })
  })

  describe('Redirect from root', () => {
    it('redirects / to /clientes', async () => {
      const router = createTestRouter('/')
      render(<RouterProvider router={router} />)
      await router.load()

      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  describe('Accessibility', () => {
    it('nav element has aria-label in Spanish', async () => {
      const router = createTestRouter('/clientes')
      render(<RouterProvider router={router} />)
      await router.load()

      const navElements = screen.getAllByRole('navigation')
      const mainNavs = navElements.filter(
        (el) => el.getAttribute('aria-label') === 'Navegación principal'
      )
      expect(mainNavs.length).toBeGreaterThanOrEqual(1)
    })
  })
})
