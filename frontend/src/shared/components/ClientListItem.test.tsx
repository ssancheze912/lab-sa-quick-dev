/**
 * Story 2.1 — ClientListItem shared component (Automate expansion)
 *
 * Unit-level tests for the `ClientListItem` shared component. Complements the
 * ATDD suite which exercises it only indirectly through `ClienteListView`.
 *
 * Verifies:
 *   • Renders `nombre` (primary) and `NIT/RUC: <nitRuc>` (secondary)
 *   • `onSelect` receives the cliente.id when clicked
 *   • `isSelected=true` yields a distinguishable class hook
 *   • The 44 px tap-target class is present (mobile accessibility per Dev Notes)
 *   • The `data-testid="cliente-list-item"` hook is on the outer <li>
 *
 * Priority: P2 — presentational surface + selection callback.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
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

afterEach(() => cleanup())

describe('[P2] ClientListItem — presentational contract', () => {
  it('[P2] should render the cliente nombre', () => {
    // GIVEN: A cliente with a distinct nombre
    render(<ClientListItem cliente={makeCliente({ nombre: 'Corporación X' })} />)

    // WHEN / THEN: The nombre is visible
    expect(screen.getByText('Corporación X')).toBeInTheDocument()
  })

  it('[P2] should render the NIT/RUC with the "NIT/RUC:" prefix', () => {
    // GIVEN: A cliente with a specific NIT
    render(
      <ClientListItem cliente={makeCliente({ nitRuc: '900987654-3' })} />,
    )

    // WHEN / THEN: The NIT is rendered with the mandated prefix
    expect(screen.getByText(/NIT\/RUC:\s*900987654-3/)).toBeInTheDocument()
  })

  it('[P2] should expose the data-testid="cliente-list-item" hook on the <li>', () => {
    // GIVEN: A cliente
    render(<ClientListItem cliente={makeCliente()} />)

    // WHEN / THEN: The outer <li> has the canonical test hook
    const item = screen.getByTestId('cliente-list-item')
    expect(item.tagName.toLowerCase()).toBe('li')
  })

  it('[P2] should honour the 44 px minimum tap target for mobile (min-h-[44px])', () => {
    // GIVEN: A cliente
    render(<ClientListItem cliente={makeCliente()} />)

    // WHEN / THEN: The clickable <button> carries the accessibility class hook
    const btn = screen
      .getByTestId('cliente-list-item')
      .querySelector('button')
    expect(btn).not.toBeNull()
    expect(btn!.className).toMatch(/min-h-\[44px\]/)
  })
})

describe('[P2] ClientListItem — selection callback', () => {
  it('[P2] should call onSelect with the cliente.id when the inner button is clicked', async () => {
    // GIVEN: A cliente with a known id and a mock onSelect
    const onSelect = vi.fn()
    const id = '00000000-0000-4000-8000-000000000042'
    render(
      <ClientListItem
        cliente={makeCliente({ id })}
        onSelect={onSelect}
      />,
    )

    // WHEN: The user clicks the inner button (the onClick handler lives there,
    //       not on the outer <li>)
    const user = userEvent.setup({ delay: null })
    const btn = screen
      .getByTestId('cliente-list-item')
      .querySelector('button')!
    await user.click(btn)

    // THEN: onSelect fires once with the cliente.id
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(id)
  })

  it('[P2] should NOT throw when onSelect is omitted (optional prop)', async () => {
    // GIVEN: A cliente without any onSelect
    render(<ClientListItem cliente={makeCliente()} />)

    // WHEN: The user clicks the inner button
    const user = userEvent.setup({ delay: null })
    const btn = screen
      .getByTestId('cliente-list-item')
      .querySelector('button')!
    // THEN: No exception is thrown
    await expect(user.click(btn)).resolves.not.toThrow()
  })
})

describe('[P2] ClientListItem — selection styling', () => {
  it('[P2] should render the selected-state class hooks when isSelected=true', () => {
    // GIVEN: A cliente marked as selected
    render(
      <ClientListItem cliente={makeCliente()} isSelected={true} />,
    )

    // WHEN / THEN: The button carries the selected-state classes
    const btn = screen
      .getByTestId('cliente-list-item')
      .querySelector('button')
    expect(btn).not.toBeNull()
    expect(btn!.className).toMatch(/bg-slate-100/)
    expect(btn!.className).toMatch(/font-semibold/)
  })

  it('[P2] should NOT render the selected-state class hooks when isSelected is falsy', () => {
    // GIVEN: A cliente rendered with isSelected omitted
    render(<ClientListItem cliente={makeCliente()} />)

    // WHEN / THEN: The button does not carry the selected classes
    const btn = screen
      .getByTestId('cliente-list-item')
      .querySelector('button')
    expect(btn).not.toBeNull()
    expect(btn!.className).not.toMatch(/font-semibold/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 2.2 — TanStack Router <Link> migration (Task 11 — RED phase)
//
// These tests define the expected shape of `<ClientListItem>` AFTER the
// Story 2.2 migration from `<button>+onSelect` to `<Link to="/clientes/$clienteId">`.
// They currently FAIL because Story 2.1 still renders a `<button>`; Task 11
// swaps that for a TanStack Router `<Link>` and drops the `isSelected`/`onSelect`
// props. `activeProps` (URL-driven) replaces local selection state.
//
// AC covered: #1 (URL updates on click + list item active styling),
//             #2 (deep-link highlights the matching item on first paint),
//             #10 (page-object continues to work).
// ─────────────────────────────────────────────────────────────────────────────

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
