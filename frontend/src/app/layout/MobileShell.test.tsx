/**
 * Story 1.2 — AC #2, #6 — Mobile shell using siesa-ui-kit NavigationBar (bottom nav).
 * RED until MobileShell.tsx is implemented.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { MobileShell } from './MobileShell'

declare global {
  // eslint-disable-next-line no-var
  var setMatchMediaWidth: (width: number) => void
}

async function mountMobileShell(initialPath = '/clientes') {
  const rootRoute = createRootRoute({
    component: () => (
      <MobileShell>
        <Outlet />
      </MobileShell>
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
  const router = createRouter({
    routeTree: rootRoute.addChildren([clientesRoute, contactosRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  const utils = render(<RouterProvider router={router} />)
  await waitFor(() => {
    expect(screen.getByTestId('mobile-nav-bar')).toBeInTheDocument()
  })
  return { ...utils, router }
}

describe('MobileShell (< lg)', () => {
  beforeEach(() => {
    globalThis.setMatchMediaWidth(375)
  })

  it('GIVEN a mobile viewport, WHEN MobileShell mounts, THEN the bottom NavigationBar is in the DOM', async () => {
    await mountMobileShell()
    expect(screen.getByTestId('mobile-nav-bar')).toBeInTheDocument()
  })

  it('GIVEN mobile shell, THEN both Clientes and Contactos items are present with Spanish labels', async () => {
    await mountMobileShell()
    expect(screen.getByRole('button', { name: /clientes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /contactos/i })).toBeInTheDocument()
  })

  it('GIVEN mobile shell, WHEN tapping "Contactos", THEN the router navigates to /contactos', async () => {
    const { router } = await mountMobileShell('/clientes')

    fireEvent.click(screen.getByRole('button', { name: /contactos/i }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
  })

  it('GIVEN mobile shell mounted at /contactos, THEN Contactos item has activeItemId semantics', async () => {
    await mountMobileShell('/contactos')
    const contactosItem = screen.getByTestId('mobile-nav-item-contactos')
    expect(contactosItem.getAttribute('data-active')).toBe('true')
  })

  it('GIVEN mobile shell items, THEN each item exposes a Spanish aria-label for screen readers', async () => {
    await mountMobileShell()
    expect(screen.getByRole('button', { name: /clientes/i }).getAttribute('aria-label')).toMatch(
      /clientes/i,
    )
    expect(screen.getByRole('button', { name: /contactos/i }).getAttribute('aria-label')).toMatch(
      /contactos/i,
    )
  })

  it('GIVEN a user navigates between routes, THEN window.location.reload is NOT called (SPA behavior)', async () => {
    await mountMobileShell('/clientes')
    fireEvent.click(screen.getByRole('button', { name: /contactos/i }))
    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })
    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('GIVEN mobile shell, THEN the content area uses dvh (not vh) to avoid keyboard viewport bug', async () => {
    await mountMobileShell()
    const main = screen.getByTestId('mobile-main')
    // Must contain a dvh class (Tailwind min-h-dvh) — never vh
    expect(main.className).toMatch(/dvh/)
    expect(main.className).not.toMatch(/min-h-screen|min-h-\[100vh\]/)
  })
})
