/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — Navigation items in NavigationRail
 *
 * AC1 — NavigationRail renders both "Clientes" and "Contactos" items
 * AC2 — Active state applied to "Clientes" nav item when on /clientes
 * AC3 — Active state applied to "Contactos" nav item when on /contactos
 * AC5, AC6 — Deep-link routes show correct active item in nav
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../../routeTree.gen'

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('NavigationRail — nav items rendering', () => {
  it('should render both "Clientes" and "Contactos" nav items in the NavigationRail', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
  })

  it('should apply aria-label "Navegación principal" to the NavigationRail', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const navRail = screen.getByTestId('navigation-rail')
    expect(navRail).toHaveAttribute('aria-label', 'Navegación principal')
  })
})

describe('NavigationRail — active state on /clientes', () => {
  it('should mark the "Clientes" nav item as active when the current route is /clientes', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('data-active', 'true')
  })

  it('should NOT mark the "Contactos" nav item as active when the current route is /clientes', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).not.toHaveAttribute('data-active', 'true')
  })
})

describe('NavigationRail — active state on /contactos', () => {
  it('should mark the "Contactos" nav item as active when the current route is /contactos', async () => {
    const router = createTestRouter('/contactos')
    await router.load()

    render(<RouterProvider router={router} />)

    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('data-active', 'true')
  })

  it('should NOT mark the "Clientes" nav item as active when the current route is /contactos', async () => {
    const router = createTestRouter('/contactos')
    await router.load()

    render(<RouterProvider router={router} />)

    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).not.toHaveAttribute('data-active', 'true')
  })
})

describe('NavigationRail — click triggers router navigation', () => {
  it('should trigger navigation to /contactos when the "Contactos" nav item is clicked', async () => {
    const router = createTestRouter('/clientes')
    await router.load()
    const navigateSpy = vi.spyOn(router, 'navigate')

    render(<RouterProvider router={router} />)

    const contactosItem = screen.getByTestId('nav-item-contactos')
    fireEvent.click(contactosItem)

    expect(navigateSpy).toHaveBeenCalled()
  })
})
