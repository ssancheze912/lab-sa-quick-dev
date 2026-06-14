/**
 * Story 2.1: Client List & Search — ClienteListItem Component Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - ClienteListItem component does not exist yet (frontend/src/shared/components/ClienteListItem.tsx)
 *
 * Acceptance Criteria covered:
 *   AC#1 — Each list item shows Nombre (bold, truncated) and NIT/RUC (smaller)
 *   AC#1 — Keyboard accessible via tabIndex and onKeyDown Enter handler
 *   AC#1 — WCAG: role="option", aria-selected
 *
 * From story tasks:
 *   Task 6 — Create ClienteListItem component
 *   - Props: cliente: Cliente, isSelected: boolean, onClick: () => void
 *   - Renders Nombre (bold, truncated) and NIT/RUC
 *   - Selected styling: bg-blue-50 border-l-4 border-[#0e79fd]
 *   - WCAG: role="option", aria-selected={isSelected}, keyboard accessible
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// RED: This import will fail until implementation exists.
// Expected failure: "Cannot find module '../ClienteListItem'"
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

describe('ClienteListItem component', () => {
  it('should render the client Nombre (AC#1)', () => {
    // GIVEN: a cliente object

    // WHEN: ClienteListItem renders
    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={() => {}} />
    )

    // THEN: Nombre text is visible
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
  })

  it('should render the client NIT/RUC (AC#1)', () => {
    // GIVEN: a cliente with NIT

    // WHEN: rendered
    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={() => {}} />
    )

    // THEN: NIT text is visible
    expect(screen.getByText('900123456-7')).toBeInTheDocument()
  })

  it('should have role="option" for WCAG 2.1 AA compliance (AC#1)', () => {
    // WHEN: rendered
    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={() => {}} />
    )

    // THEN: element has role="option"
    expect(screen.getByRole('option')).toBeInTheDocument()
  })

  it('should have aria-selected=false when not selected (AC#1)', () => {
    // GIVEN: isSelected=false

    // WHEN: rendered
    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={() => {}} />
    )

    // THEN: aria-selected is false
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false')
  })

  it('should have aria-selected=true when selected (AC#1)', () => {
    // GIVEN: isSelected=true

    // WHEN: rendered
    render(
      <ClienteListItem cliente={mockCliente} isSelected={true} onClick={() => {}} />
    )

    // THEN: aria-selected is true
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true')
  })

  it('should call onClick when item is clicked (AC#1)', async () => {
    // GIVEN: an onClick spy
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={onClick} />
    )

    // WHEN: user clicks the item
    await user.click(screen.getByRole('option'))

    // THEN: onClick is called once
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should call onClick when Enter key is pressed (AC#1 keyboard accessibility)', async () => {
    // GIVEN: an onClick spy and keyboard user
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={onClick} />
    )

    // WHEN: user focuses the item and presses Enter
    const item = screen.getByRole('option')
    item.focus()
    await user.keyboard('{Enter}')

    // THEN: onClick is triggered via keyboard
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should be focusable via keyboard (tabIndex is set, AC#1)', () => {
    // WHEN: rendered
    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={() => {}} />
    )

    // THEN: item has tabIndex to be keyboard-focusable
    const item = screen.getByRole('option')
    expect(item).toHaveAttribute('tabindex')
  })

  it('should render data-testid="cliente-list-item" for test stability', () => {
    // WHEN: rendered
    render(
      <ClienteListItem cliente={mockCliente} isSelected={false} onClick={() => {}} />
    )

    // THEN: data-testid is present for E2E test selectors
    expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument()
  })
})
