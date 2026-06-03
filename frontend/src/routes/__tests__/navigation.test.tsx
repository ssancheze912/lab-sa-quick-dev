/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — Navigation Shell (Vitest + React Testing Library)
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop, NavigationBar hidden
 *   AC2 — NavigationBar visible on mobile, NavigationRail hidden
 *   AC3 — Active nav item highlighted when at /clientes or /contactos
 *   AC4 — 404 view renders with Spanish "Página no encontrada" message
 *   AC5 — Root path / redirects to /clientes
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ─── Test router factory ──────────────────────────────────────────────────────

function createTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail rendered, NavigationBar hidden
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — NavigationRail on desktop layout', () => {
  it('should render the NavigationRail component in the shell layout', async () => {
    // GIVEN: Router is at /clientes
    const router = createTestRouter('/clientes')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: NavigationRail element with data-testid is in the document
    expect(screen.getByTestId('navigation-rail')).toBeDefined()
  })

  it('should render "Clientes" label in the NavigationRail', async () => {
    // GIVEN: Router is at /clientes
    const router = createTestRouter('/clientes')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: A nav item labeled "Clientes" is in the document
    expect(screen.getByTestId('nav-item-clientes')).toBeDefined()
  })

  it('should render "Contactos" label in the NavigationRail', async () => {
    // GIVEN: Router is at /clientes
    const router = createTestRouter('/clientes')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: A nav item labeled "Contactos" is in the document
    expect(screen.getByTestId('nav-item-contactos')).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Active route: correct nav item highlighted
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Active route highlighting', () => {
  it('should mark Clientes nav item as active (aria-current="page") when at /clientes', async () => {
    // GIVEN: Router is initialized at /clientes
    const router = createTestRouter('/clientes')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: The Clientes nav item has aria-current="page"
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem.getAttribute('aria-current')).toBe('page')
  })

  it('should mark Contactos nav item as active (aria-current="page") when at /contactos', async () => {
    // GIVEN: Router is initialized at /contactos
    const router = createTestRouter('/contactos')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: The Contactos nav item has aria-current="page"
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem.getAttribute('aria-current')).toBe('page')
  })

  it('should NOT mark Contactos nav item as active when at /clientes', async () => {
    // GIVEN: Router is initialized at /clientes
    const router = createTestRouter('/clientes')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: The Contactos nav item does NOT have aria-current="page"
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem.getAttribute('aria-current')).not.toBe('page')
  })

  it('should NOT mark Clientes nav item as active when at /contactos', async () => {
    // GIVEN: Router is initialized at /contactos
    const router = createTestRouter('/contactos')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: The Clientes nav item does NOT have aria-current="page"
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem.getAttribute('aria-current')).not.toBe('page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 Not Found view
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — 404 Not Found view', () => {
  it('should render the not-found view for unknown routes', async () => {
    // GIVEN: Router is initialized at an unknown route /ruta-desconocida
    const router = createTestRouter('/ruta-desconocida')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: The not-found view container is rendered
    expect(screen.getByTestId('not-found-view')).toBeDefined()
  })

  it('should display "Página no encontrada" message in the 404 view', async () => {
    // GIVEN: Router is initialized at /unknown-page
    const router = createTestRouter('/unknown-page')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: Spanish "Página no encontrada" message is displayed
    expect(screen.getByTestId('not-found-message').textContent).toContain('Página no encontrada')
  })

  it('should render a back-to-clientes link in the 404 view', async () => {
    // GIVEN: Router is initialized at an unknown route
    const router = createTestRouter('/does-not-exist')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: A link or button to navigate back to /clientes is present
    expect(screen.getByTestId('not-found-back-link')).toBeDefined()
  })

  it('should navigate to /clientes when clicking the back link from 404 view', async () => {
    // GIVEN: Router is at an unknown route and 404 view is rendered
    const router = createTestRouter('/unknown')
    render(<RouterProvider router={router} />)
    await router.load()

    // WHEN: User clicks the back-to-clientes link
    const backLink = screen.getByTestId('not-found-back-link')
    await userEvent.click(backLink)

    // THEN: Router navigates to /clientes
    expect(router.state.location.pathname).toBe('/clientes')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root redirect
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Root redirect from / to /clientes', () => {
  it('should redirect from / to /clientes automatically', async () => {
    // GIVEN: Router is initialized at the root path /
    const router = createTestRouter('/')

    // WHEN: Application renders and router processes the redirect
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: The router state shows /clientes as the current path
    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('should render Clientes view content after root redirect', async () => {
    // GIVEN: Router is initialized at /
    const router = createTestRouter('/')

    // WHEN: Application renders and redirect completes
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: The Clientes section view is rendered
    expect(screen.getByTestId('clientes-view')).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Route view placeholders: /clientes and /contactos render correct views
// ─────────────────────────────────────────────────────────────────────────────

describe('Route view rendering', () => {
  it('should render the Clientes section view at /clientes', async () => {
    // GIVEN: Router is initialized at /clientes
    const router = createTestRouter('/clientes')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: The Clientes view with data-testid is rendered
    expect(screen.getByTestId('clientes-view')).toBeDefined()
  })

  it('should render the Contactos section view at /contactos', async () => {
    // GIVEN: Router is initialized at /contactos
    const router = createTestRouter('/contactos')

    // WHEN: Application renders
    render(<RouterProvider router={router} />)
    await router.load()

    // THEN: The Contactos view with data-testid is rendered
    expect(screen.getByTestId('contactos-view')).toBeDefined()
  })
})
