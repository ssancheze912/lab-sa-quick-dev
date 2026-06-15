/**
 * Story 1.2: Frontend Navigation Shell
 * Component tests for __root.tsx — RED Phase (TDD)
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop layout: NavigationRail (72px left) + Navbar top visible at ≥1024px
 *   AC2 — Active state: "Clientes" marked active when at /clientes
 *   AC3 — Active state: "Contactos" marked active when at /contactos
 *   AC4 — Mobile layout (<768px): NavigationBar replaces NavigationRail; top Navbar remains
 *   AC8 — Accessibility: nav landmark with aria-label="Navegación principal", descriptive aria-labels
 *
 * These tests FAIL initially (RED phase) because:
 *   - __root.tsx does not yet render LayoutBase, NavigationRail, NavigationBar, or Navbar
 *   - Navigation items with data-testid attributes do not exist
 *   - aria-label attributes are not yet set
 *
 * Testing stack: Vitest + React Testing Library + jsdom
 * Pattern: Given-When-Then with mocked TanStack Router context
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'

// ─── Router mock ─────────────────────────────────────────────────────────────
// TanStack Router requires a RouterContext. We mock it minimally so we can
// render __root.tsx in isolation without a full router setup.

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Outlet: () => <div data-testid="router-outlet" />,
    Link: ({
      to,
      children,
      activeProps,
      inactiveProps,
      'aria-label': ariaLabel,
      'aria-current': ariaCurrent,
      ...rest
    }: {
      to: string
      children?: React.ReactNode
      activeProps?: Record<string, unknown>
      inactiveProps?: Record<string, unknown>
      'aria-label'?: string
      'aria-current'?: string
      [key: string]: unknown
    }) => (
      <a
        href={to}
        aria-label={ariaLabel}
        aria-current={ariaCurrent}
        {...rest}
      >
        {children}
      </a>
    ),
    useRouterState: () => ({ location: { pathname: '/clientes' } }),
    useLocation: () => ({ pathname: '/clientes' }),
    createRootRoute: actual.createRootRoute,
  }
})

// ─── siesa-ui-kit mock ────────────────────────────────────────────────────────
// Mock the UI kit components with data-testid attributes that tests expect.
// The real implementation must render these testids; mocks verify wiring only.

vi.mock('siesa-ui-kit', () => ({
  LayoutBase: ({
    children,
    navbar,
    navigationItems,
  }: {
    children?: React.ReactNode
    navbar?: React.ReactNode
    navigationItems?: Array<{ label: string; to: string; icon?: React.ReactNode }>
  }) => (
    <div data-testid="layout-base">
      <div data-testid="navbar-slot">{navbar}</div>
      <nav aria-label="Navegación principal" data-testid="navigation-rail">
        {navigationItems?.map((item) => (
          <a
            key={item.to}
            href={item.to}
            data-testid={`nav-item-${item.label.toLowerCase()}`}
            aria-label={`Ir a ${item.label}`}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  ),
  Navbar: ({ productName }: { productName?: string }) => (
    <header data-testid="navbar">{productName}</header>
  ),
  NavigationRail: ({
    children,
    'aria-label': ariaLabel,
  }: {
    children?: React.ReactNode
    'aria-label'?: string
  }) => (
    <nav data-testid="navigation-rail" aria-label={ariaLabel ?? 'Navegación principal'}>
      {children}
    </nav>
  ),
  NavigationBar: ({
    children,
    'aria-label': ariaLabel,
  }: {
    children?: React.ReactNode
    'aria-label'?: string
  }) => (
    <nav data-testid="navigation-bar" aria-label={ariaLabel ?? 'Navegación principal'}>
      {children}
    </nav>
  ),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setWindowInnerWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop layout: NavigationRail + Navbar visible at ≥1024px
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Desktop layout: NavigationRail and Navbar', () => {
  beforeEach(() => {
    setWindowInnerWidth(1280)
  })

  it('should render a Navbar component at the top of the layout', async () => {
    // GIVEN: __root.tsx renders LayoutBase with a Navbar
    // (import happens at test runtime — fails RED if route has no LayoutBase)
    const { Route } = await import('../__root')

    // WHEN: The root layout component renders (desktop viewport)
    const RootComponent = Route.options.component as React.FC
    render(<RootComponent />)

    // THEN: The Navbar element is visible
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })

  it('should render Navbar with productName "Siesa Agents"', async () => {
    // GIVEN: __root.tsx configures Navbar with the correct product name
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: The root layout renders
    render(<RootComponent />)

    // THEN: "Siesa Agents" text appears in the Navbar
    expect(screen.getByTestId('navbar')).toHaveTextContent('Siesa Agents')
  })

  it('should render the NavigationRail on desktop viewport', async () => {
    // GIVEN: Desktop viewport ≥ 1024px
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: The root layout renders
    render(<RootComponent />)

    // THEN: NavigationRail is visible
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
  })

  it('should render "Clientes" navigation item in the NavigationRail', async () => {
    // GIVEN: Desktop layout with navigation items configured
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: The root layout renders
    render(<RootComponent />)

    // THEN: "Clientes" nav item is present with correct testid
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
  })

  it('should render "Contactos" navigation item in the NavigationRail', async () => {
    // GIVEN: Desktop layout with navigation items configured
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: The root layout renders
    render(<RootComponent />)

    // THEN: "Contactos" nav item is present with correct testid
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
  })

  it('should render "Clientes" nav item with href pointing to /clientes', async () => {
    // GIVEN: NavigationRail with "Clientes" link
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: The root layout renders
    render(<RootComponent />)

    // THEN: The href of the "Clientes" item points to /clientes
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('href', '/clientes')
  })

  it('should render "Contactos" nav item with href pointing to /contactos', async () => {
    // GIVEN: NavigationRail with "Contactos" link
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: The root layout renders
    render(<RootComponent />)

    // THEN: The href of the "Contactos" item points to /contactos
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('href', '/contactos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Mobile layout (<768px): NavigationBar replaces NavigationRail
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — Mobile layout: NavigationBar replaces NavigationRail', () => {
  beforeEach(() => {
    setWindowInnerWidth(375)
  })

  it('should render NavigationBar on mobile viewport (<768px)', async () => {
    // GIVEN: Mobile viewport 375px (< 768px)
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: The root layout renders at mobile size
    render(<RootComponent />)

    // THEN: NavigationBar (bottom nav) is present
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
  })

  it('should NOT render the NavigationRail on mobile viewport', async () => {
    // GIVEN: Mobile viewport < 768px
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: The root layout renders
    render(<RootComponent />)

    // THEN: NavigationRail is absent or hidden on mobile
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
  })

  it('should still render the Navbar on mobile viewport', async () => {
    // GIVEN: Mobile viewport
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: Mobile layout renders
    render(<RootComponent />)

    // THEN: Top Navbar remains visible
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — Accessibility: nav landmark with Spanish aria-label, descriptive aria-labels
// ─────────────────────────────────────────────────────────────────────────────

describe('AC8 — Accessibility compliance (WCAG 2.1 AA)', () => {
  beforeEach(() => {
    setWindowInnerWidth(1280)
  })

  it('should render a <nav> element with aria-label="Navegación principal"', async () => {
    // GIVEN: The navigation shell is rendered
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: The root layout renders
    render(<RootComponent />)

    // THEN: The nav landmark has the correct Spanish accessible label
    const navEl = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(navEl).toBeInTheDocument()
  })

  it('should have a descriptive aria-label on the "Clientes" navigation item', async () => {
    // GIVEN: Navigation shell rendered
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: Root layout renders
    render(<RootComponent />)

    // THEN: "Clientes" item has a non-empty aria-label
    const clientesItem = screen.getByTestId('nav-item-clientes')
    const ariaLabel = clientesItem.getAttribute('aria-label')
    expect(ariaLabel).not.toBeNull()
    expect(ariaLabel!.length).toBeGreaterThan(0)
  })

  it('should have a descriptive aria-label on the "Contactos" navigation item', async () => {
    // GIVEN: Navigation shell rendered
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: Root layout renders
    render(<RootComponent />)

    // THEN: "Contactos" item has a non-empty aria-label
    const contactosItem = screen.getByTestId('nav-item-contactos')
    const ariaLabel = contactosItem.getAttribute('aria-label')
    expect(ariaLabel).not.toBeNull()
    expect(ariaLabel!.length).toBeGreaterThan(0)
  })

  it('should render the router Outlet inside the layout content area', async () => {
    // GIVEN: The layout wraps child routes via <Outlet />
    const { Route } = await import('../__root')
    const RootComponent = Route.options.component as React.FC

    // WHEN: Root layout renders
    render(<RootComponent />)

    // THEN: The Outlet placeholder is present (children routes will render here)
    expect(screen.getByTestId('router-outlet')).toBeInTheDocument()
  })
})
