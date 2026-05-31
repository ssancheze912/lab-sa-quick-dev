/**
 * Unit Tests — EmptyState component
 *
 * Covers:
 *   - Renders message text
 *   - Renders optional hint text
 *   - Does NOT render hint when not provided
 *   - Has data-testid="empty-state"
 *   - Has role="status" (WCAG 2.1)
 *   - Message and hint are in the DOM simultaneously
 *
 * Pattern: Vitest + @testing-library/react (no MSW — component is pure presentational)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '../EmptyState'

describe('EmptyState — rendering', () => {
  it('Renders the message text passed via props', () => {
    render(<EmptyState message="No hay clientes aún. Crea el primero." />)
    expect(
      screen.getByText('No hay clientes aún. Crea el primero.')
    ).toBeInTheDocument()
  })

  it('Has data-testid="empty-state"', () => {
    render(<EmptyState message="Any message" />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('Has role="status" for WCAG 2.1 screen reader announcement', () => {
    render(<EmptyState message="Any message" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('When hint is provided, renders the hint text', () => {
    render(<EmptyState message="Main message" hint="This is a hint" />)
    expect(screen.getByText('This is a hint')).toBeInTheDocument()
  })

  it('When hint is not provided, does not render hint text', () => {
    render(<EmptyState message="Main message" />)
    // There is no second text element (hint is undefined)
    expect(screen.queryByText('This is a hint')).not.toBeInTheDocument()
  })

  it('When both message and hint are provided, both are visible simultaneously', () => {
    render(
      <EmptyState message="No hay resultados." hint="Intenta con otro término." />
    )
    expect(screen.getByText('No hay resultados.')).toBeInTheDocument()
    expect(screen.getByText('Intenta con otro término.')).toBeInTheDocument()
  })

  it('Renders an empty message string without crashing', () => {
    expect(() => render(<EmptyState message="" />)).not.toThrow()
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('Renders a very long message without crashing', () => {
    const longMessage = 'A'.repeat(500)
    render(<EmptyState message={longMessage} />)
    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })
})
