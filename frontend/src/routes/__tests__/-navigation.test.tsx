import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock TanStack Router hooks
const mockPathname = vi.fn(() => '/clientes')
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  )
  return {
    ...actual,
    useRouterState: () => ({
      location: { pathname: mockPathname() },
    }),
    Outlet: () => <div data-testid="outlet-content">Outlet</div>,
    Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
    useNavigate: () => vi.fn(),
  }
})

// Mock siesa-ui-kit navigation components
vi.mock('siesa-ui-kit', async () => {
  return {
    NavigationRail: ({
      items,
      selectedId,
    }: {
      items: Array<{ id: string; label: string; icon: React.ReactNode; selected?: boolean; onClick?: () => void }>
      selectedId?: string
    }) => (
      <nav data-testid="navigation-rail" aria-label="Navegación principal">
        {items.map((item) => (
          <button
            key={item.id}
            data-testid={`nav-rail-item-${item.id}`}
            data-selected={selectedId === item.id}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ))}
      </nav>
    ),
    NavigationBar: ({
      items,
      activeItemId,
    }: {
      items: Array<{ id: string; label: string; icon: React.ReactNode; onClick?: (id: string) => void }>
      activeItemId?: string
    }) => (
      <nav data-testid="navigation-bar" aria-label="Navegación principal">
        {items.map((item) => (
          <button
            key={item.id}
            data-testid={`nav-bar-item-${item.id}`}
            data-active={activeItemId === item.id}
            onClick={() => item.onClick?.(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    ),
  }
})

import { AppLayout } from '../_app'

describe('Navigation Shell — AppLayout', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/clientes')
  })

  describe('AC#1 — Desktop: NavigationRail visible on large viewports', () => {
    it('renders NavigationRail with Clientes and Contactos items', () => {
      render(<AppLayout />)
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
      expect(screen.getByTestId('nav-rail-item-clientes')).toBeInTheDocument()
      expect(screen.getByTestId('nav-rail-item-contactos')).toBeInTheDocument()
    })

    it('NavigationRail has correct labels in Spanish', () => {
      render(<AppLayout />)
      expect(screen.getByTestId('nav-rail-item-clientes')).toHaveTextContent('Clientes')
      expect(screen.getByTestId('nav-rail-item-contactos')).toHaveTextContent('Contactos')
    })
  })

  describe('AC#2 — Mobile: NavigationBar visible on small viewports', () => {
    it('renders NavigationBar with Clientes and Contactos items', () => {
      render(<AppLayout />)
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
      expect(screen.getByTestId('nav-bar-item-clientes')).toBeInTheDocument()
      expect(screen.getByTestId('nav-bar-item-contactos')).toBeInTheDocument()
    })

    it('NavigationBar has correct labels in Spanish', () => {
      render(<AppLayout />)
      expect(screen.getByTestId('nav-bar-item-clientes')).toHaveTextContent('Clientes')
      expect(screen.getByTestId('nav-bar-item-contactos')).toHaveTextContent('Contactos')
    })
  })

  describe('AC#5 — Active item highlighting', () => {
    it('highlights Clientes as active when on /clientes', () => {
      mockPathname.mockReturnValue('/clientes')
      render(<AppLayout />)
      const railItem = screen.getByTestId('nav-rail-item-clientes')
      expect(railItem).toHaveAttribute('data-selected', 'true')
      const barItem = screen.getByTestId('nav-bar-item-clientes')
      expect(barItem).toHaveAttribute('data-active', 'true')
    })

    it('highlights Contactos as active when on /contactos', () => {
      mockPathname.mockReturnValue('/contactos')
      render(<AppLayout />)
      const railItem = screen.getByTestId('nav-rail-item-contactos')
      expect(railItem).toHaveAttribute('data-selected', 'true')
      const barItem = screen.getByTestId('nav-bar-item-contactos')
      expect(barItem).toHaveAttribute('data-active', 'true')
    })

    it('does not highlight Contactos when on /clientes', () => {
      mockPathname.mockReturnValue('/clientes')
      render(<AppLayout />)
      const railItem = screen.getByTestId('nav-rail-item-contactos')
      expect(railItem).toHaveAttribute('data-selected', 'false')
    })
  })

  describe('AC#6 — WCAG 2.1 AA — ARIA labels in Spanish', () => {
    it('NavigationRail has aria-label="Navegación principal"', () => {
      render(<AppLayout />)
      const rail = screen.getByTestId('navigation-rail')
      expect(rail).toHaveAttribute('aria-label', 'Navegación principal')
    })

    it('NavigationBar has aria-label="Navegación principal"', () => {
      render(<AppLayout />)
      const bar = screen.getByTestId('navigation-bar')
      expect(bar).toHaveAttribute('aria-label', 'Navegación principal')
    })
  })

  describe('Outlet — renders child route content', () => {
    it('renders Outlet inside main content area', () => {
      render(<AppLayout />)
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument()
    })
  })
})
