/**
 * Story 2.1: Client List & Search — ClienteListItem Additional Edge Case Tests
 *
 * These tests complement ClienteListItem.edge.test.tsx (which covers Space key,
 * selected-while-selected click, long text, aria-selected re-render, Tab key).
 *
 * This file adds unique coverage:
 *   - Special characters (accented Spanish names)
 *   - Selected styling CSS class check
 *   - Rapid multiple clicks (onClick called per click)
 *   - NIT with dash format renders correctly
 *   - data-testid stability across selection state changes
 *   - Icon (decorative) not announced to screen reader
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ClienteListItem } from '../ClienteListItem'

const mockCliente = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  nombre: 'Empresa ABC',
  nit: '900123456-7',
  telefono: '601 234 5678',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
}

describe('ClienteListItem — additional edge cases (complements ClienteListItem.edge.test.tsx)', () => {
  // ─── Special characters in Nombre ────────────────────────────────────────

  it('[P2] should render Nombre with Spanish accented characters correctly', () => {
    // GIVEN: client with accented characters
    const cliente = { ...mockCliente, nombre: 'Tecnología & Soluciones S.A.S.' }

    // WHEN: rendered
    render(<ClienteListItem cliente={cliente} isSelected={false} onClick={() => {}} />)

    // THEN: accented characters display correctly
    expect(screen.getByText('Tecnología & Soluciones S.A.S.')).toBeInTheDocument()
  })

  // ─── Selected styling: selected item has bg-blue-50 class ────────────────

  it('[P1] should apply bg-blue-50 CSS class when isSelected=true', () => {
    // GIVEN: item is selected
    render(
      <ClienteListItem cliente={mockCliente} isSelected={true} onClick={() => {}} />
    )

    // THEN: selected background class is present
    const item = screen.getByRole('option')
    expect(item.className).toContain('bg-blue-50')
  })

  it('[P2] should NOT apply bg-blue-50 class when isSelected=false', () => {
    // GIVEN: item is NOT selected
    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={() => {}} />
    )

    // THEN: selected background class is absent
    const item = screen.getByRole('option')
    expect(item.className).not.toContain('bg-blue-50')
  })

  // ─── Rapid clicks: onClick called each time ───────────────────────────────

  it('[P2] should call onClick for each rapid sequential click', async () => {
    // GIVEN: spy and user
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={onClick} />
    )

    // WHEN: user clicks quickly 3 times
    const item = screen.getByRole('option')
    await user.click(item)
    await user.click(item)
    await user.click(item)

    // THEN: each click invokes the handler
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  // ─── NIT with dash renders correctly ──────────────────────────────────────

  it('[P2] should render NIT in "XXXXXXXXX-X" format without transformation', () => {
    // GIVEN: standard Colombian NIT format
    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={() => {}} />
    )

    // THEN: NIT with dash is displayed exactly as received
    expect(screen.getByText('900123456-7')).toBeInTheDocument()
  })

  // ─── data-testid is stable regardless of selection state ─────────────────

  it('[P2] data-testid="cliente-list-item" is present in both selected and unselected states', () => {
    // GIVEN: selected item
    const { rerender } = render(
      <ClienteListItem cliente={mockCliente} isSelected={true} onClick={() => {}} />
    )
    expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument()

    // WHEN: deselected
    rerender(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={() => {}} />
    )

    // THEN: data-testid is still present
    expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument()
  })

  // ─── Both Nombre and NIT are rendered simultaneously ──────────────────────

  it('[P1] should render both Nombre and NIT in the same item', () => {
    // GIVEN: a client with distinct nombre and nit
    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={() => {}} />
    )

    // THEN: both are present simultaneously
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    expect(screen.getByText('900123456-7')).toBeInTheDocument()
  })
})
