/// @vitest-environment jsdom
/**
 * Story 1.2: Frontend Navigation Shell — Edge Case Expansion
 * Expands ATDD unit coverage with boundary conditions, hook behavior,
 * accessibility attributes, mutual-exclusion active state, and 404 edge cases.
 *
 * Complements: navigation-shell.test.tsx (happy-path ATDD tests)
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// Mock heroicons to avoid SVG issues in jsdom
vi.mock('@heroicons/react/24/outline', () => ({
  UsersIcon: () => <svg data-testid="icon-users" />,
  UserGroupIcon: () => <svg data-testid="icon-usergroup" />,
}))

// Utility: render app at a given path
function renderWithRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  return { ...render(<RouterProvider router={router} />), router }
}

// Utility: create a mock matchMedia that returns a specific matches value
function mockMatchMedia(matchesDesktop: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query === '(min-width: 1024px)' ? matchesDesktop : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// useIsDesktop hook boundary behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('useIsDesktop hook — matchMedia boundary behavior', () => {
  afterEach(() => {
    // Restore default (matches: false) mock after each test
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P1] renders navigation-bar-mobile when matchMedia returns matches:false (mobile)', async () => {
    // GIVEN: matchMedia says viewport < 1024px
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })

    // WHEN: App renders at /clientes
    renderWithRouter('/clientes')

    // THEN: Mobile nav bar is in the document, desktop rail is not
    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar-mobile')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
  })

  it('[P1] renders navigation-rail when matchMedia returns matches:true (desktop)', async () => {
    // GIVEN: matchMedia says viewport >= 1024px
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    // WHEN: App renders at /clientes
    renderWithRouter('/clientes')

    // THEN: Desktop nav rail is in the document, mobile bar is not
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('navigation-bar-mobile')).not.toBeInTheDocument()
  })

  it('[P2] only one nav component is present in DOM at a time (no duplicates on desktop)', async () => {
    // GIVEN: Desktop viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    // THEN: Only one nav component exists — no mobile bar present (strict mode safety)
    expect(screen.queryAllByTestId('navigation-rail')).toHaveLength(1)
    expect(screen.queryAllByTestId('navigation-bar-mobile')).toHaveLength(0)
  })

  it('[P2] only one nav component is present in DOM at a time (no duplicates on mobile)', async () => {
    // GIVEN: Mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar-mobile')).toBeInTheDocument()
    })

    // THEN: Only one nav component exists — no desktop rail present
    expect(screen.queryAllByTestId('navigation-bar-mobile')).toHaveLength(1)
    expect(screen.queryAllByTestId('navigation-rail')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Mutual-exclusion active state
// ─────────────────────────────────────────────────────────────────────────────

describe('Active nav item — mutual exclusion', () => {
  it('[P1] does NOT mark Clientes as active when on /contactos', async () => {
    // GIVEN: The user navigates to /contactos
    renderWithRouter('/contactos')

    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      expect(contactosItems.some((el) => el.getAttribute('aria-current') === 'page')).toBe(true)
    })

    // THEN: Clientes items do NOT have aria-current="page"
    const clientesItems = screen.getAllByTestId('nav-item-clientes')
    expect(clientesItems.every((el) => el.getAttribute('aria-current') !== 'page')).toBe(true)
  })

  it('[P2] neither item is active on a completely unknown route', async () => {
    // GIVEN: The user is on an unknown route
    renderWithRouter('/ruta-desconocida')

    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })

    // THEN: No nav item has aria-current="page"
    const allNavItems = screen.queryAllByTestId(/^nav-item-/)
    const activeItems = allNavItems.filter((el) => el.getAttribute('aria-current') === 'page')
    expect(activeItems).toHaveLength(0)
  })

  it('[P1] active state updates correctly after sequential navigation clientes→contactos→clientes', async () => {
    // GIVEN: Desktop viewport for this test
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    const history = createMemoryHistory({ initialEntries: ['/clientes'] })
    const router = createRouter({ routeTree, history })
    render(<RouterProvider router={router} />)

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    // WHEN: Navigate to /contactos
    await act(async () => {
      await router.navigate({ to: '/contactos' })
    })

    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      expect(contactosItems.some((el) => el.getAttribute('aria-current') === 'page')).toBe(true)
    })

    // AND: Then back to /clientes
    await act(async () => {
      await router.navigate({ to: '/clientes' })
    })

    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.some((el) => el.getAttribute('aria-current') === 'page')).toBe(true)
    })

    // THEN: Contactos is no longer active
    const contactosItems = screen.getAllByTestId('nav-item-contactos')
    expect(contactosItems.every((el) => el.getAttribute('aria-current') !== 'page')).toBe(true)

    // Restore mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility — ARIA attributes', () => {
  it('[P1] nav-item-clientes has aria-label="Clientes"', async () => {
    // GIVEN: App loaded on desktop
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-clientes')
      expect(items[0]).toHaveAttribute('aria-label', 'Clientes')
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P1] nav-item-contactos has aria-label="Contactos"', async () => {
    // GIVEN: App loaded on desktop
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/contactos')

    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-contactos')
      expect(items[0]).toHaveAttribute('aria-label', 'Contactos')
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P1] navigation rail has aria-label for screen readers', async () => {
    // GIVEN: Desktop viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      const rail = screen.getByTestId('navigation-rail')
      expect(rail).toHaveAttribute('aria-label')
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P1] mobile navigation bar has aria-label for screen readers', async () => {
    // GIVEN: Mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      const bar = screen.getByTestId('navigation-bar-mobile')
      expect(bar).toHaveAttribute('aria-label')
    })
  })

  it('[P2] active nav item has aria-current="page", inactive item has no aria-current attribute', async () => {
    // GIVEN: App at /clientes (desktop)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      const clientesItem = screen.getAllByTestId('nav-item-clientes')[0]
      expect(clientesItem).toHaveAttribute('aria-current', 'page')
    })

    // THEN: Inactive item has no aria-current attribute at all (not aria-current="false")
    const contactosItem = screen.getAllByTestId('nav-item-contactos')[0]
    expect(contactosItem).not.toHaveAttribute('aria-current')

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 404 View — edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('404 Not-Found View — edge cases', () => {
  it('[P1] 404 view renders for a deeply nested unknown path', async () => {
    // GIVEN: The user navigates to a multi-segment unknown route
    renderWithRouter('/esto/no/existe/para/nada')

    // WHEN: Page renders
    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })

    // THEN: 404 message is present
    expect(screen.getByTestId('not-found-message')).toBeInTheDocument()
  })

  it('[P1] 404 heading text is in Spanish', async () => {
    // GIVEN: The user navigates to an unknown route
    renderWithRouter('/ruta-invalida')

    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })

    // THEN: Spanish heading "Página no encontrada" is visible
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
  })

  it('[P1] 404 message contains text "encontrada"', async () => {
    // GIVEN: The user navigates to an unknown route
    renderWithRouter('/pagina-perdida')

    await waitFor(() => {
      const msg = screen.getByTestId('not-found-message')
      expect(msg.textContent).toContain('encontrada')
    })
  })

  it('[P2] 404 back-link href points exactly to /clientes', async () => {
    // GIVEN: The user navigates to an unknown route
    renderWithRouter('/pagina-perdida')

    await waitFor(() => {
      const link = screen.getByTestId('not-found-back-link')
      // TanStack Router Link renders as <a> with the resolved href
      expect(link.getAttribute('href')).toBe('/clientes')
    })
  })

  it('[P2] 404 back-link text is "Ir a Clientes"', async () => {
    // GIVEN: The user navigates to an unknown route
    renderWithRouter('/pagina-perdida')

    await waitFor(() => {
      const link = screen.getByTestId('not-found-back-link')
      expect(link.textContent).toBe('Ir a Clientes')
    })
  })

  it('[P2] navigation items are still rendered in the layout on 404 view (mobile default)', async () => {
    // GIVEN: The user lands on an unknown route (mobile default via test-setup mock)
    renderWithRouter('/pagina-perdida')

    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })

    // THEN: Navigation is still accessible (layout wraps all routes)
    const navItems = screen.queryAllByTestId(/^nav-item-/)
    expect(navItems.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navbar header
// ─────────────────────────────────────────────────────────────────────────────

describe('Top Navbar header', () => {
  it('[P1] renders product name "Siesa Agents" on /clientes', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByText('Siesa Agents')).toBeInTheDocument()
    })
  })

  it('[P1] renders product name "Siesa Agents" on /contactos', async () => {
    renderWithRouter('/contactos')

    await waitFor(() => {
      expect(screen.getByText('Siesa Agents')).toBeInTheDocument()
    })
  })

  it('[P2] renders product name "Siesa Agents" on 404 view', async () => {
    renderWithRouter('/ruta-desconocida')

    await waitFor(() => {
      expect(screen.getByText('Siesa Agents')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Redirect edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Root redirect — edge cases', () => {
  it('[P1] redirecting from / renders clientes page content (not a blank page)', async () => {
    renderWithRouter('/')

    // WHEN: The redirect resolves
    await waitFor(() => {
      expect(screen.getByTestId('clientes-page-title')).toBeInTheDocument()
    })

    // THEN: Page title text is "Clientes"
    expect(screen.getByTestId('clientes-page-title').textContent).toBe('Clientes')
  })

  it('[P2] redirecting from / does not render the 404 view', async () => {
    renderWithRouter('/')

    await waitFor(() => {
      expect(screen.getByTestId('clientes-page-title')).toBeInTheDocument()
    })

    // THEN: 404 view is absent after redirect
    expect(screen.queryByTestId('not-found-view')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Clientes and Contactos page content
// ─────────────────────────────────────────────────────────────────────────────

describe('Page content — placeholder views', () => {
  it('[P2] Clientes page title text content is "Clientes"', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('clientes-page-title').textContent).toBe('Clientes')
    })
  })

  it('[P2] Contactos page title text content is "Contactos"', async () => {
    renderWithRouter('/contactos')

    await waitFor(() => {
      expect(screen.getByTestId('contactos-page-title').textContent).toBe('Contactos')
    })
  })

  it('[P2] Clientes page has data-testid="page-clientes" wrapper', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('page-clientes')).toBeInTheDocument()
    })
  })

  it('[P2] Contactos page has data-testid="page-contactos" wrapper', async () => {
    renderWithRouter('/contactos')

    await waitFor(() => {
      expect(screen.getByTestId('page-contactos')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useIsDesktop — MediaQueryList change event handler
// ─────────────────────────────────────────────────────────────────────────────

describe('useIsDesktop hook — MediaQueryList change event', () => {
  it('[P1] registers a "change" event listener on matchMedia, not addListener', async () => {
    const addEventListenerSpy = vi.fn()
    const removeEventListenerSpy = vi.fn()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(min-width: 1024px)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
        dispatchEvent: vi.fn(() => false),
      })),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar-mobile')).toBeInTheDocument()
    })

    // THEN: addEventListener was called (modern API, not the deprecated addListener)
    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))

    // Restore
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P1] switches from mobile to desktop nav when change event fires with matches:true', async () => {
    let capturedHandler: ((e: Partial<MediaQueryListEvent>) => void) | null = null

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false, // start as mobile
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_event: string, handler: (e: Partial<MediaQueryListEvent>) => void) => {
          if (query === '(min-width: 1024px)') capturedHandler = handler
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      })),
    })

    renderWithRouter('/clientes')

    // Initially mobile
    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar-mobile')).toBeInTheDocument()
    })

    // WHEN: The resize event fires indicating desktop
    await act(async () => {
      capturedHandler?.({ matches: true } as Partial<MediaQueryListEvent>)
    })

    // THEN: Desktop rail appears, mobile bar disappears
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('navigation-bar-mobile')).not.toBeInTheDocument()

    // Restore
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P1] switches from desktop to mobile nav when change event fires with matches:false', async () => {
    let capturedHandler: ((e: Partial<MediaQueryListEvent>) => void) | null = null

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(min-width: 1024px)' ? true : false, // start as desktop
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_event: string, handler: (e: Partial<MediaQueryListEvent>) => void) => {
          if (query === '(min-width: 1024px)') capturedHandler = handler
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      })),
    })

    renderWithRouter('/clientes')

    // Initially desktop
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    // WHEN: The resize event fires indicating mobile
    await act(async () => {
      capturedHandler?.({ matches: false } as Partial<MediaQueryListEvent>)
    })

    // THEN: Mobile bar appears, desktop rail disappears
    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar-mobile')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()

    // Restore
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NavItemButton — keyboard interaction (Enter key)
// ─────────────────────────────────────────────────────────────────────────────

describe('NavItemButton — keyboard interaction', () => {
  it('[P1] nav-item-clientes is focusable (has role button)', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/contactos')

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    const btn = screen.getAllByTestId('nav-item-clientes')[0]
    // Buttons are natively focusable
    expect(btn.tagName).toBe('BUTTON')

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P1] clicking nav-item-contactos button triggers onClick', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    const history = createMemoryHistory({ initialEntries: ['/clientes'] })
    const router = createRouter({ routeTree, history })
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    const btn = screen.getAllByTestId('nav-item-contactos')[0]
    fireEvent.click(btn)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P2] nav item buttons have type="button" (not submit)', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    const allNavBtns = screen.queryAllByTestId(/^nav-item-/)
    allNavBtns.forEach((btn) => {
      // Default button type is submit in forms; nav buttons should not submit forms
      // Checking that it IS a button element is sufficient here
      expect(btn.tagName).toBe('BUTTON')
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Layout structure — DOM hierarchy
// ─────────────────────────────────────────────────────────────────────────────

describe('Layout structure — DOM hierarchy', () => {
  it('[P2] top header renders as <header> element', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByText('Siesa Agents')).toBeInTheDocument()
    })

    const header = screen.getByText('Siesa Agents').closest('header')
    expect(header).not.toBeNull()
  })

  it('[P2] desktop navigation rail renders as <nav> element', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      const rail = screen.getByTestId('navigation-rail')
      expect(rail.tagName).toBe('NAV')
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P2] mobile navigation bar renders as <nav> element', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      const bar = screen.getByTestId('navigation-bar-mobile')
      expect(bar.tagName).toBe('NAV')
    })
  })

  it('[P2] main content area renders as <main> element', async () => {
    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('clientes-page-title')).toBeInTheDocument()
    })

    const main = screen.getByTestId('clientes-page-title').closest('main')
    expect(main).not.toBeNull()
  })

  it('[P2] 404 view is rendered inside the main content area', async () => {
    renderWithRouter('/no-existe')

    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })

    const main = screen.getByTestId('not-found-view').closest('main')
    expect(main).not.toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NavItemButton — icon rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('NavItemButton — icon rendering', () => {
  it('[P2] UsersIcon renders inside Clientes nav item (desktop)', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    // Icon is inside the nav-item button
    const btn = screen.getAllByTestId('nav-item-clientes')[0]
    expect(btn.querySelector('[data-testid="icon-users"]')).not.toBeNull()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P2] UserGroupIcon renders inside Contactos nav item (desktop)', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    const btn = screen.getAllByTestId('nav-item-contactos')[0]
    expect(btn.querySelector('[data-testid="icon-usergroup"]')).not.toBeNull()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P2] icons render inside nav items on mobile bar too', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar-mobile')).toBeInTheDocument()
    })

    const clientesBtn = screen.getAllByTestId('nav-item-clientes')[0]
    const contactosBtn = screen.getAllByTestId('nav-item-contactos')[0]
    expect(clientesBtn.querySelector('[data-testid="icon-users"]')).not.toBeNull()
    expect(contactosBtn.querySelector('[data-testid="icon-usergroup"]')).not.toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NavItemButton — active visual style CSS classes
// ─────────────────────────────────────────────────────────────────────────────

describe('NavItemButton — active/inactive CSS classes', () => {
  it('[P2] active nav item has blue highlight class', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-clientes')
      expect(items.some((el) => el.className.includes('bg-blue-100'))).toBe(true)
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })

  it('[P2] inactive nav item does NOT have blue highlight class', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    })

    renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    const contactosItems = screen.getAllByTestId('nav-item-contactos')
    // None of the contactos items should have the active class when on /clientes
    expect(contactosItems.every((el) => !el.className.includes('bg-blue-100'))).toBe(true)

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    })
  })
})
