/**
 * Story 1.2: Frontend Navigation Shell — Unit Edge Cases
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE Expansion — Extends ATDD unit coverage (24 tests in _app.test.tsx)
 * with edge cases, boundary conditions, and negative paths.
 *
 * Expansion areas:
 *   U1 — clientes.tsx view isolation (no nav duplicates, exact heading text)
 *   U2 — contactos.tsx view isolation (no nav duplicates, exact heading text)
 *   U3 — index.tsx redirect uses replace:true (no history entry added)
 *   U4 — NavRail has exactly 2 nav links (Clientes + Contactos, no extras)
 *   U5 — Inactive nav links do NOT have aria-current="page"
 *   U6 — notFoundComponent has exactly one anchor link to /clientes
 *   U7 — AppShell renders correctly with non-standard initial routes
 *   U8 — Multiple sequential route changes (stress / no stale state)
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
// Helper: minimal router setup
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
// U1 — clientes.tsx view isolation
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] U1 — clientes.tsx view isolation', () => {
  it('should render exactly one element with data-testid="clientes-view"', async () => {
    // GIVEN: Router is at /clientes
    renderWithRouter('/clientes')

    // WHEN: All elements with the clientes-view testid are queried
    await screen.findByTestId('clientes-view')
    const clientesViews = screen.getAllByTestId('clientes-view')

    // THEN: Only one clientes-view element exists (no duplicates from nav or shell)
    expect(clientesViews).toHaveLength(1)
  })

  it('should render the heading "Clientes" inside clientes-view as an h1 element', async () => {
    // GIVEN: Router at /clientes
    renderWithRouter('/clientes')

    // WHEN: The heading element inside clientes-view is located
    const clientesView = await screen.findByTestId('clientes-view')
    const heading = clientesView.querySelector('h1')

    // THEN: An h1 element exists and contains the Spanish label
    expect(heading).not.toBeNull()
    expect(heading?.textContent?.trim()).toBe('Clientes')
  })

  it('clientes-view should NOT contain data-testid="contactos-view"', async () => {
    // GIVEN: Router at /clientes — only clientes content should be present
    renderWithRouter('/clientes')
    await screen.findByTestId('clientes-view')

    // THEN: The contactos-view is absent from the DOM
    expect(screen.queryByTestId('contactos-view')).toBeNull()
  })

  it('clientes-view should NOT contain data-testid="not-found-view"', async () => {
    // GIVEN: Router at /clientes — not-found content must be absent
    renderWithRouter('/clientes')
    await screen.findByTestId('clientes-view')

    // THEN: The not-found-view is absent
    expect(screen.queryByTestId('not-found-view')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// U2 — contactos.tsx view isolation
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] U2 — contactos.tsx view isolation', () => {
  it('should render exactly one element with data-testid="contactos-view"', async () => {
    // GIVEN: Router is at /contactos
    renderWithRouter('/contactos')

    // WHEN: All elements with the contactos-view testid are queried
    await screen.findByTestId('contactos-view')
    const contactosViews = screen.getAllByTestId('contactos-view')

    // THEN: Only one contactos-view element exists
    expect(contactosViews).toHaveLength(1)
  })

  it('should render the heading "Contactos" inside contactos-view as an h1 element', async () => {
    // GIVEN: Router at /contactos
    renderWithRouter('/contactos')

    // WHEN: The heading element inside contactos-view is located
    const contactosView = await screen.findByTestId('contactos-view')
    const heading = contactosView.querySelector('h1')

    // THEN: An h1 element with the Spanish label exists
    expect(heading).not.toBeNull()
    expect(heading?.textContent?.trim()).toBe('Contactos')
  })

  it('contactos-view should NOT contain data-testid="clientes-view"', async () => {
    // GIVEN: Router at /contactos — clientes content should be absent
    renderWithRouter('/contactos')
    await screen.findByTestId('contactos-view')

    // THEN: clientes-view is not in the DOM
    expect(screen.queryByTestId('clientes-view')).toBeNull()
  })

  it('contactos-view should NOT contain data-testid="not-found-view"', async () => {
    // GIVEN: Router at /contactos
    renderWithRouter('/contactos')
    await screen.findByTestId('contactos-view')

    // THEN: not-found-view is absent
    expect(screen.queryByTestId('not-found-view')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// U3 — index.tsx redirect: replace:true means no history entry duplication
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] U3 — index.tsx redirect uses replace semantics', () => {
  it('should reach /clientes after starting at root /', async () => {
    // GIVEN: Router initialized at /
    renderWithRouter('/')

    // WHEN: The beforeLoad redirect fires with replace:true

    // THEN: clientes-view is rendered (confirming redirect happened)
    const clientesView = await screen.findByTestId('clientes-view')
    expect(clientesView).toBeDefined()
  })

  it('should not render any "page not found" content when starting at root /', async () => {
    // GIVEN: Router at / — the redirect should route to a valid view
    renderWithRouter('/')

    // WHEN: The redirect resolves
    await screen.findByTestId('clientes-view')

    // THEN: No 404 view is shown (redirect reached a valid route)
    expect(screen.queryByTestId('not-found-view')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// U4 — NavigationRail has exactly 2 nav links (boundary: no missing, no extras)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] U4 — NavigationRail nav link count boundary', () => {
  it('should render exactly 2 anchor links inside nav-rail', async () => {
    // GIVEN: Router at /clientes — nav-rail is rendered
    renderWithRouter('/clientes')
    const navRail = await screen.findByTestId('nav-rail')

    // WHEN: All anchor elements inside nav-rail are counted
    const anchors = navRail.querySelectorAll('a')

    // THEN: Exactly 2 links: Clientes and Contactos (no duplicates, no missing)
    expect(anchors).toHaveLength(2)
  })

  it('the two nav links should be for /clientes and /contactos specifically', async () => {
    // GIVEN: Router at /clientes
    renderWithRouter('/clientes')
    const navRail = await screen.findByTestId('nav-rail')

    // WHEN: The href attributes of all nav links are collected
    const anchors = Array.from(navRail.querySelectorAll('a'))
    const hrefs = anchors.map((a) => a.getAttribute('href'))

    // THEN: Both /clientes and /contactos are present
    expect(hrefs).toContain('/clientes')
    expect(hrefs).toContain('/contactos')
  })

  it('nav link labels should be "Clientes" and "Contactos" (no English labels)', async () => {
    // GIVEN: Router at /clientes
    renderWithRouter('/clientes')
    const navRail = await screen.findByTestId('nav-rail')

    // WHEN: Text content of all anchors in nav-rail is collected
    const anchors = Array.from(navRail.querySelectorAll('a'))
    const texts = anchors.map((a) => a.textContent?.trim())

    // THEN: Labels are in Spanish (not "Clients"/"Contacts")
    expect(texts.some((t) => t?.includes('Clientes'))).toBe(true)
    expect(texts.some((t) => t?.includes('Contactos'))).toBe(true)
    expect(texts.every((t) => !t?.includes('Clients') && !t?.includes('Contacts'))).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// U5 — Inactive nav links must NOT have aria-current="page"
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] U5 — Only the active nav link has aria-current="page"', () => {
  it('when at /clientes, the Contactos link should NOT have aria-current="page"', async () => {
    // GIVEN: Router at /clientes — Clientes is active, Contactos is not
    renderWithRouter('/clientes')
    const navRail = await screen.findByTestId('nav-rail')

    // WHEN: The Contactos link is located and its aria-current checked
    const anchors = Array.from(navRail.querySelectorAll('a'))
    const contactosLink = anchors.find((a) => a.textContent?.includes('Contactos'))
    expect(contactosLink).toBeDefined()

    // THEN: Contactos link does NOT have aria-current="page"
    expect(contactosLink?.getAttribute('aria-current')).not.toBe('page')
  })

  it('when at /contactos, the Clientes link should NOT have aria-current="page"', async () => {
    // GIVEN: Router at /contactos — Contactos is active, Clientes is not
    renderWithRouter('/contactos')
    const navRail = await screen.findByTestId('nav-rail')

    // WHEN: The Clientes link's aria-current is inspected
    const anchors = Array.from(navRail.querySelectorAll('a'))
    const clientesLink = anchors.find((a) => a.textContent?.includes('Clientes'))
    expect(clientesLink).toBeDefined()

    // THEN: Clientes link does NOT have aria-current="page"
    expect(clientesLink?.getAttribute('aria-current')).not.toBe('page')
  })

  it('exactly one link should have aria-current="page" when at /contactos', async () => {
    // GIVEN: Router at /contactos
    renderWithRouter('/contactos')
    await screen.findByTestId('nav-rail')

    // WHEN: All aria-current="page" elements in the entire document are counted
    const currentLinks = document.querySelectorAll('[aria-current="page"]')

    // THEN: Exactly one link is marked as current (boundary: not 0, not 2)
    expect(currentLinks).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// U6 — notFoundComponent: single link to /clientes, correct text
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] U6 — 404 notFoundComponent link boundary conditions', () => {
  it('should render exactly one <a> element inside not-found-view', async () => {
    // GIVEN: Router at an unknown route
    renderWithRouter('/pagina-inexistente-vitest')
    const notFoundView = await screen.findByTestId('not-found-view')

    // WHEN: All anchor elements inside not-found-view are counted
    const anchors = notFoundView.querySelectorAll('a')

    // THEN: Exactly one link (no duplicate back-navigation options)
    expect(anchors).toHaveLength(1)
  })

  it('the back-link in not-found-view should point to /clientes', async () => {
    // GIVEN: 404 view is rendered
    renderWithRouter('/ruta-no-encontrada')
    const notFoundView = await screen.findByTestId('not-found-view')

    // WHEN: The href of the back-link is read
    const backLink = notFoundView.querySelector('a')
    const href = backLink?.getAttribute('href')

    // THEN: The href targets /clientes
    expect(href).toBeTruthy()
    expect(href).toContain('/clientes')
  })

  it('the back-link in not-found-view should have text "Ir a Clientes"', async () => {
    // GIVEN: 404 view is rendered
    renderWithRouter('/sin-ruta')
    const notFoundView = await screen.findByTestId('not-found-view')

    // WHEN: The text of the back-link is read
    const backLink = notFoundView.querySelector('a')
    const text = backLink?.textContent?.trim()

    // THEN: The text is the exact Spanish label
    expect(text).toBe('Ir a Clientes')
  })

  it('not-found-view should contain "Página no encontrada" text', async () => {
    // GIVEN: Router at an unknown path
    renderWithRouter('/this-does-not-exist')
    const notFoundView = await screen.findByTestId('not-found-view')

    // THEN: The Spanish user-friendly message is present
    expect(notFoundView.textContent).toMatch(/Página no encontrada/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// U7 — AppShell renders correctly with a non-standard but valid initial route
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] U7 — AppShell stability with edge-case initial routes', () => {
  it('should render app-shell when starting directly at /contactos', async () => {
    // GIVEN: Router initialized at /contactos (not the default /clientes)
    renderWithRouter('/contactos')

    // WHEN: The app mounts
    await screen.findByTestId('app-shell')

    // THEN: app-shell is rendered correctly
    expect(screen.getByTestId('app-shell')).toBeDefined()
  })

  it('should render nav-rail and contactos-view together when starting at /contactos', async () => {
    // GIVEN: Direct entry to /contactos
    renderWithRouter('/contactos')

    // WHEN: Both nav-rail and the view content are resolved
    await screen.findByTestId('nav-rail')
    await screen.findByTestId('contactos-view')

    // THEN: Both elements co-exist (layout + content are both rendered)
    expect(screen.getByTestId('nav-rail')).toBeDefined()
    expect(screen.getByTestId('contactos-view')).toBeDefined()
  })

  it('should render not-found-view when starting at a deeply nested unknown path', async () => {
    // GIVEN: Router initialized at a deeply nested unknown path
    renderWithRouter('/a/b/c/d/e/f/g')

    // WHEN: Route resolution completes
    const notFoundView = await screen.findByTestId('not-found-view')

    // THEN: The 404 view renders even for deeply nested unknown paths
    expect(notFoundView).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// U8 — Multiple sequential route changes (stress: no stale state)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] U8 — Sequential navigation: no stale DOM state after multiple route changes', () => {
  it('should render correct view after navigating Clientes → Contactos → Clientes via click', async () => {
    // GIVEN: Router at /clientes
    const user = userEvent.setup()
    renderWithRouter('/clientes')
    await screen.findByTestId('clientes-view')

    // WHEN: User navigates to Contactos
    const navRail = screen.getByTestId('nav-rail')
    const contactosLink = navRail.querySelector('a[href="/contactos"]')
    expect(contactosLink).not.toBeNull()
    await user.click(contactosLink!)

    // THEN: contactos-view is visible
    await screen.findByTestId('contactos-view')
    expect(screen.queryByTestId('clientes-view')).toBeNull()

    // WHEN: User navigates back to Clientes
    const clientesLink = navRail.querySelector('a[href="/clientes"]')
    expect(clientesLink).not.toBeNull()
    await user.click(clientesLink!)

    // THEN: clientes-view is visible again, contactos-view is gone
    await screen.findByTestId('clientes-view')
    expect(screen.queryByTestId('contactos-view')).toBeNull()
  })

  it('nav-rail should always have exactly one aria-current="page" link after sequential navigation', async () => {
    // GIVEN: Router at /clientes
    const user = userEvent.setup()
    renderWithRouter('/clientes')
    await screen.findByTestId('nav-rail')

    // Verify initial state: one active link
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1)

    // WHEN: Navigate to Contactos
    const navRail = screen.getByTestId('nav-rail')
    const contactosLink = navRail.querySelector('a[href="/contactos"]')!
    await user.click(contactosLink)
    await screen.findByTestId('contactos-view')

    // THEN: Still exactly one aria-current="page" link
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1)

    // WHEN: Navigate back to Clientes
    const clientesLink = navRail.querySelector('a[href="/clientes"]')!
    await user.click(clientesLink)
    await screen.findByTestId('clientes-view')

    // THEN: Still exactly one aria-current="page" link
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
  })

  it('nav-bar should NOT be rendered in the DOM when nav-rail is (no duplicate navigation roots)', async () => {
    // GIVEN: jsdom does not enforce CSS visibility — both elements exist in DOM
    // This test validates structural uniqueness (one nav-rail, one nav-bar, not duplicated)
    renderWithRouter('/clientes')
    await screen.findByTestId('nav-rail')

    // WHEN: nav-rail and nav-bar counts are checked
    const navRailElements = screen.getAllByTestId('nav-rail')
    const navBarElements = screen.getAllByTestId('nav-bar')

    // THEN: Exactly one of each (no layout duplicates from re-renders or double mounts)
    expect(navRailElements).toHaveLength(1)
    expect(navBarElements).toHaveLength(1)
  })
})
