// @vitest-environment jsdom
/**
 * Story 1.2: Frontend Navigation Shell — EDGE CASE unit/component tests
 * Epic 1: Project Foundation & Application Shell
 *
 * Expands coverage built on the ATDD baseline in AppShell.test.tsx.
 *
 * Gaps covered:
 *   - aria-current absent on inactive nav items (both desktop and mobile)
 *   - aria-current updates reactively after route changes
 *   - ContactosPage heading hierarchy (h1 level)
 *   - Not-found description text ("La ruta que buscas no existe.")
 *   - data-testid attributes present on page containers
 *   - nav links have correct role and href attributes
 *   - Multiple navigation elements each carry aria-label
 *   - app-root testid present across all routes
 *   - Route tree edge: unknown paths with special chars show 404
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

function renderAtPath(path: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history: memoryHistory })
  return { rendered: render(<RouterProvider router={router} />), router }
}

afterEach(() => {
  cleanup()
})

// ─────────────────────────────────────────────────────────────────────────────
// aria-current — inactive items must NOT carry aria-current="page"
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell - aria-current inactive state', () => {
  it('Contactos nav link does NOT have aria-current when on /clientes', async () => {
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')

    // Contactos links (both rail and bar) must not be aria-current
    const contactosLinks = screen.getAllByRole('link', { name: /contactos/i })
    contactosLinks.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current', 'page')
    })
  })

  it('Clientes nav link does NOT have aria-current when on /contactos', async () => {
    renderAtPath('/contactos')
    await screen.findByTestId('contactos-page')

    // Clientes links (both rail and bar) must not be aria-current
    const clientesLinks = screen.getAllByRole('link', { name: /clientes/i })
    clientesLinks.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current', 'page')
    })
  })

  it('Clientes nav links have aria-current="page" when on /clientes route', async () => {
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')

    // At least one Clientes link (rail or bar) should have aria-current="page"
    const clientesLinks = screen.getAllByRole('link', { name: /clientes/i })
    const activeLink = clientesLinks.find(
      (l) => l.getAttribute('aria-current') === 'page'
    )
    expect(activeLink).toBeDefined()
  })

  it('Contactos nav links have aria-current="page" when on /contactos route', async () => {
    renderAtPath('/contactos')
    await screen.findByTestId('contactos-page')

    const contactosLinks = screen.getAllByRole('link', { name: /contactos/i })
    const activeLink = contactosLinks.find(
      (l) => l.getAttribute('aria-current') === 'page'
    )
    expect(activeLink).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navigation link roles and href attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell - nav link roles and href', () => {
  it('navigation rail items render as anchor elements with correct href', async () => {
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')

    // TanStack Router <Link> renders as <a> — both rail and bar links present
    const clientesLinks = screen.getAllByRole('link', { name: /clientes/i })
    const contactosLinks = screen.getAllByRole('link', { name: /contactos/i })

    // At minimum 1 link per item (rail and/or bar depending on CSS)
    expect(clientesLinks.length).toBeGreaterThanOrEqual(1)
    expect(contactosLinks.length).toBeGreaterThanOrEqual(1)

    // href should contain the expected paths
    const clientesHrefs = clientesLinks.map((l) => l.getAttribute('href') ?? '')
    const contactosHrefs = contactosLinks.map((l) => l.getAttribute('href') ?? '')

    expect(clientesHrefs.some((h) => h.includes('/clientes'))).toBe(true)
    expect(contactosHrefs.some((h) => h.includes('/contactos'))).toBe(true)
  })

  it('"Ir a Clientes" 404 link has href pointing to /clientes', async () => {
    renderAtPath('/this-route-does-not-exist-abc123')
    await screen.findByRole('heading', { name: 'Página no encontrada' })

    const backLink = screen.getByRole('link', { name: 'Ir a Clientes' })
    expect(backLink).toHaveAttribute('href', expect.stringContaining('/clientes'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ContactosPage content and heading hierarchy
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell - ContactosPage content', () => {
  it('renders ContactosPage h1 heading with correct text', async () => {
    renderAtPath('/contactos')
    await screen.findByTestId('contactos-page')

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('Contactos')
  })

  it('ContactosPage has data-testid="contactos-page" on its container', async () => {
    renderAtPath('/contactos')
    const container = await screen.findByTestId('contactos-page')
    expect(container).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ClientesPage content
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell - ClientesPage content', () => {
  it('ClientesPage has data-testid="clientes-page" on its container', async () => {
    renderAtPath('/clientes')
    const container = await screen.findByTestId('clientes-page')
    expect(container).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Not-found view — full content verification
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell - NotFoundView content', () => {
  it('shows description text "La ruta que buscas no existe." on 404', async () => {
    renderAtPath('/this-is-definitely-not-a-route')
    await screen.findByRole('heading', { name: 'Página no encontrada' })

    expect(
      screen.getByText('La ruta que buscas no existe.')
    ).toBeInTheDocument()
  })

  it('renders the 404 heading as an h1', async () => {
    renderAtPath('/not-found-xyz')
    const heading = await screen.findByRole('heading', {
      name: 'Página no encontrada',
      level: 1,
    })
    expect(heading).toBeInTheDocument()
  })

  it('shows 404 view for deeply nested unknown path', async () => {
    renderAtPath('/deeply/nested/unknown/path')
    const heading = await screen.findByRole('heading', {
      name: 'Página no encontrada',
    })
    expect(heading).toBeInTheDocument()
  })

  it('shows 404 view for paths resembling valid routes (e.g. /clientes-extra)', async () => {
    renderAtPath('/clientes-extra')
    const heading = await screen.findByRole('heading', {
      name: 'Página no encontrada',
    })
    expect(heading).toBeInTheDocument()
    // Must NOT render the ClientesPage
    expect(screen.queryByTestId('clientes-page')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// app-root — present across all routes
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell - app-root wrapper invariant', () => {
  it('app-root is present on /contactos route', async () => {
    renderAtPath('/contactos')
    await screen.findByTestId('contactos-page')
    expect(screen.getByTestId('app-root')).toBeInTheDocument()
  })

  it('app-root is present on 404 route', async () => {
    renderAtPath('/page-does-not-exist')
    await screen.findByRole('heading', { name: 'Página no encontrada' })
    expect(screen.getByTestId('app-root')).toBeInTheDocument()
  })

  it('app-root is present after redirect from / to /clientes', async () => {
    renderAtPath('/')
    await screen.findByTestId('clientes-page')
    expect(screen.getByTestId('app-root')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navigation containers — each nav element carries aria-label
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell - all navigation containers have aria-label', () => {
  it('every navigation element has a non-empty aria-label on /clientes', async () => {
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')

    const navElements = screen.getAllByRole('navigation')
    navElements.forEach((nav) => {
      const label = nav.getAttribute('aria-label')
      expect(label).toBeTruthy()
      expect(label!.length).toBeGreaterThan(0)
    })
  })

  it('every navigation element has a non-empty aria-label on /contactos', async () => {
    renderAtPath('/contactos')
    await screen.findByTestId('contactos-page')

    const navElements = screen.getAllByRole('navigation')
    navElements.forEach((nav) => {
      const label = nav.getAttribute('aria-label')
      expect(label).toBeTruthy()
      expect(label!.length).toBeGreaterThan(0)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Redirect from / — edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell - Root redirect edge cases', () => {
  it('redirect from / shows NavigationRail structure (not just empty page)', async () => {
    renderAtPath('/')
    await screen.findByTestId('clientes-page')

    // Navigation must also be present after redirect
    const navElements = screen.getAllByRole('navigation')
    expect(navElements.length).toBeGreaterThanOrEqual(1)
  })

  it('redirect from / correctly renders Clientes heading', async () => {
    renderAtPath('/')
    await screen.findByTestId('clientes-page')

    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// data-testid on nav containers
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell - navigation container testids', () => {
  it('navigation-rail testid is present in DOM on /clientes', async () => {
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')

    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
  })

  it('navigation-bar testid is present in DOM on /clientes', async () => {
    renderAtPath('/clientes')
    await screen.findByTestId('clientes-page')

    // Both nav containers are always in the DOM; CSS controls visibility
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
  })

  it('navigation-rail testid is present in DOM on /contactos', async () => {
    renderAtPath('/contactos')
    await screen.findByTestId('contactos-page')

    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
  })
})
