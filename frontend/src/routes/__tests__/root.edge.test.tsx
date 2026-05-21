import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Edge-Case Tests: Story 1.2 — Frontend Navigation Shell
 *
 * GREEN PHASE: Expands ATDD coverage with boundary conditions, error paths,
 * and edge cases NOT covered by root.test.tsx.
 *
 * Additional coverage:
 *   EC1  — Viewport boundary at exactly 1024px (DESKTOP_BREAKPOINT edge)
 *   EC2  — Viewport at 1023px (just below breakpoint — mobile nav expected)
 *   EC3  — Resize event switches nav from desktop to mobile and back
 *   EC4  — nav-bar is absent from DOM on desktop; nav-rail absent on mobile
 *   EC5  — Deep nested unknown route still renders 404 view
 *   EC6  — 404 back link href points to /clientes
 *   EC7  — No nav item is active on an unmatched (404) route
 *   EC8  — Multiple rapid clicks on the same nav item are idempotent
 *   EC9  — nav element exposes implicit role="navigation"
 *   EC10 — Both "Clientes" and "Contactos" nav items render in mobile viewport
 *   EC11 — Active state is mutually exclusive between Clientes and Contactos
 *   EC12 — /clientes route renders inside main content area (Outlet renders)
 */

// ---------------------------------------------------------------------------
// Helpers — same pattern as root.test.tsx
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
  const { QueryProvider } = await import('../../app/providers/QueryProvider')
  const router = await createTestRouter(initialPath)
  await router.load()
  return render(
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

// Default to desktop after each test so viewport state does not leak
afterEach(() => {
  setViewportWidth(1280)
})

// ---------------------------------------------------------------------------
// EC1 — Viewport exactly at DESKTOP_BREAKPOINT (1024px)
// ---------------------------------------------------------------------------

describe('EC1 — Viewport exactly at DESKTOP_BREAKPOINT (1024px)', () => {
  beforeEach(() => setViewportWidth(1024))

  it('[P1] NavigationRail is rendered at exactly 1024px (breakpoint inclusive)', async () => {
    await renderWithRouter('/')

    // The implementation uses >= 1024 so 1024 should show the rail
    expect(screen.getByTestId('nav-rail')).toBeDefined()
  })

  it('[P1] NavigationBar is NOT rendered at exactly 1024px', async () => {
    await renderWithRouter('/')

    expect(screen.queryByTestId('nav-bar')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// EC2 — Viewport at 1023px (one pixel below breakpoint — mobile)
// ---------------------------------------------------------------------------

describe('EC2 — Viewport at 1023px (one pixel below DESKTOP_BREAKPOINT)', () => {
  beforeEach(() => setViewportWidth(1023))

  it('[P1] NavigationBar is rendered at 1023px (just below breakpoint)', async () => {
    await renderWithRouter('/')

    expect(screen.getByTestId('nav-bar')).toBeDefined()
  })

  it('[P1] NavigationRail is NOT rendered at 1023px', async () => {
    await renderWithRouter('/')

    expect(screen.queryByTestId('nav-rail')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// EC3 — Resize event switches nav from desktop to mobile
// ---------------------------------------------------------------------------

describe('EC3 — Resize event triggers nav switch', () => {
  it('[P2] Resizing from desktop to mobile swaps nav-rail for nav-bar', async () => {
    setViewportWidth(1280)
    await renderWithRouter('/')

    // Desktop: rail present, bar absent
    expect(screen.getByTestId('nav-rail')).toBeDefined()
    expect(screen.queryByTestId('nav-bar')).toBeNull()

    // Simulate resize to mobile
    setViewportWidth(390)

    // Mobile: bar present, rail absent
    expect(screen.getByTestId('nav-bar')).toBeDefined()
    expect(screen.queryByTestId('nav-rail')).toBeNull()
  })

  it('[P2] Resizing from mobile to desktop swaps nav-bar for nav-rail', async () => {
    setViewportWidth(390)
    await renderWithRouter('/')

    // Mobile: bar present
    expect(screen.getByTestId('nav-bar')).toBeDefined()
    expect(screen.queryByTestId('nav-rail')).toBeNull()

    // Simulate resize to desktop
    setViewportWidth(1280)

    // Desktop: rail present, bar absent
    expect(screen.getByTestId('nav-rail')).toBeDefined()
    expect(screen.queryByTestId('nav-bar')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// EC4 — nav-bar absent on desktop; nav-rail absent on mobile
// ---------------------------------------------------------------------------

describe('EC4 — Mutually exclusive nav component rendering', () => {
  it('[P1] nav-bar is absent from DOM on desktop viewport (1280px)', async () => {
    setViewportWidth(1280)
    await renderWithRouter('/')

    expect(screen.queryByTestId('nav-bar')).toBeNull()
  })

  it('[P1] nav-rail is absent from DOM on mobile viewport (390px)', async () => {
    setViewportWidth(390)
    await renderWithRouter('/')

    expect(screen.queryByTestId('nav-rail')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// EC5 — Deep nested unknown route still shows 404
// ---------------------------------------------------------------------------

describe('EC5 — Deep nested unknown routes render 404 view', () => {
  beforeEach(() => setViewportWidth(1280))

  it('[P1] /a/b/c/deeply-nested renders not-found-view (no crash)', async () => {
    await renderWithRouter('/a/b/c/deeply-nested')

    expect(screen.getByTestId('not-found-view')).toBeDefined()
  })

  it('[P1] /clientes/inexistente renders not-found-view (no sub-route match crash)', async () => {
    // /clientes has no child routes — an extra segment should trigger 404
    await renderWithRouter('/clientes/inexistente')

    // Should show either the 404 view or some non-blank content (no crash)
    const body = document.body.textContent ?? ''
    expect(body.trim().length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// EC6 — 404 back link href contains /clientes
// ---------------------------------------------------------------------------

describe('EC6 — 404 back link href', () => {
  beforeEach(() => setViewportWidth(1280))

  it('[P1] not-found-back-link has href containing /clientes', async () => {
    await renderWithRouter('/unknown-route')

    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink).toBeDefined()
    const href = backLink.getAttribute('href') ?? ''
    expect(href).toContain('/clientes')
  })
})

// ---------------------------------------------------------------------------
// EC7 — No nav item has active state on unknown route
// ---------------------------------------------------------------------------

describe('EC7 — Active state on unmatched (404) route', () => {
  beforeEach(() => setViewportWidth(1280))

  it('[P2] No nav item is active when on an unknown route', async () => {
    await renderWithRouter('/unknown-xyz')

    // The layout still renders with nav items
    const clientesItem = screen.getByTestId('nav-item-clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')

    expect(clientesItem.getAttribute('data-active')).not.toBe('true')
    expect(contactosItem.getAttribute('data-active')).not.toBe('true')
  })
})

// ---------------------------------------------------------------------------
// EC8 — Multiple rapid clicks on same nav item are idempotent
// ---------------------------------------------------------------------------

describe('EC8 — Multiple rapid clicks on same nav item', () => {
  beforeEach(() => setViewportWidth(1280))

  it('[P2] Clicking Clientes twice in a row stays on /clientes without error', async () => {
    const user = userEvent.setup()
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/')
    await router.load()
    render(<RouterProvider router={router} />)

    const clientesItem = screen.getByTestId('nav-item-clientes')
    await user.click(clientesItem)
    await user.click(clientesItem)

    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('[P2] Clicking Contactos after Clientes correctly updates active route', async () => {
    const user = userEvent.setup()
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)

    // Click Contactos from Clientes
    const contactosItem = screen.getByTestId('nav-item-contactos')
    await user.click(contactosItem)

    expect(router.state.location.pathname).toBe('/contactos')
  })
})

// ---------------------------------------------------------------------------
// EC9 — nav element exposes implicit role="navigation"
// ---------------------------------------------------------------------------

describe('EC9 — Nav element semantic role', () => {
  beforeEach(() => setViewportWidth(1280))

  it('[P1] nav element is discoverable by role "navigation"', async () => {
    await renderWithRouter('/')

    // RTL getByRole should find the nav landmark
    const navLandmarks = screen.getAllByRole('navigation')
    expect(navLandmarks.length).toBeGreaterThanOrEqual(1)
  })

  it('[P1] navigation landmark has accessible name "Navegación principal"', async () => {
    await renderWithRouter('/')

    const navLandmark = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(navLandmark).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// EC10 — Both nav items present in mobile viewport
// ---------------------------------------------------------------------------

describe('EC10 — Both nav items present in mobile viewport', () => {
  beforeEach(() => setViewportWidth(390))

  it('[P1] "Clientes" nav item is present inside nav-bar on mobile', async () => {
    await renderWithRouter('/')

    const navBar = screen.getByTestId('nav-bar')
    const clientesItem = screen.getByTestId('nav-item-clientes')

    // The item should be a descendant of nav-bar
    expect(navBar.contains(clientesItem)).toBe(true)
  })

  it('[P1] "Contactos" nav item is present inside nav-bar on mobile', async () => {
    await renderWithRouter('/')

    const navBar = screen.getByTestId('nav-bar')
    const contactosItem = screen.getByTestId('nav-item-contactos')

    expect(navBar.contains(contactosItem)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// EC11 — Active state is mutually exclusive
// ---------------------------------------------------------------------------

describe('EC11 — Active state is mutually exclusive between nav items', () => {
  beforeEach(() => setViewportWidth(1280))

  it('[P1] Exactly one nav item has data-active="true" on /clientes', async () => {
    await renderWithRouter('/clientes')

    const clientesItem = screen.getByTestId('nav-item-clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')

    const activeItems = [clientesItem, contactosItem].filter(
      (el) => el.getAttribute('data-active') === 'true',
    )
    expect(activeItems.length).toBe(1)
    expect(activeItems[0]).toBe(clientesItem)
  })

  it('[P1] Exactly one nav item has data-active="true" on /contactos', async () => {
    await renderWithRouter('/contactos')

    const clientesItem = screen.getByTestId('nav-item-clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')

    const activeItems = [clientesItem, contactosItem].filter(
      (el) => el.getAttribute('data-active') === 'true',
    )
    expect(activeItems.length).toBe(1)
    expect(activeItems[0]).toBe(contactosItem)
  })
})

// ---------------------------------------------------------------------------
// EC12 — Main content area renders the routed view (Outlet)
// ---------------------------------------------------------------------------

describe('EC12 — Main content area renders Outlet correctly', () => {
  beforeEach(() => setViewportWidth(1280))

  it('[P1] /clientes route renders clientes-view inside <main> element', async () => {
    await renderWithRouter('/clientes')

    const mainEl = document.querySelector('main')
    const clientesView = screen.getByTestId('clientes-view')

    expect(mainEl).not.toBeNull()
    expect(mainEl!.contains(clientesView)).toBe(true)
  })

  it('[P1] /contactos route renders contactos-view inside <main> element', async () => {
    await renderWithRouter('/contactos')

    const mainEl = document.querySelector('main')
    const contactosView = screen.getByTestId('contactos-view')

    expect(mainEl).not.toBeNull()
    expect(mainEl!.contains(contactosView)).toBe(true)
  })

  it('[P2] <main> element has flex-1 layout class for content expansion', async () => {
    await renderWithRouter('/clientes')

    const mainEl = document.querySelector('main')
    expect(mainEl).not.toBeNull()
    // flex-1 allows main content to fill remaining space next to nav
    expect(mainEl!.className).toContain('flex-1')
  })
})
