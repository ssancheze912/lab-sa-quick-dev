/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — _app.tsx layout route (NavigationRail / NavigationBar)
 *
 * ATDD Component Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Strategy: Unit-level routing tests using TanStack Router createMemoryHistory +
 * createRouter. Viewport behavior is validated by inspecting computed visibility
 * (class presence) since jsdom does not perform responsive CSS layout.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail rendered with data-testid="nav-rail" containing Clientes and Contactos
 *   AC2 — NavigationBar rendered with data-testid="nav-bar" containing Clientes and Contactos
 *   AC3 — /clientes view renders with data-testid="clientes-view"; /contactos with data-testid="contactos-view"
 *   AC4 — Unknown routes render data-testid="not-found-view" with "Ir a Clientes" link
 *   AC5 — Root / redirects to /clientes (router-level, no full page reload)
 *   AC6 — <nav> landmark with aria-label="Navegación principal"; aria-current="page" on active link
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'
import { QueryProvider } from '../../app/providers/QueryProvider'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: minimal router setup for component tests
// ─────────────────────────────────────────────────────────────────────────────

function renderWithRouter(initialPath: string = '/clientes') {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  return render(
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — NavigationRail (data-testid="nav-rail")
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — NavigationRail renders on desktop layout', () => {
  it('should render an element with data-testid="nav-rail"', async () => {
    // GIVEN: The router is initialized at /clientes (desktop layout)
    renderWithRouter('/clientes')

    // THEN: NavigationRail element is present in the DOM
    await screen.findByTestId('nav-rail')
    expect(screen.getByTestId('nav-rail')).toBeDefined()
  })

  it('should render "Clientes" navigation entry inside nav-rail', async () => {
    // GIVEN: The layout route _app.tsx is rendered at /clientes
    renderWithRouter('/clientes')

    // THEN: The nav rail contains a "Clientes" nav item
    const navRail = await screen.findByTestId('nav-rail')
    expect(navRail.textContent).toMatch(/Clientes/)
  })

  it('should render "Contactos" navigation entry inside nav-rail', async () => {
    // GIVEN: The layout route _app.tsx is rendered at /clientes
    renderWithRouter('/clientes')

    // THEN: The nav rail contains a "Contactos" nav item
    const navRail = await screen.findByTestId('nav-rail')
    expect(navRail.textContent).toMatch(/Contactos/)
  })

  it('should render app-shell wrapper with data-testid="app-shell"', async () => {
    // GIVEN: The layout route _app.tsx wraps the child routes
    renderWithRouter('/clientes')

    // THEN: The app-shell wrapper is present
    await screen.findByTestId('app-shell')
    expect(screen.getByTestId('app-shell')).toBeDefined()
  })

  it('should render a <main> content area inside the app shell', async () => {
    // GIVEN: The layout route _app.tsx renders Outlet in main
    renderWithRouter('/clientes')

    // WHEN: The DOM is inspected
    await screen.findByTestId('app-shell')

    // THEN: A <main> element is present for the routed content
    const mainEl = document.querySelector('main')
    expect(mainEl).not.toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — NavigationBar (data-testid="nav-bar")
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — NavigationBar renders for mobile layout', () => {
  it('should render an element with data-testid="nav-bar"', async () => {
    // GIVEN: The layout route _app.tsx is rendered (nav-bar always in DOM, hidden via CSS on desktop)
    renderWithRouter('/clientes')

    // THEN: NavigationBar element is present in the DOM
    await screen.findByTestId('nav-bar')
    expect(screen.getByTestId('nav-bar')).toBeDefined()
  })

  it('should render "Clientes" navigation entry inside nav-bar', async () => {
    // GIVEN: The layout route _app.tsx renders mobile NavigationBar
    renderWithRouter('/clientes')

    // THEN: The nav bar contains a "Clientes" nav item
    const navBar = await screen.findByTestId('nav-bar')
    expect(navBar.textContent).toMatch(/Clientes/)
  })

  it('should render "Contactos" navigation entry inside nav-bar', async () => {
    // GIVEN: The layout route _app.tsx renders mobile NavigationBar
    renderWithRouter('/clientes')

    // THEN: The nav bar contains a "Contactos" nav item
    const navBar = await screen.findByTestId('nav-bar')
    expect(navBar.textContent).toMatch(/Contactos/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Direct URL access renders correct view + active nav state
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — /clientes and /contactos route views render correctly', () => {
  it('should render clientes-view when router is at /clientes', async () => {
    // GIVEN: Router initialized directly at /clientes
    renderWithRouter('/clientes')

    // WHEN: The route resolves

    // THEN: The clientes placeholder view is rendered
    await screen.findByTestId('clientes-view')
    expect(screen.getByTestId('clientes-view')).toBeDefined()
  })

  it('should render contactos-view when router is at /contactos', async () => {
    // GIVEN: Router initialized directly at /contactos
    renderWithRouter('/contactos')

    // WHEN: The route resolves

    // THEN: The contactos placeholder view is rendered
    await screen.findByTestId('contactos-view')
    expect(screen.getByTestId('contactos-view')).toBeDefined()
  })

  it('should show "Clientes" heading inside clientes-view', async () => {
    // GIVEN: Router at /clientes, clientes-view is rendered
    renderWithRouter('/clientes')

    // WHEN: The view content is inspected
    const clientesView = await screen.findByTestId('clientes-view')

    // THEN: A "Clientes" heading is visible within the view
    expect(clientesView.textContent).toMatch(/Clientes/)
  })

  it('should show "Contactos" heading inside contactos-view', async () => {
    // GIVEN: Router at /contactos, contactos-view is rendered
    renderWithRouter('/contactos')

    // WHEN: The view content is inspected
    const contactosView = await screen.findByTestId('contactos-view')

    // THEN: A "Contactos" heading is visible within the view
    expect(contactosView.textContent).toMatch(/Contactos/)
  })

  it('should apply aria-current="page" on the Clientes nav link when at /clientes', async () => {
    // GIVEN: Router initialized at /clientes
    renderWithRouter('/clientes')

    // WHEN: The nav rail is inspected for active state
    await screen.findByTestId('nav-rail')

    // THEN: The active link has aria-current="page" and contains "Clientes"
    const activeLink = document.querySelector('[aria-current="page"]')
    expect(activeLink).not.toBeNull()
    expect(activeLink?.textContent).toMatch(/Clientes/)
  })

  it('should apply aria-current="page" on the Contactos nav link when at /contactos', async () => {
    // GIVEN: Router initialized at /contactos
    renderWithRouter('/contactos')

    // WHEN: The nav rail is inspected for active state
    await screen.findByTestId('nav-rail')

    // THEN: The active link has aria-current="page" and contains "Contactos"
    const activeLink = document.querySelector('[aria-current="page"]')
    expect(activeLink).not.toBeNull()
    expect(activeLink?.textContent).toMatch(/Contactos/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 not-found view for unknown routes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — 404 not-found view for unknown routes', () => {
  it('should render not-found-view for an unknown route', async () => {
    // GIVEN: Router initialized at an unknown route
    renderWithRouter('/ruta-desconocida')

    // WHEN: The route resolves

    // THEN: The 404 not-found view is displayed
    await screen.findByTestId('not-found-view')
    expect(screen.getByTestId('not-found-view')).toBeDefined()
  })

  it('should display "Página no encontrada" text in the 404 view', async () => {
    // GIVEN: Router at an unknown route
    renderWithRouter('/pagina-inexistente')

    // WHEN: The 404 view renders
    const notFoundView = await screen.findByTestId('not-found-view')

    // THEN: The user-friendly Spanish message is shown
    expect(notFoundView.textContent).toMatch(/Página no encontrada/)
  })

  it('should display a link to /clientes in the 404 view', async () => {
    // GIVEN: User is on an unknown route
    renderWithRouter('/ruta-que-no-existe')

    // WHEN: The 404 view renders
    const notFoundView = await screen.findByTestId('not-found-view')

    // THEN: A link with text "Ir a Clientes" is present
    const backLink = notFoundView.querySelector('a')
    expect(backLink).not.toBeNull()
    expect(backLink?.textContent).toMatch(/Ir a Clientes/)
  })

  it('back-link in 404 view should navigate to /clientes when clicked', async () => {
    // GIVEN: User is on the 404 not-found view
    const user = userEvent.setup()
    renderWithRouter('/unknown')

    // WHEN: The user clicks "Ir a Clientes"
    const notFoundView = await screen.findByTestId('not-found-view')
    const backLink = notFoundView.querySelector('a')
    expect(backLink).not.toBeNull()
    await user.click(backLink!)

    // THEN: The clientes-view is now rendered
    await screen.findByTestId('clientes-view')
    expect(screen.getByTestId('clientes-view')).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Root / redirects to /clientes', () => {
  it('should render clientes-view after navigating to root /', async () => {
    // GIVEN: Router initialized at root /
    renderWithRouter('/')

    // WHEN: The beforeLoad redirect fires

    // THEN: The clientes view is rendered (confirming client-side redirect to /clientes)
    await screen.findByTestId('clientes-view')
    expect(screen.getByTestId('clientes-view')).toBeDefined()
  })

  it('should render the navigation shell (nav-rail) after root redirect', async () => {
    // GIVEN: Router starts at / and redirects to /clientes
    renderWithRouter('/')

    // WHEN: The redirect resolves and _app.tsx layout is active

    // THEN: The nav-rail is present (layout shell rendered)
    await screen.findByTestId('nav-rail')
    expect(screen.getByTestId('nav-rail')).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Accessibility: <nav> landmark, aria-label, aria-current
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Accessibility requirements (WCAG 2.1 AA)', () => {
  it('should render a <nav> landmark element in the navigation shell', async () => {
    // GIVEN: The layout route _app.tsx is rendered at /clientes
    renderWithRouter('/clientes')

    // WHEN: The navigation is inspected for semantic HTML
    await screen.findByTestId('nav-rail')

    // THEN: A <nav> element exists as navigation landmark
    const navElement = document.querySelector('nav')
    expect(navElement).not.toBeNull()
  })

  it('should have aria-label="Navegación principal" on the nav element', async () => {
    // GIVEN: Navigation shell rendered at /clientes
    renderWithRouter('/clientes')

    // WHEN: The <nav> element is inspected for accessibility attributes
    await screen.findByTestId('nav-rail')

    // THEN: The nav landmark has the correct Spanish aria-label
    const navWithLabel = document.querySelector('nav[aria-label="Navegación principal"]')
    expect(navWithLabel).not.toBeNull()
  })

  it('should have aria-current="page" on exactly one nav link at any given route', async () => {
    // GIVEN: Router at /clientes — one nav item should be active
    renderWithRouter('/clientes')

    // WHEN: All aria-current="page" attributes are counted
    await screen.findByTestId('nav-rail')

    // THEN: Only one link is marked as current page
    const currentLinks = document.querySelectorAll('[aria-current="page"]')
    expect(currentLinks.length).toBe(1)
  })

  it('nav links should have non-empty aria-label attributes', async () => {
    // GIVEN: Navigation shell rendered with nav items
    renderWithRouter('/clientes')

    // WHEN: Individual nav links are inspected
    await screen.findByTestId('nav-rail')

    // THEN: Each nav link within nav-rail has a non-empty aria-label
    const navRail = screen.getByTestId('nav-rail')
    const navLinks = navRail.querySelectorAll('a')
    expect(navLinks.length).toBeGreaterThan(0)

    navLinks.forEach((link) => {
      const ariaLabel = link.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel!.length).toBeGreaterThan(0)
    })
  })
})
