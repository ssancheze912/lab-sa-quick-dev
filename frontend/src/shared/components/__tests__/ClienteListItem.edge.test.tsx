/**
 * Story 2.1: Client List & Search — ClienteListItem Edge Case Tests
 *
 * Expands ATDD coverage with boundary conditions and negative paths:
 *   - Space key does NOT trigger onClick (only Enter)
 *   - Selection state updates correctly when prop changes
 *   - Long Nombre and NIT values are rendered without crashing
 *   - Clicking a selected item still fires onClick
 *   - Tab key does not trigger onClick
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ClienteListItem } from '../ClienteListItem'

const baseCliente = {
  id: 'aaa00000-0000-0000-0000-000000000001',
  nombre: 'Empresa Base',
  nit: '900000001-1',
  telefono: '601 000 0001',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('ClienteListItem — edge cases', () => {
  it('[P2] should NOT call onClick when Space key is pressed', async () => {
    // GIVEN: a list item with a spy onClick
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={onClick} />)

    // WHEN: user focuses and presses Space
    const item = screen.getByRole('option')
    item.focus()
    await user.keyboard(' ')

    // THEN: onClick was not called (Space is not a valid keyboard trigger per story spec)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('[P2] should call onClick when clicking a currently-selected item', async () => {
    // GIVEN: an already selected item
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<ClienteListItem cliente={baseCliente} isSelected={true} onClick={onClick} />)

    // WHEN: user clicks the selected item
    await user.click(screen.getByRole('option'))

    // THEN: onClick fires (selection re-selection handled by parent)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('[P2] should render very long Nombre without crashing', () => {
    // GIVEN: a cliente with a 200-character nombre
    const longNombre = 'A'.repeat(200)
    const cliente = { ...baseCliente, nombre: longNombre }

    // WHEN: rendered
    render(<ClienteListItem cliente={cliente} isSelected={false} onClick={() => {}} />)

    // THEN: the item renders without error and the text is in the DOM
    expect(screen.getByRole('option')).toBeInTheDocument()
    expect(screen.getByText(longNombre)).toBeInTheDocument()
  })

  it('[P2] should render very long NIT without crashing', () => {
    // GIVEN: a cliente with a long NIT string
    const longNit = '9'.repeat(50) + '-7'
    const cliente = { ...baseCliente, nit: longNit }

    // WHEN: rendered
    render(<ClienteListItem cliente={cliente} isSelected={false} onClick={() => {}} />)

    // THEN: the NIT text is in the DOM
    expect(screen.getByText(longNit)).toBeInTheDocument()
  })

  it('[P2] should reflect isSelected=false after being re-rendered as unselected', () => {
    // GIVEN: item is initially selected
    const { rerender } = render(
      <ClienteListItem cliente={baseCliente} isSelected={true} onClick={() => {}} />
    )
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true')

    // WHEN: prop changes to isSelected=false
    rerender(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={() => {}} />)

    // THEN: aria-selected reflects the updated state
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false')
  })

  it('[P2] should reflect isSelected=true after being re-rendered as selected', () => {
    // GIVEN: item starts unselected
    const { rerender } = render(
      <ClienteListItem cliente={baseCliente} isSelected={false} onClick={() => {}} />
    )
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false')

    // WHEN: prop changes to isSelected=true
    rerender(<ClienteListItem cliente={baseCliente} isSelected={true} onClick={() => {}} />)

    // THEN: aria-selected reflects the updated state
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true')
  })

  it('[P3] should NOT call onClick when Tab key is pressed', async () => {
    // GIVEN: an onClick spy
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={onClick} />)

    // WHEN: user presses Tab (navigation key)
    const item = screen.getByRole('option')
    item.focus()
    await user.keyboard('{Tab}')

    // THEN: onClick was not triggered by navigation key
    expect(onClick).not.toHaveBeenCalled()
  })

  it('[P3] should have tabIndex=0 to be in the natural tab order', () => {
    // WHEN: rendered
    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={() => {}} />)

    // THEN: tabIndex is exactly 0 (natural tab order, not negative)
    expect(screen.getByRole('option')).toHaveAttribute('tabindex', '0')
  })
})
