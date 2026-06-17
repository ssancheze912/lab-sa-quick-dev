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

import { AppLayout } from '../_app'

function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  // Update matchMedia mock to reflect new width
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('min-width: 1024px') ? true : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('min-width: 1024px') ? false : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

describe('Navigation Shell — AppLayout', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/clientes')
    setDesktopViewport()
  })

  describe('AC#1 — Desktop: NavigationRail visible on large viewports', () => {
    beforeEach(() => {
      setDesktopViewport()
    })

    it('renders NavigationRail with Clientes and Contactos items', () => {
      render(<AppLayout />)
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
      expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
      expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
    })

    it('NavigationRail has correct labels in Spanish', () => {
      render(<AppLayout />)
      expect(screen.getByTestId('nav-item-clientes')).toHaveTextContent('Clientes')
      expect(screen.getByTestId('nav-item-contactos')).toHaveTextContent('Contactos')
    })
  })

  describe('AC#2 — Mobile: NavigationBar visible on small viewports', () => {
    beforeEach(() => {
      setMobileViewport()
    })

    it('renders NavigationBar with Clientes and Contactos items', () => {
      render(<AppLayout />)
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
      expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
      expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
    })

    it('NavigationBar has correct labels in Spanish', () => {
      render(<AppLayout />)
      expect(screen.getByTestId('nav-item-clientes')).toHaveTextContent('Clientes')
      expect(screen.getByTestId('nav-item-contactos')).toHaveTextContent('Contactos')
    })
  })

  describe('AC#5 — Active item highlighting', () => {
    beforeEach(() => {
      setDesktopViewport()
    })

    it('highlights Clientes as active when on /clientes', () => {
      mockPathname.mockReturnValue('/clientes')
      render(<AppLayout />)
      const clientesItem = screen.getByTestId('nav-item-clientes')
      expect(clientesItem).toHaveAttribute('aria-current', 'page')
      const contactosItem = screen.getByTestId('nav-item-contactos')
      expect(contactosItem).not.toHaveAttribute('aria-current', 'page')
    })

    it('highlights Contactos as active when on /contactos', () => {
      mockPathname.mockReturnValue('/contactos')
      render(<AppLayout />)
      const contactosItem = screen.getByTestId('nav-item-contactos')
      expect(contactosItem).toHaveAttribute('aria-current', 'page')
      const clientesItem = screen.getByTestId('nav-item-clientes')
      expect(clientesItem).not.toHaveAttribute('aria-current', 'page')
    })

    it('does not highlight Contactos when on /clientes', () => {
      mockPathname.mockReturnValue('/clientes')
      render(<AppLayout />)
      const contactosItem = screen.getByTestId('nav-item-contactos')
      expect(contactosItem).not.toHaveAttribute('aria-current', 'page')
    })
  })

  describe('AC#6 — WCAG 2.1 AA — ARIA labels in Spanish', () => {
    it('NavigationRail has aria-label="Navegación principal"', () => {
      setDesktopViewport()
      render(<AppLayout />)
      const rail = screen.getByTestId('navigation-rail')
      expect(rail).toHaveAttribute('aria-label', 'Navegación principal')
    })

    it('NavigationBar has aria-label="Navegación principal"', () => {
      setMobileViewport()
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
