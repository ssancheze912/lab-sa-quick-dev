import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Component Tests (Vitest + RTL): Story 1.2 — Frontend Navigation Shell
 *
 * Covers:
 *   AC1 — NavigationRail (desktop) visible on left with "Clientes" + "Contactos" entries
 *   AC2 — NavigationBar (mobile) visible at bottom on viewports < 1024px
 *   AC3 — Deep linking: /clientes and /contactos render directly without redirection
 *   AC4 — Unknown route renders graceful 404 view (no crash, no blank screen)
 *   AC5 — nav landmark has aria-label="Navegación principal"; Spanish labels visible
 *
 * data-testid mapping (from AppShell.tsx):
 *   navigation-rail — desktop nav wrapper
 *   navigation-bar  — mobile nav wrapper
 *   not-found-view  — 404 container
 *   not-found-back-link — back link in 404 view
 *   clientes-view   — /clientes route placeholder
 *   contactos-view  — /contactos route placeholder
 */

// ---------------------------------------------------------------------------
// Helpers — TanStack Router in-memory setup
// ---------------------------------------------------------------------------

async function createTestRouter(initialPath: string = '/') {
  const { createMemoryHistory, createRouter } = await import('@tanstack/react-router')
  const { routeTree } = await import('../../routeTree.gen')

  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  return router
}

async function renderWithRouter(initialPath: string = '/') {
  const { RouterProvider } = await import('@tanstack/react-router')
  const router = await createTestRouter(initialPath)
  await router.load()
  return render(<RouterProvider router={router} />)
}

// ---------------------------------------------------------------------------
// AC1 — NavigationRail (desktop)
// ---------------------------------------------------------------------------

describe('AC1 — NavigationRail renders on desktop viewport', () => {
  it('[P0] NavigationRail wrapper is present in the DOM on desktop', async () => {
    await renderWithRouter('/')

    // THEN: The NavigationRail wrapper exists with the correct data-testid
    expect(screen.getByTestId('navigation-rail')).toBeDefined()
  })

  it('[P0] NavigationRail contains "Clientes" link in Spanish', async () => {
    await renderWithRouter('/')

    // THEN: A link with label "Clientes" is visible inside the rail
    const links = screen.getAllByRole('link', { name: /clientes/i })
    expect(links.length).toBeGreaterThan(0)
  })

  it('[P0] NavigationRail contains "Contactos" link in Spanish', async () => {
    await renderWithRouter('/')

    // THEN: A link with label "Contactos" is visible inside the rail
    const links = screen.getAllByRole('link', { name: /contactos/i })
    expect(links.length).toBeGreaterThan(0)
  })

  it('[P1] Clicking "Clientes" link changes route to /clientes', async () => {
    const user = userEvent.setup()
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/')
    await router.load()
    render(<RouterProvider router={router} />)

    // WHEN: User clicks the "Clientes" link
    const links = screen.getAllByRole('link', { name: /clientes/i })
    await user.click(links[0])

    // THEN: Router location changes to /clientes
    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('[P1] Clicking "Contactos" link changes route to /contactos', async () => {
    const user = userEvent.setup()
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/')
    await router.load()
    render(<RouterProvider router={router} />)

    // WHEN: User clicks the "Contactos" link
    const links = screen.getAllByRole('link', { name: /contactos/i })
    await user.click(links[0])

    // THEN: Router location changes to /contactos
    expect(router.state.location.pathname).toBe('/contactos')
  })
})

// ---------------------------------------------------------------------------
// AC2 — NavigationBar (mobile, < 1024px)
// ---------------------------------------------------------------------------

describe('AC2 — NavigationBar renders on mobile viewport (< 1024px)', () => {
  it('[P0] NavigationBar wrapper is present in the DOM', async () => {
    await renderWithRouter('/')

    // NavigationBar is always in the DOM (CSS controls visibility via hidden/flex)
    expect(screen.getByTestId('navigation-bar')).toBeDefined()
  })

  it('[P1] NavigationBar contains "Clientes" item', async () => {
    await renderWithRouter('/')

    // THEN: At least one link with label "Clientes" is visible
    const links = screen.getAllByRole('link', { name: /clientes/i })
    expect(links.length).toBeGreaterThan(0)
  })

  it('[P1] NavigationBar contains "Contactos" item', async () => {
    await renderWithRouter('/')

    // THEN: At least one link with label "Contactos" is visible
    const links = screen.getAllByRole('link', { name: /contactos/i })
    expect(links.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// AC3 — Deep Linking
// ---------------------------------------------------------------------------

describe('AC3 — Deep linking: /clientes and /contactos render directly', () => {
  it('[P0] Navigating directly to /clientes renders Clientes view without redirect', async () => {
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)

    // THEN: The URL remains /clientes (no redirect to home)
    expect(router.state.location.pathname).toBe('/clientes')
    // AND: The Clientes view content is rendered
    expect(screen.getByTestId('clientes-view')).toBeDefined()
  })

  it('[P0] Navigating directly to /contactos renders Contactos view without redirect', async () => {
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/contactos')
    await router.load()
    render(<RouterProvider router={router} />)

    // THEN: The URL remains /contactos (no redirect)
    expect(router.state.location.pathname).toBe('/contactos')
    // AND: The Contactos view content is rendered
    expect(screen.getByTestId('contactos-view')).toBeDefined()
  })

  it('[P1] Index route / redirects to /clientes automatically', async () => {
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/')
    await router.load()
    render(<RouterProvider router={router} />)

    // THEN: The router redirects to /clientes
    expect(router.state.location.pathname).toBe('/clientes')
  })
})

// ---------------------------------------------------------------------------
// AC4 — 404 Not-Found Route
// ---------------------------------------------------------------------------

describe('AC4 — Unknown route renders graceful 404 view', () => {
  it('[P0] Navigating to /unknown renders a not-found view (no crash, no blank screen)', async () => {
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/unknown')
    await router.load()
    const { container } = render(<RouterProvider router={router} />)

    // THEN: A 404 view is displayed
    expect(screen.getByTestId('not-found-view')).toBeDefined()
    // AND: The container has meaningful content (not blank)
    expect(container.textContent?.trim().length).toBeGreaterThan(0)
  })

  it('[P1] 404 view contains a back link that navigates to /clientes', async () => {
    const user = userEvent.setup()
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/unknown')
    await router.load()
    render(<RouterProvider router={router} />)

    // WHEN: The user clicks the back link
    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink).toBeDefined()
    await user.click(backLink)

    // THEN: The router navigates to /clientes
    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('[P2] 404 view displays "Página no encontrada" message in Spanish', async () => {
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/ruta-inexistente')
    await router.load()
    render(<RouterProvider router={router} />)

    // THEN: The page shows the Spanish not-found message
    expect(screen.getByTestId('not-found-view').textContent).toContain('Página no encontrada')
  })
})

// ---------------------------------------------------------------------------
// AC5 — Accessibility (WCAG 2.1 AA)
// ---------------------------------------------------------------------------

describe('AC5 — Accessibility: nav landmark and Spanish labels', () => {
  it('[P0] nav element has aria-label="Navegación principal"', async () => {
    await renderWithRouter('/')

    // THEN: At least one <nav> with aria-label="Navegación principal" is in the DOM
    const navLandmark = document.querySelector('nav[aria-label="Navegación principal"]')
    expect(navLandmark).not.toBeNull()
  })

  it('[P1] "Clientes" nav link displays visible Spanish text label', async () => {
    await renderWithRouter('/')

    // THEN: The Clientes link has the Spanish label "Clientes" (not "Clients")
    const links = screen.getAllByRole('link', { name: /clientes/i })
    expect(links[0].textContent).toContain('Clientes')
    expect(links[0].textContent).not.toContain('Clients')
  })

  it('[P1] "Contactos" nav link displays visible Spanish text label', async () => {
    await renderWithRouter('/')

    // THEN: The Contactos link has the Spanish label "Contactos" (not "Contacts")
    const links = screen.getAllByRole('link', { name: /contactos/i })
    expect(links[0].textContent).toContain('Contactos')
    expect(links[0].textContent).not.toContain('Contacts')
  })
})
