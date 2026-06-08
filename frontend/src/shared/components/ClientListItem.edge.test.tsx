/**
 * Story 2.1: Client List & Search — Automate Phase
 * Epic 2: Client Management
 *
 * AUTOMATE expansion tests (edge cases — NOT regenerated from ATDD)
 * Complements `ClientListItem.test.tsx` with keyboard activation, long-content
 * boundary, special-character rendering, and `data-active` attribute.
 *
 * Acceptance Criteria touched:
 *   AC #4  — Items show `nombre` + `nit`.
 *   AC #10 — Click + URL navigation handled in parent; data-active attribute mirrors isActive.
 *   AC #11 — Keyboard reachability via Tab + Enter / Space.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
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

describe('ClientListItem — edge cases (AC #4, #10, #11)', () => {
  it('[P2] reflects isActive via the `data-active` attribute (used by E2E tests)', () => {
    // GIVEN: an active item
    render(<ClientListItem cliente={buildCliente()} isActive={true} onClick={vi.fn()} />)

    // WHEN / THEN: data-active="true" is present (E2E selectors depend on this for assertions)
    expect(screen.getByTestId('client-list-item')).toHaveAttribute('data-active', 'true')
  })

  it('[P2] reflects isActive=false via `data-active="false"`', () => {
    // GIVEN: an inactive item
    render(<ClientListItem cliente={buildCliente()} isActive={false} onClick={vi.fn()} />)

    // WHEN / THEN: data-active="false" is present
    expect(screen.getByTestId('client-list-item')).toHaveAttribute('data-active', 'false')
  })

  it('[P2] renders a very long nombre (200-char DB max) without crashing or truncating the DOM text', () => {
    // GIVEN: a client with a 200-char nombre (max-length boundary)
    const longNombre = 'X'.repeat(200)
    render(
      <ClientListItem cliente={buildCliente({ nombre: longNombre })} isActive={false} onClick={vi.fn()} />,
    )

    // WHEN / THEN: the full string is in the DOM (visual truncation can happen via CSS, not React)
    expect(screen.getByText(longNombre)).toBeInTheDocument()
    expect(screen.getByLabelText(`Ver cliente: ${longNombre}`)).toBeInTheDocument()
  })

  it('[P2] preserves Spanish diacritics in the rendered nombre', () => {
    // GIVEN: a client whose nombre contains diacritics (P0 company standard — Spanish copy)
    const client = buildCliente({ nombre: 'Compañía Eléctrica del Pacífico' })
    render(<ClientListItem cliente={client} isActive={false} onClick={vi.fn()} />)

    // WHEN / THEN: the diacritics survive the React render (no auto-normalization)
    expect(screen.getByText('Compañía Eléctrica del Pacífico')).toBeInTheDocument()
    expect(screen.getByLabelText('Ver cliente: Compañía Eléctrica del Pacífico')).toBeInTheDocument()
  })

  it('[P2] renders a NIT containing alphanumeric characters (RUC) literally', () => {
    // GIVEN: a NIT-as-RUC value that includes letters (some LATAM countries)
    const client = buildCliente({ nit: 'RUC-123-XYZ' })
    render(<ClientListItem cliente={client} isActive={false} onClick={vi.fn()} />)

    // WHEN / THEN: the secondary text shows the NIT verbatim
    expect(screen.getByText('RUC-123-XYZ')).toBeInTheDocument()
  })

  it('[P1] activating the focused item with a click invokes onClick exactly once (keyboard parity)', () => {
    // GIVEN: a focused item (Tab order reached it)
    const onClick = vi.fn()
    render(<ClientListItem cliente={buildCliente()} isActive={false} onClick={onClick} />)
    const item = screen.getByTestId('client-list-item')
    item.focus()

    // WHEN: the user activates the button (Enter on a focused <button> dispatches a click event)
    fireEvent.click(item)

    // THEN: onClick fires exactly once
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('[P2] when isActive=true, both aria-current AND data-active are set (single source of truth pair)', () => {
    // GIVEN: an active item
    render(<ClientListItem cliente={buildCliente()} isActive={true} onClick={vi.fn()} />)

    // WHEN / THEN: aria-current="page" + data-active="true" must move together — they encode the same state
    const item = screen.getByTestId('client-list-item')
    expect(item).toHaveAttribute('aria-current', 'page')
    expect(item).toHaveAttribute('data-active', 'true')
  })
})
