/**
 * ClientListItem shared component tests.
 *
 * Story 2.1 established the presentational contract (nombre + NIT/RUC + testid).
 * Story 2.2 migrated the item from `<button>+onSelect` to a TanStack Router
 * `<Link to="/clientes/$clienteId">` with URL-driven active styling. The
 * pre-existing selection-callback / isSelected assertions from Story 2.1 are
 * intentionally removed — those props no longer exist. The remaining
 * presentational assertions (nombre / NIT visible, 44 px tap target,
 * data-testid on the outer <li>) are preserved.
 *
 * The Story 2.2 [P0] block adds the migration assertions: the anchor `href`
 * points to `/clientes/{id}`, the 44 px tap target moves to the anchor, and
 * `activeProps` swaps in the highlight when the URL matches (deep-link).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { ClientListItem } from '@/shared/components/ClientListItem'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

function makeCliente(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    nombre: 'Cliente Demo',
    nitRuc: '900123456-7',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00+00:00',
    updatedAt: '2026-01-01T00:00:00+00:00',
    ...overrides,
  }
}

function renderInRouter(ui: ReactNode, initialPath = '/clientes/some-id') {
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const clientesIndexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <ul>{ui}</ul>,
  })
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => <ul>{ui}</ul>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([clientesIndexRoute, detailRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  return render(<RouterProvider router={router} />)
}

afterEach(() => cleanup())

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Presentational contract preserved from Story 2.1
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] ClientListItem — presentational contract', () => {
  it('[P2] should render the cliente nombre', async () => {
    // GIVEN: A cliente with a distinct nombre
    renderInRouter(
      <ClientListItem cliente={makeCliente({ nombre: 'Corporación X' })} />,
      '/clientes',
    )

    // WHEN / THEN: The nombre is visible (async — router hydrates the route)
    expect(await screen.findByText('Corporación X')).toBeInTheDocument()
  })

  it('[P2] should render the NIT/RUC with the "NIT/RUC:" prefix', async () => {
    // GIVEN: A cliente with a specific NIT
    renderInRouter(
      <ClientListItem cliente={makeCliente({ nitRuc: '900987654-3' })} />,
      '/clientes',
    )

    // WHEN / THEN: The NIT is rendered with the mandated prefix
    expect(
      await screen.findByText(/NIT\/RUC:\s*900987654-3/),
    ).toBeInTheDocument()
  })

  it('[P2] should expose the data-testid="cliente-list-item" hook on the <li>', async () => {
    // GIVEN: A cliente
    renderInRouter(<ClientListItem cliente={makeCliente()} />, '/clientes')

    // WHEN / THEN: The outer <li> has the canonical test hook
    const item = await screen.findByTestId('cliente-list-item')
    expect(item.tagName.toLowerCase()).toBe('li')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 2.2 — TanStack Router <Link> migration (Task 11)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] ClientListItem — TanStack Router <Link> migration (Story 2.2)', () => {
  it('[P0] should render an anchor whose href points to /clientes/{id}', async () => {
    // GIVEN: A cliente with a known id
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000042',
    })

    // WHEN: The item is rendered inside a router with the /clientes route
    renderInRouter(<ClientListItem cliente={cliente} />, '/clientes')

    // THEN: The rendered node contains an <a> whose href matches the deep-link URL
    const item = await screen.findByTestId('cliente-list-item')
    const anchor = item.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor!.getAttribute('href')).toBe(`/clientes/${cliente.id}`)
  })

  it('[P0] should preserve the 44 px minimum tap target on the migrated anchor', async () => {
    // GIVEN: A cliente
    const cliente = makeCliente()

    // WHEN: The item is rendered inside a router
    renderInRouter(<ClientListItem cliente={cliente} />, '/clientes')

    // THEN: The anchor carries the min-h-[44px] class hook
    const anchor = (await screen.findByTestId('cliente-list-item')).querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor!.className).toMatch(/min-h-\[44px\]/)
  })

  it('[P0] should apply the active class when the URL matches the item id (deep-link)', async () => {
    // GIVEN: A cliente whose id matches the initial URL
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000099',
    })

    // WHEN: The router is initialised at /clientes/{id}
    renderInRouter(
      <ClientListItem cliente={cliente} />,
      `/clientes/${cliente.id}`,
    )

    // THEN: The anchor carries the active styling from `activeProps`
    //       (URL-driven — no click required).
    const anchor = (await screen.findByTestId('cliente-list-item')).querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor!.className).toMatch(/bg-slate-100/)
    expect(anchor!.className).toMatch(/font-semibold/)
  })

  it('[P0] should NOT apply the active class when the URL does not match the item id', async () => {
    // GIVEN: A cliente whose id does NOT match the initial URL
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000200',
    })

    // WHEN: The router is initialised at /clientes/{different-id}
    renderInRouter(
      <ClientListItem cliente={cliente} />,
      '/clientes/00000000-0000-4000-8000-000000000999',
    )

    // THEN: The anchor does NOT carry the active styling
    const anchor = (await screen.findByTestId('cliente-list-item')).querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor!.className).not.toMatch(/font-semibold/)
  })
})
