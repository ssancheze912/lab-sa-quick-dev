import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from '../../routeTree.gen'

// Mock siesa-ui-kit components used in __root.tsx
vi.mock('siesa-ui-kit', () => ({
  NavigationRailItem: ({
    id,
    label,
    selected,
    onClick,
  }: {
    id?: string
    label: string
    selected?: boolean
    onClick?: () => void
  }) => (
    <button
      data-testid={`rail-internal-item-${id ?? label.toLowerCase()}`}
      data-selected={selected}
      onClick={onClick}
    >
      {label}
    </button>
  ),
  NavigationBar: ({
    items,
    activeItemId,
  }: {
    items: Array<{ id: string; label: string; active?: boolean }>
    activeItemId?: string
  }) => (
    <div data-testid="navigation-bar-inner" data-active={activeItemId}>
      {items.map((item) => (
        <span key={item.id} data-testid={`bar-item-${item.id}`}>
          {item.label}
        </span>
      ))}
    </div>
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

function renderWithProviders(router: ReturnType<typeof createTestRouter>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('RootLayout Navigation Shell', () => {
  describe('NavigationRail (desktop)', () => {
    it('renders desktop rail wrapper with Clientes and Contactos items', async () => {
      const router = createTestRouter('/clientes')
      renderWithProviders(router)
      await router.load()

      const rail = screen.getByTestId('navigation-rail')
      expect(rail).toBeTruthy()

      const clientesItem = screen.getByTestId('nav-item-clientes')
      expect(clientesItem).toBeTruthy()

      const contactosItem = screen.getByTestId('nav-item-contactos')
      expect(contactosItem).toBeTruthy()
    })

    it('sets aria-current="page" on Clientes wrapper when on /clientes route', async () => {
      const router = createTestRouter('/clientes')
      renderWithProviders(router)
      await router.load()

      const clientesItem = screen.getByTestId('nav-item-clientes')
      expect(clientesItem.getAttribute('aria-current')).toBe('page')

      const contactosItem = screen.getByTestId('nav-item-contactos')
      expect(contactosItem.getAttribute('aria-current')).toBeNull()
    })

    it('sets aria-current="page" on Contactos wrapper when on /contactos route', async () => {
      const router = createTestRouter('/contactos')
      renderWithProviders(router)
      await router.load()

      const contactosItem = screen.getByTestId('nav-item-contactos')
      expect(contactosItem.getAttribute('aria-current')).toBe('page')

      const clientesItem = screen.getByTestId('nav-item-clientes')
      expect(clientesItem.getAttribute('aria-current')).toBeNull()
    })
  })

  describe('NavigationBar (mobile)', () => {
    it('renders mobile nav wrapper with navigation-bar testid', async () => {
      const router = createTestRouter('/clientes')
      renderWithProviders(router)
      await router.load()

      const bar = screen.getByTestId('navigation-bar')
      expect(bar).toBeTruthy()
    })

    it('renders tappable items with nav-bar-item testid', async () => {
      const router = createTestRouter('/clientes')
      renderWithProviders(router)
      await router.load()

      const clientesItem = screen.getByTestId('nav-bar-item-clientes')
      expect(clientesItem).toBeTruthy()

      const contactosItem = screen.getByTestId('nav-bar-item-contactos')
      expect(contactosItem).toBeTruthy()
    })
  })

  describe('404 Not Found route', () => {
    it('renders 404 view with not-found-view testid for unknown routes', async () => {
      const router = createTestRouter('/ruta-desconocida')
      renderWithProviders(router)
      await router.load()

      const notFoundView = screen.getByTestId('not-found-view')
      expect(notFoundView).toBeTruthy()

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading.textContent).toBe('404')
    })

    it('renders a back-to-home link with not-found-home-link testid in 404 view', async () => {
      const router = createTestRouter('/pagina-que-no-existe')
      renderWithProviders(router)
      await router.load()

      const homeLink = screen.getByTestId('not-found-home-link')
      expect(homeLink).toBeTruthy()
      expect(homeLink.textContent).toMatch(/volver al inicio/i)
    })
  })

  describe('Redirect from root', () => {
    it('redirects / to /clientes', async () => {
      const router = createTestRouter('/')
      renderWithProviders(router)
      await router.load()

      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  describe('View routes', () => {
    it('renders clientes-view when on /clientes', async () => {
      const router = createTestRouter('/clientes')
      renderWithProviders(router)
      await router.load()

      const view = screen.getByTestId('clientes-view')
      expect(view).toBeTruthy()
    })

    it('renders contactos-view when on /contactos', async () => {
      const router = createTestRouter('/contactos')
      renderWithProviders(router)
      await router.load()

      const view = screen.getByTestId('contactos-view')
      expect(view).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('desktop nav element has aria-label "Navegación principal"', async () => {
      const router = createTestRouter('/clientes')
      renderWithProviders(router)
      await router.load()

      const navElements = screen.getAllByRole('navigation')
      const mainNavs = navElements.filter(
        (el) => el.getAttribute('aria-label') === 'Navegación principal'
      )
      expect(mainNavs.length).toBeGreaterThanOrEqual(1)
    })
  })
})
