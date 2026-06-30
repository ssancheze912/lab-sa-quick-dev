/**
 * Story 2.1 — Expanded edge-case tests for ClienteListItem shared component.
 * Covers: selected state styles, keyboard activation (Enter/Space), click handler,
 * ARIA attributes, and rendering of nombre/nit fields.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ClienteListItem } from './ClienteListItem'
import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

const baseCliente: Cliente = {
  id: '1',
  nombre: 'Empresa Alpha',
  nit: '900111222-3',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('ClienteListItem — rendering', () => {
  it('[P1] renders the cliente nombre as primary text', () => {
    // GIVEN: A cliente with a known nombre
    // WHEN: ClienteListItem is rendered
    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={vi.fn()} />)

    // THEN: The nombre is visible
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
  })

  it('[P1] renders the cliente nit as secondary text', () => {
    // GIVEN: A cliente with a known nit
    // WHEN: ClienteListItem is rendered
    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={vi.fn()} />)

    // THEN: The nit is visible
    expect(screen.getByText('900111222-3')).toBeInTheDocument()
  })

  it('[P2] has role="button" for keyboard accessibility', () => {
    // GIVEN: ClienteListItem rendered
    // WHEN: Looking for ARIA role
    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={vi.fn()} />)

    // THEN: The element has button role
    expect(screen.getByRole('button', { name: /empresa alpha/i })).toBeInTheDocument()
  })

  it('[P2] has aria-label including nombre and nit', () => {
    // GIVEN: ClienteListItem rendered
    // WHEN: Rendered with a cliente
    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={vi.fn()} />)

    // THEN: aria-label contains nombre and nit
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Cliente Empresa Alpha, NIT 900111222-3')
  })

  it('[P2] has tabIndex=0 to be focusable', () => {
    // GIVEN: ClienteListItem rendered
    // WHEN: Rendered
    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={vi.fn()} />)

    // THEN: tabIndex is 0
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('tabindex', '0')
  })
})

describe('ClienteListItem — selected state', () => {
  it('[P1] sets aria-pressed=true when isSelected is true', () => {
    // GIVEN: A selected cliente item
    // WHEN: Rendered with isSelected=true
    render(<ClienteListItem cliente={baseCliente} isSelected={true} onClick={vi.fn()} />)

    // THEN: aria-pressed reflects the selected state
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('[P1] sets aria-pressed=false when isSelected is false', () => {
    // GIVEN: A non-selected cliente item
    // WHEN: Rendered with isSelected=false
    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={vi.fn()} />)

    // THEN: aria-pressed is false
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('ClienteListItem — interactions', () => {
  it('[P1] calls onClick when the item is clicked', () => {
    // GIVEN: A click handler
    const handleClick = vi.fn()

    // WHEN: User clicks the item
    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={handleClick} />)
    fireEvent.click(screen.getByRole('button'))

    // THEN: onClick is called once
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('[P1] calls onClick when Enter key is pressed', () => {
    // GIVEN: A click handler and focused element
    const handleClick = vi.fn()

    // WHEN: User presses Enter on the item
    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={handleClick} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter', code: 'Enter' })

    // THEN: onClick is called once
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('[P1] calls onClick when Space key is pressed', () => {
    // GIVEN: A click handler and focused element
    const handleClick = vi.fn()

    // WHEN: User presses Space on the item
    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={handleClick} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ', code: 'Space' })

    // THEN: onClick is called once
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('[P2] does NOT call onClick for non-activation keys (e.g. Tab)', () => {
    // GIVEN: A click handler
    const handleClick = vi.fn()

    // WHEN: User presses Tab on the item
    render(<ClienteListItem cliente={baseCliente} isSelected={false} onClick={handleClick} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab', code: 'Tab' })

    // THEN: onClick is NOT called
    expect(handleClick).not.toHaveBeenCalled()
  })
})
