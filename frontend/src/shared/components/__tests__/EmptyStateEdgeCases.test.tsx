import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EmptyState } from '../EmptyState'

/**
 * Edge case unit tests for EmptyState component — Story 2.1 expansion.
 *
 * Test IDs: UNIT-C-FE-ES-EDGE-01 … UNIT-C-FE-ES-EDGE-05
 */
describe('EmptyState — edge cases', () => {
  // ---------------------------------------------------------------------------
  // UNIT-C-FE-ES-EDGE-01: Renders custom title prop
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-ES-EDGE-01 — renders custom title prop', () => {
    render(<EmptyState title="Sin resultados" />)

    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-ES-EDGE-02: Description is optional — renders without it when omitted
  // Boundary: passing description="" (empty string) should be safe
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-ES-EDGE-02 — renders without error when description is empty string', () => {
    expect(() => {
      render(<EmptyState title="Sin datos" description="" />)
    }).not.toThrow()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-ES-EDGE-03: action prop renders arbitrary React node
  // Boundary: the action slot can receive a button element
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-ES-EDGE-03 — renders the action prop as a React node', () => {
    render(
      <EmptyState
        title="Sin clientes"
        action={<button type="button" data-testid="action-btn">Nuevo cliente</button>}
      />
    )

    expect(screen.getByTestId('action-btn')).toBeInTheDocument()
    expect(screen.getByText('Nuevo cliente')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-ES-EDGE-04: No action prop renders without extra DOM elements
  // Boundary: action slot is conditional — undefined should produce no button
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-ES-EDGE-04 — renders without action slot when action is not provided', () => {
    render(<EmptyState title="Sin resultados" />)

    // No button should be rendered (default empty-state has no button)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-ES-EDGE-05: Contains an icon element (aria-hidden) for visual context
  // The icon must be hidden from screen readers to avoid noise.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-ES-EDGE-05 — icon element has aria-hidden="true"', () => {
    render(<EmptyState />)

    const icon = screen.getByTestId('empty-state').querySelector('[aria-hidden="true"]')
    expect(icon).not.toBeNull()
  })
})
