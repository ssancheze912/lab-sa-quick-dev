/**
 * Story 1.2 — Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Responsive Component Tests — RED Phase (intentionally failing until implementation lands)
 *
 * Covers test-design IDs:
 *   - TC-E1-P2-01 — Desktop (≥1024px): NavigationRailGroup visible, mobile NavigationBar hidden (AC #1)
 *   - TC-E1-P2-02 — Mobile  (<1024px): NavigationBar visible, NavigationRailGroup hidden (AC #2)
 *
 * Implementation contract (per story Dev Notes):
 *   - Desktop rail wrapper uses Tailwind class "hidden lg:block" and has data-testid="shell-rail-container"
 *   - Mobile bar wrapper uses Tailwind class "lg:hidden"            and has data-testid="shell-mobile-nav"
 *
 * The swap is class-based (Tailwind responsive utilities) — NOT a JS media query — so we assert on
 * the rendered DOM containers and their className tokens rather than computed style.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'

import { AppShell } from './AppShell'

function buildTestRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
  })

  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="clientes-view">Clientes</div>,
  })

  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => <div data-testid="contactos-view">Contactos</div>,
  })

  const routeTree = rootRoute.addChildren([clientesRoute, contactosRoute])

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 })
  // Tailwind responsive classes do not depend on JS media queries in jsdom, but emit a resize event
  // so any future internal listener has a chance to react. This is not a hard wait — it is one
  // synchronous dispatch.
  window.dispatchEvent(new Event('resize'))
}

describe('AppShell — responsive navigation surfaces (Story 1.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('TC-E1-P2-01 — at 1280px the desktop rail container renders with "lg:block" wrapper', async () => {
    // GIVEN: a desktop viewport
    setViewport(1280)
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: the shell renders
    // THEN: the desktop rail container is present in the DOM and uses the lg:block Tailwind class
    const railContainer = await screen.findByTestId('shell-rail-container')
    expect(railContainer).toBeInTheDocument()
    expect(railContainer.className).toMatch(/\blg:block\b/)
    expect(railContainer.className).toMatch(/\bhidden\b/)
  })

  it('TC-E1-P2-01 — at 1280px the mobile NavigationBar wrapper carries "lg:hidden"', async () => {
    // GIVEN: a desktop viewport
    setViewport(1280)
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: the shell renders
    // THEN: the mobile nav wrapper is present in the DOM but tagged with the lg:hidden class so
    // Tailwind hides it at lg+. Asserting the class (not computed style) is the contract per the
    // responsive strategy in the story Dev Notes.
    const mobileNav = await screen.findByTestId('shell-mobile-nav')
    expect(mobileNav).toBeInTheDocument()
    expect(mobileNav.className).toMatch(/\blg:hidden\b/)
  })

  it('TC-E1-P2-02 — at 375px the mobile NavigationBar wrapper is rendered with "lg:hidden"', async () => {
    // GIVEN: a mobile viewport (< 1024px)
    setViewport(375)
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: the shell renders
    // THEN: the bottom-fixed mobile nav wrapper is present with the lg:hidden class
    const mobileNav = await screen.findByTestId('shell-mobile-nav')
    expect(mobileNav).toBeInTheDocument()
    expect(mobileNav.className).toMatch(/\blg:hidden\b/)
    // It must be a fixed/bottom container per the UX spec
    expect(mobileNav.className).toMatch(/\bfixed\b/)
    expect(mobileNav.className).toMatch(/\bbottom-0\b/)
  })

  it('TC-E1-P2-02 — at 375px the desktop rail wrapper still uses "hidden lg:block" (Tailwind-only swap)', async () => {
    // GIVEN: a mobile viewport
    setViewport(375)
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: the shell renders
    // THEN: the desktop rail container is still in the DOM (Tailwind class-based swap, not unmount)
    // but tagged with "hidden lg:block" so it is hidden below the lg breakpoint.
    const railContainer = await screen.findByTestId('shell-rail-container')
    expect(railContainer.className).toMatch(/\bhidden\b/)
    expect(railContainer.className).toMatch(/\blg:block\b/)
  })

  it('mobile NavigationBar exposes both Clientes and Contactos items with Spanish aria-labels (AC #2)', async () => {
    // GIVEN: a mobile viewport
    setViewport(375)
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: the shell renders the bottom NavigationBar
    const mobileNav = await screen.findByTestId('shell-mobile-nav')

    // THEN: both navigation items are tappable and labelled in Spanish
    await waitFor(() => {
      expect(mobileNav).toBeInTheDocument()
    })
    expect(screen.getAllByRole('button', { name: 'Ir a Clientes' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Ir a Contactos' }).length).toBeGreaterThan(0)
  })
})
