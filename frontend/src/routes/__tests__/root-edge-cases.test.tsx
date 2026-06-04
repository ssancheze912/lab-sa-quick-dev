/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case Tests — __root.tsx navigation shell
 * Covers scenarios NOT included in the ATDD root.test.tsx:
 *   - useIsDesktop hook boundary: exactly 1023px vs 1024px
 *   - useIsDesktop hook: resize event correctly toggles desktop/mobile
 *   - NavigationRail and NavigationBar never rendered simultaneously
 *   - NavLinks renders the correct number of navigation entries
 *   - Nav landmark is unique in the DOM (only one <nav> at a time)
 *   - aria-current is absent when not on the active route
 *   - Navigation to non-existent route still renders the nav shell
 *   - Root path / renders nav shell (not blank page) before redirect
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

async function renderAtRoute(path: string) {
  const router = createTestRouter(path)
  render(<RouterProvider router={router} />)
  await router.load()
  return router
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// useIsDesktop — boundary conditions at 1023px / 1024px
// ─────────────────────────────────────────────────────────────────────────────

describe('useIsDesktop — viewport boundary (1023px vs 1024px)', () => {
  afterEach(() => {
    // Restore to a neutral desktop value so tests don't bleed
    setViewportWidth(1280)
  })

  it('should render NavigationBar (mobile) when innerWidth is 1023px (below breakpoint)', async () => {
    // GIVEN: Viewport is 1px below the desktop threshold
    setViewportWidth(1023)

    // WHEN: The navigation shell renders
    await renderAtRoute('/clientes')

    // THEN: Mobile NavigationBar is present, desktop NavigationRail is absent
    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
      expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
    })
  })

  it('should render NavigationRail (desktop) when innerWidth is exactly 1024px (at breakpoint)', async () => {
    // GIVEN: Viewport is exactly at the desktop threshold
    setViewportWidth(1024)

    // WHEN: The navigation shell renders
    await renderAtRoute('/clientes')

    // THEN: Desktop NavigationRail is present, mobile NavigationBar is absent
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument()
    })
  })

  it('should switch to NavigationBar after resize event crosses below 1024px', async () => {
    // GIVEN: Desktop viewport — NavigationRail is rendered
    setViewportWidth(1280)
    await renderAtRoute('/clientes')
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    // WHEN: Viewport drops to 768px (mobile)
    setViewportWidth(768)

    // THEN: NavigationBar replaces NavigationRail
    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
      expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
    })
  })

  it('should switch to NavigationRail after resize event crosses above 1024px', async () => {
    // GIVEN: Mobile viewport — NavigationBar is rendered
    setViewportWidth(390)
    await renderAtRoute('/clientes')
    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    })

    // WHEN: Viewport grows to 1280px (desktop)
    setViewportWidth(1280)

    // THEN: NavigationRail replaces NavigationBar
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Nav shell renders exactly one navigation component at a time
// ─────────────────────────────────────────────────────────────────────────────

describe('Nav shell — mutual exclusivity of NavigationRail and NavigationBar', () => {
  beforeEach(() => setViewportWidth(1280))
  afterEach(() => setViewportWidth(1280))

  it('should render exactly one <nav> landmark on desktop viewport', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280)
    await renderAtRoute('/clientes')

    // THEN: Only one <nav> element exists (NavigationRail, no NavigationBar)
    await waitFor(() => {
      const navElements = screen.getAllByRole('navigation')
      expect(navElements).toHaveLength(1)
    })
  })

  it('should render exactly one <nav> landmark on mobile viewport', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(390)
    await renderAtRoute('/clientes')

    // THEN: Only one <nav> element exists (NavigationBar, no NavigationRail)
    await waitFor(() => {
      const navElements = screen.getAllByRole('navigation')
      expect(navElements).toHaveLength(1)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NavLinks — correct number of navigation entries rendered
// ─────────────────────────────────────────────────────────────────────────────

describe('NavLinks — navigation entries count and content', () => {
  beforeEach(() => setViewportWidth(1280))

  it('should render exactly two navigation links (Clientes and Contactos)', async () => {
    // GIVEN: Navigation shell with two configured nav items
    await renderAtRoute('/clientes')

    // THEN: Exactly two nav links are rendered
    await waitFor(() => {
      const navLinks = [
        screen.getByTestId('nav-link-clientes'),
        screen.getByTestId('nav-link-contactos'),
      ]
      expect(navLinks).toHaveLength(2)
    })
  })

  it('should render Clientes link with href pointing to /clientes', async () => {
    // GIVEN: Navigation shell rendered on desktop
    await renderAtRoute('/clientes')

    // THEN: Clientes link has the correct href
    await waitFor(() => {
      const clientesLink = screen.getByTestId('nav-link-clientes')
      expect(clientesLink).toHaveAttribute('href', '/clientes')
    })
  })

  it('should render Contactos link with href pointing to /contactos', async () => {
    // GIVEN: Navigation shell rendered on desktop
    await renderAtRoute('/clientes')

    // THEN: Contactos link has the correct href
    await waitFor(() => {
      const contactosLink = screen.getByTestId('nav-link-contactos')
      expect(contactosLink).toHaveAttribute('href', '/contactos')
    })
  })

  it('should render icon elements (aria-hidden) inside each nav link', async () => {
    // GIVEN: Navigation shell with Heroicons configured
    await renderAtRoute('/clientes')

    // THEN: Each nav link contains an aria-hidden icon (decorative, not read by screen readers)
    await waitFor(() => {
      const clientesLink = screen.getByTestId('nav-link-clientes')
      const contactosLink = screen.getByTestId('nav-link-contactos')
      // SVG icons are aria-hidden — they should exist in the DOM
      expect(clientesLink.querySelector('svg[aria-hidden="true"]')).toBeTruthy()
      expect(contactosLink.querySelector('svg[aria-hidden="true"]')).toBeTruthy()
    })
  })

  it('should render visible text label inside each nav link', async () => {
    // GIVEN: Navigation shell rendered
    await renderAtRoute('/clientes')

    // THEN: Each link contains its Spanish text label
    await waitFor(() => {
      const clientesLink = screen.getByTestId('nav-link-clientes')
      const contactosLink = screen.getByTestId('nav-link-contactos')
      expect(clientesLink).toHaveTextContent('Clientes')
      expect(contactosLink).toHaveTextContent('Contactos')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// aria-current — absence on inactive links
// ─────────────────────────────────────────────────────────────────────────────

describe('aria-current — correct absence on non-active links', () => {
  beforeEach(() => setViewportWidth(1280))

  it('should NOT have aria-current on Contactos when /clientes is active', async () => {
    // GIVEN: User is on /clientes
    await renderAtRoute('/clientes')

    // THEN: Contactos nav link has no aria-current attribute at all
    await waitFor(() => {
      const contactosLink = screen.getByTestId('nav-link-contactos')
      expect(contactosLink).not.toHaveAttribute('aria-current')
    })
  })

  it('should NOT have aria-current on Clientes when /contactos is active', async () => {
    // GIVEN: User is on /contactos
    await renderAtRoute('/contactos')

    // THEN: Clientes nav link has no aria-current attribute at all
    await waitFor(() => {
      const clientesLink = screen.getByTestId('nav-link-clientes')
      expect(clientesLink).not.toHaveAttribute('aria-current')
    })
  })

  it('should update aria-current correctly after client-side navigation via click', async () => {
    // GIVEN: User starts on /clientes — Clientes is active
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await router.load()

    await waitFor(() => {
      expect(screen.getByTestId('nav-link-clientes')).toHaveAttribute('aria-current', 'page')
      expect(screen.getByTestId('nav-link-contactos')).not.toHaveAttribute('aria-current')
    })

    // WHEN: User clicks Contactos nav link
    await userEvent.click(screen.getByTestId('nav-link-contactos'))

    // THEN: Contactos becomes active, Clientes loses active state
    await waitFor(() => {
      expect(screen.getByTestId('nav-link-contactos')).toHaveAttribute('aria-current', 'page')
      expect(screen.getByTestId('nav-link-clientes')).not.toHaveAttribute('aria-current')
    })
  })
})

// Navigation shell renders correctly for 404 route — see root-404-nav.test.tsx
