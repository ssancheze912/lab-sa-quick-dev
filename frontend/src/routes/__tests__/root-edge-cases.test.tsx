/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — __root.tsx edge cases & boundary conditions
 *
 * Covers cases NOT in root.test.tsx:
 *   - NavigationBar mobile items present in DOM
 *   - aria-label on NavigationBar
 *   - aria-current on active nav items (desktop rail + mobile bar)
 *   - Active state on mobile nav-bar items
 *   - nav items contain accessible text labels
 *   - Root path "/" triggers redirect to /clientes at unit level
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('__root.tsx — NavigationBar mobile items in DOM', () => {
  it('should render the "Clientes" mobile nav-bar item in the DOM', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('nav-bar-item-clientes')).toBeInTheDocument()
  })

  it('should render the "Contactos" mobile nav-bar item in the DOM', async () => {
    const router = createTestRouter('/contactos')
    await router.load()

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('nav-bar-item-contactos')).toBeInTheDocument()
  })

  it('should apply aria-label "Navegación principal" to the NavigationBar', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const navBar = screen.getByTestId('navigation-bar')
    expect(navBar).toHaveAttribute('aria-label', 'Navegación principal')
  })
})

describe('__root.tsx — aria-current accessibility on NavigationRail', () => {
  it('should set aria-current="page" on the Clientes rail item when on /clientes', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('aria-current', 'page')
  })

  it('should NOT set aria-current on the Contactos rail item when on /clientes', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).not.toHaveAttribute('aria-current', 'page')
  })

  it('should set aria-current="page" on the Contactos rail item when on /contactos', async () => {
    const router = createTestRouter('/contactos')
    await router.load()

    render(<RouterProvider router={router} />)

    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('aria-current', 'page')
  })

  it('should NOT set aria-current on the Clientes rail item when on /contactos', async () => {
    const router = createTestRouter('/contactos')
    await router.load()

    render(<RouterProvider router={router} />)

    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).not.toHaveAttribute('aria-current', 'page')
  })
})

describe('__root.tsx — mobile NavigationBar active state', () => {
  it('should mark the "Clientes" mobile nav-bar item as active when on /clientes', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const mobileClientesItem = screen.getByTestId('nav-bar-item-clientes')
    expect(mobileClientesItem).toHaveAttribute('data-active', 'true')
  })

  it('should NOT mark the "Contactos" mobile nav-bar item as active when on /clientes', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const mobileContactosItem = screen.getByTestId('nav-bar-item-contactos')
    expect(mobileContactosItem).not.toHaveAttribute('data-active', 'true')
  })

  it('should mark the "Contactos" mobile nav-bar item as active when on /contactos', async () => {
    const router = createTestRouter('/contactos')
    await router.load()

    render(<RouterProvider router={router} />)

    const mobileContactosItem = screen.getByTestId('nav-bar-item-contactos')
    expect(mobileContactosItem).toHaveAttribute('data-active', 'true')
  })

  it('should NOT mark the "Clientes" mobile nav-bar item as active when on /contactos', async () => {
    const router = createTestRouter('/contactos')
    await router.load()

    render(<RouterProvider router={router} />)

    const mobileClientesItem = screen.getByTestId('nav-bar-item-clientes')
    expect(mobileClientesItem).not.toHaveAttribute('data-active', 'true')
  })
})

describe('__root.tsx — navigation items accessible text', () => {
  it('should expose "Clientes" text in the NavigationRail item for screen readers', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('aria-label', 'Clientes')
  })

  it('should expose "Contactos" text in the NavigationRail item for screen readers', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('aria-label', 'Contactos')
  })

  it('should expose "Clientes" text in the mobile NavigationBar item for screen readers', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const mobileClientesItem = screen.getByTestId('nav-bar-item-clientes')
    expect(mobileClientesItem).toHaveAttribute('aria-label', 'Clientes')
  })

  it('should expose "Contactos" text in the mobile NavigationBar item for screen readers', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const mobileContactosItem = screen.getByTestId('nav-bar-item-contactos')
    expect(mobileContactosItem).toHaveAttribute('aria-label', 'Contactos')
  })
})

describe('__root.tsx — root path redirect', () => {
  it('should redirect from "/" to "/clientes" (router-level redirect)', async () => {
    const router = createTestRouter('/')
    await router.load()

    // After load, the router history should reflect the redirect to /clientes
    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('should render the Clientes view after "/" redirect', async () => {
    const router = createTestRouter('/')
    await router.load()

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
  })
})
