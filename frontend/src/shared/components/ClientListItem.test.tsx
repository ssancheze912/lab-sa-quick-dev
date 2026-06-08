/**
 * Story 2.1: Client List & Search — Task 14
 * Epic 2: Client Management
 *
 * ATDD component test — RED Phase
 * Intentionally FAILING until `ClientListItem` is implemented.
 *
 * Acceptance Criteria covered:
 *   AC #4  — Items show `nombre` (primary) and `nit` (secondary) per ux-design-specification.
 *   AC #10 — Selecting an item updates URL state — click is handled in parent (test the handler is invoked).
 *   AC #11 — Spanish aria-label "Ver cliente: {nombre}" + Tab + Enter reachability.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
// RED: ClientListItem.tsx does not exist yet — this import will fail until Task 14 is done.
import { ClientListItem } from './ClientListItem'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

afterEach(() => {
  cleanup()
})

function buildCliente(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    nombre: 'Acme S.A.',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00+00:00',
    updatedAt: '2026-01-01T00:00:00+00:00',
    ...overrides,
  }
}

describe('ClientListItem (AC #4, #10, #11)', () => {
  it('renders the client nombre as primary text', () => {
    // GIVEN: a client "Acme S.A."
    // WHEN: the item mounts
    render(<ClientListItem cliente={buildCliente()} isActive={false} onClick={vi.fn()} />)

    // THEN: nombre is visible
    expect(screen.getByText('Acme S.A.')).toBeInTheDocument()
  })

  it('renders the client nit as secondary text', () => {
    // GIVEN: a client with nit "900123456-1"
    // WHEN: the item mounts
    render(<ClientListItem cliente={buildCliente()} isActive={false} onClick={vi.fn()} />)

    // THEN: nit is visible
    expect(screen.getByText('900123456-1')).toBeInTheDocument()
  })

  it('exposes the Spanish aria-label "Ver cliente: {nombre}" (AC #11)', () => {
    // GIVEN: a client
    // WHEN: the item mounts
    render(<ClientListItem cliente={buildCliente()} isActive={false} onClick={vi.fn()} />)

    // THEN: the button-like element exposes the Spanish aria-label
    expect(screen.getByLabelText('Ver cliente: Acme S.A.')).toBeInTheDocument()
  })

  it('exposes data-testid="client-list-item"', () => {
    render(<ClientListItem cliente={buildCliente()} isActive={false} onClick={vi.fn()} />)
    expect(screen.getByTestId('client-list-item')).toBeInTheDocument()
  })

  it('invokes onClick exactly once when the user clicks the item (AC #10)', () => {
    // GIVEN: an onClick handler
    const onClick = vi.fn()
    render(<ClientListItem cliente={buildCliente()} isActive={false} onClick={onClick} />)

    // WHEN: the user clicks the item
    fireEvent.click(screen.getByTestId('client-list-item'))

    // THEN: onClick fires once
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('sets aria-current="page" when isActive is true (AC #10)', () => {
    // GIVEN: an item rendered as active
    render(<ClientListItem cliente={buildCliente()} isActive={true} onClick={vi.fn()} />)

    // WHEN: the item renders
    // THEN: aria-current is "page" (signals selection to assistive tech)
    expect(screen.getByTestId('client-list-item')).toHaveAttribute('aria-current', 'page')
  })

  it('does NOT set aria-current when isActive is false', () => {
    // GIVEN: an item rendered as inactive
    render(<ClientListItem cliente={buildCliente()} isActive={false} onClick={vi.fn()} />)

    // WHEN: the item renders
    // THEN: aria-current is absent
    expect(screen.getByTestId('client-list-item')).not.toHaveAttribute('aria-current')
  })

  it('renders as a <button type="button"> so it is reachable via Tab + Enter (AC #11)', () => {
    // GIVEN: an item mounted
    render(<ClientListItem cliente={buildCliente()} isActive={false} onClick={vi.fn()} />)

    // WHEN / THEN: the item is a native <button> with type="button"
    const item = screen.getByTestId('client-list-item')
    expect(item.tagName).toBe('BUTTON')
    expect(item).toHaveAttribute('type', 'button')
  })
})
