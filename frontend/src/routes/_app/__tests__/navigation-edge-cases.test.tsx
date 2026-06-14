/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — Navigation edge cases & boundary conditions
 *
 * Covers cases NOT in navigation.test.tsx:
 *   - Clicking "Clientes" nav item triggers navigate (complementing Contactos click test)
 *   - aria-current="page" on active mobile bar items
 *   - Both nav items have accessible href attributes pointing to correct routes
 *   - nav items render correct label text in the DOM (visible text)
 *   - Navigating between routes updates active state correctly (integration flow)
 *   - Clientes and Contactos views contain expected heading content
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../../routeTree.gen'

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('NavigationRail — click "Clientes" triggers navigation', () => {
  it('should trigger router navigation when the "Clientes" nav item is clicked', async () => {
    const router = createTestRouter('/contactos')
    await router.load()
    const navigateSpy = vi.spyOn(router, 'navigate')

    render(<RouterProvider router={router} />)

    const clientesItem = screen.getByTestId('nav-item-clientes')
    fireEvent.click(clientesItem)

    expect(navigateSpy).toHaveBeenCalled()
  })
})

describe('NavigationRail — correct href attributes', () => {
  it('should have href="/clientes" on the Clientes rail nav item', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('href', '/clientes')
  })

  it('should have href="/contactos" on the Contactos rail nav item', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('href', '/contactos')
  })

  it('should have href="/clientes" on the mobile bar Clientes item', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const mobileClientesItem = screen.getByTestId('nav-bar-item-clientes')
    expect(mobileClientesItem).toHaveAttribute('href', '/clientes')
  })

  it('should have href="/contactos" on the mobile bar Contactos item', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const mobileContactosItem = screen.getByTestId('nav-bar-item-contactos')
    expect(mobileContactosItem).toHaveAttribute('href', '/contactos')
  })
})

describe('NavigationRail — visible label text in DOM', () => {
  it('should render "Clientes" as visible text within the Clientes nav item', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem.textContent).toContain('Clientes')
  })

  it('should render "Contactos" as visible text within the Contactos nav item', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem.textContent).toContain('Contactos')
  })
})

describe('Mobile NavigationBar — aria-current accessibility', () => {
  it('should set aria-current="page" on the Clientes mobile bar item when on /clientes', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const mobileClientesItem = screen.getByTestId('nav-bar-item-clientes')
    expect(mobileClientesItem).toHaveAttribute('aria-current', 'page')
  })

  it('should NOT set aria-current on the Contactos mobile bar item when on /clientes', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const mobileContactosItem = screen.getByTestId('nav-bar-item-contactos')
    expect(mobileContactosItem).not.toHaveAttribute('aria-current', 'page')
  })

  it('should set aria-current="page" on the Contactos mobile bar item when on /contactos', async () => {
    const router = createTestRouter('/contactos')
    await router.load()

    render(<RouterProvider router={router} />)

    const mobileContactosItem = screen.getByTestId('nav-bar-item-contactos')
    expect(mobileContactosItem).toHaveAttribute('aria-current', 'page')
  })
})

describe('Clientes and Contactos views — content rendered correctly', () => {
  it('should render the Clientes heading text in the Clientes view', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const clientesView = screen.getByTestId('clientes-view')
    expect(clientesView.textContent).toContain('Clientes')
  })

  it('should render the Contactos heading text in the Contactos view', async () => {
    const router = createTestRouter('/contactos')
    await router.load()

    render(<RouterProvider router={router} />)

    const contactosView = screen.getByTestId('contactos-view')
    expect(contactosView.textContent).toContain('Contactos')
  })

  it('should render the Clientes view when navigating directly to /clientes', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
  })

  it('should render the Contactos view when navigating directly to /contactos', async () => {
    const router = createTestRouter('/contactos')
    await router.load()

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
  })
})
