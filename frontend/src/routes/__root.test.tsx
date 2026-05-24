/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail rendered on desktop viewport (>= 1024px)
 *   AC2 — Mobile: NavigationBar rendered on mobile viewport (< 1024px)
 *   AC3 — Deep linking: active nav item reflects current route
 *   AC4 — Unknown route: 404 not-found view rendered in Spanish
 *   AC5 — Root redirect: `/` redirects to `/clientes`
 *   AC6 — Active state: nav item matches current route at all times
 *
 * Required data-testid attributes (implementation must add these):
 *   - nav-rail            → NavigationRail wrapper element (desktop)
 *   - nav-bar             → NavigationBar wrapper element (mobile)
 *   - nav-item-clientes   → Clientes navigation item/link
 *   - nav-item-contactos  → Contactos navigation item/link
 *   - clientes-view       → Root element of the /clientes route view
 *   - contactos-view      → Root element of the /contactos route view
 *   - not-found-view      → Root element of the 404 not-found view
 *   - not-found-message   → Text message element in 404 page
 *   - not-found-link      → Return link in 404 page
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'

// These route imports will NOT exist until implementation — tests fail RED
import { Route as rootRoute } from './__root'
import { Route as indexRoute } from './index'
import { Route as clientesRoute } from './_app/clientes'
import { Route as contactosRoute } from './_app/contactos'
import { Route as notFoundRoute } from './404'

// ─────────────────────────────────────────────────────────────────────────────
// Test Router Factory
// Creates an in-memory router for component testing following TanStack Router patterns.
// The router is rebuilt per test to avoid shared state.
// ─────────────────────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string) {
  const routeTree = rootRoute.addChildren([
    indexRoute,
    clientesRoute,
    contactosRoute,
    notFoundRoute,
  ])

  const history = createMemoryHistory({ initialEntries: [initialPath] })

  return createRouter({ routeTree, history })
}

function renderAtRoute(path: string) {
  const router = createTestRouter(path)
  return render(<RouterProvider router={router} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail visible on desktop viewport (>= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Desktop NavigationRail', () => {
  beforeEach(() => {
    // GIVEN: Desktop viewport (>= 1024px)
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true, configurable: true })
    window.dispatchEvent(new Event('resize'))
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true })
  })

  it('should render a NavigationRail element on desktop viewport', () => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // WHEN: The root layout renders
    renderAtRoute('/clientes')

    // THEN: A NavigationRail component is present in the DOM
    expect(screen.getByTestId('nav-rail')).toBeInTheDocument()
  })

  it('should render a Clientes navigation item inside the NavigationRail', () => {
    // GIVEN: The application is loaded on a desktop browser
    // WHEN: The root layout renders
    renderAtRoute('/clientes')

    // THEN: A Clientes navigation entry is present
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
  })

  it('should render a Contactos navigation item inside the NavigationRail', () => {
    // GIVEN: The application is loaded on a desktop browser
    // WHEN: The root layout renders
    renderAtRoute('/clientes')

    // THEN: A Contactos navigation entry is present
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
  })

  it('should NOT render the NavigationBar on desktop viewport', () => {
    // GIVEN: The application is loaded on a desktop browser (>= 1024px)
    // WHEN: The root layout renders
    renderAtRoute('/clientes')

    // THEN: The mobile NavigationBar element is not visible
    // Implementation uses Tailwind `hidden lg:flex` — element exists in DOM but is hidden
    const navBar = screen.queryByTestId('nav-bar')
    if (navBar) {
      // If rendered, it must be visually hidden (CSS class `hidden` or `lg:hidden`)
      expect(navBar).not.toBeVisible()
    } else {
      // Alternatively, element is not rendered at all — also acceptable
      expect(navBar).toBeNull()
    }
  })

  it('should have a nav landmark with aria-label "Navegación principal"', () => {
    // GIVEN: The application is loaded on a desktop browser
    // WHEN: The root layout renders
    renderAtRoute('/clientes')

    // THEN: The navigation landmark has the correct accessible label in Spanish
    expect(screen.getByRole('navigation', { name: /navegación principal/i })).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile: NavigationBar at bottom (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Mobile NavigationBar', () => {
  beforeEach(() => {
    // GIVEN: Mobile viewport (< 1024px)
    Object.defineProperty(window, 'innerWidth', { value: 390, writable: true, configurable: true })
    window.dispatchEvent(new Event('resize'))
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true })
  })

  it('should render a NavigationBar element on mobile viewport', () => {
    // GIVEN: The application is loaded on a mobile browser viewport (< 1024px)
    // WHEN: The root layout renders
    renderAtRoute('/clientes')

    // THEN: A NavigationBar component is present in the DOM
    expect(screen.getByTestId('nav-bar')).toBeInTheDocument()
  })

  it('should render a Clientes navigation item inside the NavigationBar on mobile', () => {
    // GIVEN: The application is loaded on a mobile browser viewport
    // WHEN: The root layout renders
    renderAtRoute('/clientes')

    // THEN: A Clientes navigation entry is present and accessible
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
  })

  it('should render a Contactos navigation item inside the NavigationBar on mobile', () => {
    // GIVEN: The application is loaded on a mobile browser viewport
    // WHEN: The root layout renders
    renderAtRoute('/clientes')

    // THEN: A Contactos navigation entry is present and accessible
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
  })

  it('should NOT render the NavigationRail on mobile viewport', () => {
    // GIVEN: The application is loaded on a mobile browser viewport (< 1024px)
    // WHEN: The root layout renders
    renderAtRoute('/clientes')

    // THEN: The desktop NavigationRail is not visible
    const navRail = screen.queryByTestId('nav-rail')
    if (navRail) {
      expect(navRail).not.toBeVisible()
    } else {
      expect(navRail).toBeNull()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: direct URL navigation renders correct view
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Deep Linking', () => {
  it('should render the Clientes view when initialized at /clientes', () => {
    // GIVEN: The user navigates directly to /clientes
    // WHEN: The router initializes at /clientes
    renderAtRoute('/clientes')

    // THEN: The correct Clientes view is rendered without redirection
    expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
  })

  it('should render the Contactos view when initialized at /contactos', () => {
    // GIVEN: The user navigates directly to /contactos
    // WHEN: The router initializes at /contactos
    renderAtRoute('/contactos')

    // THEN: The correct Contactos view is rendered without redirection
    expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
  })

  it('should mark the Clientes nav item as active (aria-current="page") when at /clientes', () => {
    // GIVEN: The user navigates directly to /clientes
    // WHEN: The router initializes at /clientes
    renderAtRoute('/clientes')

    // THEN: The Clientes navigation item has aria-current="page"
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')
  })

  it('should mark the Contactos nav item as active (aria-current="page") when at /contactos', () => {
    // GIVEN: The user navigates directly to /contactos
    // WHEN: The router initializes at /contactos
    renderAtRoute('/contactos')

    // THEN: The Contactos navigation item has aria-current="page"
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route: 404 / not-found view in Spanish
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — 404 Not-Found Route', () => {
  it('should render the not-found view for an unknown route', () => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The router initializes at an unknown path
    renderAtRoute('/ruta-desconocida-xyz')

    // THEN: The not-found view is rendered
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
  })

  it('should display "Página no encontrada" text in the not-found view', () => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The router initializes at an unknown path
    renderAtRoute('/ruta-que-no-existe')

    // THEN: A Spanish "Página no encontrada" message is displayed
    expect(screen.getByTestId('not-found-message')).toHaveTextContent('Página no encontrada')
  })

  it('should display a return link in the not-found view', () => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The router renders the 404 page
    renderAtRoute('/ruta-desconocida')

    // THEN: A link to return to the application is present
    expect(screen.getByTestId('not-found-link')).toBeInTheDocument()
  })

  it('should have a return link pointing to /clientes', () => {
    // GIVEN: The user is on the 404 page
    // WHEN: The not-found view renders
    renderAtRoute('/ruta-desconocida')

    // THEN: The return link href points to /clientes
    const returnLink = screen.getByTestId('not-found-link')
    expect(returnLink).toHaveAttribute('href', '/clientes')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root redirect: `/` redirects to `/clientes`
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Root Path Redirect', () => {
  it('should render the Clientes view after the root redirect from /', async () => {
    // GIVEN: The root path `/` is accessed
    // WHEN: The router initializes at `/` and the redirect fires
    renderAtRoute('/')

    // THEN: The Clientes view is rendered (redirect completed synchronously)
    expect(await screen.findByTestId('clientes-view')).toBeInTheDocument()
  })

  it('should NOT render the Clientes view on the root path without redirect completing', () => {
    // GIVEN: The root path `/` is accessed immediately (before redirect)
    // WHEN: The router initializes at `/`
    // This test validates the redirect mechanism exists — if `clientes-view`
    // never appears, the redirect is not implemented.
    renderAtRoute('/')

    // THEN: Either clientes-view appears (redirect worked) OR root has no content
    // This test fails RED if no redirect is configured at all.
    // Using findByTestId (async) to allow for async router resolution.
    // If the test times out, the redirect is missing — RED as expected.
    return screen.findByTestId('clientes-view', {}, { timeout: 3000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Active state: navigation item reflects current route
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Active Navigation State', () => {
  it('should mark Clientes as active when on /clientes and NOT mark Contactos as active', () => {
    // GIVEN: The application is running and the user is on /clientes
    // WHEN: The route renders
    renderAtRoute('/clientes')

    // THEN: Clientes item is active, Contactos is not
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page')
  })

  it('should mark Contactos as active when on /contactos and NOT mark Clientes as active', () => {
    // GIVEN: The application is running and the user is on /contactos
    // WHEN: The route renders
    renderAtRoute('/contactos')

    // THEN: Contactos item is active, Clientes is not
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page')
  })

  it('should update active nav item when user clicks from Clientes to Contactos', async () => {
    // GIVEN: The user is on /clientes
    renderAtRoute('/clientes')
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')

    // WHEN: The user clicks the Contactos navigation item
    await userEvent.click(screen.getByTestId('nav-item-contactos'))

    // THEN: Contactos item becomes active
    expect(await screen.findByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page')
  })

  it('should update active nav item when user clicks from Contactos to Clientes', async () => {
    // GIVEN: The user is on /contactos
    renderAtRoute('/contactos')
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page')

    // WHEN: The user clicks the Clientes navigation item
    await userEvent.click(screen.getByTestId('nav-item-clientes'))

    // THEN: Clientes item becomes active
    expect(await screen.findByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — WCAG 2.1 AA compliance (component level)
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility — Navigation Shell WCAG 2.1 AA', () => {
  it('should have a nav element with aria-label "Navegación principal"', () => {
    // GIVEN: The application is loaded
    // WHEN: The root layout renders
    renderAtRoute('/clientes')

    // THEN: A navigation landmark with the correct accessible name is present
    expect(screen.getByRole('navigation', { name: /navegación principal/i })).toBeInTheDocument()
  })

  it('should have navigation items as links (role="link" or anchor elements)', () => {
    // GIVEN: The application is loaded
    // WHEN: The root layout renders
    renderAtRoute('/clientes')

    // THEN: Navigation items are keyboard-accessible links
    const clientesItem = screen.getByTestId('nav-item-clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')

    // Items should be anchor elements or have role="link"
    expect(
      clientesItem.tagName === 'A' || clientesItem.getAttribute('role') === 'link'
    ).toBe(true)
    expect(
      contactosItem.tagName === 'A' || contactosItem.getAttribute('role') === 'link'
    ).toBe(true)
  })
})
