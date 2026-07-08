/**
 * Story 1.2 — AC #1, #6, #7 — Desktop shell via siesa-ui-kit LayoutBase.
 * RED until AppShell.tsx is implemented.
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
import { AppShell } from './AppShell'

declare global {
  // eslint-disable-next-line no-var
  var setMatchMediaWidth: (width: number) => void
}

async function mountAppShell(initialPath = '/clientes') {
  const rootRoute = createRootRoute({
    component: () => (
      <div data-testid="app-shell">
        <AppShell>
          <Outlet />
        </AppShell>
      </div>
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
    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
  })
  return { ...utils, router }
}

describe('AppShell (desktop)', () => {
  beforeEach(() => {
    globalThis.setMatchMediaWidth(1280)
  })

  it('GIVEN a desktop viewport, WHEN AppShell mounts, THEN "Clientes" nav entry is present', async () => {
    await mountAppShell()
    expect(screen.getByRole('button', { name: /clientes/i })).toBeInTheDocument()
  })

  it('GIVEN a desktop viewport, WHEN AppShell mounts, THEN "Contactos" nav entry is present', async () => {
    await mountAppShell()
    expect(screen.getByRole('button', { name: /contactos/i })).toBeInTheDocument()
  })

  it('GIVEN AppShell rendered at /clientes, WHEN clicking "Contactos", THEN the URL changes to /contactos WITHOUT full reload', async () => {
    const { router } = await mountAppShell('/clientes')

    fireEvent.click(screen.getByRole('button', { name: /contactos/i }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('GIVEN AppShell mounted at /clientes, THEN the Clientes item reflects the active state', async () => {
    await mountAppShell('/clientes')
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem.getAttribute('data-active')).toBe('true')
  })

  it('GIVEN AppShell mounted at /contactos, THEN the Contactos item reflects the active state', async () => {
    await mountAppShell('/contactos')
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem.getAttribute('data-active')).toBe('true')
  })

  it('GIVEN the shell composes siesa-ui-kit LayoutBase, THEN productName "Siesa Agents" is exposed to the Navbar', async () => {
    await mountAppShell()
    // AppShell must render a Navbar surface that mentions the product name
    expect(screen.getByText(/siesa agents/i)).toBeInTheDocument()
  })
})
