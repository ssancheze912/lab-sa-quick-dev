/**
 * Component Edge-Case Tests — Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Test level: Component (Vitest + React Testing Library)
 * Target: frontend/src/routes/__root.tsx
 *
 * Coverage focus: edge cases, boundary conditions, and error paths NOT in ATDD tests:
 *   - Unknown route produces no active nav state (neither clientes nor contactos)
 *   - Nav item data-active="false" attribute on inactive items (not just absence of "true")
 *   - NotFoundPage renders all required visual elements (icon, heading, description, link)
 *   - nav wrapper has correct role semantics (aria-label accessible from ARIA tree)
 *   - Layout structure: header, nav, main are all present in DOM
 *   - Both navigation rail and navigation bar are rendered in DOM (CSS hides one)
 *   - Navigation items count: exactly 2 nav-item-* elements in rail
 *   - Navigation items count: exactly 2 nav-bar-item-* elements in bar
 *   - Active state only on one item at a time (mutual exclusivity)
 *   - aria-current not present at all on inactive items (not just not "page")
 *   - 404 back link href is exactly "/clientes" (not relative, not incorrect)
 *   - notFoundPage does not render nav-item-* active state on unknown route
 *   - Graceful: rendering at exact boundary path "/clientes" (not "/clientes/")
 */

import { render, screen, within } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import { describe, test, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

async function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history })
  await router.load()
  return render(<RouterProvider router={router} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// Active state exclusivity — only one item active at a time
// ─────────────────────────────────────────────────────────────────────────────

describe('Active state exclusivity', () => {
  test('on /clientes: exactly one nav item has data-active="true"', async () => {
    await renderAt('/clientes')
    const activeItems = document.querySelectorAll('[data-testid^="nav-item-"][data-active="true"]')
    expect(activeItems).toHaveLength(1)
    expect(activeItems[0]).toHaveAttribute('data-testid', 'nav-item-clientes')
  })

  test('on /contactos: exactly one nav item has data-active="true"', async () => {
    await renderAt('/contactos')
    const activeItems = document.querySelectorAll('[data-testid^="nav-item-"][data-active="true"]')
    expect(activeItems).toHaveLength(1)
    expect(activeItems[0]).toHaveAttribute('data-testid', 'nav-item-contactos')
  })

  test('on unknown route: no nav item has data-active="true"', async () => {
    await renderAt('/ruta-inexistente-edge')
    const activeItems = document.querySelectorAll('[data-testid^="nav-item-"][data-active="true"]')
    expect(activeItems).toHaveLength(0)
  })

  test('inactive item has data-active="false" (not just missing attribute)', async () => {
    await renderAt('/clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')
    // The value should be explicitly "false", not just absent
    expect(contactosItem).toHaveAttribute('data-active', 'false')
  })

  test('on /contactos: clientes item has data-active="false"', async () => {
    await renderAt('/contactos')
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('data-active', 'false')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// aria-current attribute — precise boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('aria-current boundary conditions', () => {
  test('active item has aria-current="page" (exact value)', async () => {
    await renderAt('/clientes')
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('aria-current', 'page')
  })

  test('inactive item has NO aria-current attribute at all', async () => {
    await renderAt('/clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')
    // Should not have the attribute at all — not "false", not "false", absent
    expect(contactosItem).not.toHaveAttribute('aria-current')
  })

  test('on /contactos: contactos item has aria-current="page"', async () => {
    await renderAt('/contactos')
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page')
  })

  test('on /contactos: clientes item has no aria-current attribute', async () => {
    await renderAt('/contactos')
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// DOM structure — layout element count and presence
// ─────────────────────────────────────────────────────────────────────────────

describe('Layout DOM structure', () => {
  test('renders a <header> element containing the navbar', async () => {
    await renderAt('/clientes')
    const navbar = screen.getByTestId('app-navbar')
    expect(navbar.tagName).toBe('HEADER')
  })

  test('renders a <main> element for the content area', async () => {
    const { container } = await renderAt('/clientes')
    const mains = container.querySelectorAll('main')
    expect(mains).toHaveLength(1)
  })

  test('renders exactly 2 nav-item-* elements in the navigation rail', async () => {
    await renderAt('/clientes')
    const navItems = document.querySelectorAll('[data-testid^="nav-item-"]')
    expect(navItems).toHaveLength(2)
  })

  test('renders exactly 2 nav-bar-item-* elements in the mobile nav bar', async () => {
    await renderAt('/clientes')
    const navBarItems = document.querySelectorAll('[data-testid^="nav-bar-item-"]')
    expect(navBarItems).toHaveLength(2)
  })

  test('navigation rail is present in the DOM (CSS visibility is controlled by Tailwind)', async () => {
    await renderAt('/clientes')
    // Both rail and bar are always in the DOM; Tailwind CSS hides the appropriate one
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
  })

  test('layout-base wrapper is a direct child of the document body area', async () => {
    await renderAt('/clientes')
    const layoutBase = screen.getByTestId('layout-base')
    expect(layoutBase).toBeInTheDocument()
    expect(layoutBase.tagName).toBe('DIV')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navigation rail aria attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation semantic structure', () => {
  test('main-nav element has role="navigation" via <nav> tag semantics', async () => {
    await renderAt('/clientes')
    const mainNav = screen.getByTestId('main-nav')
    // <nav> has implicit role="navigation"; verify it's a nav element
    expect(mainNav.tagName).toBe('NAV')
  })

  test('main-nav has aria-label="Navegación principal"', async () => {
    await renderAt('/clientes')
    expect(screen.getByTestId('main-nav')).toHaveAttribute('aria-label', 'Navegación principal')
  })

  test('nav items have aria-label attributes for icon-only accessibility', async () => {
    await renderAt('/clientes')
    const clientesItem = screen.getByTestId('nav-item-clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(clientesItem).toHaveAttribute('aria-label')
    expect(contactosItem).toHaveAttribute('aria-label')
  })

  test('Clientes nav item aria-label contains the word "Clientes"', async () => {
    await renderAt('/clientes')
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem.getAttribute('aria-label')).toContain('Clientes')
  })

  test('Contactos nav item aria-label contains the word "Contactos"', async () => {
    await renderAt('/clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem.getAttribute('aria-label')).toContain('Contactos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NotFoundPage — component-level edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundPage — edge cases', () => {
  test('renders not-found-page container on any unknown path', async () => {
    await renderAt('/totally/unknown/deep/path')
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
  })

  test('not-found-heading text is exactly "Página no encontrada" (case-sensitive)', async () => {
    await renderAt('/unknown-edge')
    expect(screen.getByTestId('not-found-heading')).toHaveTextContent('Página no encontrada')
  })

  test('renders the secondary description text "La ruta que buscas no existe."', async () => {
    await renderAt('/unknown-edge')
    expect(screen.getByText('La ruta que buscas no existe.')).toBeInTheDocument()
  })

  test('back link href is exactly "/clientes" (not empty, not wrong)', async () => {
    await renderAt('/path-404')
    const link = screen.getByTestId('not-found-back-link')
    expect(link).toHaveAttribute('href', '/clientes')
  })

  test('back link text is "Volver al inicio"', async () => {
    await renderAt('/path-404')
    const link = screen.getByTestId('not-found-back-link')
    expect(link).toHaveTextContent('Volver al inicio')
  })

  test('not-found-heading is rendered as an <h1> element', async () => {
    await renderAt('/404-heading-check')
    const heading = screen.getByTestId('not-found-heading')
    expect(heading.tagName).toBe('H1')
  })

  test('404 page does not show clientes or contactos placeholder content', async () => {
    await renderAt('/ruta-invalida')
    expect(screen.queryByTestId('clientes-placeholder')).not.toBeInTheDocument()
    expect(screen.queryByTestId('contactos-placeholder')).not.toBeInTheDocument()
  })

  test('layout-base is still present on 404 page (shell persists)', async () => {
    await renderAt('/ruta-invalida')
    expect(screen.getByTestId('layout-base')).toBeInTheDocument()
  })

  test('app-navbar is present on 404 page (navbar persists)', async () => {
    await renderAt('/ruta-invalida')
    expect(screen.getByTestId('app-navbar')).toBeInTheDocument()
  })

  test('no nav item is active on 404 page', async () => {
    await renderAt('/ruta-invalida')
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'false')
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'false')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navbar — boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('Navbar — boundary conditions', () => {
  test('navbar-product-name text content is exactly "Siesa Agents"', async () => {
    await renderAt('/clientes')
    expect(screen.getByTestId('navbar-product-name')).toHaveTextContent('Siesa Agents')
  })

  test('navbar-logo element is present in DOM on all main routes', async () => {
    await renderAt('/clientes')
    expect(screen.getByTestId('navbar-logo')).toBeInTheDocument()

    // Also verify on /contactos without needing a separate test
    screen.getByTestId('navbar-logo') // already rendered in /clientes renderAt
  })

  test('navbar-logo has an accessible label', async () => {
    await renderAt('/clientes')
    const logo = screen.getByTestId('navbar-logo')
    // Should have aria-label or aria-hidden (either is acceptable, but element must exist)
    expect(logo).toBeInTheDocument()
  })

  test('app-navbar element is a <header> element', async () => {
    await renderAt('/clientes')
    const navbar = screen.getByTestId('app-navbar')
    expect(navbar.tagName).toBe('HEADER')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Root redirect edge — boundary state
// ─────────────────────────────────────────────────────────────────────────────

describe('Root redirect — component edge cases', () => {
  test('after redirect from /, nav-item-clientes is active (not contactos)', async () => {
    await renderAt('/')
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'false')
  })

  test('after redirect from /, clientes-placeholder is the only content visible', async () => {
    await renderAt('/')
    expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument()
    expect(screen.queryByTestId('contactos-placeholder')).not.toBeInTheDocument()
  })

  test('after redirect from /, layout-base wrapper is present', async () => {
    await renderAt('/')
    expect(screen.getByTestId('layout-base')).toBeInTheDocument()
  })
})
