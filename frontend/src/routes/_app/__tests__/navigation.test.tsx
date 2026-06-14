/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — Navigation items in NavigationRail
 *
 * RED Phase: These tests FAIL until implementation is complete.
 *
 * AC1 — NavigationRail renders both "Clientes" and "Contactos" items
 * AC2 — Active state applied to "Clientes" nav item when on /clientes
 * AC3 — Active state applied to "Contactos" nav item when on /contactos
 * AC5, AC6 — Deep-link routes show correct active item in nav
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createRouter, createMemoryHistory } from '@tanstack/react-router'

// NOTE: routeTree.gen.ts is auto-generated. This import FAILS (RED) until
// the file-based routes are created and the plugin runs.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — routeTree.gen.ts does not exist yet (RED phase)
import { routeTree } from '../../../routeTree.gen'

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('NavigationRail — nav items rendering', () => {
  it('should render both "Clientes" and "Contactos" nav items in the NavigationRail', () => {
    // GIVEN: The root layout is rendered at /clientes (desktop context)
    const router = createTestRouter('/clientes')

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <(router as any).RouterProvider router={router} />,
    )

    // WHEN: The NavigationRail renders
    // THEN: Both nav items are present
    // These FAIL until _app.tsx + __root.tsx render NavigationRail with nav items
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
  })

  it('should apply aria-label "Navegación principal" to the NavigationRail', () => {
    // GIVEN: The root layout is rendered
    const router = createTestRouter('/clientes')

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <(router as any).RouterProvider router={router} />,
    )

    // WHEN: The NavigationRail renders
    // THEN: It has the correct Spanish aria-label for screen readers
    // This FAILS until aria-label="Navegación principal" is applied
    const navRail = screen.getByTestId('navigation-rail')
    expect(navRail).toHaveAttribute('aria-label', 'Navegación principal')
  })
})

describe('NavigationRail — active state on /clientes', () => {
  it('should mark the "Clientes" nav item as active when the current route is /clientes', () => {
    // GIVEN: The router is initialized at /clientes
    const router = createTestRouter('/clientes')

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <(router as any).RouterProvider router={router} />,
    )

    // WHEN: The app renders at /clientes
    // THEN: The Clientes nav item has data-active="true"
    // This FAILS until active item detection is wired via TanStack Router Link activeProps
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('data-active', 'true')
  })

  it('should NOT mark the "Contactos" nav item as active when the current route is /clientes', () => {
    // GIVEN: The router is initialized at /clientes
    const router = createTestRouter('/clientes')

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <(router as any).RouterProvider router={router} />,
    )

    // WHEN: The app renders at /clientes
    // THEN: The Contactos nav item does NOT have data-active="true"
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).not.toHaveAttribute('data-active', 'true')
  })
})

describe('NavigationRail — active state on /contactos', () => {
  it('should mark the "Contactos" nav item as active when the current route is /contactos', () => {
    // GIVEN: The router is initialized at /contactos
    const router = createTestRouter('/contactos')

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <(router as any).RouterProvider router={router} />,
    )

    // WHEN: The app renders at /contactos
    // THEN: The Contactos nav item has data-active="true"
    // This FAILS until active item detection is wired for the /contactos route
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('data-active', 'true')
  })

  it('should NOT mark the "Clientes" nav item as active when the current route is /contactos', () => {
    // GIVEN: The router is initialized at /contactos
    const router = createTestRouter('/contactos')

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <(router as any).RouterProvider router={router} />,
    )

    // WHEN: The app renders at /contactos
    // THEN: The Clientes nav item does NOT have data-active="true"
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).not.toHaveAttribute('data-active', 'true')
  })
})

describe('NavigationRail — click triggers router navigation', () => {
  it('should trigger navigation to /contactos when the "Contactos" nav item is clicked', async () => {
    // GIVEN: The router is initialized at /clientes
    const router = createTestRouter('/clientes')
    const navigateSpy = vi.spyOn(router, 'navigate')

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <(router as any).RouterProvider router={router} />,
    )

    // WHEN: The user clicks the "Contactos" nav item
    const contactosItem = screen.getByTestId('nav-item-contactos')
    fireEvent.click(contactosItem)

    // THEN: The router navigate function was called (SPA navigation, no full reload)
    // This FAILS until the NavigationRail items are wired as TanStack Router Link components
    expect(navigateSpy).toHaveBeenCalled()
  })
})
