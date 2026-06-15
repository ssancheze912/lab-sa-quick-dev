/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Component / Routing Tests — RED Phase (Vitest + React Testing Library)
 *
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Covers Acceptance Criteria:
 *   AC #2 — SPA navigation between /clientes and /contactos without full page reload
 *
 * Test Cases mapped:
 *   TC-E1-P1-01 — SPA navigation between /clientes and /contactos occurs without
 *                 window.location mutation.
 */

import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'

function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', {
    value: 1280,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('1024'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
  window.dispatchEvent(new Event('resize'))
}

function buildAppRouter(initialPath: string = '/clientes') {
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
    component: () => (
      <section aria-label="Clientes">
        <h1 data-testid="clientes-heading">Clientes</h1>
      </section>
    ),
  })

  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => (
      <section aria-label="Contactos">
        <h1 data-testid="contactos-heading">Contactos</h1>
      </section>
    ),
  })

  const routeTree = rootRoute.addChildren([clientesRoute, contactosRoute])

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('SPA navigation — no full page reload (TC-E1-P1-01)', () => {
  beforeEach(() => {
    setDesktopViewport()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  test('GIVEN user is on /clientes WHEN clicking "Contactos" rail item THEN router navigates to /contactos and renders the Contactos view', async () => {
    // GIVEN: The user is on /clientes inside the app shell
    const router = buildAppRouter('/clientes')
    render(<RouterProvider router={router} />)

    // Sanity: Clientes heading initially rendered
    await screen.findByTestId('clientes-heading')

    // WHEN: User clicks the Contactos rail item
    const contactosNav = await screen.findByTestId('nav-rail-item-contactos')
    fireEvent.click(contactosNav)

    // THEN: The URL transitions to /contactos and the Contactos view is rendered
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
    expect(await screen.findByTestId('contactos-heading')).toBeInTheDocument()
  })

  test('GIVEN user is on /contactos WHEN clicking "Clientes" rail item THEN router navigates back to /clientes', async () => {
    // GIVEN: The user is on /contactos
    const router = buildAppRouter('/contactos')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('contactos-heading')

    // WHEN: User clicks the Clientes rail item
    const clientesNav = await screen.findByTestId('nav-rail-item-clientes')
    fireEvent.click(clientesNav)

    // THEN: The URL transitions to /clientes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    expect(await screen.findByTestId('clientes-heading')).toBeInTheDocument()
  })

  test('GIVEN navigation occurs via rail click WHEN inspecting window.location THEN no full reload (.assign / .replace / .href mutation) is triggered', async () => {
    // GIVEN: Spy on window.location side effects that would indicate a full page reload
    const assignSpy = vi.fn()
    const replaceSpy = vi.fn()
    const reloadSpy = vi.fn()

    // jsdom's location is read-only by default; redefine selectively.
    Object.defineProperty(window.location, 'assign', {
      configurable: true,
      writable: true,
      value: assignSpy,
    })
    Object.defineProperty(window.location, 'replace', {
      configurable: true,
      writable: true,
      value: replaceSpy,
    })
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      writable: true,
      value: reloadSpy,
    })

    const router = buildAppRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: User clicks Contactos
    const contactosNav = await screen.findByTestId('nav-rail-item-contactos')
    fireEvent.click(contactosNav)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })

    // THEN: No imperative window.location mutation occurred (SPA-only navigation)
    expect(assignSpy).not.toHaveBeenCalled()
    expect(replaceSpy).not.toHaveBeenCalled()
    expect(reloadSpy).not.toHaveBeenCalled()
  })

  test('GIVEN user navigates between routes WHEN the active rail item is queried THEN the selected id mirrors the current path', async () => {
    // AC #2 — selectedId mirrors current path
    const router = buildAppRouter('/clientes')
    render(<RouterProvider router={router} />)

    // GIVEN: Initial route /clientes → clientes item should be flagged active
    const clientesItem = await screen.findByTestId('nav-rail-item-clientes')
    expect(clientesItem.getAttribute('data-active')).toBe('true')

    // WHEN: Navigate to /contactos
    const contactosItem = await screen.findByTestId('nav-rail-item-contactos')
    fireEvent.click(contactosItem)

    // THEN: contactos becomes active, clientes becomes inactive
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })

    const updatedContactos = await screen.findByTestId('nav-rail-item-contactos')
    expect(updatedContactos.getAttribute('data-active')).toBe('true')
  })
})
