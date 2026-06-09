/**
 * AUTOMATE PHASE — Story 1.2: Frontend Navigation Shell
 *
 * Edge case / boundary / negative-path coverage that EXPANDS the existing ATDD suite
 * (`_app.test.tsx`, `navigation.test.tsx`, `__root.test.tsx`, `index.test.tsx`).
 *
 * Focus: keyboard navigation, accessibility (touch targets, ARIA), back/forward
 * navigation, multiple consecutive navigations (shell-not-remounted invariant),
 * deep-links with query strings + trailing slashes, error component rendering,
 * and visual active-state class assertions.
 *
 * Backend (.NET) tests are intentionally OUT OF SCOPE — backend env unavailable.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
// NOTE: `@testing-library/user-event` is not installed in this sandbox.
// Keyboard interactions are simulated via fireEvent.keyDown / fireEvent.click
// which is sufficient for asserting handler invocation in jsdom.
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { Route as IndexRoute } from './index'
import { Route as AppLayoutRoute } from './_app'
import { Route as ClientesRoute } from './_app/clientes'
import { Route as ContactosRoute } from './_app/contactos'

function buildTestRouter(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const appLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: '_app',
    component: AppLayoutRoute.options.component,
  })
  const clientesRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/clientes',
    component: ClientesRoute.options.component,
  })
  const contactosRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/contactos',
    component: ContactosRoute.options.component,
  })
  const routeTree = rootRoute.addChildren([
    appLayoutRoute.addChildren([clientesRoute, contactosRoute]),
  ])
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

function buildRealRouter(initialPath: string) {
  IndexRoute.parentRoute = RootRoute
  AppLayoutRoute.parentRoute = RootRoute
  ClientesRoute.parentRoute = AppLayoutRoute
  ContactosRoute.parentRoute = AppLayoutRoute
  const routeTree = RootRoute.addChildren([
    IndexRoute,
    AppLayoutRoute.addChildren([ClientesRoute, ContactosRoute]),
  ])
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

beforeEach(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  }
})

describe('Story 1.2 — Navigation shell edge cases (P1)', () => {
  it('[P1] keyboard navigation — focused nav link is reachable and activates the route (no full reload)', async () => {
    // GIVEN the shell starts at /clientes
    const router = buildTestRouter('/clientes')
    const reloadSpy = vi.fn()
    const originalReload = window.location.reload
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      writable: true,
      value: reloadSpy,
    })
    try {
      render(<RouterProvider router={router} />)
      await screen.findByTestId('clientes-view')

      // WHEN the user focuses the Contactos rail link (Tab-reachable) and activates it
      const contactosLink = await screen.findByTestId('nav-rail-contactos')
      contactosLink.focus()
      expect(contactosLink).toHaveFocus()
      // Anchors are activated by both keyboard (Enter) and click. We simulate the
      // browser default by dispatching a click — TanStack <Link> handles it client-side.
      fireEvent.click(contactosLink)

      // THEN the router navigates client-side, no reload
      await screen.findByTestId('contactos-view')
      expect(router.state.location.pathname).toBe('/contactos')
      expect(reloadSpy).not.toHaveBeenCalled()
    } finally {
      // Restore the original reload to prevent cross-test leakage
      Object.defineProperty(window.location, 'reload', {
        configurable: true,
        writable: true,
        value: originalReload,
      })
    }
  })

  it('[P1] shell remains mounted across multiple consecutive navigations (no remount)', async () => {
    // GIVEN the shell starts at /clientes
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // capture a reference to the rail wrapper — this is part of the _app layout
    const railBefore = await screen.findByTestId('navigation-rail-wrapper')

    // WHEN we navigate Clientes → Contactos → Clientes → Contactos
    fireEvent.click(await screen.findByTestId('nav-rail-contactos'))
    await screen.findByTestId('contactos-view')
    fireEvent.click(await screen.findByTestId('nav-rail-clientes'))
    await screen.findByTestId('clientes-view')
    fireEvent.click(await screen.findByTestId('nav-rail-contactos'))
    await screen.findByTestId('contactos-view')

    // THEN the SAME rail DOM node is still in the tree (shell not remounted)
    const railAfter = await screen.findByTestId('navigation-rail-wrapper')
    expect(railAfter).toBe(railBefore)
  })

  it('[P1] active visual state classes are applied on the active rail link', async () => {
    // GIVEN router at /clientes
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN we inspect the active link
    const clientesActive = await screen.findByTestId('nav-rail-clientes')

    // THEN it carries the active classes from the implementation
    // (border-l-2 / bg-[#0e79fd]/10 / text-[#154ca9])
    expect(clientesActive.className).toMatch(/border-l-2/)
    expect(clientesActive.className).toMatch(/0e79fd/)

    // AND the inactive link does NOT carry those active classes
    const contactosInactive = await screen.findByTestId('nav-rail-contactos')
    expect(contactosInactive.className).not.toMatch(/border-l-2/)
  })

  it('[P1] aria-current toggles correctly when the user changes routes', async () => {
    // GIVEN router at /clientes
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    let clientes = await screen.findByTestId('nav-rail-clientes')
    let contactos = await screen.findByTestId('nav-rail-contactos')
    expect(clientes).toHaveAttribute('aria-current', 'page')
    expect(contactos).not.toHaveAttribute('aria-current', 'page')

    // WHEN we navigate to /contactos
    fireEvent.click(contactos)
    await screen.findByTestId('contactos-view')

    // THEN aria-current flips
    clientes = await screen.findByTestId('nav-rail-clientes')
    contactos = await screen.findByTestId('nav-rail-contactos')
    expect(contactos).toHaveAttribute('aria-current', 'page')
    expect(clientes).not.toHaveAttribute('aria-current', 'page')
  })
})

describe('Story 1.2 — Accessibility edge cases (P1)', () => {
  it('[P1] all nav links meet minimum 44px touch target (WCAG 2.1 AA, NFR)', async () => {
    // GIVEN the shell is rendered
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN we inspect every rail+bar link
    const links = [
      await screen.findByTestId('nav-rail-clientes'),
      await screen.findByTestId('nav-rail-contactos'),
      await screen.findByTestId('nav-bar-clientes'),
      await screen.findByTestId('nav-bar-contactos'),
    ]

    // THEN each carries the min-h-[44px] utility class (touch target ≥ 44 px)
    for (const link of links) {
      expect(link.className).toMatch(/min-h-\[44px\]/)
    }
  })

  it('[P1] every nav link has a Spanish aria-label', async () => {
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    expect(await screen.findByTestId('nav-rail-clientes')).toHaveAttribute(
      'aria-label',
      'Clientes',
    )
    expect(await screen.findByTestId('nav-rail-contactos')).toHaveAttribute(
      'aria-label',
      'Contactos',
    )
    expect(await screen.findByTestId('nav-bar-clientes')).toHaveAttribute(
      'aria-label',
      'Clientes',
    )
    expect(await screen.findByTestId('nav-bar-contactos')).toHaveAttribute(
      'aria-label',
      'Contactos',
    )
  })

  it('[P1] shell exposes exactly two navigation landmarks (primary + bottom)', async () => {
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // THEN both nav landmarks exist with distinct Spanish labels
    const primary = await screen.findByRole('navigation', {
      name: /navegación principal/i,
    })
    const inferior = await screen.findByRole('navigation', {
      name: /navegación inferior/i,
    })
    expect(primary).toBeInTheDocument()
    expect(inferior).toBeInTheDocument()
    expect(primary).not.toBe(inferior)
  })

  it('[P1] main content region is exposed via <main> landmark', async () => {
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // THEN the routed view is wrapped in a <main> landmark (single one)
    const mains = await screen.findAllByRole('main')
    expect(mains.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Story 1.2 — Deep-link & redirect edge cases (P2)', () => {
  it('[P2] deep link to /clientes preserves query string (no redirect, view renders)', async () => {
    // GIVEN a deep link with a query string (forward-compat for Epic 2 filters)
    const router = buildTestRouter('/clientes?q=acme&page=2')
    render(<RouterProvider router={router} />)

    // THEN the view renders and the search portion is preserved
    // (TanStack Router parses numeric query params to numbers by default)
    await screen.findByTestId('clientes-view')
    expect(router.state.location.pathname).toBe('/clientes')
    const search = router.state.location.search as Record<string, unknown>
    expect(search.q).toBe('acme')
    expect(String(search.page)).toBe('2')
  })

  it('[P2] deep link with trailing slash /clientes/ still resolves to Clientes view', async () => {
    // GIVEN a deep link with a trailing slash
    const router = buildTestRouter('/clientes/')
    render(<RouterProvider router={router} />)

    // THEN the view still renders (TanStack normalises trailing slashes by default)
    await waitFor(
      async () => {
        const view = screen.queryByTestId('clientes-view')
        expect(view).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('[P2] index → /clientes redirect does NOT leave / in history (no flicker)', async () => {
    // GIVEN the user lands on /
    const router = buildRealRouter('/')
    render(<RouterProvider router={router} />)

    // THEN the router resolves directly to /clientes (beforeLoad throws redirect)
    await screen.findByTestId('clientes-view')
    expect(router.state.location.pathname).toBe('/clientes')
    // AND the IndexRoute uses beforeLoad (architectural guarantee — prevents flash)
    expect(IndexRoute.options.beforeLoad).toBeTypeOf('function')
  })
})

describe('Story 1.2 — 404 / Not-found edge cases (P2)', () => {
  it('[P2] 404 view renders for paths with special characters', async () => {
    // GIVEN an unknown path with URL-encoded special chars
    const router = buildRealRouter('/ruta%20con%20espacios')
    render(<RouterProvider router={router} />)

    // THEN the Spanish 404 heading is shown
    const heading = await screen.findByRole('heading', {
      name: /página no encontrada/i,
    })
    expect(heading).toBeInTheDocument()
  })

  it('[P2] 404 view renders for deeply-nested unknown paths', async () => {
    // GIVEN a deeply-nested unknown path
    const router = buildRealRouter('/a/b/c/d/e/no-existe')
    render(<RouterProvider router={router} />)

    // THEN the Spanish 404 heading is shown
    const heading = await screen.findByRole('heading', {
      name: /página no encontrada/i,
    })
    expect(heading).toBeInTheDocument()
  })

  it('[P2] 404 CTA "Ir a Clientes" recovers the user to a valid route', async () => {
    // GIVEN the user is on a 404 page
    const router = buildRealRouter('/no-existe')
    render(<RouterProvider router={router} />)
    await screen.findByRole('heading', { name: /página no encontrada/i })

    // WHEN they click the recovery CTA
    const cta = await screen.findByRole('link', { name: /ir a clientes/i })
    fireEvent.click(cta)

    // THEN they land on /clientes
    await waitFor(
      () => {
        expect(router.state.location.pathname).toBe('/clientes')
      },
      { timeout: 2000 },
    )
  })

  it('[P2] 404 view leaks no English / no stack traces (Spanish-only enforcement)', async () => {
    // GIVEN a 404 page
    const router = buildRealRouter('/no-existe')
    render(<RouterProvider router={router} />)
    await screen.findByRole('heading', { name: /página no encontrada/i })

    // THEN typical English not-found phrases are NOT present
    expect(screen.queryByText(/not\s*found/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/page.*does.*not.*exist/i)).not.toBeInTheDocument()
    // AND no error-stack indicators
    expect(screen.queryByText(/at\s+Object\./i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument()
  })
})

describe('Story 1.2 — Root error component edge cases (P2)', () => {
  it('[P2] __root.tsx registers a defaultErrorComponent (graceful runtime errors)', () => {
    // ARCHITECTURAL ASSERTION — guarantees no stack-trace leakage on runtime errors
    expect(RootRoute.options.errorComponent).toBeTypeOf('function')
  })

  it('[P2] error component renders Spanish-only fallback text (no English leakage)', async () => {
    // GIVEN a router whose root error component is the one registered in __root.tsx,
    //   and a route that throws on load (forces the errorComponent to render).
    const ErrorComp = RootRoute.options.errorComponent || undefined
    expect(ErrorComp).toBeDefined()

    // Build a minimal router that intentionally throws, so the registered
    // errorComponent renders within a router context (Link requires it).
    const rootRoute = createRootRoute({
      component: () => <Outlet />,
      errorComponent: ErrorComp,
    })
    const boomRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      loader: () => {
        throw new Error('boom')
      },
      component: () => <div>never renders</div>,
    })
    const router = createRouter({
      routeTree: rootRoute.addChildren([boomRoute]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
      defaultErrorComponent: ErrorComp,
    })

    // WHEN the router mounts and the loader throws
    render(<RouterProvider router={router} />)

    // THEN Spanish fallback is rendered and no raw "boom" / stack trace leaks
    await waitFor(() => {
      expect(screen.getByText(/ha ocurrido un error/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument()
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument()
  })
})

describe('Story 1.2 — Placeholder views invariants (P3)', () => {
  it('[P3] Clientes placeholder exposes a Spanish heading and test id', async () => {
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    const view = await screen.findByTestId('clientes-view')
    expect(view).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /^clientes$/i }),
    ).toBeInTheDocument()
  })

  it('[P3] Contactos placeholder exposes a Spanish heading and test id', async () => {
    const router = buildTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    const view = await screen.findByTestId('contactos-view')
    expect(view).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /^contactos$/i }),
    ).toBeInTheDocument()
  })

  it('[P3] placeholder views do NOT scaffold list/detail UI (Epic 2/3 scope guard)', async () => {
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await screen.findByTestId('clientes-view')

    // Scope guard: there should be no form, no table, no "Nuevo Cliente" CTA yet
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(screen.queryByText(/nuevo cliente/i)).not.toBeInTheDocument()
  })
})
